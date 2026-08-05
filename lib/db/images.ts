/**
 * The bytes of a project's images, stored in Hanzo Base — the ONE store for
 * every picture the builder holds, whether a person uploaded it, generated it,
 * or imported it from a board or a folder.
 *
 * It replaces an upload into a published Hugging Face space, which could not
 * have worked from here: the credential this app holds is a hanzo.id IAM token,
 * and it was being handed to huggingface.co as an access token. That is also why
 * the bytes could only be stored AFTER publishing — the space repo was the
 * store, so no space meant nowhere to put them. Base is the app's data plane
 * already, and a row costs nothing, so a draft can hold images like anything else.
 *
 * READING IS DELIBERATELY UNAUTHENTICATED. These bytes get embedded in generated
 * pages that strangers load, so a session cannot be required to see them. The
 * record id is unguessable and it IS the capability — the same posture as the
 * public space files this replaces, minus the enumerable repo listing.
 */
import { baseAs, baseUrl } from '@/lib/base';
import { IMAGES, IMAGE_TYPES, MAX_IMAGE_BYTES } from '@/lib/base/collections';

export { IMAGE_TYPES, MAX_IMAGE_BYTES };

type ImageRow = {
  id: string;
  user_id: string;
  space_id: string;
  name: string;
  file: string;
  created: string;
};

/** The extension that matches what the bytes ACTUALLY are, not what they claim. */
const EXT: Record<string, string> = {
  'image/png': '.png',
  'image/jpeg': '.jpg',
  'image/gif': '.gif',
  'image/webp': '.webp',
  'image/avif': '.avif',
  'image/svg+xml': '.svg',
};

/**
 * The filename the serving URL ends with. It carries a real extension so the
 * browser, and the app's own middleware, can both tell this is an image —
 * without it every image on a page would spend the visitor's rate-limit budget.
 */
export function fileName(file: File): string {
  const ext = EXT[file.type] ?? '.png';
  // The stem keeps no dots and no separators, so the ONE dot in the result is
  // the extension — a name cannot smuggle a second one, or a path, past this.
  const stem =
    file.name
      .replace(/\.[^.]*$/, '')
      .replace(/[^A-Za-z0-9_-]/g, '-')
      .slice(0, 60) || 'image';
  return `${stem}${ext}`;
}

/** Why these bytes cannot be stored, or '' when they can. */
export function refuse(file: File): string {
  if (!IMAGE_TYPES.includes(file.type)) return `${file.name} is not an image.`;
  if (file.size > MAX_IMAGE_BYTES)
    return `${file.name} is larger than ${MAX_IMAGE_BYTES >> 20}MB.`;
  return '';
}

/** The path every stored image is served under. */
const SERVED = '/v1/images/';

/** Where a stored image is served from. Absolute — published pages embed it. */
export function imageUrl(origin: string, id: string, name: string): string {
  return `${origin}${SERVED}${encodeURIComponent(id)}/${encodeURIComponent(name)}`;
}

/**
 * Whether a URL already names bytes WE hold. Asked of imported images, whose
 * url points at the board or the folder they came from until the bytes land.
 * Matched on the path, not the host, so it stays true across environments.
 */
export function stored(url: string): boolean {
  return url.includes(SERVED);
}

/**
 * Store one image and answer with the URL that serves it back. The name is kept
 * for provenance; the URL's own tail is derived from the bytes' real type.
 */
export async function putImage(
  token: string,
  input: { userId: string; spaceId: string; origin: string; file: File }
): Promise<string> {
  const db = baseAs(token);

  const name = fileName(input.file);
  const form = new FormData();
  form.append('user_id', input.userId);
  form.append('space_id', input.spaceId);
  form.append('name', input.file.name);
  form.append('file', input.file, name);

  const row = await db.collection(IMAGES).create<ImageRow>(form);
  return imageUrl(input.origin, row.id, name);
}

/**
 * The stored bytes, or null when there is no such image. No token is taken
 * because none can be offered: see the note at the top of this file.
 */
export async function readImage(id: string): Promise<Response | null> {
  const base = baseUrl();
  const at = encodeURIComponent(id);

  const record = await fetch(`${base}/v1/collections/${IMAGES}/records/${at}`);
  if (!record.ok) return null;

  const row = (await record.json().catch(() => null)) as { file?: string } | null;
  if (!row?.file) return null;

  const bytes = await fetch(`${base}/v1/files/${IMAGES}/${at}/${encodeURIComponent(row.file)}`);
  return bytes.ok && bytes.body ? bytes : null;
}
