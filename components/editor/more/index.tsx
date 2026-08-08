'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Paragraph, SizableText, XStack, YStack } from '@hanzo/ui';
import { ChevronDown, ChevronRight, Plug } from 'lucide-react';

import { panel } from '@/lib/chrome';
import { fetchConnectors, type Provider } from '@/lib/connectors';
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
  // Connectors is the one section whose reader already exists — the same
  // client /connectors and the project settings read, resolve-never-throws.
  if (section.id === 'connectors') return <ConnectorsBody />;
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
