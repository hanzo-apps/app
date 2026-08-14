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
import { AGENTS, BOTS, FUNCTIONS, SANDBOXES, SECRETS, STORAGE, USERS } from '@/components/editor/more/cloud';

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

  it.each(unreadable)('functions: %p reads as not-known, not empty', (body) => {
    expect(FUNCTIONS.rows(body)).toBeNull();
  });

  it.each(unreadable)('sandboxes: %p reads as not-known, not empty', (body) => {
    expect(SANDBOXES.rows(body)).toBeNull();
  });

  it.each(unreadable)('agents: %p reads as not-known, not empty', (body) => {
    expect(AGENTS.rows(body)).toBeNull();
  });

  it.each(unreadable)('bots: %p reads as not-known, not empty', (body) => {
    expect(BOTS.rows(body)).toBeNull();
  });

  it('a well-formed empty answer IS empty — that one may be claimed', () => {
    expect(USERS.rows({ status: 'success', data: [] })).toEqual([]);
    expect(STORAGE.rows({ buckets: [], total: 0 })).toEqual([]);
    expect(SECRETS.rows({ names: [], secrets: [], total: 0 })).toEqual([]);
    expect(FUNCTIONS.rows({ functions: [] })).toEqual([]);
    expect(SANDBOXES.rows({ sandboxes: [] })).toEqual([]);
    expect(AGENTS.rows({ agents: [] })).toEqual([]);
    // The live answer today. An org with no bots is a fact, not a gap.
    expect(BOTS.rows({ bots: [] })).toEqual([]);
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

describe('a count of zero is a measurement; a missing count is not', () => {
  it('keeps a real zero', () => {
    const [f] = FUNCTIONS.rows({ functions: [{ name: 'fleet-smoke', invocations7d: 0 }] })!;
    expect(f.calls).toBe('0');
  });

  it('will not print 0 for a number the answer never carried', () => {
    const [f] = FUNCTIONS.rows({ functions: [{ name: 'fleet-smoke' }] })!;
    expect(f.calls).toBe(DASH);
    const [a] = AGENTS.rows({ agents: [{ id: 'a1', name: 'greeter' }] })!;
    expect(a.runs).toBe(DASH);
  });
});

describe('functions, sandboxes and agents read their live shapes', () => {
  it('functions', () => {
    expect(
      FUNCTIONS.rows({
        functions: [
          { name: 'fleet-smoke', environment: 'python', status: 'ready', invocations7d: 1 },
        ],
      }),
    ).toEqual([{ name: 'fleet-smoke', runtime: 'python', state: 'ready', calls: '1' }]);
  });

  it('sandboxes, with epoch lastUsedAt', () => {
    expect(
      SANDBOXES.rows({
        sandboxes: [
          {
            id: 'm_a1c53480ce34ca40af10a899',
            project: 'tabs',
            class: 'dev',
            status: 'running',
            lastUsedAt: 1786668543,
          },
        ],
      }),
    ).toEqual([
      { id: 'm_a1c53480ce34ca40af10a899', project: 'tabs', kind: 'dev', state: 'running', used: '2026-08-14' },
    ]);
  });

  it('agents', () => {
    expect(
      AGENTS.rows({
        agents: [{ id: 'agent_ceb', name: 'example-greeter', model: 'zen5', status: 'ready', runs: 1 }],
      }),
    ).toEqual([{ id: 'agent_ceb', name: 'example-greeter', model: 'zen5', state: 'ready', runs: '1' }]);
  });
});

describe('every reader names one canonical /v1 surface', () => {
  it.each([USERS, STORAGE, SECRETS, FUNCTIONS, SANDBOXES, AGENTS, BOTS])('$path is /v1/<head>/… with no /api and no version but v1', (spec) => {
    expect(spec.path).toMatch(/^\/v1\/[a-z0-9]+(\/[a-z0-9-]+)*$/);
    expect(spec.path).not.toContain('/api/');
    expect(spec.path).not.toMatch(/\/v[2-9]/);
  });
});
