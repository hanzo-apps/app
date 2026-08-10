'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Paragraph, SizableText, XStack, YStack } from '@hanzo/ui';
import { Boxes, ChevronDown, ChevronLeft, ChevronRight, Plug } from 'lucide-react';

import { panel } from '@/lib/chrome';
import { fetchConnectors, type Provider } from '@/lib/connectors';
import { useModels } from '@/lib/hooks/use-models';
import { fetchMcpServers, fetchMcpToolCount, type McpServer } from '@/lib/mcp';
import { SECTIONS, findSection, type Section } from './sections';

/**
 * The More pane — everything about this project that is not its source.
 *
 * One nav on the left, one section on the right. The nav is derived from
 * `sections.ts`, so a row and its content are the same declaration and cannot
 * drift apart.
 *
 * WHAT THIS PANE REFUSES TO DO is the design. A section whose backing surface
 * exists reads it; a section that is named but not yet connected says exactly
 * that, in the sentence that describes what it will do. It never renders a
 * plausible empty dashboard over nothing — zeros that mean "not wired" are
 * indistinguishable from zeros that mean "no traffic yet", and once a person
 * has been fooled by one number they stop trusting all of them.
 */
export function MorePane({ projectId }: { projectId?: string | null }) {
  const [openGroups, setOpenGroups] = useState<string[]>(['cloud']);
  const [current, setCurrent] = useState('analytics');
  // On a phone the nav and the detail cannot share a row — 248px of nav left the
  // detail ~140px, unreadable. So below $md this becomes a drill-down: the nav
  // is the whole pane, picking a section swaps to the detail full-width, and a
  // back row returns. Desktop is unchanged — both columns side by side, and
  // `showDetail` never gates anything there ($md forces both visible).
  const [showDetail, setShowDetail] = useState(false);
  const section = findSection(current) ?? SECTIONS[0];

  const toggle = (id: string) =>
    setOpenGroups((g) => (g.includes(id) ? g.filter((x) => x !== id) : [...g, id]));

  // Picking a section is the drill-in on a phone; expanding a group (onToggle)
  // stays in the nav. Desktop ignores showDetail.
  const select = (id: string) => {
    setCurrent(id);
    setShowDetail(true);
  };

  return (
    <XStack position="absolute" top={0} right={0} bottom={0} left={0} zIndex={10} backgroundColor="$background">
      {/* THE NAV. Full width on a phone (the whole pane until you pick a
          section), a fixed 248 beside the detail on a desktop — a label does
          not get longer because the window did. */}
      <YStack display={showDetail ? 'none' : 'flex'} $md={{ display: 'flex', width: 248 }} width="100%" flexShrink={0} minHeight={0} overflow="scroll" paddingHorizontal="$2" paddingVertical="$3" gap="$0.5">
        {SECTIONS.map((s) => (
          <NavRow
            key={s.id}
            section={s}
            current={current}
            open={openGroups.includes(s.id)}
            onToggle={() => toggle(s.id)}
            onSelect={select}
  />
        ))}
      </YStack>

      <YStack display={showDetail ? 'flex' : 'none'} $md={{ display: 'flex' }} flex={1} minWidth={0} minHeight={0} overflow="scroll" padding="$4" gap="$3">
        {/* Back to the nav — phone only; on a desktop the nav never left. */}
        <XStack display="flex" $md={{ display: 'none' }} role="button" tabIndex={0} onPress={() => setShowDetail(false)} alignItems="center" gap="$1.5" cursor="pointer" marginBottom="$1">
          <SizableText color="$color11"><ChevronLeft size={16} /></SizableText>
          <SizableText fontSize="$2" color="$color11">All settings</SizableText>
        </XStack>
        <YStack gap="$1">
          <SizableText fontSize="$6" color="$color">{section.label}</SizableText>
          <Paragraph fontSize="$2" color="$color11">{section.blurb}</Paragraph>
        </YStack>
        <SectionBody section={section} projectId={projectId} />
      </YStack>
    </XStack>
  );
}

