"use client";

import { YStack, XStack, H2, Paragraph, Image, SizableText, H3 } from '@hanzo/gui';
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
import { linkProvider } from "@/lib/hanzo/iam";
import { isGitUrl, gitUrlGateMessage } from "@/lib/git/url";
import { toast, Button, Input, Label } from '@hanzo/ui';

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
    <YStack borderRadius="$8" borderWidth={1} borderColor="$borderColor" backgroundColor="$color3" padding="$4.5" $sm={{ padding: "$5" }}>
      <XStack marginBottom="$1" alignItems="center" gap="$2">
        <Github size={18} color="$color" />
        <H2 fontSize={15} fontWeight="500">Import Git Repository</H2>
      </XStack>
      <Paragraph marginBottom="$4.5" fontSize="$3" color="$color11">
        Connect a repository and deploy it as a service, container, or site —
        with automatic builds on every push.
      </Paragraph>

      {loadingAccounts ? (
        <YStack rowGap="$2">
          <YStack height="$7" borderRadius="$6" borderWidth={1} borderColor="$borderColor" backgroundColor="$color3" />
          {Array.from({ length: 3 }).map((_, i) => (
            <YStack
              key={i}
              height={60} borderRadius="$6" borderWidth={1} borderColor="$borderColor" backgroundColor="$color3"
  />
          ))}
        </YStack>
      ) : !connected ? (
        <ConnectCta
          onConnect={connectGithub}
          onConnectGitlab={connectGitlab}
          gitlabConnectable={gitlabConnectable}
  />
      ) : (
        <>
          {/* Account dropdown + repo search */}
          <YStack gap="$2" $sm={{ flexDirection: "row", alignItems: "center" }}>
            <YStack ref={menuRef} position="relative" $sm={{ width: "46%" }}>
              <Button
                type="button"
                onClick={() => setMenuOpen((o) => !o)}
                height="$7" width="100%" alignItems="center" gap="$2" borderRadius="$5" borderWidth={1} borderColor="$borderColor" backgroundColor="$background" paddingHorizontal="$3" fontSize="$3" color="$color" hoverStyle={{ borderColor: "$color" }}
              >
                {(() => {
                  const Icon =
                    PROVIDER_META[activeAccount?.provider ?? "github"]?.Icon ?? Github;
                  return <Icon className="h-4 w-4 shrink-0 text-foreground" />;
                })()}
                {activeAccount?.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <Image
                    src={activeAccount.avatarUrl}
                    alt=""
                    height="$4.5" width="$4.5" flexShrink={0} borderRadius="$10"
  />
                ) : null}
                <SizableText numberOfLines={1}>{active || "Select account"}</SizableText>
                <ChevronDown size={16} color="$color11" />
              </Button>

              {menuOpen && (
                <YStack position="absolute" zIndex={30} marginTop="$1.5" width="100%" minWidth={240} overflow="hidden" borderRadius="$6" borderWidth={1} borderColor="$borderColor" backgroundColor="$background" elevation={6}>
                  <YStack maxHeight={256} paddingVertical="$1" overflow="scroll">
                    {accounts.map((a) => {
                      const Icon = PROVIDER_META[a.provider]?.Icon ?? Github;
                      return (
                        <Button
                          key={`${a.provider}:${a.login}`}
                          type="button"
                          onClick={() => {
                            setActive(a.login);
                            setSearch("");
                            setMenuOpen(false);
                          }}
                          width="100%" alignItems="center" gap="$2.5" paddingHorizontal="$3" paddingVertical="$2" textAlign="left" fontSize="$3" hoverStyle={{ backgroundColor: "$color3" }} {...{ color: a.login === active ? "$color" : "$color11" }}
                        >
                          {a.avatarUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <Image src={a.avatarUrl} alt="" height="$4.5" width="$4.5" borderRadius="$10" />
                          ) : (
                            <Icon className="h-4 w-4 text-muted-foreground" />
                          )}
                          <SizableText numberOfLines={1}>{a.login}</SizableText>
                          <SizableText marginLeft="auto" fontSize={11} color="$color11">
                            {a.provider === "gitlab"
                              ? "GitLab"
                              : a.type === "org"
                                ? "Org"
                                : "Personal"}
                          </SizableText>
                        </Button>
                      );
                    })}
                  </YStack>
                  <YStack borderTopWidth={1} borderColor="$borderColor">
                    <Button
                      type="button"
                      onClick={connectGithub}
                      width="100%" alignItems="center" gap="$2.5" paddingHorizontal="$3" paddingVertical="$2.5" textAlign="left" fontSize="$3" color="$color11" hoverStyle={{ backgroundColor: "$color3", color: "$color" }}
                    >
                      <Plus size={16} />
                      Add GitHub Account
                    </Button>
                    <Button
                      type="button"
                      onClick={connectGitlab}
                      width="100%" alignItems="center" gap="$2.5" paddingHorizontal="$3" paddingVertical="$2.5" textAlign="left" fontSize="$3" color="$color11" hoverStyle={{ backgroundColor: "$color3", color: "$color" }}
                    >
                      <GitlabIcon size={16} />
                      Add GitLab Account
                      {!gitlabConnectable && (
                        <SizableText marginLeft="auto" borderRadius="$10" borderWidth={1} borderColor="$yellow9" backgroundColor="$yellow9" paddingHorizontal="$2" paddingVertical="$0.5" fontSize={10} fontWeight="500" color="$yellow4">
                          Needs setup
                        </SizableText>
                      )}
                    </Button>
                    <Button
                      type="button"
                      onClick={() => setShowProviders((s) => !s)}
                      width="100%" alignItems="center" gap="$2.5" paddingHorizontal="$3" paddingVertical="$2.5" textAlign="left" fontSize="$3" color="$color11" hoverStyle={{ backgroundColor: "$color3", color: "$color" }}
                    >
                      <RefreshCw size={16} />
                      Providers
                    </Button>
                    {showProviders && (
                      <YStack gap="$1.5" borderTopWidth={1} borderColor="$borderColor" paddingHorizontal="$2" paddingVertical="$2">
                        <SizableText paddingHorizontal="$1" fontSize={11} textTransform="uppercase" letterSpacing={0.4} color="$color11">
                          Providers
                        </SizableText>
                        <SizableText alignItems="center" gap="$1.5" borderRadius="$3" borderWidth={1} borderColor="$borderColor" backgroundColor="$color3" paddingHorizontal="$2" paddingVertical="$1.5" fontSize="$1" color="$color">
                          <Github size={14} /> GitHub
                        </SizableText>
                        {gitlabConnectable ? (
                          <Button
                            type="button"
                            onClick={connectGitlab}
                            alignItems="center" gap="$1.5" borderRadius="$3" borderWidth={1} borderColor="$borderColor" backgroundColor="$color3" paddingHorizontal="$2" paddingVertical="$1.5" fontSize="$1" color="$color" hoverStyle={{ borderColor: "$color" }}
                          >
                            <GitlabIcon size={14} /> GitLab
                          </Button>
                        ) : (
                          <SizableText
                            alignItems="center" gap="$1.5" borderRadius="$3" borderWidth={1} borderColor="$borderColor" paddingHorizontal="$2" paddingVertical="$1.5" fontSize="$1" color="$color11"
                            title="GitLab connect is being set up"
                          >
                            <GitlabIcon size={14} /> GitLab · Setup
                          </SizableText>
                        )}
                        <SizableText alignItems="center" gap="$1.5" borderRadius="$3" borderWidth={1} borderColor="$borderColor" paddingHorizontal="$2" paddingVertical="$1.5" fontSize="$1" color="$color11">
                          <Globe size={14} /> Bitbucket · Soon
                        </SizableText>
                      </YStack>
                    )}
                  </YStack>
                </YStack>
              )}
            </YStack>

            <YStack position="relative" flex={1}>
              <Search size={16} color="$color11" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search repositories…"
                height="$7" width="100%" borderRadius="$5" borderWidth={1} borderColor="$borderColor" backgroundColor="$background" paddingLeft={36} paddingRight="$3" fontSize="$3" color="$color" placeholderTextColor="$color11" focusStyle={{ borderColor: "$color", outlineWidth: 0 }}
  />
            </YStack>
          </YStack>

          {/* Repo list */}
          <YStack marginRight="-2" marginTop="$3" maxHeight={300} rowGap="$2" paddingRight="$2" overflow="scroll" className="custom-scrollbar">
            {loadingRepos ? (
              Array.from({ length: 4 }).map((_, i) => (
                <YStack
                  key={i}
                  height={60} borderRadius="$6" borderWidth={1} borderColor="$borderColor" backgroundColor="$color3"
  />
              ))
            ) : filteredRepos.length === 0 ? (
              <SizableText paddingVertical="$6" textAlign="center" fontSize="$3" color="$color11" display="flex" flexDirection="column">
                {repos.length === 0
                  ? `No repositories found for ${active}.`
                  : `No repositories match “${search}”.`}
              </SizableText>
            ) : (
              filteredRepos.map((r) => (
                <XStack
                  key={r.fullName}
                  group alignItems="center" gap="$3" borderRadius="$6" borderWidth={1} borderColor="$borderColor" backgroundColor="$color3" paddingHorizontal="$3.5" paddingVertical="$2.5" hoverStyle={{ borderColor: "$color", backgroundColor: "$color3" }}
                >
                  <SizableText height="$6" width="$6" flexShrink={0} alignItems="center" justifyContent="center" borderRadius="$5" borderWidth={1} borderColor="$borderColor" backgroundColor="$color3" color="$color11" display="flex" flexDirection="row">
                    {(() => {
                      const Icon = PROVIDER_META[r.provider]?.Icon ?? Github;
                      return <Icon className="h-4 w-4" />;
                    })()}
                  </SizableText>
                  <YStack minWidth={0} flex={1}>
                    <XStack alignItems="center" gap="$1.5">
                      <SizableText numberOfLines={1} fontSize="$3" fontWeight="500" color="$color">
                        {r.fullName}
                      </SizableText>
                      {r.private && (
                        <Lock size={12} color="$color11" />
                      )}
                    </XStack>
                    <SizableText numberOfLines={1} fontSize="$1" color="$color11" display="flex" flexDirection="column">
                      {[r.language, relativeTime(r.pushedAt)]
                        .filter(Boolean)
                        .join(" · ") || "Repository"}
                    </SizableText>
                  </YStack>
                  <Button
                    type="button"
                    onClick={() => importRepo(r.cloneUrl)}
                    disabled={Boolean(importing)}
                    height="$6" flexShrink={0} alignItems="center" gap="$1" borderRadius="$5" borderWidth={1} borderColor="$borderColor" backgroundColor="$color3" paddingHorizontal="$3" fontSize="$1" fontWeight="500" color="$color" hoverStyle={{ borderColor: "$color", backgroundColor: "$color3" }} disabledStyle={{ opacity: 0.5 }}
                  >
                    {importing === r.cloneUrl ? (
                      <Loader2 size={14} />
                    ) : (
                      <>
                        Import
                        <ArrowRight size={14} />
                      </>
                    )}
                  </Button>
                </XStack>
              ))
            )}
          </YStack>
        </>
      )}

      {/* Always-available fallback: paste a repository URL. */}
      <YStack marginTop="$4.5" borderTopWidth={1} borderColor="$borderColor" paddingTop="$4">
        <Label marginBottom="$1.5" fontSize="$1" color="$color11">
          Paste any repository URL
        </Label>
        <Paragraph marginBottom="$2" fontSize="$1" color="$color11">
          Your <SizableText fontWeight="500" color="$color">git.hanzo.ai</SizableText> repos, GitHub, GitLab, or any git remote — clone, edit, and Push to Git.
        </Paragraph>
        <XStack alignItems="center" gap="$2">
          <Input
            type="url"
            value={pasteUrl}
            onChange={(e) => setPasteUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") submitPaste();
            }}
            placeholder="git.hanzo.ai/hanzoai/app  ·  github.com/org/repo  ·  git@…"
            height={36} flex={1} borderRadius="$5" borderWidth={1} borderColor="$borderColor" backgroundColor="$background" paddingHorizontal="$3" fontSize="$3" color="$color" placeholderTextColor="$color11" focusStyle={{ borderColor: "$color", outlineWidth: 0 }}
  />
          <Button
            type="button"
            onClick={submitPaste}
            disabled={!isGitUrl(pasteUrl) || Boolean(importing)}
            height={36} flexShrink={0} alignItems="center" borderRadius="$5" backgroundColor="$color12" paddingHorizontal="$4" fontSize="$3" fontWeight="500" color="$background" hoverStyle={{ backgroundColor: "$color12" }} disabledStyle={{ opacity: 0.4 }}
          >
            Import
          </Button>
        </XStack>
      </YStack>
    </YStack>
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
    <SizableText alignSelf="center" maxWidth={448} flexDirection="column" alignItems="center" borderRadius="$6" borderWidth={1} borderStyle="dashed" borderColor="$borderColor" backgroundColor="$color3" paddingHorizontal="$5" paddingVertical="$7" textAlign="center" display="flex">
      <XStack marginBottom="$4" height="$8" width="$8" alignItems="center" justifyContent="center" borderRadius="$10" borderWidth={1} borderColor="$borderColor" backgroundColor="$color3">
        <Github size={24} color="$color" />
      </XStack>
      <H3 fontSize="$3" fontWeight="500" color="$color">Connect a Git provider</H3>
      <Paragraph alignSelf="center" marginTop="$1.5" maxWidth={320} fontSize="$3" color="$color11">
        Sign in with GitHub or GitLab to import your repositories and deploy them
        with automatic builds on every push.
      </Paragraph>
      <XStack marginTop="$4.5" flexWrap="wrap" alignItems="center" justifyContent="center" gap="$2">
        <Button
          type="button"
          onClick={onConnect}
          alignItems="center" gap="$2" borderRadius="$5" backgroundColor="$color12" paddingHorizontal="$4" paddingVertical="$2.5" fontSize="$3" fontWeight="500" color="$background" hoverStyle={{ backgroundColor: "$color12" }}
        >
          <Github size={16} />
          Connect GitHub
        </Button>
        <Button
          type="button"
          onClick={onConnectGitlab}
          alignItems="center" gap="$2" borderRadius="$5" borderWidth={1} borderColor="$borderColor" backgroundColor="$color3" paddingHorizontal="$4" paddingVertical="$2.5" fontSize="$3" fontWeight="500" color="$color" hoverStyle={{ borderColor: "$color", backgroundColor: "$color3" }}
        >
          <GitlabIcon size={16} />
          Connect GitLab
          {!gitlabConnectable && (
            <SizableText borderRadius="$10" borderWidth={1} borderColor="$yellow9" backgroundColor="$yellow9" paddingHorizontal="$2" paddingVertical="$0.5" fontSize={10} fontWeight="500" color="$yellow4">
              Needs setup
            </SizableText>
          )}
        </Button>
      </XStack>
    </SizableText>
  );
}
