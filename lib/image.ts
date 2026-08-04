/**
 * Browser-side image reduction — turn a camera-roll photo into an avatar.
 *
 * A phone photo is 3–12 MB and 4032px wide; the profile renders it at 96px and
 * the store caps what it will keep. Sending the original and letting the server
 * refuse it would be technically correct and useless — every real photo a person
 * picks would fail. So the file is decoded, cropped square from the centre, and
 * re-encoded at avatar size BEFORE it is ever uploaded.
 *
 * Quality is stepped down until the result fits rather than guessed once: a
 * detailed photo and a flat graphic compress nothing alike, and a fixed quality
 * that fits one will miss the other. Stop at the first size that fits.
 */

/** Longest edge of the stored avatar, in CSS pixels. Rendered at 96px, so 256 covers 2× displays. */
const SIZE = 256;

/** Encoders to try, best first. WebP is ~30% smaller; not every browser writes it. */
const TYPES = ['image/webp', 'image/jpeg'] as const;

const QUALITIES = [0.9, 0.8, 0.7, 0.6, 0.5] as const;

/** True when the canvas actually produced the type asked for (Safari lies by falling back to PNG). */
const producedType = (url: string, type: string) => url.startsWith(`data:${type};base64,`);

/**
 * Decode `file` into an ImageBitmap, or throw with a message worth showing.
 * `createImageBitmap` handles EXIF orientation in current browsers, which an
 * `<img>` + canvas draw does not — a portrait photo would otherwise store sideways.
 */
async function decode(file: Blob): Promise<ImageBitmap> {
  try {
    return await createImageBitmap(file, { imageOrientation: 'from-image' } as ImageBitmapOptions);
  } catch {
    throw new Error('That file could not be read as an image.');
  }
}

/**
 * A square, avatar-sized data URI for `file`, at most `limit` bytes.
 *
 * Throws when the image cannot be decoded, or when even the lowest quality
 * exceeds `limit` — never returns something oversized, and never truncates
 * (a cut data URI is a broken image that looks like a successful save).
 */
export async function avatarDataUrl(file: Blob, limit: number): Promise<string> {
  const bitmap = await decode(file);

  // Centre crop to a square, then scale to SIZE. Cropping before scaling keeps
  // the subject centred instead of squashing the aspect ratio.
  const edge = Math.min(bitmap.width, bitmap.height);
  const sx = (bitmap.width - edge) / 2;
  const sy = (bitmap.height - edge) / 2;

  const canvas = document.createElement('canvas');
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('This browser could not process the image.');
  ctx.drawImage(bitmap, sx, sy, edge, edge, 0, 0, SIZE, SIZE);
  bitmap.close?.();

  let smallest = '';
  for (const type of TYPES) {
    for (const quality of QUALITIES) {
      const url = canvas.toDataURL(type, quality);
      if (!producedType(url, type)) break; // this browser cannot write this type
      if (url.length <= limit) return url;
      if (!smallest || url.length < smallest.length) smallest = url;
    }
  }
  throw new Error(
    smallest
      ? `That image is still ${Math.round(smallest.length / 1024)} KB after resizing. Try a simpler photo.`
      : 'That image could not be converted.',
  );
}
