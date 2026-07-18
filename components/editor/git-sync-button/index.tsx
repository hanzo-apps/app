"use client";

import { useEffect, useState, type ComponentType } from "react";
import { useIam } from "@hanzo/iam/react";
import { toast } from "sonner";
import {
  AlertCircle,
  Check,
  Copy,
  ExternalLink,
  Github,
  GitBranch,
  GitlabIcon,
  Loader2,
  Lock,
  RefreshCw,
  UploadCloud,
} from "lucide-react";

import { Button } from "@hanzo/ui";
import { Input } from "@hanzo/ui";
import { Switch } from "@hanzo/ui";
import { Popover, PopoverContent, PopoverTrigger } from "@hanzo/ui";

import { HanzoLogo } from "@/components/HanzoLogo";
import { useUser } from "@/hooks/useUser";
import { currentOrg } from "@/lib/org-scope";
import { linkProvider } from "@/lib/hanzo/iam";
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

/** Best-effort provider from a stored clone/remote URL (host family). */
function providerFromUrl(url: string): GitProvider {
  const h = (url || "").toLowerCase();
  if (h.includes("gitlab")) return "gitlab";
  if (h.includes("github")) return "github";
  return "hanzo"; // our own git (api.hanzo.ai/…)
}

/** Compact `owner/repo` label from a clone/web URL (drops scheme, host, `.git`). */
function repoLabel(url: string): string {
  const s = (url || "")
    .replace(/^https?:\/\//i, "")
    .replace(/\.git$/i, "")
    .replace(/\/+$/, "");
  const parts = s.split("/").filter(Boolean);
  if (parts.length <= 1) return s;
  return parts.slice(-2).join("/"); // owner/repo
}

/** The repo we re-sync to — hydrated from the project record or the last push. */
interface LinkedRepo {
  provider: GitProvider;
  htmlUrl: string;
  repoUrl: string;
  branch: string;
  label: string;
}

/**
 * Push to Git — the REVERSE of the repo-import panel.
 *
 * Pushes the builder's generated pages to a repo the signed-in user owns, as ONE
 * commit, via the same-origin `/v1/git/sync` BFF (the provider token is resolved
 * + used SERVER-SIDE only). Once a project is linked to a repo (from a prior push
 * OR loaded from the project record on open) the panel leads with a one-click
 * "Push update" that re-syncs to the SAME repo; the full form (provider, name,
 * visibility) is one click away for the first push or a different target.
 * Fail-closed: no linked token ⇒ an honest "Connect …" CTA to the hanzo.id
 * account tab.
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
  const { sdk } = useIam();

  const [provider, setProvider] = useState<GitProvider>("hanzo");
  const [name, setName] = useState("");
  const [slug, setSlug] = useState<string | undefined>(undefined);
  const [isPrivate, setIsPrivate] = useState(true);
  const [loading, setLoading] = useState(false);
  const [needsConnect, setNeedsConnect] = useState(false);
  const [result, setResult] = useState<SyncGitResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [linked, setLinked] = useState<LinkedRepo | null>(null);
  // When linked, the compact re-sync card leads; this reveals the full form
  // (different provider / repo name) on demand.
  const [showForm, setShowForm] = useState(false);
  const [copied, setCopied] = useState(false);

  // Reuse the open project's slug/name so a re-sync targets the SAME record/repo,
  // and hydrate the linked-repo state from the project record so RE-OPENING the
  // builder shows "Linked to …" (and a one-click re-sync) without a push first.
  useEffect(() => {
    const w = window as unknown as { __projectSlug?: string; __projectName?: string };
    const s = w.__projectSlug;
    if (s) setSlug(s);
    if (w.__projectName) setName((n) => n || (w.__projectName as string));
    if (!s) return;
    let alive = true;
    fetch(`/v1/projects/${encodeURIComponent(s)}`, { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((p: { repo?: { url?: string; branch?: string } } | null) => {
        if (!alive || !p?.repo?.url) return;
        const url = p.repo.url;
        const prov = providerFromUrl(url);
        setLinked({
          provider: prov,
          repoUrl: url,
          htmlUrl: url.replace(/\.git$/i, ""),
          branch: p.repo.branch || "main",
          label: repoLabel(url),
        });
        setProvider(prov);
      })
      .catch(() => {
        /* linked state is a convenience; the form still works */
      });
    return () => {
      alive = false;
    };
  }, []);

  if (!user?.id) return null;

  const meta = providerMeta(provider);
  const providerName = meta.label;
  const ProviderIcon = meta.Icon;

  // Hanzo needs no OAuth link — the only "connect" is the IAM account itself, so
  // this only matters for GitHub/GitLab (Hanzo never sets `needsConnect`). LINK
  // the provider to the signed-in hanzo.id account via the canonical SDK popup
  // (`provider=<p>&method=link` → the app's registered `/auth/callback`), then
  // drop the connect gate so the user's retried push carries the linked token.
  const connect = () => {
    void (async () => {
      await linkProvider(sdk, provider === "gitlab" ? "gitlab" : "github");
      setNeedsConnect(false);
      setError(null);
    })();
  };

  /** Push to `target` under `repoName`; the BFF reuses the project's linked repo. */
  const runSync = async (target: GitProvider, repoName: string) => {
    if (!repoName.trim()) {
      toast.error("Enter a name for your repository.");
      return;
    }
    setLoading(true);
    setNeedsConnect(false);
    setError(null);
    try {
      const res = await syncToGit(
        {
          provider: target,
          name: repoName.trim(),
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
          if (target === "hanzo") {
            setError("Your session expired — sign in again to push to Hanzo git.");
            return;
          }
          setNeedsConnect(true);
          return;
        }
        if (res.status === 409 && res.needsOnboarding) {
          setError("Set up your organization first, then push.");
          return;
        }
        setError(res.error || `Failed to push to ${providerMeta(target).label}.`);
        return;
      }

      setResult(res);
      if (res.repoUrl) {
        setLinked({
          provider: res.provider || target,
          repoUrl: res.repoUrl,
          htmlUrl: res.htmlUrl || res.repoUrl.replace(/\.git$/i, ""),
          branch: res.branch || "main",
          label: repoLabel(res.htmlUrl || res.repoUrl),
        });
      }
      setShowForm(false);
      toast.success(`Pushed to ${providerMeta(res.provider || target).label}.`, {
        description: res.created ? "Repository created and pushed." : "New commit pushed.",
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : `Failed to push to ${providerMeta(target).label}.`);
    } finally {
      setLoading(false);
    }
  };

  // First push / different target uses the form's provider + name; a re-sync
  // targets the already-linked repo (same provider, same name).
  const push = () => runSync(provider, name);
  const resync = () => {
    if (!linked) return push();
    return runSync(linked.provider, linked.label.split("/").pop() || name);
  };

  const copyUrl = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable */
    }
  };

  return (
    <Popover
      onOpenChange={(open) => {
        // On close, drop the transient "just pushed" confirmation so the next
        // open leads with the linked-repo re-sync card (linked state persists).
        if (!open && result?.ok) {
          setResult(null);
          setError(null);
        }
      }}
    >
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
          {linked && (
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" aria-hidden />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-[360px] !rounded-2xl !border-white/10 !bg-neutral-950 !p-0 text-white shadow-2xl shadow-black/60"
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
          <div className="px-6 py-7 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-emerald-400/20 bg-emerald-400/10">
              <Check className="h-6 w-6 text-emerald-400" />
            </div>
            <p className="text-sm font-medium">
              {result.created ? "Repository created" : "Commit pushed"}
            </p>

            <div className="mt-3 rounded-xl border border-white/10 bg-white/[0.02] p-3 text-left">
              <div className="flex items-center gap-2">
                {(() => {
                  const I = providerMeta(result.provider || provider).Icon;
                  return <I className="h-4 w-4 shrink-0 text-white/70" />;
                })()}
                <a
                  href={result.htmlUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="min-w-0 flex-1 truncate text-sm text-white/85 hover:text-white"
                >
                  {repoLabel(result.htmlUrl || result.repoUrl || "")}
                </a>
                <button
                  type="button"
                  onClick={() => copyUrl(result.htmlUrl || result.repoUrl || "")}
                  className="text-white/40 transition-colors hover:text-white"
                  title="Copy URL"
                >
                  {copied ? (
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </button>
                <a
                  href={result.htmlUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white/40 transition-colors hover:text-white"
                  title="Open repository"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
              {(result.branch || result.commitSha) && (
                <div className="mt-2 flex items-center gap-1.5 font-mono text-xs text-white/35">
                  <GitBranch className="h-3 w-3" />
                  {result.branch}
                  {result.commitSha ? ` · ${result.commitSha.slice(0, 7)}` : ""}
                </div>
              )}
            </div>

            <div className="mt-4 flex items-center justify-center gap-2">
              <Button
                variant="default"
                size="sm"
                onClick={resync}
                disabled={loading}
                className="gap-1.5"
              >
                {loading ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <RefreshCw className="size-3.5" />
                )}
                Push again
              </Button>
              <button
                type="button"
                onClick={() => {
                  setResult(null);
                  setShowForm(true);
                }}
                className="rounded-lg px-3 py-1.5 text-xs text-white/50 transition-colors hover:text-white/80"
              >
                Push elsewhere
              </button>
            </div>
          </div>
        ) : linked && !showForm ? (
          <div className="p-5">
            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3.5">
              <div className="mb-1.5 flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-white/35">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                Linked repository
              </div>
              <div className="flex items-center gap-2">
                {(() => {
                  const I = providerMeta(linked.provider).Icon;
                  return <I className="h-4 w-4 shrink-0 text-white/70" />;
                })()}
                <a
                  href={linked.htmlUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="min-w-0 flex-1 truncate text-sm font-medium text-white hover:text-white/80"
                >
                  {linked.label}
                </a>
                <button
                  type="button"
                  onClick={() => copyUrl(linked.htmlUrl)}
                  className="text-white/40 transition-colors hover:text-white"
                  title="Copy URL"
                >
                  {copied ? (
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </button>
                <a
                  href={linked.htmlUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white/40 transition-colors hover:text-white"
                  title="Open repository"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
              <div className="mt-1.5 flex items-center gap-1.5 font-mono text-xs text-white/35">
                <GitBranch className="h-3 w-3" />
                {linked.branch}
              </div>
            </div>

            {error && <ErrorNote message={error} />}

            <Button
              variant="default"
              onClick={resync}
              disabled={loading}
              className="mt-3 w-full gap-2"
            >
              {loading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <RefreshCw className="size-4" />
              )}
              Push update to {providerMeta(linked.provider).label}
            </Button>
            <button
              type="button"
              onClick={() => {
                setShowForm(true);
                setError(null);
              }}
              className="mt-2 w-full text-center text-xs text-white/40 transition-colors hover:text-white/70"
            >
              Push to a different repository
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

            {error && <ErrorNote message={error} />}

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

            {linked && (
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setError(null);
                }}
                className="w-full truncate text-center text-xs text-white/40 transition-colors hover:text-white/70"
              >
                Back to {linked.label}
              </button>
            )}

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

/** Inline, on-brand error note (semantic red — the one exception to monochrome). */
function ErrorNote({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-2 rounded-lg border border-red-500/25 bg-red-500/[0.06] px-3 py-2.5 text-left">
      <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-400" />
      <p className="text-xs text-red-200/90">{message}</p>
    </div>
  );
}
