/**
 * The profile writer's allow-list is a PRIVILEGE boundary, not a tidiness rule.
 *
 * IAM's update-user takes a WHOLE user object and overwrites the column set, and
 * the app reaches it as a confidential client that may address any row. So the
 * only thing between a profile form and `isAdmin: true` is that `writeProfile`
 * copies a fixed set of keys onto the STORED row and ignores everything else.
 *
 * These drive the real transport over MSW — same as the org-onboarding suite —
 * so what is asserted is the body that would actually reach IAM, not a mock's
 * idea of it. The hostile-patch case fails if the merge is ever loosened to a
 * spread (verified by mutation).
 */
import { http, HttpResponse } from 'msw';

import { server } from '../../jest.setup';
import { IAM, CLIENT_ID } from '../iam-fixture';

/** The row as IAM stores it — privileged columns included, as get-user returns. */
const STORED = {
  owner: 'hanzo',
  name: 'antje',
  displayName: 'Antje',
  avatar: '',
  isAdmin: false,
  isForbidden: false,
  passwordHash: '$argon2id$v=19$m=65536,t=3,p=4$secret',
  permissions: [],
  score: 0,
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
          : { status: 'ok', data: { ...STORED } },
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

describe('writeProfile merges only profile fields', () => {
  it('writes the fields a profile form owns', async () => {
    const { writeProfile } = await import('@/lib/profile');
    await writeProfile('hanzo/antje', { displayName: 'Antje W', bio: 'builder', github: 'antje' });

    expect(body().displayName).toBe('Antje W');
    expect(body().bio).toBe('builder');
    expect(body().github).toBe('antje');
  });

  it('IGNORES privilege and identity fields smuggled into the patch', async () => {
    const { writeProfile } = await import('@/lib/profile');
    await writeProfile('hanzo/antje', {
      displayName: 'Antje',
      // None of these are on the allow-list. If any reaches update-user, an
      // ordinary user just escalated through a profile form.
      isAdmin: true,
      owner: 'admin',
      name: 'root',
      passwordHash: 'x',
      permissions: ['*'],
      score: 999999,
    } as never);

    expect(body().isAdmin).toBe(false);
    expect(body().owner).toBe('hanzo');
    expect(body().name).toBe('antje');
    expect(body().passwordHash).toBe(STORED.passwordHash);
    expect(body().permissions).toEqual([]);
    expect(body().score).toBe(0);
  });

  it('preserves stored columns the patch never mentions', async () => {
    // update-user overwrites the column set, so a partial body BLANKS the row.
    const { writeProfile } = await import('@/lib/profile');
    await writeProfile('hanzo/antje', { bio: 'hi' });

    expect(body().passwordHash).toBe(STORED.passwordHash);
    expect(body().name).toBe('antje');
    expect(body().owner).toBe('hanzo');
  });

  it('refuses to write when the row cannot be read', async () => {
    // A partial/absent read must never become a write that erases the account.
    rowMissing = true;
    const { writeProfile } = await import('@/lib/profile');
    await expect(writeProfile('hanzo/antje', { bio: 'hi' })).rejects.toThrow();
    expect(written).toHaveLength(0);
  });
});

describe('checkPatch', () => {
  it('accepts a bounded data-URI image, and an empty value clears the photo', async () => {
    const { checkPatch } = await import('@/lib/profile');
    expect(() => checkPatch({ avatar: 'data:image/webp;base64,AAAA' })).not.toThrow();
    expect(() => checkPatch({ avatar: '' })).not.toThrow();
  });

  it('refuses a non-image and a remote URL masquerading as one', async () => {
    const { checkPatch } = await import('@/lib/profile');
    expect(() => checkPatch({ avatar: 'https://evil.example.com/x.png' })).toThrow();
    expect(() => checkPatch({ avatar: 'data:text/html;base64,PHNjcmlwdD4=' })).toThrow();
  });

  it('refuses an oversized image rather than truncating it', async () => {
    const { checkPatch, AVATAR_LIMIT } = await import('@/lib/profile');
    const huge = 'data:image/png;base64,' + 'A'.repeat(AVATAR_LIMIT);
    expect(() => checkPatch({ avatar: huge })).toThrow(/limit/i);
  });

  it('refuses a javascript: website — it is rendered as an href', async () => {
    const { checkPatch } = await import('@/lib/profile');
    expect(() => checkPatch({ homepage: 'javascript:alert(1)' })).toThrow();
    expect(() => checkPatch({ homepage: 'https://hanzo.ai' })).not.toThrow();
  });
});
