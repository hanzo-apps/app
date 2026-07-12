"use client";

import { useEffect, useState, type ComponentType } from "react";
import { useIam } from "@hanzo/iam/react";
import { toast } from "sonner";
import {
  Check,
  ExternalLink,
  Github,
  GitlabIcon,
  Loader2,
  Lock,
  UploadCloud,
} from "lucide-react";

import { Button } from "@hanzo/ui";
import { Input } from "@hanzo/ui";
import { Switch } from "@hanzo/ui";
import { Popover, PopoverContent, PopoverTrigger } from "@hanzo/ui";

import { HanzoLogo } from "@/components/HanzoLogo";
import { useUser } from "@/hooks/useUser";
import { currentOrg } from "@/lib/org-scope";
import { syncToGit, type GitProvider, type SyncGitResult } from "@/lib/api/git";
import { Page } from "@/types";

/**
 * The push targets, Hanzo FIRST (our own git — the default). Each carries its
 * human label + brand mark. Hanzo uses the real geometric logomark (the same
 * `HanzoLogo` the header uses), never a text "H". `lucide` marks are wrapped so
 * every entry has the same `{ className }` icon contract.
 */
const PROVIDERS: {
  id: GitProvider;
  label: string;
  Icon: ComponentType<{ className?: string }>;
}[] = [
  { id: "hanzo", label: "Hanzo", Icon: HanzoLogo },
  { id: "github", label: "GitHub", Icon: Github },
  { id: "gitlab", label: "GitLab", Icon: GitlabIcon },
];

const providerMeta = (p: GitProvider) =>
  PROVIDERS.find((x) => x.id === p) ?? PROVIDERS[0];

/**
 * Push to GitHub / Sync to GitLab — the REVERSE of the repo-import panel.
 *
 * Pushes the builder's generated pages to a repo the signed-in user owns, as ONE
 * commit, via the same-origin `/v1/git/sync` BFF (the provider token is resolved
 * + used SERVER-SIDE only). Fail-closed: no linked token ⇒ an honest "Connect …"
 * CTA that opens the hanzo.id account tab (the canonical link flow). Re-syncs push
 * to the SAME repo (the BFF reuses the project's linked repo).
 */
