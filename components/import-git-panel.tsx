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
  type GitRepo,
} from "@/lib/api/git";

/** A git repository URL (https, ssh, or bare owner/repo) — the paste fallback. */
function isGitUrl(v: string): boolean {
  const s = v.trim();
  if (!s) return false;
  if (/^git@[\w.-]+:[\w./-]+/i.test(s)) return true;
  if (/\.git$/i.test(s)) return true;
  return /^(https?:\/\/)?(www\.)?(github|gitlab|bitbucket)\.(com|org)\/[\w.-]+\/[\w.-]+/i.test(s);
}

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
  const { login } = useIam();

  const [loadingAccounts, setLoadingAccounts] = useState(true);
  const [connected, setConnected] = useState(false);
  const [accounts, setAccounts] = useState<GitAccount[]>([]);
  const [active, setActive] = useState<string>("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [showProviders, setShowProviders] = useState(false);

  const [repos, setRepos] = useState<GitRepo[]>([]);
  const [loadingRepos, setLoadingRepos] = useState(false);
  const [search, setSearch] = useState("");
  const [importing, setImporting] = useState<string>("");

  const [pasteUrl, setPasteUrl] = useState("");

  const menuRef = useRef<HTMLDivElement>(null);

  // Load the connected accounts once. A not-connected/unauthenticated response
  // yields the honest Connect CTA (fetchGitAccounts never throws).
  useEffect(() => {
    let alive = true;
    fetchGitAccounts().then((r) => {
      if (!alive) return;
      setConnected(r.connected);
      setAccounts(r.accounts);
      setActive(r.accounts[0]?.login ?? "");
      setLoadingAccounts(false);
    });
    return () => {
      alive = false;
    };
  }, []);

  // Load the active account's repositories whenever it changes.
  useEffect(() => {
    if (!connected || !active) return;
    let alive = true;
    setLoadingRepos(true);
    fetchGitRepos(active).then((r) => {
      if (!alive) return;
      setRepos(r);
      setLoadingRepos(false);
    });
    return () => {
      alive = false;
    };
  }, [connected, active]);

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

  // Start the IAM connect flow. `prompt=login` forces the IAM login page (rather
  // than a silent SSO re-sign-in) so the user can pick "Continue with GitHub",
  // which links GitHub and stores the token in their IAM account. On return the
  // BFF resolves the token and the accounts/repos load.
  const connectGithub = useCallback(async () => {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("redirectAfterLogin", window.location.pathname);
      } catch {
        /* storage unavailable */
      }
    }
    await login({ additionalParams: { prompt: "login" } });
  }, [login]);

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
        <ConnectCta onConnect={connectGithub} />
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
                <Github className="h-4 w-4 shrink-0 text-white/70" />
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
                    {accounts.map((a) => (
                      <button
                        key={a.login}
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
                          <Github className="h-4 w-4 text-white/50" />
                        )}
                        <span className="truncate">{a.login}</span>
                        <span className="ml-auto text-[11px] text-white/30">
                          {a.type === "org" ? "Org" : "Personal"}
                        </span>
                      </button>
                    ))}
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
                      onClick={() => setShowProviders((s) => !s)}
                      className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm text-white/70 transition-colors hover:bg-white/[0.06] hover:text-white"
                    >
                      <RefreshCw className="h-4 w-4" />
                      Switch Git Provider
                    </button>
                    {showProviders && (
                      <div className="grid grid-cols-2 gap-1.5 border-t border-white/10 px-2 py-2">
                        <span className="col-span-2 px-1 text-[11px] uppercase tracking-wide text-white/30">
                          Providers
                        </span>
                        <span className="inline-flex items-center gap-1.5 rounded-md border border-white/15 bg-white/[0.05] px-2 py-1.5 text-xs text-white">
                          <Github className="h-3.5 w-3.5" /> GitHub
                        </span>
                        <span className="inline-flex items-center gap-1.5 rounded-md border border-white/10 px-2 py-1.5 text-xs text-white/35">
                          <GitlabIcon className="h-3.5 w-3.5" /> GitLab · Soon
                        </span>
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
                    <Github className="h-4 w-4" />
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

function ConnectCta({ onConnect }: { onConnect: () => void }) {
  return (
    <div className="flex flex-col items-center rounded-xl border border-dashed border-white/15 bg-white/[0.02] px-6 py-10 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/[0.04]">
        <Github className="h-6 w-6 text-white/80" />
      </div>
      <h3 className="text-sm font-medium text-white">Connect GitHub</h3>
      <p className="mx-auto mt-1.5 max-w-xs text-sm text-white/45">
        Sign in with GitHub to import your repositories and deploy them with
        automatic builds on every push.
      </p>
      <button
        type="button"
        onClick={onConnect}
        className="mt-5 inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-medium text-black transition-colors hover:bg-white/90"
      >
        <Github className="h-4 w-4" />
        Connect GitHub
      </button>
    </div>
  );
}
