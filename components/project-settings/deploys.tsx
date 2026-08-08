"use client";

/**
 * Deploys section BODY for /dev/:org/:project/settings — the page provides the
 * Section frame/icon/title, this renders what goes inside it.
 *
 * Real deploy history from the ONE org-scoped store (`/v1/projects/:slug/
 * deployments` via lib/api/deploys — same-origin BFF, caller's IAM bearer).
 * Each row is a real deployment: state (green = live, red = failed, in-flight
 * is neutral with a spinner), version + short sha, relative time, and the
 * servable URL for a live row. While a deploy is in flight the list re-fetches
 * every 5s until it settles. Nothing fabricated: loading is a skeleton, empty
 * says publish, an error states the gateway's reason and offers retry.
 */

import { useCallback, useEffect, useState } from "react";
import { Paragraph, SizableText, XStack, YStack } from '@hanzo/ui';
// `Anchor` is not on @hanzo/ui's barrel yet — the dts build drops it, the
// same way it drops the GuiElement type. Tracked; everything else in this
// file comes from @hanzo/ui.
import { Anchor } from '@hanzo/gui';
import { Button } from "@hanzo/ui";
import { Circle, ExternalLink } from "lucide-react";

import type { Project } from "@/types";
import { relativeTime } from "@/lib/projects-view";
import { Spinner } from "@/components/ui/spinner";
import {
  fetchDeploys,
  inflight,
  sha,
  stateOf,
  urlOf,
  type Deployment,
} from "@/lib/api/deploys";

type State =
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "ready"; deploys: Deployment[] };

export function DeploysSection({ project }: { project: Project }) {
  // space_id is the `${org}/${slug}` pivot (lib/api/projects.toEditorProject).
  const slug = (project.space_id ?? "").split("/")[1] ?? "";
  const [state, setState] = useState<State>({ kind: "loading" });

  const load = useCallback(async () => {
    if (!slug) return;
    try {
      setState({ kind: "ready", deploys: await fetchDeploys(slug) });
    } catch (e) {
      setState({
        kind: "error",
        message: e instanceof Error && e.message ? e.message : "Couldn’t load deploy history.",
      });
    }
  }, [slug]);

  useEffect(() => {
    load();
  }, [load]);

  // A deploy in flight settles server-side — poll until it does.
  useEffect(() => {
    if (state.kind !== "ready" || !state.deploys.some(inflight)) return;
    const t = setInterval(load, 5000);
    return () => clearInterval(t);
  }, [state, load]);

  return (
    <YStack>
      <Paragraph fontSize="$3" color="$color11">
        Publishing deploys your site to Hanzo Cloud — live at{" "}
        <SizableText fontFamily="$mono" color="$color">{slug ? `${slug}.hanzo.app` : "<slug>.hanzo.app"}</SizableText>{" "}
        — and commits the source to Hanzo Git. Each publish is a new versioned deployment.
      </Paragraph>

      {!slug ? (
        <Paragraph marginTop="$3" borderRadius="$5" borderWidth={1} borderColor="$borderColor" backgroundColor="$background" paddingHorizontal="$3" paddingVertical="$2.5" fontSize="$1" color="$color11">
          Not saved to the cloud yet — publish from the builder to create the project and its first deploy.
        </Paragraph>
      ) : state.kind === "loading" ? (
        <YStack marginTop="$3" rowGap="$2">
          <YStack height={40} borderRadius="$5" backgroundColor="$color4" className="skeleton" />
          <YStack height={40} borderRadius="$5" backgroundColor="$color4" className="skeleton" style={{ animationDelay: "120ms" }} />
          <YStack height={40} borderRadius="$5" backgroundColor="$color4" className="skeleton" style={{ animationDelay: "240ms" }} />
        </YStack>
      ) : state.kind === "error" ? (
        <XStack marginTop="$3" flexWrap="wrap" alignItems="center" justifyContent="space-between" gap="$3" borderRadius="$5" borderWidth={1} borderColor="$borderColor" backgroundColor="$background" paddingHorizontal="$3" paddingVertical="$2.5">
          <SizableText minWidth={0} flex={1} numberOfLines={2} fontSize="$1" color="$color11">
            {state.message}
          </SizableText>
          <Button type="button" onClick={() => { setState({ kind: "loading" }); load(); }}>
            Retry
          </Button>
        </XStack>
      ) : state.deploys.length === 0 ? (
        <Paragraph marginTop="$3" borderRadius="$5" borderWidth={1} borderColor="$borderColor" backgroundColor="$background" paddingHorizontal="$3" paddingVertical="$2.5" fontSize="$1" color="$color11">
          Not deployed yet. Publish from the builder to go live at{" "}
          <SizableText fontFamily="$mono" color="$color11">{slug}.hanzo.app</SizableText>.
        </Paragraph>
      ) : (
        <YStack marginTop="$3" rowGap="$2">
          {state.deploys.map((d) => (
            <Row key={d.id} d={d} slug={slug} />
          ))}
        </YStack>
      )}
    </YStack>
  );
}

function Row({ d, slug }: { d: Deployment; slug: string }) {
  const s = stateOf(d.status);
  const url = urlOf(d, slug);
  const commit = sha(d.commit);
  const when = d.updatedAt ? relativeTime(new Date(d.updatedAt * 1000).toISOString()) : null;

  return (
    <XStack flexWrap="wrap" alignItems="center" justifyContent="space-between" gap="$3" borderRadius="$5" borderWidth={1} borderColor="$borderColor" backgroundColor="$background" paddingHorizontal="$3" paddingVertical="$2.5">
      <XStack minWidth={0} flexWrap="wrap" alignItems="center" columnGap="$3" rowGap="$1">
        <XStack alignItems="center" gap="$1.5">
          {s.kind === "inflight" ? (
            <Spinner size={12} color="var(--muted-foreground)" />
          ) : (
            <Circle size={8} color={s.color ?? "var(--muted-foreground)"} />
          )}
          <SizableText fontSize="$1" color={s.color ?? "$color11"}>{s.label}</SizableText>
        </XStack>
        {d.version > 0 && (
          <SizableText fontFamily="$mono" fontSize="$1" color="$color11">v{d.version}</SizableText>
        )}
        {commit && (
          <SizableText fontFamily="$mono" fontSize="$1" color="$color11">{commit}</SizableText>
        )}
        {when && <SizableText fontSize="$1" color="$color11">{when}</SizableText>}
        {s.kind === "failed" && d.message && (
          <SizableText minWidth={0} numberOfLines={1} fontSize="$1" color="$color11">
            {d.message}
          </SizableText>
        )}
      </XStack>
      {url && (
        <Anchor display="inline-flex"
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          alignItems="center"
          gap="$1.5"
          fontFamily="$mono"
          fontSize="$1"
          color="$color11"
          hoverStyle={{ color: "$color" }}
        >
          {url.replace(/^https?:\/\//, "")}
          <ExternalLink size={12} />
        </Anchor>
      )}
    </XStack>
  );
}