export function GitSyncButton({
  pages,
  prompts,
  disabled = false,
}: {
  pages: Page[];
  prompts: string[];
  disabled?: boolean;
}) {
  const { user } = useUser();
  const { config } = useIam();

  const [provider, setProvider] = useState<GitProvider>("hanzo");
  const [name, setName] = useState("");
  const [slug, setSlug] = useState<string | undefined>(undefined);
  const [isPrivate, setIsPrivate] = useState(true);
  const [loading, setLoading] = useState(false);
  const [needsConnect, setNeedsConnect] = useState(false);
  const [result, setResult] = useState<SyncGitResult | null>(null);

  // Reuse the open project's slug/name so a re-sync targets the SAME record/repo.
  useEffect(() => {
    const w = window as unknown as { __projectSlug?: string; __projectName?: string };
    if (w.__projectSlug) setSlug(w.__projectSlug);
    if (w.__projectName) setName((n) => n || (w.__projectName as string));
  }, []);

  if (!user?.id) return null;

  const meta = providerMeta(provider);
  const providerName = meta.label;
  // Hanzo needs no OAuth link — the only "connect" is the IAM account itself, so
  // this only matters for GitHub/GitLab (Hanzo never sets `needsConnect`).
  const connect = () => {
    const base = (config.serverUrl || "https://hanzo.id").replace(/\/+$/, "");
    window.open(`${base}/account`, "_blank", "noopener,noreferrer");
  };

  const push = async () => {
    if (!name.trim()) {
      toast.error("Enter a name for your repository.");
      return;
    }
    setLoading(true);
    setNeedsConnect(false);
    setResult(null);
    try {
      const res = await syncToGit(
        {
          provider,
          name: name.trim(),
          slug,
          description: prompts?.[prompts.length - 1] || "",
          private: isPrivate,
          pages,
        },
        currentOrg() || undefined,
      );

      if (!res.ok) {
        if (res.status === 401 && res.connected === false) {
          // Hanzo has no OAuth-link step — a 401 means the session lapsed, so
          // prompt a re-sign-in rather than the "link provider" panel.
          if (provider === "hanzo") {
            toast.error("Your session expired — sign in again to push to Hanzo git.");
            return;
          }
          setNeedsConnect(true);
          return;
        }
        if (res.status === 409 && res.needsOnboarding) {
          toast.error("Set up your organization first.");
          return;
        }
        toast.error(res.error || `Failed to push to ${providerName}.`);
        return;
      }

      setResult(res);
      toast.success(`Pushed to ${providerName}. 🎉`, {
        description: res.created ? "Repository created and pushed." : "New commit pushed.",
      });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : `Failed to push to ${providerName}.`);
    } finally {
      setLoading(false);
    }
  };

  const ProviderIcon = meta.Icon;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={disabled}
          className="gap-2 !border-white/15 !bg-white/[0.04] !text-white hover:!bg-white/10"
          title="Push your project to Hanzo git, GitHub, or GitLab"
        >
          <UploadCloud className="size-4" />
          <span className="hidden md:inline">Push to Git</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-[340px] !rounded-2xl !border-white/10 !bg-neutral-950 !p-0 text-white shadow-2xl shadow-black/60"
      >
        <div className="border-b border-white/10 p-5">
          <div className="mb-1 flex items-center gap-2">
            <UploadCloud className="h-[18px] w-[18px] text-white/70" />
            <h3 className="text-[15px] font-medium">Push to a Git repository</h3>
          </div>
          <p className="text-sm text-white/45">
            Push your generated project to a repo you own — one commit, on the
            default branch. Re-syncing pushes to the same repo.
          </p>
        </div>

        {needsConnect ? (
          <div className="flex flex-col items-center px-6 py-8 text-center">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/[0.04]">
              <ProviderIcon className="h-6 w-6 text-white/80" />
            </div>
            <p className="text-sm font-medium">Connect {providerName}</p>
            <p className="mx-auto mt-1.5 max-w-xs text-sm text-white/45">
              Link {providerName} to your Hanzo account, then push your project.
            </p>
            <button
              type="button"
              onClick={connect}
              className="mt-5 inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-medium text-black transition-colors hover:bg-white/90"
            >
              <ProviderIcon className="h-4 w-4" />
              Connect {providerName}
            </button>
            <button
              type="button"
              onClick={() => setNeedsConnect(false)}
              className="mt-3 text-xs text-white/40 hover:text-white/70"
            >
              I&apos;ve connected — try again
            </button>
          </div>
        ) : result?.ok ? (
          <div className="flex flex-col items-center px-6 py-8 text-center">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-emerald-400/20 bg-emerald-400/10">
              <Check className="h-6 w-6 text-emerald-400" />
            </div>
            <p className="text-sm font-medium">
              {result.created ? "Repository created" : "Commit pushed"}
            </p>
            <a
              href={result.htmlUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1.5 inline-flex items-center gap-1 text-sm text-white/70 underline decoration-white/20 underline-offset-2 hover:text-white"
            >
              {result.htmlUrl?.replace(/^https?:\/\//, "")}
              <ExternalLink className="h-3 w-3" />
            </a>
            {result.commitSha && (
              <p className="mt-2 font-mono text-xs text-white/35">
                {result.branch} · {result.commitSha.slice(0, 7)}
              </p>
            )}
            <button
              type="button"
              onClick={() => setResult(null)}
              className="mt-5 text-xs text-white/40 hover:text-white/70"
            >
              Push again
            </button>
          </div>
        ) : (
          <div className="space-y-4 p-5">
            {/* Provider toggle — Hanzo first (our own git, the default). */}
            <div className="grid grid-cols-3 gap-2">
              {PROVIDERS.map(({ id, label, Icon }) => {
                const activeP = provider === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setProvider(id)}
                    className={`inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border text-sm transition-colors ${
                      activeP
                        ? "border-white/25 bg-white/10 text-white"
                        : "border-white/10 bg-transparent text-white/50 hover:border-white/20 hover:text-white/80"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                  </button>
                );
              })}
            </div>

            <div>
              <label className="mb-1.5 block text-xs text-white/50">Repository name</label>
              <Input
                value={name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
                placeholder="my-awesome-site"
                className="!border-white/12 !bg-black/40 !text-white placeholder:!text-white/30"
              />
            </div>

            <label className="flex cursor-pointer items-center justify-between rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2.5">
              <span className="flex items-center gap-2 text-sm text-white/80">
                <Lock className="h-3.5 w-3.5 text-white/50" />
                Private repository
              </span>
              <Switch checked={isPrivate} onCheckedChange={setIsPrivate} />
            </label>

            <Button
              variant="default"
              onClick={push}
              disabled={loading}
              className="w-full gap-2"
            >
              {loading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <UploadCloud className="size-4" />
              )}
              Push to {providerName}
            </Button>
            <p className="flex items-center gap-1 text-xs text-white/35">
              <ExternalLink className="size-3" />
              {provider === "hanzo"
                ? "Pushes to your Hanzo account. Credentials stay server-side."
                : `Pushes with your linked ${providerName} account. Token stays server-side.`}
            </p>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
