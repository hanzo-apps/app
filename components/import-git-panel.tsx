"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useIam } from "@hanzo/iam/react";
import {
  ArrowRight,
  ChevronDown,
  Github,
  GitlabIcon,
  Globe,
  Loader2,
  Lock,
  Plus,
  RefreshCw,
  Search,
} from "lucide-react";

import { Badge, Button } from "@hanzo/ui";
import { Input } from "@/components/control";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/overlay";

import {
  fetchGitAccounts,
  fetchGitRepos,
  relativeTime,
  repoImportLink,
  type GitAccount,
  type GitProvider,
  type GitProviderStatus,
  type GitRepo,
} from "@/lib/api/git";
import { linkProvider } from "@/lib/hanzo/iam";
import { isGitUrl, gitUrlGateMessage } from "@/lib/git/url";
import { toast } from "@hanzo/ui";

/**
 * Provider display metadata — the ONE place icon/label per provider lives.
 * Partial: this panel only ever surfaces OAuth-linked accounts (github/gitlab);
 * `hanzo` is our own git and never appears as an importable account, so lookups
 * fall back to the GitHub mark (see call sites) rather than carrying dead rows.
 */
const PROVIDER_META: Partial<Record<GitProvider, { label: string; Icon: typeof Github }>> = {
  github: { label: "GitHub", Icon: Github },
  gitlab: { label: "GitLab", Icon: GitlabIcon },
};

/**
 * Import Git Repository — the real, connected-account import panel.
 *
 * Lists the signed-in user's IAM-linked GitHub accounts (self + orgs) and their
 * live repositories via the same-origin `/v1/git/*` BFF. Selecting an account
 * loads its repos; each row imports into the builder through the existing
 * `/dev?repo=<clone_url>` wire. When nothing is connected it shows an HONEST
 * "Connect GitHub" CTA (never fabricated rows), and a "paste a repository URL"
 * affordance is always available as the fallback.
 */
