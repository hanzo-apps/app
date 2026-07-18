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
import { isGitUrl, gitUrlGateMessage } from "@/lib/git/url";
import { toast } from "sonner";

/** Provider display metadata — the ONE place icon/label per provider lives. */
const PROVIDER_META: Record<GitProvider, { label: string; Icon: typeof Github }> = {
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
  const { config, isAuthenticated, login } = useIam();

  const [loadingAccounts, setLoadingAccounts] = useState(true);
  const [connected, setConnected] = useState(false);
  const [accounts, setAccounts] = useState<GitAccount[]>([]);
  const [providers, setProviders] = useState<GitProviderStatus[]>([]);
  const [active, setActive] = useState<string>("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [showProviders, setShowProviders] = useState(false);

  const [repos, setRepos] = useState<GitRepo[]>([]);
  const [loadingRepos, setLoadingRepos] = useState(false);
  const [search, setSearch] = useState("");
  const [importing, setImporting] = useState<string>("");

  const [pasteUrl, setPasteUrl] = useState("");

  const menuRef = useRef<HTMLDivElement>(null);
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

  // Close the account menu on outside click.
  useEffect(() => {
    if (!menuOpen) return;
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [menuOpen]);

  // Connect GitHub — two honest paths, one per auth state:
  //
  //  • Already signed in (e.g. via Google/password): LINK GitHub to the
  //    EXISTING hanzo.id account. `login({prompt:"login"})` would silently
  //    re-SSO the live session back WITHOUT ever showing the GitHub chooser,
  //    so nothing links and `/v1/git/accounts` stays `{connected:false}`.
  //    Instead open hanzo.id's own account page, whose "Link" button runs the
  //    canonical Casdoor link flow: getAuthUrl(app, provider-github, "link")
  //    encodes `method=link` in the OAuth `state`, so IAM's /callback runs
  //    LinkUserAccount against the logged-in user. A new tab keeps /new alive;
  //    the visibilitychange listener re-fetches on return and the repos appear.
  //
  //  • Not signed in: full SSO. Signing in WITH GitHub links it on first
  //    sign-in (the already-working path), then returns to /new.
  const connectGithub = useCallback(() => {
    if (isAuthenticated) {
      linkPendingRef.current = true;
      const base = (config.serverUrl || "https://hanzo.id").replace(/\/+$/, "");
      window.open(`${base}/account`, "_blank", "noopener,noreferrer");
      return;
    }
    try {
      localStorage.setItem("redirectAfterLogin", window.location.pathname);
    } catch {
      /* storage unavailable */
    }
    void login();
  }, [isAuthenticated, config, login]);

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
    // Signed in already → LINK GitLab to the existing account (a silent re-SSO
    // would never show the GitLab chooser). Open hanzo.id's account page; the
    // return-focus listener re-fetches accounts and reveals the repos.
    if (isAuthenticated) {
      linkPendingRef.current = true;
      const base = (config.serverUrl || "https://hanzo.id").replace(/\/+$/, "");
      window.open(`${base}/account`, "_blank", "noopener,noreferrer");
      return;
    }
    try {
      localStorage.setItem("redirectAfterLogin", window.location.pathname);
    } catch {
      /* storage unavailable */
    }
    void login();
  }, [gitlabConnectable, isAuthenticated, config, login]);

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
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 sm:p-6">
      <div className="mb-1 flex items-center gap-2">
        <Github className="h-[18px] w-[18px] text-white/70" />
        <h2 className="text-[15px] font-medium">Import Git Repository</h2>
      </div>
      <p className="mb-5 text-sm text-white/45">
        Connect a repository and deploy it as a service, container, or site —
        with automatic builds on every push.
      </p>

      {loadingAccounts ? (
        <div className="space-y-2">
          <div className="h-10 animate-pulse rounded-xl border border-white/10 bg-white/[0.03]" />
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-[60px] animate-pulse rounded-xl border border-white/10 bg-white/[0.03]"
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
            <div ref={menuRef} className="relative sm:w-[46%]">
              <button
                type="button"
                onClick={() => setMenuOpen((o) => !o)}
                className="flex h-10 w-full items-center gap-2 rounded-lg border border-white/12 bg-black/40 px-3 text-sm text-white transition-colors hover:border-white/25"
              >
                {(() => {
                  const Icon = PROVIDER_META[activeAccount?.provider ?? "github"].Icon;
                  return <Icon className="h-4 w-4 shrink-0 text-white/70" />;
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
                <ChevronDown className="ml-auto h-4 w-4 shrink-0 text-white/40" />
              </button>

              {menuOpen && (
                <div className="absolute z-30 mt-1.5 w-full min-w-[240px] overflow-hidden rounded-xl border border-white/12 bg-neutral-950 shadow-2xl shadow-black/60">
                  <div className="max-h-64 overflow-y-auto py-1">
                    {accounts.map((a) => {
                      const Icon = PROVIDER_META[a.provider].Icon;
                      return (
                        <button
                          key={`${a.provider}:${a.login}`}
                          type="button"
                          onClick={() => {
                            setActive(a.login);
                            setSearch("");
                            setMenuOpen(false);
                          }}
                          className={`flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm transition-colors hover:bg-white/[0.06] ${
                            a.login === active ? "text-white" : "text-white/70"
                          }`}
                        >
                          {a.avatarUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={a.avatarUrl} alt="" className="h-5 w-5 rounded-full" />
                          ) : (
                            <Icon className="h-4 w-4 text-white/50" />
                          )}
                          <span className="truncate">{a.login}</span>
                          <span className="ml-auto text-[11px] text-white/30">
                            {a.provider === "gitlab"
                              ? "GitLab"
                              : a.type === "org"
                                ? "Org"
                                : "Personal"}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  <div className="border-t border-white/10">
                    <button
                      type="button"
                      onClick={connectGithub}
                      className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm text-white/70 transition-colors hover:bg-white/[0.06] hover:text-white"
                    >
                      <Plus className="h-4 w-4" />
                      Add GitHub Account
                    </button>
                    <button
                      type="button"
                      onClick={connectGitlab}
                      className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm text-white/70 transition-colors hover:bg-white/[0.06] hover:text-white"
                    >
                      <GitlabIcon className="h-4 w-4" />
                      Add GitLab Account
                      {!gitlabConnectable && (
                        <span className="ml-auto rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-300/90">
                          Needs setup
                        </span>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowProviders((s) => !s)}
                      className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm text-white/70 transition-colors hover:bg-white/[0.06] hover:text-white"
                    >
                      <RefreshCw className="h-4 w-4" />
                      Providers
                    </button>
                    {showProviders && (
                      <div className="grid grid-cols-2 gap-1.5 border-t border-white/10 px-2 py-2">
                        <span className="col-span-2 px-1 text-[11px] uppercase tracking-wide text-white/30">
                          Providers
                        </span>
                        <span className="inline-flex items-center gap-1.5 rounded-md border border-white/15 bg-white/[0.05] px-2 py-1.5 text-xs text-white">
                          <Github className="h-3.5 w-3.5" /> GitHub
                        </span>
                        {gitlabConnectable ? (
                          <button
                            type="button"
                            onClick={connectGitlab}
                            className="inline-flex items-center gap-1.5 rounded-md border border-white/15 bg-white/[0.05] px-2 py-1.5 text-xs text-white transition-colors hover:border-white/30"
                          >
                            <GitlabIcon className="h-3.5 w-3.5" /> GitLab
                          </button>
                        ) : (
                          <span
                            className="inline-flex items-center gap-1.5 rounded-md border border-white/10 px-2 py-1.5 text-xs text-white/35"
                            title="GitLab connect is being set up"
                          >
                            <GitlabIcon className="h-3.5 w-3.5" /> GitLab · Setup
                          </span>
                        )}
                        <span className="inline-flex items-center gap-1.5 rounded-md border border-white/10 px-2 py-1.5 text-xs text-white/35">
                          <Globe className="h-3.5 w-3.5" /> Bitbucket · Soon
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search repositories…"
                className="h-10 w-full rounded-lg border border-white/12 bg-black/40 pl-9 pr-3 text-sm text-white placeholder:text-white/30 focus:border-white/25 focus:outline-none"
              />
            </div>
          </div>

          {/* Repo list */}
          <div className="custom-scrollbar -mr-2 mt-3 max-h-[300px] space-y-2 overflow-y-auto pr-2">
            {loadingRepos ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="h-[60px] animate-pulse rounded-xl border border-white/10 bg-white/[0.03]"
                />
              ))
            ) : filteredRepos.length === 0 ? (
              <div className="py-8 text-center text-sm text-white/40">
                {repos.length === 0
                  ? `No repositories found for ${active}.`
                  : `No repositories match “${search}”.`}
              </div>
            ) : (
              filteredRepos.map((r) => (
                <div
                  key={r.fullName}
                  className="group flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.02] px-3.5 py-2.5 transition-all hover:border-white/20 hover:bg-white/[0.05]"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-white/60">
                    {(() => {
                      const Icon = PROVIDER_META[r.provider]?.Icon ?? Github;
                      return <Icon className="h-4 w-4" />;
                    })()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="truncate text-sm font-medium text-white">
                        {r.fullName}
                      </span>
                      {r.private && (
                        <Lock className="h-3 w-3 shrink-0 text-white/35" />
                      )}
                    </div>
                    <div className="truncate text-xs text-white/40">
                      {[r.language, relativeTime(r.pushedAt)]
                        .filter(Boolean)
                        .join(" · ") || "Repository"}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => importRepo(r.cloneUrl)}
                    disabled={Boolean(importing)}
                    className="inline-flex h-8 shrink-0 items-center gap-1 rounded-lg border border-white/15 bg-white/[0.04] px-3 text-xs font-medium text-white transition-colors hover:border-white/30 hover:bg-white/10 disabled:opacity-50"
                  >
                    {importing === r.cloneUrl ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <>
                        Import
                        <ArrowRight className="h-3.5 w-3.5" />
                      </>
                    )}
                  </button>
                </div>
              ))
            )}
          </div>
        </>
      )}

      {/* Always-available fallback: paste a repository URL. */}
      <div className="mt-5 border-t border-white/10 pt-4">
        <label className="mb-2 block text-xs text-white/40">
          Or paste a repository URL
        </label>
        <div className="flex items-center gap-2">
          <input
            type="url"
            value={pasteUrl}
            onChange={(e) => setPasteUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") submitPaste();
            }}
            placeholder="github.com/org/repo  ·  https://…  ·  git@…"
            className="h-9 flex-1 rounded-lg border border-white/12 bg-black/40 px-3 text-sm text-white placeholder:text-white/30 focus:border-white/25 focus:outline-none"
          />
          <button
            type="button"
            onClick={submitPaste}
            disabled={!isGitUrl(pasteUrl) || Boolean(importing)}
            className="inline-flex h-9 shrink-0 items-center rounded-lg bg-white px-4 text-sm font-medium text-black transition-colors hover:bg-white/90 disabled:opacity-40"
          >
            Import
          </button>
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
    <div className="flex flex-col items-center rounded-xl border border-dashed border-white/15 bg-white/[0.02] px-6 py-10 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/[0.04]">
        <Github className="h-6 w-6 text-white/80" />
      </div>
      <h3 className="text-sm font-medium text-white">Connect a Git provider</h3>
      <p className="mx-auto mt-1.5 max-w-xs text-sm text-white/45">
        Sign in with GitHub or GitLab to import your repositories and deploy them
        with automatic builds on every push.
      </p>
      <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
        <button
          type="button"
          onClick={onConnect}
          className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-medium text-black transition-colors hover:bg-white/90"
        >
          <Github className="h-4 w-4" />
          Connect GitHub
        </button>
        <button
          type="button"
          onClick={onConnectGitlab}
          className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/[0.04] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:border-white/30 hover:bg-white/[0.08]"
        >
          <GitlabIcon className="h-4 w-4" />
          Connect GitLab
          {!gitlabConnectable && (
            <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-300/90">
              Needs setup
            </span>
          )}
        </button>
      </div>
    </div>
  );
}
