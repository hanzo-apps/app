/**
 * The Cloud pane's readers must not be able to lie.
 *
 * Every rule here is one a person acts on. "No buckets" sends someone to create
 * one they already have; a "0" beside a metric nobody measured gets quoted in a
 * meeting; a secret VALUE on a builder screen is a value in a screenshot. The
 * rendering is `@hanzo/ui/product`'s and tested there — what is local, and so
 * what is tested here, is the reading: which shapes become rows, which become
 * NOTHING KNOWN, and what a row is allowed to carry.
 */
import { SECRETS, STORAGE, USERS } from '@/components/editor/more/cloud';

const DASH = '—';

describe('an answer this build cannot read is never an empty list', () => {
  // null is the honest "could not read" — the caller renders a failure. An empty
  // array would render "nothing here", which is a claim nobody verified.
  const unreadable = [null, undefined, {}, { data: 'nope' }, 42, 'oops', { items: {} }];

  it.each(unreadable)('users: %p reads as not-known, not empty', (body) => {
    expect(USERS.rows(body)).toBeNull();
  });

  it.each(unreadable)('storage: %p reads as not-known, not empty', (body) => {
    expect(STORAGE.rows(body)).toBeNull();
  });

  it.each(unreadable)('secrets: %p reads as not-known, not empty', (body) => {
    expect(SECRETS.rows(body)).toBeNull();
  });

  it('a well-formed empty answer IS empty — that one may be claimed', () => {
    expect(USERS.rows({ status: 'success', data: [] })).toEqual([]);
    expect(STORAGE.rows({ buckets: [], total: 0 })).toEqual([]);
    expect(SECRETS.rows({ names: [], secrets: [], total: 0 })).toEqual([]);
  });
});

describe('users', () => {
  it('reads the live /v1/o11y/users shape', () => {
    const rows = USERS.rows({
      status: 'success',
      data: [
        {
          id: '2d4d67ab-30f1-474e-b81f-f60461852259',
          displayName: 'z@hanzo.ai',
          email: 'z@hanzo.ai',
          status: 'active',
          createdAt: '2026-08-03T16:38:32.940558Z',
        },
      ],
    });
    expect(rows).toEqual([
      {
        id: '2d4d67ab-30f1-474e-b81f-f60461852259',
        name: 'z@hanzo.ai',
        state: 'active',
        joined: '2026-08-03',
      },
    ]);
  });

  it('renders an em-dash for a field the answer did not carry', () => {
    const [row] = USERS.rows({ data: [{ id: 'u1' }] })!;
    expect(row.name).toBe(DASH);
    expect(row.state).toBe(DASH);
    expect(row.joined).toBe(DASH);
  });

  it('a date it cannot parse is not a date', () => {
    const [row] = USERS.rows({ data: [{ id: 'u1', createdAt: 'sometime' }] })!;
    expect(row.joined).toBe(DASH);
  });
});

describe('storage', () => {
  it('reads the live /v1/s3/buckets shape, epoch seconds included', () => {
    expect(STORAGE.rows({ buckets: [{ name: 'ui-verify-selfservice', createdAt: 1782958752 }], total: 1 })).toEqual([
      { name: 'ui-verify-selfservice', created: '2026-07-02' },
    ]);
  });

  it('a bucket with no creation time says so rather than showing an epoch', () => {
    const [row] = STORAGE.rows({ buckets: [{ name: 'photos' }] })!;
    expect(row.created).toBe(DASH);
    expect(row.created).not.toBe('1970-01-01');
  });
});

describe('secrets carry names, never values', () => {
  it('reads the live /v1/kms/secrets metadata shape', () => {
    expect(
      SECRETS.rows({
        names: ['ANTHROPIC_API_KEY'],
        secrets: [{ name: 'ANTHROPIC_API_KEY', path: '/orgs/hanzo', env: 'prod', scheme: 'aead+mlkem' }],
        total: 1,
      }),
    ).toEqual([{ name: 'ANTHROPIC_API_KEY', where: '/orgs/hanzo', env: 'prod' }]);
  });

  it('drops a value even when the answer volunteers one', () => {
    // KMS does not send values to a list today. If it ever did, the row a person
    // sees must not be where that lands.
    const rows = SECRETS.rows({
      secrets: [{ name: 'API_KEY', path: '/orgs/hanzo', env: 'prod', value: 'sk-live-do-not-render' }],
    })!;
    expect(JSON.stringify(rows)).not.toContain('sk-live-do-not-render');
    expect(Object.keys(rows[0]!).sort()).toEqual(['env', 'name', 'where']);
  });

  it('falls back to bare names, admitting what it does not know', () => {
    expect(SECRETS.rows({ names: ['API_KEY'] })).toEqual([{ name: 'API_KEY', where: DASH, env: DASH }]);
  });

  it('reads only the list surface — no reveal', () => {
    expect(SECRETS.path).toBe('/v1/kms/secrets');
  });
});

describe('every reader names one canonical /v1 surface', () => {
  it.each([USERS, STORAGE, SECRETS])('$path is /v1/<head>/… with no /api and no version but v1', (spec) => {
    expect(spec.path).toMatch(/^\/v1\/[a-z0-9]+(\/[a-z0-9-]+)*$/);
    expect(spec.path).not.toContain('/api/');
    expect(spec.path).not.toMatch(/\/v[2-9]/);
  });
});
