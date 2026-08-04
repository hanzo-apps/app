import { test, expect } from '@playwright/test';
import zlib from 'node:zlib';

/**
 * Profile persistence — the whole point of the confidential IAM client.
 *
 * `lib/iam-admin` authenticates as the app's confidential OAuth client to reach
 * IAM's privileged `/v1/iam/*` primitives, because IAM has NO self-service write:
 * a user's own token may only READ its own row. When that client is unset,
 * `adminConfigured()` is false and BOTH verbs answer 501 — which is honest, and
 * which is also exactly what a deployment missing the credential looks like.
 *
 * So this spec is the difference between "the page said it saved" and "the row
 * changed". The page previously shipped a `toast.success` with no request behind
 * it; asserting the toast would re-certify that bug. It asserts the RESPONSE and
 * then a RELOAD, because only the reload proves IAM kept it rather than React.
 *
 * It restores whatever avatar it found, so running it leaves the account as it
 * was — the account is a real superuser, not a fixture.
 */

/**
 * A real 64×64 PNG, BUILT rather than pasted.
 *
 * The browser decodes the file with `createImageBitmap` before re-encoding it,
 * so the fixture has to be a decodable image and not merely PNG-shaped. A
 * hand-shortened base64 blob passes `file(1)` and still throws "The source image
 * could not be decoded" — at which point the picker fails, the page posts the
 * draft it never changed, and the SERVER's refusal is what the test reports. An
 * hour went into that misattribution; a generated image cannot drift into it.
 */
function png(size = 64): Buffer {
  const chunk = (type: string, data: Buffer) => {
    const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(zlib.crc32(body) >>> 0);
    return Buffer.concat([len, body, crc]);
  };
  // Each scanline is a filter byte followed by RGBA pixels; the gradient just
  // makes the bytes non-uniform so a lossy re-encode still differs from black.
  const raw = Buffer.concat(
    Array.from({ length: size }, (_, y) =>
      Buffer.concat([
        Buffer.from([0]),
        Buffer.from(
          Array.from({ length: size * 4 }, (_, i) => (i % 4 === 3 ? 255 : (y * 4 + i) % 256)),
        ),
      ]),
    ),
  );
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // colour type: RGBA
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

test('an avatar picked on /profile survives a reload', async ({ page }) => {
  await page.goto('/profile');

  // The read half. 501 here means the confidential client is unwired, which is a
  // deployment fact worth naming rather than letting a later assertion be vague.
  const read = await page.waitForResponse(
    (r) => r.url().includes('/v1/me/profile') && r.request().method() === 'GET',
  );
  expect(read.status(), 'GET /v1/me/profile — 501 means IAM_CLIENT_ID/SECRET are unset').toBe(200);
  const original = ((await read.json())?.profile?.avatar ?? '') as string;

  // Refuse to run against an account whose picture is a REMOTE URL. The route
  // deliberately will not write one back — it stores only self-contained data
  // URIs — so this spec could not put such a value back after overwriting it.
  // Skipping beats replacing it: run against a URL avatar once, on a real
  // superuser, and the original was simply gone.
  test.skip(
    /^https?:\/\//i.test(original),
    'this account stores a remote-URL avatar the route cannot restore',
  );

  // Go through the AVATAR, not the input. Clicking the photo is what turns
  // editing on — filling the always-mounted input directly skips that gesture,
  // so the draft updates while "Save Changes" never renders.
  const [chooser] = await Promise.all([
    page.waitForEvent('filechooser'),
    page.getByRole('button', { name: 'Change profile photo' }).click(),
  ]);
  await chooser.setFiles({ name: 'avatar.png', mimeType: 'image/png', buffer: png() });

  const save = page.getByRole('button', { name: /save changes/i });
  await expect(save).toBeEnabled();

  const [written] = await Promise.all([
    page.waitForResponse(
      (r) => r.url().includes('/v1/me/profile') && r.request().method() === 'POST',
    ),
    save.click(),
  ]);

  const body = await written.json();
  expect(body.ok, `POST ${written.status()} — ${body.message ?? '(no message)'}`).toBe(true);
  expect(written.status()).toBe(200);

  // The browser reduces and re-encodes before upload; the server stores only
  // self-contained data URIs, never a remote URL.
  const stored = body.profile.avatar as string;
  expect(stored).toMatch(/^data:image\/(webp|jpeg|png);base64,/);
  expect(stored).not.toBe(original);

  try {
    // The proof: a fresh page, a fresh read, the same bytes back from IAM.
    await page.reload();
    const again = await page.waitForResponse(
      (r) => r.url().includes('/v1/me/profile') && r.request().method() === 'GET',
    );
    expect(again.status()).toBe(200);
    expect((await again.json()).profile.avatar).toBe(stored);
  } finally {
    // Put back what was there. Guarded above to a value the route accepts, so
    // this is the app's own write path and not a second way to reach IAM.
    const restore = await page.request.post('/v1/me/profile', {
      data: { avatar: original },
      headers: { origin: new URL(page.url()).origin },
    });
    expect(restore.ok(), 'could not restore the original avatar').toBe(true);
  }
});
