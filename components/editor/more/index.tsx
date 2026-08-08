'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Paragraph, SizableText, XStack, YStack } from '@hanzo/ui';
import { Boxes, ChevronDown, ChevronRight, Plug } from 'lucide-react';

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
  const section = findSection(current) ?? SECTIONS[0];

  const toggle = (id: string) =>
    setOpenGroups((g) => (g.includes(id) ? g.filter((x) => x !== id) : [...g, id]));

  return (
    <XStack position="absolute" top={0} right={0} bottom={0} left={0} zIndex={10} backgroundColor="$background">
      {/* THE NAV. A fixed width, for the same reason the Files browser has one:
          it holds labels, and a label does not get longer because the window
          did. The content beside it takes the remainder. */}
      <YStack width={248} flexShrink={0} minHeight={0} overflow="scroll" paddingHorizontal="$2" paddingVertical="$3" gap="$0.5">
        {SECTIONS.map((s) => (
          <NavRow
            key={s.id}
            section={s}
            current={current}
            open={openGroups.includes(s.id)}
            onToggle={() => toggle(s.id)}
            onSelect={setCurrent}
  />
        ))}
      </YStack>

      <YStack flex={1} minWidth={0} minHeight={0} overflow="scroll" padding="$4" gap="$3">
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
