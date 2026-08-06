'use client';

import { YStack, XStack, Paragraph, SizableText, Anchor } from '@hanzo/gui';
import { Rocket, ExternalLink } from "lucide-react";
import Image from "next/image";

import Loading from "@/components/loading";
import { Button, Input, toast, Label } from '@hanzo/ui';
import { CopyButton } from '@hanzo/ui/product';
import SpaceIcon from "@/assets/space.svg";
import { Page } from "@/types";
import { builderLink } from "@/lib/api/projects";
import { baseEnabled } from "@/lib/base/flag";
import { syncToGit } from "@/lib/api/git";
import { currentOrg } from "@/lib/org-scope";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { EVENTS } from "@hanzo/event";
import { useAnalytics } from "@hanzo/event/react";
import { sendRewardSignal, getLastGenerationRequestId } from "@/lib/reward-signal";

export const DeployButtonContent = ({
  pages,
  options,
  prompts,
}: {
  pages: Page[];
  options?: {
    title?: string;
    description?: string;
  };
  prompts: string[];
}) => {
  const router = useRouter();
  const analytics = useAnalytics();
  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState({ title: "" });
  // After a successful publish that returns a live URL, hold it so we can hand the
  // user a real, shareable link (Open + Copy) instead of silently redirecting away.
  const [published, setPublished] = useState<{ url: string; slug: string; org?: string } | null>(null);
  // When the builder was opened on an existing project (`/dev?project=<slug>`),
  // reuse its slug + name so re-publishing updates the SAME shared record.
  const [existingSlug, setExistingSlug] = useState<string | undefined>(undefined);
  useEffect(() => {
    const w = window as unknown as { __projectSlug?: string; __projectName?: string };
    if (w.__projectSlug) setExistingSlug(w.__projectSlug);
    if (w.__projectName) setConfig((c) => (c.title ? c : { title: w.__projectName as string }));
  }, []);

  /**
   * Publish to the ONE org-scoped shared store (`/v1/publish` → cloud
   * projects service). The org is resolved server-side from the user's bearer, so the
   * project is created + billed under their organization with a real name + slug
   * (never `name: None`) and is visible in console.hanzo.ai from the SAME store.
   */
  const publish = async () => {
    if (!config.title.trim()) {
      toast.error("Please enter a title for your project.");
      return;
    }
    setLoading(true);
    analytics.capture(EVENTS.DEPLOY_STARTED, { framework: "static", update: Boolean(existingSlug) });

    try {
      const selectedOrg = currentOrg();
      // Source-repo provenance: when the builder was opened from a template/git
      // remote (/dev?template=…), that repo was stashed in localStorage. Carrying
      // it into publish is what lets the deploy be attributed to the OSS author who
      // owns the repo (Hanzo OSS Author program). Absent for from-scratch builds.
      let sourceRepo: string | undefined;
      try {
        sourceRepo = localStorage.getItem("sourceRepo") || undefined;
      } catch {}
      const res = await fetch("/v1/publish", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...(selectedOrg ? { "X-Org-Id": selectedOrg } : {}),
        },
        body: JSON.stringify({
          name: config.title.trim(),
          slug: existingSlug,
          description: prompts?.[prompts.length - 1] || "",
          framework: "static",
          pages,
          ...(sourceRepo ? { sourceRepo } : {}),
        }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        // The most expensive drop in the product: the user asked to ship and did
        // not. `status` distinguishes "needs onboarding" (a product gap we can
        // fix) from a real server failure — a status code, never the response body.
        analytics.capture(EVENTS.DEPLOY_FAILED, {
          framework: "static",
          update: Boolean(existingSlug),
          status: res.status,
          reason: data?.needsOnboarding ? "needs_onboarding" : "error",
        });
        if (res.status === 409 && data?.needsOnboarding) {
          toast.error("Set up your organization first.");
          router.push("/new");
          return;
        }
        toast.error(data?.error || "Failed to publish project");
        return;
      }

      // Content-free reward signal: the user shipped this generation. Attaches
      // the last gateway response id (no-ops if none). Fire-and-forget.
      sendRewardSignal(getLastGenerationRequestId(), "up");

      // Base backend: when the composer's Base toggle was on, spawn/refresh the
      // app's own Base (per-project data plane) so the published app's forms +
      // realtime actually persist. Fire-and-forget — publish never blocks on it.
      if (baseEnabled() && data?.slug) {
        fetch("/v1/provision", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ projectId: data.slug }),
        }).catch(() => {});
      }

      // Native git: commit + push the app's source to its Hanzo git repo
      // (api.hanzo.ai/v1/git/<org>/<slug>.git — auto-created on first push, S3-
      // backed). Every published app is versioned in Hanzo git, one commit per
      // publish, with an honest message. Fire-and-forget — a git hiccup never
      // fails the deploy (the site is already live). Reuses the ONE push path
      // (/v1/git/sync → cloud client-less push) the "Push to Git" button uses.
      if (data?.slug) {
        syncToGit(
          {
            provider: "hanzo",
            name: config.title.trim(),
            slug: data.slug,
            description: prompts?.[prompts.length - 1] || "",
            message: prompts?.[prompts.length - 1] || "Publish",
            private: true,
            pages,
          },
          selectedOrg || undefined,
        ).catch(() => {});
      }

      const liveUrl: string | undefined =
        data?.project?.liveUrl || data?.deployment?.liveUrl;
      // Live URL in hand → show the shareable link (Open + Copy) instead of bouncing
      // back into the editor. This is the moment that makes the builder shareable.
      if (liveUrl && data?.slug) {
        setPublished({ url: liveUrl, slug: data.slug, org: data?.org || data?.project?.org });
        // FUNNELS.appShip terminal step — a live URL exists. This is the whole
        // point of the product, so it is its own event, never inferred from a
        // deploy_started with no error. Never the URL/name (that is user content).
        analytics.capture(EVENTS.DEPLOY_SUCCEEDED, {
          framework: "static",
          update: Boolean(existingSlug),
          withBase: baseEnabled(),
        });
        if (!existingSlug) {
          // First live app = this person's activation moment. ONE activation
          // event across every product; `action` names the product's moment.
          analytics.capture(EVENTS.FIRST_ACTION, { action: "app_live" });
        }
        toast.success("Your project is live! 🎉");
        return;
      }
      if (data?.deployError && !liveUrl) {
        toast.success("Project saved to your organization.", {
          description: "The live deploy is finishing — open it from Projects.",
        });
      } else {
        toast.success("Your project is published! 🎉", {
          description: liveUrl ? "Your site is live." : undefined,
        });
      }

      // Deep-link back into the builder at the canonical nice URL
      // (/dev/<org>/<slug> — the same link console.hanzo.ai uses).
      router.push(builderLink(data.slug, data?.org || data?.project?.org));
    } catch (err) {
      analytics.capture(EVENTS.DEPLOY_FAILED, {
        framework: "static",
        update: Boolean(existingSlug),
        reason: "exception",
      });
      analytics.captureError(err, { properties: { where: "publish" } });
      toast.error(err instanceof Error ? err.message : "Failed to publish project");
    } finally {
      setLoading(false);
    }
  };

  // Published — hand the user their real, shareable live link.
  if (published) {
    const host = published.url.replace(/^https?:\/\//, "");
    return (
      <>
        <YStack borderBottomWidth={1} borderColor="$borderColor" backgroundColor="$background" padding="$4">
          <XStack marginBottom="$2" alignItems="center" justifyContent="center">
            <XStack width={36} height={36} alignItems="center" justifyContent="center" borderRadius="$5" borderWidth={1} borderColor="$green9" backgroundColor="$green9">
              <Rocket size={16} />
            </XStack>
          </XStack>
          <Paragraph textAlign="center" fontSize="$4" fontWeight="500" color="$color">Your app is live</Paragraph>
          <Paragraph marginTop="$1" textAlign="center" fontSize="$1" lineHeight="1.625" color="$color11">
            Share this link — anyone can open it.
          </Paragraph>
        </YStack>
        <YStack rowGap="$3" backgroundColor="$background" padding="$4">
          <XStack alignItems="center" gap="$2" borderRadius="$5" borderWidth={1} borderColor="$borderColor" backgroundColor="$color2" paddingHorizontal="$3" paddingVertical="$2">
            <SizableText flex={1} numberOfLines={1} fontFamily="$mono" fontSize="$3" color="$color">{host}</SizableText>
            <CopyButton value={published.url} label="Copy link" size={28} id="published-url" />
          </XStack>
          <Anchor display="inline-flex"
            href={published.url}
            target="_blank"
            rel="noopener noreferrer"
            width="100%" alignItems="center" justifyContent="center" gap="$1.5" borderRadius="$3" backgroundColor="$color5" borderWidth={1} borderColor="$color6" paddingHorizontal="$3" paddingVertical="$2" fontSize="$3" fontWeight="500" color="$color12" hoverStyle={{ backgroundColor: "$color6" }}
          >
            Open site <ExternalLink size={16} />
          </Anchor>
          <Button
            type="button"
            onClick={() => router.push(builderLink(published.slug, published.org))}
            variant="outline"
            width="100%" borderRadius="$3" borderWidth={1} borderColor="$borderColor" paddingHorizontal="$3" paddingVertical="$2" hoverStyle={{ backgroundColor: "$color3" }}
          >
            Back to editor
          </Button>
        </YStack>
      </>
    );
  }

  return (
    <>
      {/* Black chrome to match the builder — compact header. */}
      <YStack borderBottomWidth={1} borderColor="$borderColor" backgroundColor="$background" padding="$4">
        <XStack marginBottom="$2" alignItems="center" justifyContent="center">
          <XStack width={36} height={36} alignItems="center" justifyContent="center" borderRadius="$5" borderWidth={1} borderColor="$borderColor" backgroundColor="$color2">
            <Image src={SpaceIcon} alt="" width={28} height={28} />
          </XStack>
        </XStack>
        <Paragraph textAlign="center" fontSize="$4" fontWeight="500" color="$color">Publish your project</Paragraph>
        <Paragraph marginTop="$1" textAlign="center" fontSize="$1" lineHeight="1.625" color="$color11">
          {options?.description ??
            "Publish to your org on Hanzo Cloud — billed to your org, live across your Hanzo tools."}
        </Paragraph>
      </YStack>
      <YStack rowGap="$3" backgroundColor="$background" padding="$4">
        <div>
          <Label marginBottom="$1.5" fontSize="$1" fontWeight="500" color="$color11">Project title</Label>
          <Input
            type="text"
            placeholder="My Awesome Website"
            value={config.title}
            onChangeText={(v: string) => setConfig({ ...config, title: v })}
            borderColor="$borderColor" backgroundColor="$color2" color="$color" placeholderTextColor="$color11"
  />
        </div>
        <Button
          variant="default"
          size="sm"
          onClick={publish}
          position="relative" width="100%" gap="$1.5" backgroundColor="$color5" borderWidth={1} borderColor="$color6" hoverStyle={{ backgroundColor: "$color6" }}
          disabled={loading}
        >
          {loading ? (
            <>
              <Loading overlay={false} size={16} /> Publishing…
            </>
          ) : (
            <>
              Publish <Rocket size={16} />
            </>
          )}
        </Button>
      </YStack>
    </>
  );
};
