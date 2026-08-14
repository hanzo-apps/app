'use client';

/**
 * The Cloud group's readers.
 *
 * These render the SAME components the console renders — `DataTable`,
 * `BackendStateCard` and `classifyRead` from `@hanzo/ui/product` — over the SAME
 * cloud `/v1` surfaces its Users, Storage and Secrets modules read, reached
 * through this app's one BFF forwarder (`lib/org/bff`). Nothing about a table,
 * a skeleton, or the sentence a 401/403/503 deserves is decided here; those
 * answers live in the package, once, and both surfaces get whichever one is
 * current. What is local is the only thing that IS local: which endpoint a
 * section reads and how a row of it reads.
 *
 * Three states and they are kept apart on purpose. A body this build cannot
 * parse is NOT an empty list — `rows()` returns null for it and that renders as
 * a failure, because an org with fifty buckets being told it has none is how a
 * person stops believing the screen.
 *
 * A missing value renders an EM-DASH. Never a zero: a zero is a measurement.
 */
import { useEffect, useState } from 'react';
import { Paragraph, SizableText, XStack, YStack } from '@hanzo/ui';
import {
  BackendStateCard,
  DataTable,
  classifyRead,
  type BackendState,
  type Column,
} from '@hanzo/ui/product';

import { panel, row, rows as rowsBox } from '@/lib/chrome';

/** Not known. Never rendered as 0, "none", or a blank cell. */
const NONE = '—';

/** How many rows a pane this size shows before it is just noise. */
const SHOWN = 100;

type Read<T> =
  | { phase: 'loading' }
  | { phase: 'failed'; state: BackendState }
  | { phase: 'rows'; rows: T[]; total: number };

/** One `/v1` list: where it lives, how to pull rows out, how a row reads. */
interface List<T> {
  path: string;
  /** Rows from the body, or null when the shape is not one this build knows. */
  rows: (body: unknown) => T[] | null;
  columns: Column<T>[];
  key: (row: T) => string;
  /** What a well-formed EMPTY answer means — only ever shown for one. */
  empty: string;
  /** One line naming what the answer covers. */
  scope: string;
}

const list = (v: unknown, key: string): unknown[] | null => {
  if (Array.isArray(v)) return v;
  const under = (v as Record<string, unknown>)?.[key];
  return Array.isArray(under) ? under : null;
};

const text = (v: unknown): string => (typeof v === 'string' && v ? v : '');

/** ISO or epoch-seconds → a plain day. Anything else is not a date. */
const day = (v: unknown): string => {
  const at = typeof v === 'number' ? new Date(v * 1000) : typeof v === 'string' ? new Date(v) : null;
  return at && !Number.isNaN(at.getTime()) ? at.toISOString().slice(0, 10) : NONE;
};

/** The reason a response gives for itself, for `classifyRead` to weigh. */
async function reason(res: Response): Promise<string> {
  const body = await res.text().catch(() => '');
  try {
    const j = JSON.parse(body) as { error?: unknown; message?: unknown };
    return text(j.message) || text(j.error) || `Request failed (HTTP ${res.status})`;
  } catch {
    return `Request failed (HTTP ${res.status})`;
  }
}

