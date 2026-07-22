import { Rocket, Check, Copy, ExternalLink } from "lucide-react";
import Image from "next/image";

import Loading from "@/components/loading";
import { Button } from "@hanzo/ui";
import { Input } from "@hanzo/ui";
import SpaceIcon from "@/assets/space.svg";
import { Page } from "@/types";
import { builderLink } from "@/lib/api/projects";
import { baseEnabled } from "@/lib/base/flag";
import { syncToGit } from "@/lib/api/git";
import { currentOrg } from "@/lib/org-scope";
import { toast } from "sonner";
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
  const [copied, setCopied] = useState(false);
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
<<<<<<< HEAD
   * projects service). The org is resolved server-side from the user's bearer, so the
=======
   * projects store). The org is resolved server-side from the user's bearer, so the
>>>>>>> chore/comment-cleanup-projects
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
        <header className="border-b border-border bg-card p-4">
          <div className="mb-2 flex items-center justify-center">
            <div className="flex size-9 items-center justify-center rounded-lg border border-green-500/30 bg-green-500/10">
              <Rocket className="size-4 text-green-400" />
            </div>
          </div>
          <p className="text-center text-base font-medium text-foreground">Your app is live</p>
          <p className="mt-1 text-center text-xs leading-relaxed text-muted-foreground">
            Share this link — anyone can open it.
          </p>
        </header>
        <main className="space-y-3 bg-card p-4">
          <div className="flex items-center gap-2 rounded-lg border border-border bg-white/[0.04] px-3 py-2">
            <span className="flex-1 truncate font-mono text-sm text-foreground">{host}</span>
            <button
              type="button"
              aria-label="Copy link"
              onClick={() => {
                navigator.clipboard?.writeText(published.url).then(
                  () => {
                    setCopied(true);
                    setTimeout(() => setCopied(false), 1400);
                  },
                  () => {},
                );
              }}
              className="flex size-7 flex-shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              {copied ? <Check className="size-4 text-green-400" /> : <Copy className="size-4" />}
            </button>
          </div>
          <a
            href={published.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex w-full items-center justify-center gap-1.5 rounded-md !bg-primary px-3 py-2 text-sm font-medium !text-primary-foreground transition-colors hover:!bg-primary/90"
          >
            Open site <ExternalLink className="size-4" />
          </a>
          <button
            type="button"
            onClick={() => router.push(builderLink(published.slug, published.org))}
            className="w-full rounded-md border border-border px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            Back to editor
          </button>
        </main>
      </>
    );
  }

  return (
    <>
      {/* Black chrome to match the builder — compact header. */}
      <header className="border-b border-border bg-card p-4">
        <div className="mb-2 flex items-center justify-center">
          <div className="flex size-9 items-center justify-center rounded-lg border border-border bg-white/[0.06]">
            <Image src={SpaceIcon} alt="" className="size-5" />
          </div>
        </div>
        <p className="text-center text-base font-medium text-foreground">Publish your project</p>
        <p className="mt-1 text-center text-xs leading-relaxed text-muted-foreground">
          {options?.description ??
            "Publish to your org on Hanzo Cloud — billed to your org, live across your Hanzo tools."}
        </p>
      </header>
      <main className="space-y-3 bg-card p-4">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Project title</label>
          <Input
            type="text"
            placeholder="My Awesome Website"
            value={config.title}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setConfig({ ...config, title: e.target.value })
            }
            className="!border-border !bg-white/[0.04] !text-foreground !placeholder:text-muted-foreground selection:!bg-white/20"
          />
        </div>
        <Button
          variant="default"
          size="sm"
          onClick={publish}
          className="relative w-full gap-1.5 !bg-primary font-medium !text-primary-foreground hover:!bg-primary/90"
          disabled={loading}
        >
          {loading ? (
            <>
              <Loading className="size-4 animate-spin" /> Publishing…
            </>
          ) : (
            <>
              Publish <Rocket className="size-4" />
            </>
          )}
        </Button>
      </main>
    </>
  );
};
