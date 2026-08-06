"use client";

/**
 * Connections & Base — the settings-section BODY for a project's integrations
 * surface. The page provides the Section frame/icon/title; this renders inside.
 *
 * Connections are a per-project VIEW over the ONE org connector store
 * (lib/connectors.ts → same-origin /v1/connectors BFF — the store /connectors
 * and console.hanzo.ai render). Connections belong to the workspace, so this
 * lists the org's REAL connected providers; managing them stays on /connectors,
 * the canonical surface. fetchConnectors resolves-never-throws (failure → []),
 * so the empty state honestly covers "nothing enabled" and "unreachable" alike —
 * never fabricated rows.
 *
 * Base has NO per-project status endpoint (the /v1/base BFF is record-scoped),
 * so the Base area states only what is true — provisioned on publish when the
 * Base option is enabled — and deep-links to the builder's data & schema.
 */

import { XStack, YStack, SizableText, Paragraph } from "@hanzo/ui";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Database, Plug } from "lucide-react";

import { fetchConnectors, type Provider } from "@/lib/connectors";
import { builderLink } from "@/lib/api/projects";
import { relativeTime } from "@/lib/projects-view";
import type { Project } from "@/types";

export function ConnectionsSection({ project }: { project: Project }) {
  // space_id is the `${org}/${slug}` pivot the editor keys everything off.
  const cut = (project.space_id || "").indexOf("/");
  const org = cut > 0 ? project.space_id.slice(0, cut) : "";
  const slug = cut > 0 ? project.space_id.slice(cut + 1) : project.space_id || "";

  return (
    <>
      <Paragraph fontSize="$3" color="$color11">
        Connect data sources, auth providers, and third-party services your app uses.
        Connections belong to the workspace, so every project — including this one — can use them.
      </Paragraph>

      <Connections />

      <Link href="/connectors"><XStack alignItems="center" gap="$1.5" borderRadius="$5" borderWidth={1} borderColor="$borderColor" backgroundColor="$color3" paddingHorizontal="$3.5" paddingVertical="$2" hoverStyle={{ borderColor: "$color" }}>
        <Plug size={14} />
        <SizableText fontSize="$3" color="$color">Manage connectors</SizableText>
      </XStack></Link>

      {/* Base backend */}
      <YStack marginTop="$1" borderTopWidth={1} borderColor="$borderColor" paddingTop="$3" rowGap="$3">
        <XStack alignItems="center" gap="$2">
          <Database size={14} />
          <SizableText fontSize="$1" fontWeight="500" color="$color11">Base backend</SizableText>
        </XStack>
        <Paragraph fontSize="$3" color="$color11">
          This app’s data plane — forms, records, and realtime run on its own Hanzo Base. It is provisioned on publish when the Base option is enabled.
        </Paragraph>
        <Link href={builderLink(slug, org)}><XStack alignItems="center" gap="$1.5" borderRadius="$5" borderWidth={1} borderColor="$borderColor" backgroundColor="$color3" paddingHorizontal="$3.5" paddingVertical="$2" hoverStyle={{ borderColor: "$color" }}>
          <Database size={14} />
          <SizableText fontSize="$3" color="$color">Open data &amp; schema in builder</SizableText>
        </XStack></Link>
      </YStack>
    </>
  );
}

/**
 * The org's live connections, read from the ONE store. Loading → skeleton;
 * empty → one honest line; otherwise the REAL connected rows (name, account,
 * connected-since) plus the true count still available to connect.
 */
function Connections() {
  const [state, setState] = useState<
    | { kind: "loading" }
    | { kind: "ready"; providers: Provider[] }
  >({ kind: "loading" });

  useEffect(() => {
    let alive = true;
    fetchConnectors().then((providers) => {
      if (alive) setState({ kind: "ready", providers });
    });
    return () => {
      alive = false;
    };
  }, []);

  if (state.kind === "loading") {
    return (
      <YStack rowGap="$2">
        {[0, 1].map((i) => (
          <YStack key={i} className="skeleton" height={40} borderRadius="$5" backgroundColor="$color4" />
        ))}
      </YStack>
    );
  }

  const connected = state.providers.filter((p) => p.connected);
  const available = state.providers.filter((p) => !p.connected && p.available);

  if (state.providers.length === 0) {
    return (
      <Paragraph borderRadius="$5" borderWidth={1} borderColor="$borderColor" backgroundColor="$background" paddingHorizontal="$3" paddingVertical="$2.5" fontSize="$1" color="$color11">
        No connectors are available to this workspace yet — nothing to set up.
      </Paragraph>
    );
  }

  if (connected.length === 0) {
    return (
      <Paragraph borderRadius="$5" borderWidth={1} borderColor="$borderColor" backgroundColor="$background" paddingHorizontal="$3" paddingVertical="$2.5" fontSize="$1" color="$color11">
        Nothing connected yet — {available.length === 1 ? "1 connector is" : `${available.length} connectors are`} available to this workspace.
      </Paragraph>
    );
  }

  return (
    <YStack rowGap="$2">
      {connected.map((p) => (
        <ConnectionRow key={p.id} p={p} />
      ))}
      {available.length > 0 && (
        <SizableText fontSize="$1" color="$color11">
          {available.length} more available to connect.
        </SizableText>
      )}
    </YStack>
  );
}

function ConnectionRow({ p }: { p: Provider }) {
  const when = p.connection?.connectedAt ? relativeTime(p.connection.connectedAt) : "—";
  const detail = [p.connection?.account, when === "—" ? "" : `connected ${when}`]
    .filter(Boolean)
    .join(" · ");
  return (
    <XStack alignItems="center" gap="$2.5" borderRadius="$5" borderWidth={1} borderColor="$borderColor" backgroundColor="$background" paddingHorizontal="$3" paddingVertical="$2.5">
      {/* Green stays the ONE semantic "connected" signal (matches /connectors). */}
      <SizableText flexShrink={0} width="$1.5" height="$1.5" borderRadius="$10" backgroundColor="$green9" />
      <SizableText flexShrink={0} numberOfLines={1} fontSize="$3" fontWeight="500" color="$color">{p.name}</SizableText>
      {detail && (
        <SizableText minWidth={0} flex={1} numberOfLines={1} fontSize="$1" color="$color11">{detail}</SizableText>
      )}
    </XStack>
  );
}
