/**
 * Account-level appearance is written with the app's confidential client, which
 * can address any row — so the same two properties that keep the profile writer
 * safe have to hold here, plus one more that is specific to a preference that
 * becomes CSS:
 *
 *   1. Only `properties.appearance` changes. Every other property (a person's
 *      oauth tokens above all) and every column survive, because IAM's update-user
 *      overwrites the whole set — a partial body BLANKS the row.
 *   2. A partial/absent read never becomes a write.
 *   3. The accent is validated as a real colour. The value is chosen by its owner
 *      and is later rendered into a `<style>` body, so a crafted accent carrying
 *      `;}` must never reach the stored JSON — that would be CSS injection.
 *
 * These drive the real transport over MSW — the same as the profile suite — so
 * what is asserted is the body that would actually reach IAM.
 */
import { http, HttpResponse } from 'msw';

import { server } from '../../jest.setup';
import { IAM, CLIENT_ID } from '../iam-fixture';

/** The row as IAM stores it — a populated properties bag, so preservation is
 *  provable, not vacuous. */
const STORED = {
  owner: 'hanzo',
  name: 'antje',
  displayName: 'Antje',
  isAdmin: false,
  passwordHash: '$argon2id$v=19$m=65536,t=3,p=4$secret',
  properties: {
    oauth_GitHub_accessToken: 'gho_secret',
    oauth_GitHub_username: 'antje',
  },
};

/** Bodies POSTed to update-user during a test. */
let written: Record<string, unknown>[] = [];
/** When true, get-user answers with no row (the partial-read case). */
let rowMissing = false;

beforeAll(() => {
  process.env.IAM_URL = IAM;
  process.env.IAM_ADMIN_URL = IAM;
  process.env.IAM_CLIENT_ID = CLIENT_ID;
  process.env.IAM_MINT_CLIENT_ID = 'hanzo-app-mint';
  process.env.IAM_MINT_CLIENT_SECRET = 'test-secret';
});

beforeEach(() => {
  written = [];
  rowMissing = false;
  server.use(
    http.get(`${IAM}/v1/iam/get-user`, () =>
      HttpResponse.json(
        rowMissing
          ? { status: 'error', msg: 'the entity does not exist' }
          : { status: 'ok', data: { ...STORED, properties: { ...STORED.properties } } },
      ),
    ),
    http.post(`${IAM}/v1/iam/update-user`, async ({ request }) => {
      written.push((await request.json()) as Record<string, unknown>);
      return HttpResponse.json({ status: 'ok', data: null });
    }),
  );
});

const body = () => {
  if (!written.length) throw new Error('update-user was never called');
  return written[written.length - 1];
};
/** The appearance JSON that would land in the properties bag. */
const stored = () => JSON.parse((body().properties as Record<string, string>).appearance);

describe('writeAppearance stores only the appearance property', () => {
  it('writes the preference as one JSON value under properties.appearance', async () => {
    const { writeAppearance } = await import('@/lib/appearance');
    const value = await writeAppearance('hanzo/antje', { type: 1.15, density: 'compact', accent: '#8b5cf6' });

    expect(value).toEqual({ type: 1.15, density: 'compact', accent: '#8b5cf6' });
    expect(stored()).toEqual({ type: 1.15, density: 'compact', accent: '#8b5cf6' });
  });

  it('preserves the other properties — oauth tokens are untouched', async () => {
    const { writeAppearance } = await import('@/lib/appearance');
    await writeAppearance('hanzo/antje', { accent: '#3b82f6' });

    const props = body().properties as Record<string, string>;
    expect(props.oauth_GitHub_accessToken).toBe('gho_secret');
    expect(props.oauth_GitHub_username).toBe('antje');
  });

  it('preserves stored columns the write never mentions', async () => {
    const { writeAppearance } = await import('@/lib/appearance');
    await writeAppearance('hanzo/antje', { type: 0.9 });

    expect(body().passwordHash).toBe(STORED.passwordHash);
    expect(body().isAdmin).toBe(false);
    expect(body().owner).toBe('hanzo');
    expect(body().name).toBe('antje');
  });

  it('refuses to write when the row cannot be read', async () => {
    rowMissing = true;
    const { writeAppearance } = await import('@/lib/appearance');
    await expect(writeAppearance('hanzo/antje', { accent: '#fff' })).rejects.toThrow();
    expect(written).toHaveLength(0);
  });
});

describe('clean rejects anything that is not a real preference', () => {
  it('refuses an accent that would break out of a <style> body', async () => {
    const { clean } = await import('@/lib/appearance');
    // Each of these carries a CSS metacharacter; none may survive to the document.
    for (const accent of [
      '#fff;}html{display:none}',
      'red; } body { visibility: hidden',
      'url(https://evil.example/x)',
      '#fff"><script>',
      'blue',
    ]) {
      expect(clean({ accent }).accent).toBeUndefined();
    }
  });

  it('accepts the colour forms the panel and CSS actually use', async () => {
    const { clean } = await import('@/lib/appearance');
    expect(clean({ accent: '#8b5cf6' }).accent).toBe('#8b5cf6');
    expect(clean({ accent: '#abc' }).accent).toBe('#abc');
    expect(clean({ accent: 'rgb(139 92 246 / 0.8)' }).accent).toBe('rgb(139 92 246 / 0.8)');
    expect(clean({ accent: 'oklch(62% 0.2 280)' }).accent).toBe('oklch(62% 0.2 280)');
  });

  it('clamps the type scale into the ramp window', async () => {
    const { clean } = await import('@/lib/appearance');
    expect(clean({ type: 99 }).type).toBe(1.4);
    expect(clean({ type: 0.1 }).type).toBe(0.85);
    expect(clean({ type: 1.15 }).type).toBe(1.15);
    expect(clean({ type: Number.NaN }).type).toBeUndefined();
  });

  it('keeps a known density and drops an invented one', async () => {
    const { clean } = await import('@/lib/appearance');
    expect(clean({ density: 'comfortable' }).density).toBe('comfortable');
    expect(clean({ density: 'roomy' }).density).toBeUndefined();
  });

  it('drops keys it does not recognise', async () => {
    const { clean } = await import('@/lib/appearance');
    expect(clean({ theme: 'light', isAdmin: true, type: 1 })).toEqual({ type: 1 });
  });
});
