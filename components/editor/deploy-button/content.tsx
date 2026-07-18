import { Rocket, ExternalLink } from "lucide-react";
import Image from "next/image";

import Loading from "@/components/loading";
import { Button } from "@hanzo/ui";
import { Input } from "@hanzo/ui";
import SpaceIcon from "@/assets/space.svg";
import { Page } from "@/types";
import { builderLink } from "@/lib/api/projects";
import { currentOrg } from "@/lib/org-scope";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { EVENTS } from "@hanzo/capture";
import { useAnalytics } from "@hanzo/capture/react";
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
   * projectsvc). The org is resolved server-side from the user's bearer, so the
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

      const liveUrl: string | undefined =
        data?.project?.liveUrl || data?.deployment?.liveUrl;
      if (data?.deployError && !liveUrl) {
        toast.success("Project saved to your organization.", {
          description: "The live deploy is finishing — open it from Projects.",
        });
      } else {
        toast.success("Your project is published! 🎉", {
          description: liveUrl ? "Your site is live." : undefined,
        });
      }

      // Deep-link back into the builder by the stable project slug (the same
      // link console.hanzo.ai uses for "Edit in hanzo.app").
      router.push(builderLink(data.slug));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to publish project");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Black chrome to match the builder — compact header. */}
      <header className="border-b border-white/10 bg-neutral-900 p-4">
        <div className="mb-2 flex items-center justify-center">
          <div className="flex size-9 items-center justify-center rounded-lg border border-white/10 bg-white/[0.06]">
            <Image src={SpaceIcon} alt="" className="size-5" />
          </div>
        </div>
        <p className="text-center text-base font-medium text-white">Publish your project</p>
        <p className="mt-1 text-center text-xs leading-relaxed text-white/50">
          {options?.description ??
            "Publish to your org on Hanzo Cloud — billed to your org, live across your Hanzo tools."}
        </p>
      </header>
      <main className="space-y-3 bg-neutral-950 p-4">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-white/50">Project title</label>
          <Input
            type="text"
            placeholder="My Awesome Website"
            value={config.title}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setConfig({ ...config, title: e.target.value })
            }
            className="!border-white/15 !bg-white/[0.04] !text-white !placeholder:text-white/30 selection:!bg-white/20"
          />
        </div>
        <Button
          variant="default"
          onClick={publish}
          className="relative w-full !bg-white !text-black hover:!bg-white/90"
          disabled={loading}
        >
          Publish <Rocket className="size-4" />
          {loading && <Loading className="ml-2 size-4 animate-spin" />}
        </Button>
        <p className="flex items-center justify-center gap-1 text-[11px] text-white/35">
          <ExternalLink className="size-3" />
          Manage every project at console.hanzo.ai
        </p>
      </main>
    </>
  );
};