function NavRow({
  section,
  current,
  open,
  onToggle,
  onSelect,
}: {
  section: Section;
  current: string;
  open: boolean;
  onToggle: () => void;
  onSelect: (id: string) => void;
}) {
  const group = Boolean(section.children?.length);
  // A group's own row selects nothing — it opens. Making it both meant a click
  // on "Cloud" did two things at once and you could not do either on purpose.
  const active = !group && current === section.id;

  return (
    <YStack gap="$0.5">
      <XStack
        role="button"
        tabIndex={0}
        onPress={() => (group ? onToggle() : onSelect(section.id))}
        alignItems="center"
        gap="$2"
        borderRadius="$4"
        paddingHorizontal="$2.5"
        paddingVertical="$2"
        cursor="pointer"
        backgroundColor={active ? '$color3' : 'transparent'}
        hoverStyle={active ? undefined : { backgroundColor: '$color2' }}
      >
        <SizableText color={active ? '$color' : '$color11'}><section.icon size={15} /></SizableText>
        <SizableText flex={1} minWidth={0} numberOfLines={1} fontSize="$2" color={active ? '$color' : '$color11'}>
          {section.label}
        </SizableText>
        {group && (
          <SizableText color="$color11">
            {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </SizableText>
        )}
      </XStack>

      {group && open && (
        <YStack paddingLeft="$4" gap="$0.5">
          {section.children!.map((child) => {
            const on = current === child.id;
            return (
              <XStack
                key={child.id}
                role="button"
                tabIndex={0}
                onPress={() => onSelect(child.id)}
                alignItems="center"
                gap="$2"
                borderRadius="$4"
                paddingHorizontal="$2.5"
                paddingVertical="$1.5"
                cursor="pointer"
                backgroundColor={on ? '$color3' : 'transparent'}
                hoverStyle={on ? undefined : { backgroundColor: '$color2' }}
              >
                <SizableText color={on ? '$color' : '$color11'}><child.icon size={14} /></SizableText>
                <SizableText flex={1} minWidth={0} numberOfLines={1} fontSize="$2" color={on ? '$color' : '$color11'}>
                  {child.label}
                </SizableText>
              </XStack>
            );
          })}
        </YStack>
      )}
    </YStack>
  );
}

/**
 * What a section shows.
 *
 * Deliberately one shape for now: the card names the surface that answers the
 * section, or says there is not one. Real readers land here section by section
 * — each is a different endpoint with a different shape, and inventing a shared
 * one before any of them is written is how a settings pane ends up with a
 * lowest-common-denominator table that suits none of them.
 */
function SectionBody({ section, projectId }: { section: Section; projectId?: string | null }) {
  // The sections whose readers already exist render the real thing.
  if (section.id === 'connectors') return <ConnectorsBody />;
  if (section.id === 'ai') return <ModelsBody />;
  if (section.id === 'agents') return <McpBody />;
  if (section.id === 'payments') return <PaymentsBody projectId={projectId} />;
  if (section.id === 'cloud-database') return <DatabaseBody />;
  if (section.id === 'cloud-usage') return <UsageBody />;
  if (section.id === 'cloud-logs') return <LogsBody />;
  if (section.id === 'analytics') return <AnalyticsBody />;
  return (
    <YStack {...panel} padding="$4" gap="$2">
      {section.where ? (
        <>
          <SizableText fontSize="$3" color="$color">Connected</SizableText>
          <Paragraph fontSize="$2" color="$color11">
            This section reads{' '}
            <SizableText fontFamily="$mono" fontSize="$1" color="$color">{section.where}</SizableText>
            {projectId ? (
              <>
                {' '}for{' '}
                <SizableText fontFamily="$mono" fontSize="$1" color="$color">{projectId}</SizableText>
              </>
            ) : null}
            . The reader for this surface is not drawn here yet — the endpoint is live and the
            wiring is the remaining work.
          </Paragraph>
        </>
      ) : (
        <>
          <SizableText fontSize="$3" color="$color">Not connected yet</SizableText>
          <Paragraph fontSize="$2" color="$color11">
            Nothing answers this section, so there is nothing to show. It is listed because it is
            planned and you should be able to see where it will live — not because it half works.
          </Paragraph>
        </>
      )}
    </YStack>
  );
}

/**
 * The org's real connectors, compactly.
 *
 * The same store `/connectors` manages — connections belong to the WORKSPACE,
 * so this is a view, not a second copy, and the manage link goes to the one
 * canonical surface. `fetchConnectors` resolves-never-throws (failure → []),
 * so the empty state honestly covers "nothing connected" and "unreachable"
 * alike rather than fabricating rows.
 */
function ConnectorsBody() {
  const [providers, setProviders] = useState<Provider[] | null>(null);

  useEffect(() => {
    let alive = true;
    fetchConnectors().then((p) => alive && setProviders(p));
    return () => {
      alive = false;
    };
  }, []);

  const connected = (providers ?? []).filter((p) => p.connected);

  return (
    <YStack {...panel} padding="$4" gap="$3">
      {providers === null ? (
        <SizableText fontSize="$2" color="$color11">Loading connections…</SizableText>
      ) : connected.length === 0 ? (
        <YStack gap="$1">
          <SizableText fontSize="$3" color="$color">Nothing connected</SizableText>
          <Paragraph fontSize="$2" color="$color11">
            Connections belong to the workspace, so any project can use them once made.
          </Paragraph>
        </YStack>
      ) : (
        <YStack gap="$0.5">
          {connected.map((p) => (
            <XStack key={p.id} alignItems="center" gap="$2.5" paddingVertical="$2" borderBottomWidth={1} borderColor="$color04">
              <SizableText color="$color11"><Plug size={14} /></SizableText>
              <YStack flex={1} minWidth={0}>
                <SizableText fontSize="$2" color="$color">{p.name}</SizableText>
                <SizableText fontSize="$1" color="$color11">{p.category}</SizableText>
              </YStack>
              <SizableText fontSize="$1" color="$color11">Connected</SizableText>
            </XStack>
          ))}
        </YStack>
      )}
      <Link href="/connectors">
        <SizableText fontSize="$2" color="$color11" hoverStyle={{ color: '$color' }} textDecorationLine="underline">
          Manage connectors
        </SizableText>
      </Link>
    </YStack>
  );
}

/**
 * The models this project can call — the SAME list the composer's picker shows,
 * through the same session-shared hook, so the two surfaces cannot disagree.
 * The default is named because "which model answers when I don't choose" is
 * the first question this section exists to answer; changing it lives in the
 * composer's settings, and this says so instead of growing a second control.
 */
function ModelsBody() {
  const { models, defaultModel, loading } = useModels();
  const families = new Map<string, number>();
  for (const m of models) families.set(m.family, (families.get(m.family) ?? 0) + 1);
  const fallback = models.find((m) => m.value === defaultModel)?.label ?? defaultModel;

  return (
    <YStack {...panel} padding="$4" gap="$3">
      <YStack gap="$0.5">
        <SizableText fontSize="$2" color="$color11">Default model</SizableText>
        <SizableText fontSize="$4" color="$color">{fallback}</SizableText>
        <Paragraph fontSize="$1" color="$color11">
          Answers every build unless a turn picks otherwise — change it from the composer's
          model picker.
        </Paragraph>
      </YStack>
      <YStack gap="$0.5">
        <SizableText fontSize="$2" color="$color11">
          {loading ? 'Loading the live list…' : `${models.length} models across ${families.size} families`}
        </SizableText>
        <XStack flexWrap="wrap" gap="$1.5" paddingTop="$1">
          {[...families.entries()].map(([family, count]) => (
            <XStack key={family} alignItems="center" gap="$1.5" borderRadius={999} backgroundColor="$color2" paddingHorizontal="$2.5" paddingVertical="$1">
              <SizableText fontSize="$1" color="$color">{family}</SizableText>
              <SizableText fontSize="$1" color="$color11">{count}</SizableText>
            </XStack>
          ))}
        </XStack>
      </YStack>
    </YStack>
  );
}

/**
 * The org's MCP registry — servers and the tools they contribute.
 *
 * Three states, and the middle one is the honest work: `null` from the client
 * means the registry did not answer in a shape this build understands, and
 * that renders as COULD NOT READ — never as none-registered, because an org
 * that has servers being told it has none re-registers duplicates. Only a
 * well-formed empty answer claims emptiness.
 */
function McpBody() {
  const [servers, setServers] = useState<McpServer[] | null | undefined>(undefined);
  const [tools, setTools] = useState<number | null>(null);

  useEffect(() => {
    let alive = true;
    fetchMcpServers().then((s) => alive && setServers(s));
    fetchMcpToolCount().then((n) => alive && setTools(n));
    return () => {
      alive = false;
    };
  }, []);

  return (
    <YStack {...panel} padding="$4" gap="$3">
      {servers === undefined ? (
        <SizableText fontSize="$2" color="$color11">Reading the registry…</SizableText>
      ) : servers === null ? (
        <YStack gap="$1">
          <SizableText fontSize="$3" color="$color">The registry could not be read</SizableText>
          <Paragraph fontSize="$2" color="$color11">
            This is not the same as having no servers — the answer did not arrive, so nothing
            here is claimed either way.
          </Paragraph>
        </YStack>
      ) : servers.length === 0 ? (
        <YStack gap="$1">
          <SizableText fontSize="$3" color="$color">No MCP servers registered</SizableText>
          <Paragraph fontSize="$2" color="$color11">
            Register one and every agent this workspace runs can use its tools.
          </Paragraph>
        </YStack>
      ) : (
        <YStack gap="$0.5">
          {tools !== null && (
            <SizableText fontSize="$2" color="$color11" paddingBottom="$1">
              {tools} tool{tools === 1 ? '' : 's'} across {servers.length} server{servers.length === 1 ? '' : 's'}
            </SizableText>
          )}
          {servers.map((s) => (
            <XStack key={s.id} alignItems="center" gap="$2.5" paddingVertical="$2" borderBottomWidth={1} borderColor="$color04">
              <SizableText color="$color11"><Boxes size={14} /></SizableText>
              <YStack flex={1} minWidth={0}>
                <SizableText fontSize="$2" color="$color">{s.name}</SizableText>
                {s.url && <SizableText fontSize="$1" color="$color11" numberOfLines={1}>{s.url}</SizableText>}
              </YStack>
            </XStack>
          ))}
        </YStack>
      )}
    </YStack>
  );
}

/**
 * Payments — the org's REAL commerce state for this project.
 *
 * /v1/store/products answers four ways and each is a different sentence:
 * an array is the catalog; [] is a bound store with nothing in it yet; 409 is
 * the meaningful "no store bound to this project" state (not an error — most
 * projects sell nothing); anything else is could-not-read. Never a fixture.
 */
function PaymentsBody({ projectId }: { projectId?: string | null }) {
  const [state, setState] = useState<
    | { kind: 'loading' }
    | { kind: 'catalog'; count: number }
    | { kind: 'unbound' }
    | { kind: 'unreadable' }
  >({ kind: 'loading' });

  useEffect(() => {
    let alive = true;
    const q = projectId ? `?space_id=${encodeURIComponent(projectId)}` : '';
    fetch(`/v1/store/products${q}`, { credentials: 'include', cache: 'no-store' })
      .then(async (r) => {
        if (!alive) return;
        if (r.status === 409) return setState({ kind: 'unbound' });
        if (!r.ok) return setState({ kind: 'unreadable' });
        const body = await r.json().catch(() => null);
        const rows = Array.isArray(body) ? body : Array.isArray(body?.products) ? body.products : null;
        setState(rows ? { kind: 'catalog', count: rows.length } : { kind: 'unreadable' });
      })
      .catch(() => alive && setState({ kind: 'unreadable' }));
    return () => {
      alive = false;
    };
  }, [projectId]);

  return (
    <YStack {...panel} padding="$4" gap="$2">
      {state.kind === 'loading' ? (
        <SizableText fontSize="$2" color="$color11">Reading the catalog…</SizableText>
      ) : state.kind === 'unbound' ? (
        <>
          <SizableText fontSize="$3" color="$color">No store bound to this project</SizableText>
          <Paragraph fontSize="$2" color="$color11">
            Most projects sell nothing, and that is fine. Bind a store and the catalog,
            checkout and orders light up here — the same commerce plane the /store page sells from.
          </Paragraph>
        </>
      ) : state.kind === 'catalog' ? (
        <>
          <SizableText fontSize="$3" color="$color">
            {state.count === 0 ? 'Store bound — catalog is empty' : `${state.count} product${state.count === 1 ? '' : 's'} in the catalog`}
          </SizableText>
          <Paragraph fontSize="$2" color="$color11">
            Live from commerce. Checkout and orders ride the same plane.
          </Paragraph>
        </>
      ) : (
        <>
          <SizableText fontSize="$3" color="$color">The catalog could not be read</SizableText>
          <Paragraph fontSize="$2" color="$color11">
            Not the same as empty — the answer did not arrive, so nothing is claimed either way.
          </Paragraph>
        </>
      )}
      <Link href="/store">
        <SizableText fontSize="$2" color="$color11" hoverStyle={{ color: '$color' }} textDecorationLine="underline">
          Open the storefront
        </SizableText>
      </Link>
    </YStack>
  );
}

/**
 * Database — Hanzo Base, proven rather than described.
 *
 * There is no list-collections endpoint on the record-scoped BFF, so this does
 * not invent one: it probes a collection that cannot exist and reads the SHAPE
 * of the refusal. A 404 travelled session → BFF → Base and back — the whole
 * chain answers, which is the fact a person opening this section wants. 401
 * names the session; anything else is could-not-read. Collections appear as
 * the app creates them; records ride /v1/base/<collection>.
 */
/**
 * Web analytics, from cloud's org-scoped read surface. The WRITE half is the
 * hosted tag publish injects onto every page; this is the read: the topPages
 * lens off `/v1/analytics/top`, org-wide because the lens does not filter by
 * project yet — the lede says so rather than passing org totals off as this
 * project's.
 *
 * The lens carries its OWN honesty (`Breakdown{available, reason, items}`,
 * apps/analytics query.go): `available:false` means the warehouse table could
 * not be read — that IS the three-valued "did not answer", stated by the plane
 * itself rather than inferred from a parse. A page ranks by `pageviews` with
 * `pct` its share of ALL in-window views (so a top-N shows the long tail
 * honestly, which is why there is no fabricated grand total).
 */
function AnalyticsBody() {
  type Page = { key: string; pageviews: number; visitors: number; pct: number };
  const [read, setRead] = useState<null | 'unreachable' | { pages: Page[] }>(null);

  useEffect(() => {
    let alive = true;
    fetch('/v1/analytics/top', { credentials: 'include', cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((b: unknown) => {
        if (!alive) return;
        const lens = (b as { topPages?: { available?: boolean; items?: unknown[] } })?.topPages;
        // The plane says whether it could read. `available === false`, or a
        // response with no topPages lens at all, is the honest unreachable.
        if (!lens || lens.available === false || !Array.isArray(lens.items)) {
          setRead('unreachable');
          return;
        }
        const pages = lens.items
          .map((x) => {
            const r = (x ?? {}) as Record<string, unknown>;
            return {
              key: typeof r.key === 'string' ? r.key : '',
              pageviews: typeof r.pageviews === 'number' ? r.pageviews : 0,
              visitors: typeof r.visitors === 'number' ? r.visitors : 0,
              pct: typeof r.pct === 'number' ? r.pct : 0,
            };
          })
          .filter((x) => x.key);
        setRead({ pages });
      })
      .catch(() => alive && setRead('unreachable'));
    return () => {
      alive = false;
    };
  }, []);

  return (
    <YStack {...panel} padding="$4" gap="$2.5">
      {read === null ? (
        <SizableText fontSize="$2" color="$color11">Reading traffic…</SizableText>
      ) : read === 'unreachable' ? (
        <>
          <SizableText fontSize="$3" color="$color">Analytics did not answer</SizableText>
          <Paragraph fontSize="$2" color="$color11">
            Not a claim about your traffic — the read surface is unreachable right now.
          </Paragraph>
        </>
      ) : read.pages.length === 0 ? (
        <>
          <SizableText fontSize="$3" color="$color">No pageviews yet</SizableText>
          <Paragraph fontSize="$2" color="$color11">
            The lens answered and it is empty. Every page you publish carries the
            tag; views appear here as visitors arrive. Workspace-wide for now —
            per-project filtering follows the lens.
          </Paragraph>
        </>
      ) : (
        <>
          <XStack alignItems="baseline" justifyContent="space-between" paddingBottom="$1">
            <SizableText fontSize="$2" color="$color11">Top pages — this workspace</SizableText>
            <SizableText fontSize="$1" color="$color06">views · share</SizableText>
          </XStack>
          <YStack gap="$1.5">
            {read.pages.slice(0, 8).map((p) => (
              <XStack key={p.key} alignItems="baseline" gap="$2">
                <SizableText flex={1} numberOfLines={1} fontFamily="$mono" fontSize="$1" color="$color">{p.key}</SizableText>
                <SizableText fontFamily="$mono" fontSize="$1" color="$color" flexShrink={0}>{p.pageviews}</SizableText>
                <SizableText fontFamily="$mono" fontSize="$1" color="$color11" flexShrink={0} width={44} textAlign="right">{p.pct.toFixed(1)}%</SizableText>
              </XStack>
            ))}
          </YStack>
          <Paragraph fontSize="$1" color="$color11">
            Share is of all in-window views. Workspace-wide — per-project
            filtering follows the events lens.
          </Paragraph>
        </>
      )}
    </YStack>
  );
}

/**
 * Account usage, from `/v1/usage` — which is honest by construction: the only
 * metered figure today is the real project count, and the endpoint SAYS the
 * rest is not metered yet. This reader renders exactly that, limits included
 * when they exist, and never invents a bar for a number nobody measured.
 */
function UsageBody() {
  type Metric = { label: string; value: number; limit: number | null };
  const [read, setRead] = useState<
    null | { metered: boolean; metrics: Metric[]; note?: string } | 'unreachable'
  >(null);

  useEffect(() => {
    let alive = true;
    fetch('/v1/usage', { credentials: 'include', cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((b: { usage?: { metered: boolean; metrics: Metric[]; note?: string } }) => {
        if (!alive) return;
        setRead(b.usage ?? 'unreachable');
      })
      .catch(() => alive && setRead('unreachable'));
    return () => {
      alive = false;
    };
  }, []);

  return (
    <YStack {...panel} padding="$4" gap="$2.5">
      {read === null ? (
        <SizableText fontSize="$2" color="$color11">Reading usage…</SizableText>
      ) : read === 'unreachable' ? (
        <>
          <SizableText fontSize="$3" color="$color">Usage did not answer</SizableText>
          <Paragraph fontSize="$2" color="$color11">
            Not a claim about your consumption — the reader itself is unreachable right now.
          </Paragraph>
        </>
      ) : (
        <>
          {read.metrics.map((m) => (
            <XStack key={m.label} alignItems="baseline" justifyContent="space-between" gap="$3">
              <SizableText fontSize="$2" color="$color11">{m.label}</SizableText>
              <SizableText fontSize="$3" color="$color" fontFamily="$mono">
                {m.value}
                {m.limit !== null ? ` / ${m.limit}` : ''}
              </SizableText>
            </XStack>
          ))}
          {read.note ? (
            <Paragraph fontSize="$1" color="$color11">{read.note}</Paragraph>
          ) : null}
        </>
      )}
    </YStack>
  );
}

/**
 * The org's request log, from `/v1/o11y/logs` — the same org-pinned stream the
 * console reads, so the two surfaces show one truth. The shape is read
 * TOLERANTLY (rows under `logs`/`rows`/bare array; a row's time, product and
 * message under their common names) because the reader's job is to show what
 * arrived — and the three-valued contract stays strict: null is "couldn't
 * read", an empty list is the stream ANSWERING "nothing logged", and only a
 * well-formed answer may claim emptiness.
 */
function LogsBody() {
  type Row = { at: string; product: string; status: string; text: string };
  const [rows, setRows] = useState<Row[] | null | 'unreachable'>(null);

  useEffect(() => {
    let alive = true;
    const word = (v: unknown): string =>
      typeof v === 'string' ? v : typeof v === 'number' ? String(v) : '';
    fetch('/v1/o11y/logs?limit=50', { credentials: 'include', cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((b: unknown) => {
        if (!alive) return;
        const list = Array.isArray(b)
          ? b
          : Array.isArray((b as { logs?: unknown[] })?.logs)
            ? (b as { logs: unknown[] }).logs
            : Array.isArray((b as { rows?: unknown[] })?.rows)
              ? (b as { rows: unknown[] }).rows
              : null;
        if (!list) {
          setRows('unreachable');
          return;
        }
        setRows(
          list.slice(0, 50).map((raw) => {
            const r = (raw ?? {}) as Record<string, unknown>;
            return {
              at: word(r.at) || word(r.time) || word(r.timestamp),
              product: word(r.product) || word(r.service),
              status: word(r.status) || word(r.code),
              text: word(r.msg) || word(r.message) || word(r.path) || word(r.route),
            };
          }),
        );
      })
      .catch(() => alive && setRows('unreachable'));
    return () => {
      alive = false;
    };
  }, []);

  return (
    <YStack {...panel} padding="$4" gap="$2">
      {rows === null ? (
        <SizableText fontSize="$2" color="$color11">Reading the request log…</SizableText>
      ) : rows === 'unreachable' ? (
        <>
          <SizableText fontSize="$3" color="$color">The log did not answer</SizableText>
          <Paragraph fontSize="$2" color="$color11">
            Not a claim that nothing happened — the stream itself is unreachable right now.
          </Paragraph>
        </>
      ) : rows.length === 0 ? (
        <>
          <SizableText fontSize="$3" color="$color">Nothing logged yet</SizableText>
          <Paragraph fontSize="$2" color="$color11">
            The stream answered and it is empty — requests appear here as your org makes them.
          </Paragraph>
        </>
      ) : (
        <YStack gap="$1" maxHeight={420} overflow="scroll">
          {rows.map((r, i) => (
            <XStack key={i} gap="$2" alignItems="baseline">
              <SizableText fontFamily="$mono" fontSize="$1" color="$color06" flexShrink={0}>
                {r.at.slice(0, 19)}
              </SizableText>
              {r.product ? (
                <SizableText fontFamily="$mono" fontSize="$1" color="$color11" flexShrink={0}>
                  {r.product}
                </SizableText>
              ) : null}
              {r.status ? (
                <SizableText
                  fontFamily="$mono"
                  fontSize="$1"
                  flexShrink={0}
                  {...{ color: /^[45]/.test(r.status) ? 'var(--destructive)' : '$color11' }}
                >
                  {r.status}
                </SizableText>
              ) : null}
              <SizableText fontFamily="$mono" fontSize="$1" color="$color" numberOfLines={1}>
                {r.text}
              </SizableText>
            </XStack>
          ))}
        </YStack>
      )}
    </YStack>
  );
}

function DatabaseBody() {
  const [door, setDoor] = useState<'checking' | 'answers' | 'session' | 'unreachable'>('checking');

  useEffect(() => {
    let alive = true;
    fetch('/v1/base/__door_probe__', { credentials: 'include', cache: 'no-store' })
      .then((r) => {
        if (!alive) return;
        if (r.status === 404) setDoor('answers');
        else if (r.status === 401) setDoor('session');
        else if (r.ok) setDoor('answers');
        else setDoor('unreachable');
      })
      .catch(() => alive && setDoor('unreachable'));
    return () => {
      alive = false;
    };
  }, []);

  return (
    <YStack {...panel} padding="$4" gap="$2">
      {door === 'checking' ? (
        <SizableText fontSize="$2" color="$color11">Knocking on the data door…</SizableText>
      ) : door === 'answers' ? (
        <>
          <SizableText fontSize="$3" color="$color">Base answers</SizableText>
          <Paragraph fontSize="$2" color="$color11">
            The data door (session → app → Base) is live for this workspace. Collections appear
            as your app creates them; records ride{' '}
            <SizableText fontFamily="$mono" fontSize="$1" color="$color">/v1/base/&lt;collection&gt;</SizableText>
            , with identity injected server-side — the browser never holds a Base credential.
          </Paragraph>
        </>
      ) : door === 'session' ? (
        <>
          <SizableText fontSize="$3" color="$color">The door wants a session</SizableText>
          <Paragraph fontSize="$2" color="$color11">Sign in again and this section re-checks.</Paragraph>
        </>
      ) : (
        <>
          <SizableText fontSize="$3" color="$color">Base did not answer</SizableText>
          <Paragraph fontSize="$2" color="$color11">
            Not a claim about your data — the door itself is unreachable right now.
          </Paragraph>
        </>
      )}
    </YStack>
  );
}