function Table<T>({ list: spec }: { list: List<T> }) {
  const [read, setRead] = useState<Read<T>>({ phase: 'loading' });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let alive = true;
    setRead({ phase: 'loading' });
    (async () => {
      try {
        const res = await fetch(spec.path, { credentials: 'include', cache: 'no-store' });
        if (!res.ok) throw Object.assign(new Error(await reason(res)), { status: res.status });
        const found = spec.rows(await res.json());
        if (!alive) return;
        setRead(
          found
            ? { phase: 'rows', rows: found.slice(0, SHOWN), total: found.length }
            : {
                phase: 'failed',
                state: { kind: 'error', message: 'The answer was not in a shape this build reads.' },
              },
        );
      } catch (e) {
        if (!alive) return;
        // `classifyRead` returns null for a 402: a read is never credit-walled,
        // so that is the surface saying nothing is provisioned — an empty answer,
        // not a paywall.
        const state = classifyRead(e);
        setRead(state ? { phase: 'failed', state } : { phase: 'rows', rows: [], total: 0 });
      }
    })();
    return () => {
      alive = false;
    };
  }, [spec, attempt]);

  if (read.phase === 'failed') {
    return (
      <YStack {...panel} padding="$4">
        <BackendStateCard
          state={read.state}
          onRetry={() => setAttempt((n) => n + 1)}
          hint={`endpoint · GET ${spec.path}`}
        />
      </YStack>
    );
  }

  const shown = read.phase === 'rows' ? read.rows : [];
  const total = read.phase === 'rows' ? read.total : 0;

  return (
    <YStack {...panel} padding="$4" gap="$2.5">
      <DataTable
        columns={spec.columns}
        rows={shown}
        loading={read.phase === 'loading'}
        empty={spec.empty}
        rowKey={spec.key}
      />
      <Paragraph fontSize="$1" color="$color11">
        {spec.scope}
        {total > shown.length ? ` Showing the first ${shown.length} of ${total}.` : ''}
      </Paragraph>
    </YStack>
  );
}

/**
 * Users — the workspace's people, from the same `/v1/o11y/users` the console's
 * Users module reads.
 */
type User = { id: string; name: string; state: string; joined: string };

export const USERS: List<User> = {
  path: '/v1/o11y/users',
  rows: (body) => {
    const found = list(body, 'data') ?? list((body as { data?: unknown })?.data, 'items');
    return (
      found?.map((raw) => {
        const u = (raw ?? {}) as Record<string, unknown>;
        return {
          id: text(u.id) || text(u.email),
          name: text(u.displayName) || text(u.email) || NONE,
          state: text(u.status) || NONE,
          joined: day(u.createdAt),
        };
      }) ?? null
    );
  },
  columns: [
    { key: 'name', header: 'User', render: (u) => u.name },
    { key: 'state', header: 'Status', render: (u) => u.state, width: 110 },
    { key: 'joined', header: 'Joined', render: (u) => u.joined, width: 120, mono: true },
  ],
  key: (u) => u.id,
  empty: 'No users in this workspace yet.',
  scope: 'Everyone who can sign in to this workspace, from Hanzo IAM.',
};

/** Storage — the workspace's buckets, from `/v1/s3/buckets`. */
type Bucket = { name: string; created: string };

export const STORAGE: List<Bucket> = {
  path: '/v1/s3/buckets',
  rows: (body) => {
    const found = list(body, 'buckets');
    return (
      found?.map((raw) => {
        const b = (raw ?? {}) as Record<string, unknown>;
        return { name: text(b.name) || NONE, created: day(b.createdAt ?? b.created_at) };
      }) ?? null
    );
  },
  columns: [
    { key: 'name', header: 'Bucket', render: (b) => b.name },
    { key: 'created', header: 'Created', render: (b) => b.created, width: 120, mono: true },
  ],
  key: (b) => b.name,
  empty: 'No buckets yet — one appears when your app first stores a file.',
  scope: 'Object storage for this workspace. Uploading and deleting live in the console.',
};

/**
 * Secrets — NAMES and where they live. Never a value.
 *
 * `/v1/kms/secrets` answers with metadata only (`name`, `path`, `env`,
 * `scheme`), and this reader asks for nothing else. KMS does have a read-one
 * endpoint; it is not called here and this surface has no control that would.
 */
type Secret = { name: string; where: string; env: string };

export const SECRETS: List<Secret> = {
  path: '/v1/kms/secrets',
  rows: (body) => {
    const meta = list(body, 'secrets');
    if (meta) {
      return meta.map((raw) => {
        const s = (raw ?? {}) as Record<string, unknown>;
        return { name: text(s.name) || NONE, where: text(s.path) || NONE, env: text(s.env) || NONE };
      });
    }
    // A build of KMS that answers with bare names still answers honestly — the
    // rest of the row is simply not known.
    const names = list(body, 'names');
    return names?.map((n) => ({ name: text(n) || NONE, where: NONE, env: NONE })) ?? null;
  },
  columns: [
    { key: 'name', header: 'Name', render: (s) => s.name, mono: true },
    { key: 'where', header: 'Path', render: (s) => s.where, mono: true },
    { key: 'env', header: 'Env', render: (s) => s.env, width: 90 },
  ],
  key: (s) => `${s.where}/${s.env}/${s.name}`,
  empty: 'No secrets held for this workspace yet.',
  scope: 'Names only, from Hanzo KMS. A value is never read by this screen.',
};

