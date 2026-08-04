"use client";

import { SizableText, YStack, XStack, H3, Paragraph, Anchor } from '@hanzo/gui';
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ComponentType,
} from "react";
import { useIam } from "@hanzo/iam/react";
import { toast, Button, Input, Switch, Popover, PopoverContent, PopoverTrigger, Label } from '@hanzo/ui';
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


import { HanzoLogo } from "@/components/HanzoLogo";
import { useUser } from "@/hooks/useUser";
import { currentOrg } from "@/lib/org-scope";
import { linkProvider } from "@/lib/hanzo/iam";
import {
  syncToGit,
  composeCommitMessage,
  type GitProvider,
  type SyncGitResult,
} from "@/lib/api/git";
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
  Icon: ComponentType<{ className?: string; size?: number; color?: string }>;
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

  const [open, setOpen] = useState(false);
  const [provider, setProvider] = useState<GitProvider>("hanzo");
  const [name, setName] = useState("");
  const [slug, setSlug] = useState<string | undefined>(undefined);
  const [isPrivate, setIsPrivate] = useState(true);
  const [loading, setLoading] = useState(false);
  const [needsConnect, setNeedsConnect] = useState(false);
  const [result, setResult] = useState<SyncGitResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [linked, setLinked] = useState<LinkedRepo | null>(null);
  // The commit message: AI-composed from the session's edit prompts when the
  // panel opens, but manually overridable (propose, don't force). `messageEdited`
  // pins a user edit so a recompose never clobbers it; `composedForCount` tracks
  // the prompt count the current proposal was authored from (recompose on change).
  const [message, setMessage] = useState("");
  const [messageLoading, setMessageLoading] = useState(false);
  const messageEdited = useRef(false);
  const composedForCount = useRef(-1);
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

  // Propose an AI commit message from the session's edit prompts. Skipped once
  // the user has hand-edited the field, and re-run only when the prompt count
  // changed (a new edit landed) — so it stays cheap and never clobbers an edit.
  const proposeMessage = useCallback(async () => {
    if (messageEdited.current) return;
    const list = (prompts ?? []).map((p) => p?.trim()).filter(Boolean) as string[];
    if (list.length === 0) return;
    if (composedForCount.current === list.length) return;
    setMessageLoading(true);
    try {
      const m = await composeCommitMessage(list, currentOrg() || undefined);
      composedForCount.current = list.length;
      if (!messageEdited.current && m) setMessage(m);
    } finally {
      setMessageLoading(false);
    }
  }, [prompts]);

  // Open on the History panel's "Commit & push" / "Connect a repo" request, and
  // propose a message when it does (the ONE push flow lives here).
  useEffect(() => {
    const openIt = () => {
      setOpen(true);
      void proposeMessage();
    };
    window.addEventListener("hanzo:open-git-sync", openIt);
    return () => window.removeEventListener("hanzo:open-git-sync", openIt);
  }, [proposeMessage]);

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
          // AI-composed (or hand-edited) subject so new commits are born clean;
          // the BFF falls back to a default only when this is blank.
          message: message.trim() || undefined,
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
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        // On open, propose a fresh commit message from the session prompts.
        if (next) void proposeMessage();
        // On close, drop the transient "just pushed" confirmation so the next
        // open leads with the linked-repo re-sync card (linked state persists).
        if (!next && result?.ok) {
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
          height={28} gap="$1.5" paddingHorizontal="$2.5" borderColor="$borderColor" backgroundColor="$color" hoverStyle={{ backgroundColor: "$color3" }}
          title="Push your project to Hanzo git, GitHub, or GitLab"
        >
          <UploadCloud size={14} />
          <SizableText display="none">Push to Git</SizableText>
          {linked && (
            <SizableText height="$1.5" width="$1.5" borderRadius="$10" backgroundColor="$green8" aria-hidden />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        width={360} padding="$0"
      >
        <YStack borderBottomWidth={1} borderColor="$borderColor" padding="$4.5">
          <XStack marginBottom="$1" alignItems="center" gap="$2">
            <UploadCloud size={18} />
            <H3 fontSize={15} fontWeight="500">Push to a Git repository</H3>
          </XStack>
          <Paragraph fontSize="$3" color="$color11">
            Push your generated project to a repo you own — one commit, on the
            default branch. Re-syncing pushes to the same repo.
          </Paragraph>
        </YStack>

        {needsConnect ? (
          <YStack alignItems="center" paddingHorizontal="$5" paddingVertical="$6">
            <XStack marginBottom="$4" height="$8" width="$8" alignItems="center" justifyContent="center" borderRadius="$10" borderWidth={1} borderColor="$borderColor" backgroundColor="$color">
              <ProviderIcon size={24} color="var(--foreground)" />
            </XStack>
            <Paragraph fontSize="$3" fontWeight="500" textAlign="center">Connect {providerName}</Paragraph>
            <Paragraph alignSelf="center" marginTop="$1.5" maxWidth={320} fontSize="$3" color="$color11" textAlign="center">
              Link {providerName} to your Hanzo account, then push your project.
            </Paragraph>
            <Button
              type="button"
              onClick={connect}
              marginTop="$4.5" alignItems="center" gap="$2" borderRadius="$5" backgroundColor="$color12" paddingHorizontal="$4" paddingVertical="$2.5" hoverStyle={{ backgroundColor: "$color12" }}
            >
              <ProviderIcon size={16} />
              Connect {providerName}
            </Button>
            <Button
              type="button"
              onClick={() => setNeedsConnect(false)}
              variant="linkMuted"
              marginTop="$3"
            >
              <SizableText fontSize="$1">I&apos;ve connected — try again</SizableText>
            </Button>
          </YStack>
        ) : result?.ok ? (
          <YStack paddingHorizontal="$5" paddingVertical={28}>
            <XStack alignSelf="center" marginBottom="$4" height="$8" width="$8" alignItems="center" justifyContent="center" borderRadius="$10" borderWidth={1} borderColor="$green8" backgroundColor="$green8">
              <Check size={24} />
            </XStack>
            <Paragraph fontSize="$3" fontWeight="500" textAlign="center">
              {result.created ? "Repository created" : "Commit pushed"}
            </Paragraph>

            <YStack marginTop="$3" borderRadius="$6" borderWidth={1} borderColor="$borderColor" backgroundColor="$color" padding="$3">
              <XStack alignItems="center" gap="$2">
                {(() => {
                  const I = providerMeta(result.provider || provider).Icon;
                  return <I size={16} color="var(--foreground)" />;
                })()}
                <Anchor
                  href={result.htmlUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  minWidth={0} flex={1} numberOfLines={1} fontSize="$3" color="$color" hoverStyle={{ color: "$color" }}
                >
                  {repoLabel(result.htmlUrl || result.repoUrl || "")}
                </Anchor>
                <Button
                  type="button"
                  onClick={() => copyUrl(result.htmlUrl || result.repoUrl || "")}
                  variant="linkMuted"
                  title="Copy URL"
                >
                  {copied ? (
                    <Check size={14} />
                  ) : (
                    <Copy size={14} />
                  )}
                </Button>
                <Anchor
                  href={result.htmlUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  color="$color11" hoverStyle={{ color: "$color" }}
                  aria-label="Open repository"
                >
                  <ExternalLink size={14} />
                </Anchor>
              </XStack>
              {(result.branch || result.commitSha) && (
                <XStack marginTop="$2" alignItems="center" gap="$1.5">
                  <GitBranch size={12} />
                  <SizableText fontFamily="$mono" fontSize="$1" color="$color11">
                    {result.branch}
                    {result.commitSha ? ` · ${result.commitSha.slice(0, 7)}` : ""}
                  </SizableText>
                </XStack>
              )}
            </YStack>

            <XStack marginTop="$4" alignItems="center" justifyContent="center" gap="$2">
              <Button
                variant="default"
                size="sm"
                onClick={resync}
                disabled={loading}
                gap="$1.5"
              >
                {loading ? (
                  <Loader2 size={14} />
                ) : (
                  <RefreshCw size={14} />
                )}
                Push again
              </Button>
              <Button
                type="button"
                onClick={() => {
                  setResult(null);
                  setShowForm(true);
                }}
                variant="linkMuted"
                borderRadius="$5" paddingHorizontal="$3" paddingVertical="$1.5"
              >
                <SizableText fontSize="$1">Push elsewhere</SizableText>
              </Button>
            </XStack>
          </YStack>
        ) : linked && !showForm ? (
          <YStack padding="$4.5">
            <YStack borderRadius="$6" borderWidth={1} borderColor="$borderColor" backgroundColor="$color" padding="$3.5">
              <XStack marginBottom="$1.5" alignItems="center" gap="$1.5">
                <SizableText height="$1.5" width="$1.5" borderRadius="$10" backgroundColor="$green8" />
                <SizableText fontSize={11} textTransform="uppercase" letterSpacing={0.4} color="$color11">
                  Linked repository
                </SizableText>
              </XStack>
              <XStack alignItems="center" gap="$2">
                {(() => {
                  const I = providerMeta(linked.provider).Icon;
                  return <I size={16} color="var(--foreground)" />;
                })()}
                <Anchor
                  href={linked.htmlUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  minWidth={0} flex={1} numberOfLines={1} fontSize="$3" fontWeight="500" color="$color" hoverStyle={{ color: "$color" }}
                >
                  {linked.label}
                </Anchor>
                <Button
                  type="button"
                  onClick={() => copyUrl(linked.htmlUrl)}
                  variant="linkMuted"
                  title="Copy URL"
                >
                  {copied ? (
                    <Check size={14} />
                  ) : (
                    <Copy size={14} />
                  )}
                </Button>
                <Anchor
                  href={linked.htmlUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  color="$color11" hoverStyle={{ color: "$color" }}
                  aria-label="Open repository"
                >
                  <ExternalLink size={14} />
                </Anchor>
              </XStack>
              <XStack marginTop="$1.5" alignItems="center" gap="$1.5">
                <GitBranch size={12} />
                <SizableText fontFamily="$mono" fontSize="$1" color="$color11">
                  {linked.branch}
                </SizableText>
              </XStack>
            </YStack>

            <YStack marginTop="$3">
              <CommitMessageField
                value={message}
                loading={messageLoading}
                onChange={(v) => {
                  messageEdited.current = true;
                  setMessage(v);
                }}
  />
            </YStack>

            {error && <ErrorNote message={error} />}

            <Button
              variant="default"
              onClick={resync}
              disabled={loading}
              marginTop="$3" width="100%" gap="$2"
            >
              {loading ? (
                <Loader2 size={16} />
              ) : (
                <RefreshCw size={16} />
              )}
              Push update to {providerMeta(linked.provider).label}
            </Button>
            <Button
              type="button"
              onClick={() => {
                setShowForm(true);
                setError(null);
              }}
              variant="linkMuted"
              marginTop="$2" width="100%"
            >
              <SizableText textAlign="center" fontSize="$1">Push to a different repository</SizableText>
            </Button>
          </YStack>
        ) : (
          <YStack rowGap="$4" padding="$4.5">
            {/* Provider toggle — Hanzo first (our own git, the default). */}
            <YStack gap="$2">
              {PROVIDERS.map(({ id, label, Icon }) => {
                const activeP = provider === id;
                return (
                  <Button
                    key={id}
                    type="button"
                    variant="ghost"
                    onClick={() => setProvider(id)}
                    height={36} alignItems="center" justifyContent="center" borderRadius="$5" borderWidth={1} borderColor="$borderColor" backgroundColor={activeP ? "$color3" : "transparent"}
                  >
                    <XStack alignItems="center" gap="$1.5">
                      <Icon size={16} />
                      <SizableText fontSize="$3" color={activeP ? "$color" : "$color11"}>
                        {label}
                      </SizableText>
                    </XStack>
                  </Button>
                );
              })}
            </YStack>

            <div>
              <Label marginBottom="$1.5" fontSize="$1" color="$color11">Repository name</Label>
              <Input
                value={name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
                placeholder="my-awesome-site"
                borderColor="$borderColor" backgroundColor="$background" color="$color" placeholderTextColor="$color11"
  />
            </div>

            <CommitMessageField
              value={message}
              loading={messageLoading}
              onChange={(v) => {
                messageEdited.current = true;
                setMessage(v);
              }}
  />

            <Label cursor="pointer" alignItems="center" justifyContent="space-between" borderRadius="$5" borderWidth={1} borderColor="$borderColor" backgroundColor="$color" paddingHorizontal="$3" paddingVertical="$2.5">
              <XStack alignItems="center" gap="$2">
                <Lock size={14} />
                <SizableText fontSize="$3" color="$color">
                  Private repository
                </SizableText>
              </XStack>
              <Switch checked={isPrivate} onCheckedChange={setIsPrivate} />
            </Label>

            {error && <ErrorNote message={error} />}

            <Button
              variant="default"
              onClick={push}
              disabled={loading}
              width="100%" gap="$2"
            >
              {loading ? (
                <Loader2 size={16} />
              ) : (
                <UploadCloud size={16} />
              )}
              Push to {providerName}
            </Button>

            {linked && (
              <Button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setError(null);
                }}
                variant="linkMuted"
                width="100%"
              >
                <SizableText numberOfLines={1} textAlign="center" fontSize="$1">Back to {linked.label}</SizableText>
              </Button>
            )}

            <Paragraph alignItems="center" gap="$1" fontSize="$1" color="$color11">
              <ExternalLink size={12} />
              {provider === "hanzo"
                ? "Pushes to your Hanzo account. Credentials stay server-side."
                : `Pushes with your linked ${providerName} account. Token stays server-side.`}
            </Paragraph>
          </YStack>
        )}
      </PopoverContent>
    </Popover>
  );
}

/**
 * The commit-message field: an AI-proposed subject (composed from the session's
 * edit prompts) that the user can edit before pushing. Propose, don't force.
 */
function CommitMessageField({
  value,
  loading,
  onChange,
}: {
  value: string;
  loading: boolean;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <Label marginBottom="$1.5" fontSize="$1" color="$color11">Commit message</Label>
      <YStack position="relative">
        <Input
          value={value}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
          placeholder="Describe this change"
          borderColor="$borderColor" backgroundColor="$background" color="$color" placeholderTextColor="$color11"
  />
        {loading && (
          <Loader2 size={14} />
        )}
      </YStack>
      <Paragraph marginTop="$1" fontSize={10} color="$color11">
        AI-proposed from your edits — edit before pushing.
      </Paragraph>
    </div>
  );
}

/** Inline, on-brand error note (semantic red — the one exception to monochrome). */
function ErrorNote({ message }: { message: string }) {
  return (
    <XStack alignItems="flex-start" gap="$2" borderRadius="$5" borderWidth={1} borderColor="$red9" backgroundColor="$red9" paddingHorizontal="$3" paddingVertical="$2.5">
      <AlertCircle size={14} />
      <Paragraph fontSize="$1" color="$red3">{message}</Paragraph>
    </XStack>
  );
}