export function ImportGitPanel() {
  const router = useRouter();
  const { sdk, isAuthenticated, login } = useIam();

  const [loadingAccounts, setLoadingAccounts] = useState(true);
  const [connected, setConnected] = useState(false);
  const [accounts, setAccounts] = useState<GitAccount[]>([]);
  const [providers, setProviders] = useState<GitProviderStatus[]>([]);
  const [active, setActive] = useState<string>("");
  const [showProviders, setShowProviders] = useState(false);

  const [repos, setRepos] = useState<GitRepo[]>([]);
  const [loadingRepos, setLoadingRepos] = useState(false);
  const [search, setSearch] = useState("");
  const [importing, setImporting] = useState<string>("");

  const [pasteUrl, setPasteUrl] = useState("");

  // True while the user is off linking GitHub in the hanzo.id account tab, so a
  // return to this tab re-checks the connection (idle refocus stays a no-op).
  const linkPendingRef = useRef(false);

  // Load (or reload) the connected accounts; resolves to whether GitHub is
  // connected. A not-connected/unauthenticated response yields the honest
  // Connect CTA (fetchGitAccounts never throws). The active selection is
  // preserved across reloads so a post-link refetch never resets the user.
  const refreshAccounts = useCallback(async () => {
    const r = await fetchGitAccounts();
    setConnected(r.connected);
    setAccounts(r.accounts);
    setProviders(r.providers);
    setActive((prev) => prev || r.accounts[0]?.login || "");
    return r.connected;
  }, []);

  // Initial load.
  useEffect(() => {
    let alive = true;
    refreshAccounts().finally(() => {
      if (alive) setLoadingAccounts(false);
    });
    return () => {
      alive = false;
    };
  }, [refreshAccounts]);

  // When the user returns from the hanzo.id link tab, re-check the connection
  // and reveal their repos. Gated on a pending link so idle refocus is a no-op.
  useEffect(() => {
    const onReturn = () => {
      if (document.visibilityState !== "visible") return;
      if (!linkPendingRef.current) return;
      void refreshAccounts().then((ok) => {
        if (ok) linkPendingRef.current = false;
      });
    };
    document.addEventListener("visibilitychange", onReturn);
    window.addEventListener("focus", onReturn);
    return () => {
      document.removeEventListener("visibilitychange", onReturn);
      window.removeEventListener("focus", onReturn);
    };
  }, [refreshAccounts]);

  // Load the active account's repositories whenever it changes. The provider is
  // taken from the account itself so a GitLab account queries GitLab, not GitHub.
  useEffect(() => {
    if (!connected || !active) return;
    const provider = accounts.find((a) => a.login === active)?.provider ?? "github";
    let alive = true;
    setLoadingRepos(true);
    fetchGitRepos(active, provider).then((r) => {
      if (!alive) return;
      setRepos(r);
      setLoadingRepos(false);
    });
    return () => {
      alive = false;
    };
  }, [connected, active, accounts]);

  // Connect GitHub — two honest paths, one per auth state:
  //
  //  • Already signed in (e.g. via Google/password): LINK GitHub to the
  //    EXISTING hanzo.id account via a POPUP. `login({prompt:"login"})` would
  //    silently re-SSO the live session back WITHOUT ever showing the GitHub
  //    chooser, so nothing links. `linkProvider` opens the SDK-built authorize
  //    URL (`provider=github&method=link`, redirect_uri = the app's REGISTERED
  //    `/auth/callback`) in a popup that goes straight to GitHub, links to the
  //    signed-in account, then posts back + closes. We re-fetch on resolve so
  //    the repos appear without leaving /new.
  //
  //  • Not signed in: full SSO. Signing in WITH GitHub links it on first
  //    sign-in (the already-working path), then returns to /new.
  const connectGithub = useCallback(() => {
    if (isAuthenticated) {
      linkPendingRef.current = true;
      void (async () => {
        await linkProvider(sdk, "github");
        await refreshAccounts();
        linkPendingRef.current = false;
      })();
      return;
    }
    try {
      localStorage.setItem("redirectAfterLogin", window.location.pathname);
    } catch {
      /* storage unavailable */
    }
    void login();
  }, [isAuthenticated, sdk, login, refreshAccounts]);

  const gitlabStatus = providers.find((p) => p.provider === "gitlab");
  const gitlabConnectable = gitlabStatus?.connectable ?? false;

  // Start the GitLab connect flow — mirrors GitHub exactly (same two honest
  // paths by auth state). When GitLab isn't set up yet (no OAuth app / IAM
  // provider) we NEVER dead-click: an honest toast explains what's pending
  // instead of opening a chooser with no "Continue with GitLab".
  const connectGitlab = useCallback(() => {
    if (!gitlabConnectable) {
      toast.info(
        "GitLab sign-in is being set up. It’ll appear here once the GitLab connection is live.",
      );
      return;
    }
    // Signed in already → LINK GitLab to the existing account in a popup (a
    // silent re-SSO would never show the GitLab chooser). Same canonical flow as
    // GitHub; re-fetch on resolve so the repos appear without leaving /new.
    if (isAuthenticated) {
      linkPendingRef.current = true;
      void (async () => {
        await linkProvider(sdk, "gitlab");
        await refreshAccounts();
        linkPendingRef.current = false;
      })();
      return;
    }
    try {
      localStorage.setItem("redirectAfterLogin", window.location.pathname);
    } catch {
      /* storage unavailable */
    }
    void login();
  }, [gitlabConnectable, isAuthenticated, sdk, login, refreshAccounts]);

  const importRepo = useCallback(
    (cloneUrl: string) => {
      setImporting(cloneUrl);
      router.push(repoImportLink(cloneUrl));
    },
    [router],
  );

  const submitPaste = useCallback(() => {
    const url = pasteUrl.trim();
    if (!isGitUrl(url)) return;
    // Honest gate: SSH/private remotes can't be fetched — tell the user rather
    // than routing to a dead end.
    const gate = gitUrlGateMessage(url);
    if (gate) {
      toast.error(gate);
      return;
    }
    importRepo(url);
  }, [pasteUrl, importRepo]);

  const activeAccount = accounts.find((a) => a.login === active);
  const filteredRepos = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return repos;
    return repos.filter((r) =>
      (r.fullName + " " + r.description).toLowerCase().includes(q),
    );
  }, [repos, search]);

  return (
    <div className="rounded-2xl border border-border bg-muted p-5 sm:p-6">
      <div className="mb-1 flex items-center gap-2">
        <Github className="h-[18px] w-[18px] text-foreground" />
        <h2 className="text-[15px] font-medium">Import Git Repository</h2>
      </div>
      <p className="mb-5 text-sm text-muted-foreground">
        Connect a repository and deploy it as a service, container, or site —
        with automatic builds on every push.
      </p>

      {loadingAccounts ? (
        <div className="space-y-2">
          <div className="h-10 animate-pulse rounded-xl border border-border bg-muted" />
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-[60px] animate-pulse rounded-xl border border-border bg-muted"
            />
          ))}
        </div>
      ) : !connected ? (
        <ConnectCta
          onConnect={connectGithub}
          onConnectGitlab={connectGitlab}
          gitlabConnectable={gitlabConnectable}
        />
      ) : (
        <>
          {/* Account dropdown + repo search */}
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="sm:w-[46%]">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="lg" className="w-full">
                    {(() => {
                      const Icon =
                        PROVIDER_META[activeAccount?.provider ?? "github"]?.Icon ?? Github;
                      return <Icon className="h-4 w-4 shrink-0" />;
                    })()}
                    {activeAccount?.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={activeAccount.avatarUrl}
                        alt=""
                        className="h-5 w-5 shrink-0 rounded-full"
                      />
                    ) : null}
                    <span className="truncate">{active || "Select account"}</span>
                    <ChevronDown className="ml-auto h-4 w-4 shrink-0" />
                  </Button>
                </DropdownMenuTrigger>

                {/* Sized by its content, not by the trigger: the module's `fit`
                    already caps height to the room Radix measured and width to
                    the phone, so pinning the trigger width only forced wraps. */}
                <DropdownMenuContent align="start" className="min-w-[240px]">
                  {accounts.map((a) => {
                    const Icon = PROVIDER_META[a.provider]?.Icon ?? Github;
                    return (
                      <DropdownMenuItem
                        key={`${a.provider}:${a.login}`}
                        onSelect={() => {
                          setActive(a.login);
                          setSearch("");
                        }}
                      >
                        {a.avatarUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={a.avatarUrl} alt="" className="h-5 w-5 rounded-full" />
                        ) : (
                          <Icon className="h-4 w-4" />
                        )}
                        <span className="truncate">{a.login}</span>
                        <span className="ml-auto text-[11px] text-muted-foreground">
                          {a.provider === "gitlab"
                            ? "GitLab"
                            : a.type === "org"
                              ? "Org"
                              : "Personal"}
                        </span>
                      </DropdownMenuItem>
                    );
                  })}

                  <DropdownMenuSeparator />

                  <DropdownMenuItem onSelect={connectGithub}>
                    <Plus className="h-4 w-4" />
                    Add GitHub Account
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={connectGitlab}>
                    <GitlabIcon className="h-4 w-4" />
                    Add GitLab Account
                    {!gitlabConnectable && (
                      <Badge variant="outline" className="ml-auto">
                        Needs setup
                      </Badge>
                    )}
                  </DropdownMenuItem>
                  {/* Stays open: this row reveals the provider list in place, so
                      selecting it must not dismiss the surface it reveals. */}
                  <DropdownMenuItem onSelect={(e) => { e.preventDefault(); setShowProviders((s) => !s); }}>
                    <RefreshCw className="h-4 w-4" />
                    Providers
                  </DropdownMenuItem>
                  {showProviders && (
                    <div className="grid grid-cols-2 gap-1.5 border-t border-border px-2 py-2">
                      <span className="col-span-2 px-1 text-[11px] uppercase tracking-wide text-muted-foreground">
                        Providers
                      </span>
                      <Badge variant="outline" className="gap-1.5">
                        <Github className="h-3.5 w-3.5" /> GitHub
                      </Badge>
                      {gitlabConnectable ? (
                        <Button variant="outline" size="sm" onClick={connectGitlab}>
                          <GitlabIcon className="h-3.5 w-3.5" /> GitLab
                        </Button>
                      ) : (
                        <Badge variant="outline" className="gap-1.5" title="GitLab connect is being set up">
                          <GitlabIcon className="h-3.5 w-3.5" /> GitLab · Setup
                        </Badge>
                      )}
                      <Badge variant="outline" className="gap-1.5">
                        <Globe className="h-3.5 w-3.5" /> Bitbucket · Soon
                      </Badge>
                    </div>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search repositories…"
                className="h-10 pl-9"
              />
            </div>
          </div>

          {/* Repo list */}
          <div className="custom-scrollbar -mr-2 mt-3 max-h-[300px] space-y-2 overflow-y-auto pr-2">
            {loadingRepos ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="h-[60px] animate-pulse rounded-xl border border-border bg-muted"
                />
              ))
            ) : filteredRepos.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">
                {repos.length === 0
                  ? `No repositories found for ${active}.`
                  : `No repositories match “${search}”.`}
              </div>
            ) : (
              filteredRepos.map((r) => (
                <div
                  key={r.fullName}
                  className="group flex items-center gap-3 rounded-xl border border-border bg-muted px-3.5 py-2.5 transition-all hover:border-foreground/30 hover:bg-muted"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border bg-muted text-muted-foreground">
                    {(() => {
                      const Icon = PROVIDER_META[r.provider]?.Icon ?? Github;
                      return <Icon className="h-4 w-4" />;
                    })()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="truncate text-sm font-medium text-foreground">
                        {r.fullName}
                      </span>
                      {r.private && (
                        <Lock className="h-3 w-3 shrink-0 text-muted-foreground" />
                      )}
                    </div>
                    <div className="truncate text-xs text-muted-foreground">
                      {[r.language, relativeTime(r.pushedAt)]
                        .filter(Boolean)
                        .join(" · ") || "Repository"}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => importRepo(r.cloneUrl)}
                    disabled={Boolean(importing)}
                  >
                    {importing === r.cloneUrl ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <>
                        Import
                        <ArrowRight className="h-3.5 w-3.5" />
                      </>
                    )}
                  </Button>
                </div>
              ))
            )}
          </div>
        </>
      )}

      {/* Always-available fallback: paste a repository URL. */}
      <div className="mt-5 border-t border-border pt-4">
        <label className="mb-1.5 block text-xs text-muted-foreground">
          Paste any repository URL
        </label>
        <p className="mb-2 text-xs text-muted-foreground/80">
          Your <span className="font-medium text-foreground">git.hanzo.ai</span> repos, GitHub, GitLab, or any git remote — clone, edit, and Push to Git.
        </p>
        <div className="flex items-center gap-2">
          <Input
            type="url"
            value={pasteUrl}
            onChange={(e) => setPasteUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") submitPaste();
            }}
            placeholder="git.hanzo.ai/hanzoai/app  ·  github.com/org/repo  ·  git@…"
            className="h-9 flex-1"
          />
          <Button
            onClick={submitPaste}
            disabled={!isGitUrl(pasteUrl) || Boolean(importing)}
          >
            Import
          </Button>
        </div>
      </div>
    </div>
  );
}

function ConnectCta({
  onConnect,
  onConnectGitlab,
  gitlabConnectable,
}: {
  onConnect: () => void;
  onConnectGitlab: () => void;
  gitlabConnectable: boolean;
}) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center rounded-xl border border-dashed border-border bg-muted px-6 py-10 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-border bg-muted">
        <Github className="h-6 w-6 text-foreground" />
      </div>
      <h3 className="text-sm font-medium text-foreground">Connect a Git provider</h3>
      <p className="mx-auto mt-1.5 max-w-xs text-sm text-muted-foreground">
        Sign in with GitHub or GitLab to import your repositories and deploy them
        with automatic builds on every push.
      </p>
      <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
        <Button onClick={onConnect}>
          <Github className="h-4 w-4" />
          Connect GitHub
        </Button>
        <Button variant="outline" onClick={onConnectGitlab}>
          <GitlabIcon className="h-4 w-4" />
          Connect GitLab
          {!gitlabConnectable && <Badge variant="outline">Needs setup</Badge>}
        </Button>
      </div>
    </div>
  );
}