export const UsersBody = () => <Table list={USERS} />;
export const StorageBody = () => <Table list={STORAGE} />;
export const SecretsBody = () => <Table list={SECRETS} />;

/**
 * Overview — what is actually provisioned for THIS project.
 *
 * `/v1/provision` stamps a marker when a project is set up and this reads that
 * marker back. `null` from it means NOT KNOWN — a store that predates the marker
 * — and renders as an em-dash rather than as "Off", which would be a claim
 * nobody measured.
 */
type State =
  | { phase: 'idle' }
  | { phase: 'loading' }
  | { phase: 'failed'; state: BackendState }
  | {
      phase: 'read';
      base: boolean;
      analytics: boolean | null;
      provisionedAt: string | null;
      org: string | null;
    };

export function OverviewBody({ projectId }: { projectId?: string | null }) {
  const [read, setRead] = useState<State>({ phase: 'idle' });

  useEffect(() => {
    if (!projectId) {
      setRead({ phase: 'idle' });
      return;
    }
    let alive = true;
    setRead({ phase: 'loading' });
    (async () => {
      try {
        const res = await fetch(`/v1/provision?projectId=${encodeURIComponent(projectId)}`, {
          credentials: 'include',
          cache: 'no-store',
        });
        if (!res.ok) throw Object.assign(new Error(await reason(res)), { status: res.status });
        const b = (await res.json()) as {
          base?: boolean;
          analytics?: boolean | null;
          provisionedAt?: string | null;
          org?: string | null;
        };
        if (!alive) return;
        setRead({
          phase: 'read',
          base: b.base === true,
          analytics: typeof b.analytics === 'boolean' ? b.analytics : null,
          provisionedAt: b.provisionedAt ?? null,
          org: b.org ?? null,
        });
      } catch (e) {
        if (!alive) return;
        const state = classifyRead(e);
        setRead(state ? { phase: 'failed', state } : { phase: 'read', base: false, analytics: null, provisionedAt: null, org: null });
      }
    })();
    return () => {
      alive = false;
    };
  }, [projectId]);

  if (read.phase === 'idle') {
    return (
      <YStack {...panel} padding="$4" gap="$2">
        <SizableText fontSize="$3" color="$color">No project open</SizableText>
        <Paragraph fontSize="$2" color="$color11">
          Provisioning belongs to a project. Open one and this reads what it has.
        </Paragraph>
      </YStack>
    );
  }

  if (read.phase === 'failed') {
    return (
      <YStack {...panel} padding="$4">
        <BackendStateCard state={read.state} hint="endpoint · GET /v1/provision" />
      </YStack>
    );
  }

  const loading = read.phase === 'loading';
  const facts: Array<[string, string]> = loading
    ? []
    : [
        ['Hanzo Base', read.base ? 'On' : 'Not created yet'],
        ['Analytics', read.analytics === null ? NONE : read.analytics ? 'On' : 'Off'],
        ['Provisioned', read.provisionedAt ? day(read.provisionedAt) : NONE],
        ['Workspace', read.org ?? NONE],
      ];

  return (
    <YStack gap="$2.5">
      <YStack {...rowsBox}>
        {loading ? (
          <XStack {...row}>
            <SizableText fontSize="$2" color="$color11">Reading what is provisioned…</SizableText>
          </XStack>
        ) : (
          facts.map(([label, value]) => (
            <XStack key={label} {...row}>
              <SizableText fontSize="$2" color="$color">{label}</SizableText>
              <SizableText fontSize="$2" color="$color11" fontFamily="$mono">{value}</SizableText>
            </XStack>
          ))
        )}
      </YStack>
      <Paragraph fontSize="$1" color="$color11">
        Base is this project&apos;s own data plane; analytics rides every page you publish.
        An em-dash is a fact this project never recorded, not a zero.
      </Paragraph>
    </YStack>
  );
}
