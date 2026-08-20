"use client";

import { sends } from '@hanzo/ui/chat';
import { H2, H3, Image, Paragraph, SizableText, Spinner, XStack, YStack } from '@hanzo/ui';
import { useCallback, useEffect, useMemo, useState } from "react";
import { useIam } from "@hanzo/iam/react";
import {
  ArrowRight,
  ChevronDown,
  GitBranch,
  Github,
  GitlabIcon,
  Globe,
  Lock,
  Plus,
  RefreshCw,
  Search,
} from "lucide-react";

import {
  Badge,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Input,
  Label,
  toast,
} from "@hanzo/ui";

import {
  fetchGitAccounts,
  fetchGitRepos,
  pushedAgo,
  type GitAccount,
  type GitProvider,
  type GitProviderStatus,
  type GitRepo,
} from "@/lib/api/git";
import { connectProvider } from "@/lib/connectors";
import { isGitUrl } from "@/lib/git/url";
import { useRepoImport } from "@/lib/import/use-repo-import";

/**
 * Provider display metadata — the ONE place icon/label per provider lives.
 * `hanzo` (git.hanzo.ai) is our own git and leads the list: a signed-in user's
 * forge account is populated automatically, with no OAuth link. Its accounts
 * carry the forge avatar, so the branch mark shows only as a fallback.
 */
const PROVIDER_META: Record<GitProvider, { label: string; Icon: typeof Github }> = {
  hanzo: { label: "Hanzo", Icon: GitBranch },
  github: { label: "GitHub", Icon: Github },
  gitlab: { label: "GitLab", Icon: GitlabIcon },
};

/**
 * Import Git Repository — the real, connected-account import panel.
 *
 * Lists every git account the signed-in user can import from — git.hanzo.ai, and
 * the GitHub and GitLab accounts the org has CONNECTED — with their live
 * repositories, via the same-origin `/v1/git/*` BFF. Selecting an
 * account loads its repos; a row and the paste box perform the SAME import
 * (`useRepoImport`) — the repo is cloned onto git.hanzo.ai with its history and
 * opened as a project. When nothing is connected it shows an HONEST "Connect"
 * CTA (never fabricated rows), and pasting a URL always works without one.
 */
export function ImportGitPanel() {
  const { isAuthenticated, login } = useIam();

  // Sign in and come back here — the one path for every control on this panel
  // that needs an account it does not have.
  const signIn = useCallback(() => {
    try {
      localStorage.setItem("redirectAfterLogin", window.location.pathname);
    } catch {
      /* storage unavailable */
    }
    void login();
  }, [login]);

  const [loadingAccounts, setLoadingAccounts] = useState(true);
  const [connected, setConnected] = useState(false);
  const [accounts, setAccounts] = useState<GitAccount[]>([]);
  const [providers, setProviders] = useState<GitProviderStatus[]>([]);
  const [active, setActive] = useState<string>("");
  const [showProviders, setShowProviders] = useState(false);

  const [repos, setRepos] = useState<GitRepo[]>([]);
  const [loadingRepos, setLoadingRepos] = useState(false);
  const [search, setSearch] = useState("");

  const [pasteUrl, setPasteUrl] = useState("");
  // The provider whose consent screen we are navigating to, so the button says so.
  const [connecting, setConnecting] = useState<"" | "github" | "gitlab">("");

  // A row's Import and the paste box are the SAME action — clone the repo onto
  // git.hanzo.ai with its history, then open it in the builder.
  const { importing, importRepo } = useRepoImport(signIn);

  // Load (or reload) the connected accounts; resolves to whether anything is
  // connected. A not-connected/unauthenticated response yields the honest
  // Connect CTA (fetchGitAccounts never throws). The active selection is
  // preserved across reloads so a refetch never resets the user.
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

  // Connect a provider — ONE path for GitHub and GitLab, because there is one
  // place a git credential lives: the org's connectors. Cloud runs the OAuth leg
  // and seals the token in KMS, which is what makes repositories readable
  // afterwards; an IAM identity LINK proves who you are and grants nothing to
  // read, so this button does not use one.
  //
  // Not signed in ⇒ sign in first and come back — cloud scopes the connection to
  // the org the bearer names, so there is nothing to connect to yet.
  //
  // The authorize URL is a TOP-LEVEL navigation, never a popup: the provider
  // redirects to cloud's own public callback (api.hanzo.ai), which seals the
  // token and lands the person back here.
  const connect = useCallback(
    (provider: "github" | "gitlab") => {
      if (!isAuthenticated) {
        signIn();
        return;
      }
      if (!providers.find((p) => p.provider === provider)?.connectable) {
        toast.info(
          `${PROVIDER_META[provider].label} is not configured on this deployment yet, so there is nothing to connect to.`,
        );
        return;
      }
      setConnecting(provider);
      void connectProvider(provider).then((r) => {
        if (r.authorizeUrl) {
          try {
            localStorage.setItem("redirectAfterLogin", window.location.pathname);
          } catch {
            /* storage unavailable */
          }
          window.location.assign(r.authorizeUrl);
          return;
        }
        setConnecting("");
        toast.error(r.error || `Could not start the ${PROVIDER_META[provider].label} connection.`);
      });
    },
    [isAuthenticated, providers, signIn],
  );

  const connectGithub = useCallback(() => connect("github"), [connect]);
  const connectGitlab = useCallback(() => connect("gitlab"), [connect]);

  const gitlabConnectable = providers.find((p) => p.provider === "gitlab")?.connectable ?? false;

  const submitPaste = useCallback(() => {
    void importRepo(pasteUrl);
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
    /* $color2 is the panel ground and $color3 the rows on it — one rung apart,
       the same ladder the Clone a Template panel beside this one uses. At
       $color3 the panel and its own rows were the same colour, so every row
       read as a hairline drawn on nothing. */
    <YStack borderRadius="$8" borderWidth={1} borderColor="$borderColor" backgroundColor="$color2" padding="$4.5" $sm={{ padding: "$5" }}>
      <XStack marginBottom="$1" alignItems="center" gap="$2">
        <GitBranch size={18} />
        <H2 fontSize="$4" fontWeight="500">Import Git Repository</H2>
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
          connecting={connecting}
  />
      ) : (
        <>
          {/* Account dropdown + repo search */}
          <YStack gap="$2" $sm={{ flexDirection: "row", alignItems: "center" }}>
            <YStack $sm={{ width: "46%" }}>
              <DropdownMenu placement="bottom-start">
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="lg" width="100%">
                    {(() => {
                      const Icon =
                        PROVIDER_META[activeAccount?.provider ?? "github"]?.Icon ?? Github;
                      return <Icon size={16} />;
                    })()}
                    {activeAccount?.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <Image
                        src={activeAccount.avatarUrl}
                        alt=""
                        height="$4.5" width="$4.5" flexShrink={0} borderRadius="$10"
                      />
                    ) : null}
                    <SizableText flex={1} numberOfLines={1}>{active || "Select account"}</SizableText>
                    <ChevronDown size={16} />
                  </Button>
                </DropdownMenuTrigger>

                {/* Sized by its content, not by the trigger: the menu panel
                    already caps height to the room it measured and width to the
                    phone, so pinning the trigger width only forced wraps. */}
                <DropdownMenuContent minWidth={240}>
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
                          <Image src={a.avatarUrl} alt="" height="$4.5" width="$4.5" borderRadius="$10" />
                        ) : (
                          <Icon size={16} />
                        )}
                        <SizableText numberOfLines={1}>{a.login}</SizableText>
                        <SizableText marginLeft="auto" fontSize="$1" color="$color11">
                          {a.provider === "hanzo"
                            ? "Hanzo"
                            : a.provider === "gitlab"
                              ? "GitLab"
                              : a.type === "org"
                                ? "Org"
                                : "Personal"}
                        </SizableText>
                      </DropdownMenuItem>
                    );
                  })}

                  <DropdownMenuSeparator />

                  <DropdownMenuItem onSelect={connectGithub}>
                    <Plus size={16} />
                    Add GitHub Account
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={connectGitlab}>
                    <GitlabIcon size={16} />
                    Add GitLab Account
                  </DropdownMenuItem>
                  {/* Stays open: this row reveals the provider list in place, so
                      selecting it must not dismiss the surface it reveals. */}
                  <DropdownMenuItem onSelect={(e) => { e?.preventDefault(); setShowProviders((s) => !s); }}>
                    <RefreshCw size={16} />
                    Providers
                  </DropdownMenuItem>
                  {showProviders && (
                    <YStack gap="$1.5" borderTopWidth={1} borderColor="$borderColor" paddingHorizontal="$2" paddingVertical="$2">
                      <SizableText paddingHorizontal="$1" fontSize="$1" letterSpacing={0.4} color="$color11">
                        Providers
                      </SizableText>
                      <Badge variant="outline">
                        <Github size={14} /> GitHub
                      </Badge>
                      {gitlabConnectable ? (
                        <Button variant="outline" size="sm" onClick={connectGitlab}>
                          <GitlabIcon size={14} /> GitLab
                        </Button>
                      ) : (
                        <Badge variant="outline" title="GitLab connect is being set up">
                          <GitlabIcon size={14} /> GitLab · Setup
                        </Badge>
                      )}
                      <Badge variant="outline">
                        <Globe size={14} /> Bitbucket · Soon
                      </Badge>
                    </YStack>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </YStack>

            <YStack flex={1}>
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search repositories…"
                height="$7" startAdornment={<Search size={16} />}
              />
            </YStack>
          </YStack>

          {/* Repo list */}
          <YStack marginRight="$-2" marginTop="$3" maxHeight={300} rowGap="$2" paddingRight="$2" overflow="scroll" className="thin-scrollbar">
            {loadingRepos ? (
              Array.from({ length: 4 }).map((_, i) => (
                <YStack
                  key={i}
                  height={60} borderRadius="$6" borderWidth={1} borderColor="$borderColor" backgroundColor="$color3"
  />
              ))
            ) : filteredRepos.length === 0 ? (
              <YStack paddingVertical="$6">
                <SizableText textAlign="center" fontSize="$3" color="$color11">
                  {repos.length === 0
                    ? `Nothing to import from ${active}. Repositories the account can reach are listed here.`
                    : `No repositories match “${search}”.`}
                </SizableText>
              </YStack>
            ) : (
              filteredRepos.map((r) => (
                <XStack
                  key={r.fullName}
                  group alignItems="center" gap="$3" borderRadius="$6" borderWidth={1} borderColor="$borderColor" backgroundColor="$color3" paddingHorizontal="$3.5" paddingVertical="$2.5" hoverStyle={{ borderColor: "$color", backgroundColor: "$color3" }}
                >
                  {/* 36, not `$6` — that token is 64px here, which put a 16px
                      glyph in the middle of an empty square and made each row
                      86px tall, so a scroll box sized for six repos held four.
                      The template rows next door use the same 36. */}
                  <XStack height={36} width={36} flexShrink={0} alignItems="center" justifyContent="center" borderRadius="$5" borderWidth={1} borderColor="$borderColor" backgroundColor="$color4" {...{ color: "$color11" }}>
                    {(() => {
                      const Icon = PROVIDER_META[r.provider]?.Icon ?? Github;
                      return <Icon size={16} />;
                    })()}
                  </XStack>
                  <YStack minWidth={0} flex={1}>
                    <XStack alignItems="center" gap="$1.5">
                      <SizableText numberOfLines={1} fontSize="$3" fontWeight="500" color="$color">
                        {r.fullName}
                      </SizableText>
                      {r.private && (
                        <Lock size={12} />
                      )}
                    </XStack>
                    <SizableText numberOfLines={1} fontSize="$1" color="$color11">
                      {[r.language, pushedAgo(r.pushedAt)]
                        .filter(Boolean)
                        .join(" · ") || "Repository"}
                    </SizableText>
                  </YStack>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => void importRepo(r.cloneUrl)}
                    disabled={Boolean(importing)}
                  >
                    {importing === r.cloneUrl ? (
                      <Spinner size={14} />
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
          Your <SizableText fontWeight="500" color="$color">git.hanzo.ai</SizableText> repos, GitHub, GitLab, or any git remote — imported with their full history, then edit and Push to Git.
        </Paragraph>
        <XStack alignItems="center" gap="$2">
          <Input
            type="url"
            value={pasteUrl}
            onChange={(e) => setPasteUrl(e.target.value)}
            onKeyDown={(e) => {
              if (sends(e.key, e.nativeEvent)) submitPaste();
            }}
            placeholder="github.com/org/repo  ·  gitlab.com/group/project  ·  git.hanzo.ai/you/site"
            height={36} flex={1}
          />
          <Button
            onClick={submitPaste}
            disabled={!isGitUrl(pasteUrl) || Boolean(importing)}
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
  connecting,
}: {
  onConnect: () => void;
  onConnectGitlab: () => void;
  gitlabConnectable: boolean;
  connecting: "" | "github" | "gitlab";
}) {
  return (
    <YStack alignSelf="center" maxWidth={448} alignItems="center" borderRadius="$6" borderWidth={1} borderStyle="dashed" borderColor="$borderColor" backgroundColor="$color3" paddingHorizontal="$5" paddingVertical="$7">
      <XStack marginBottom="$4" height="$8" width="$8" alignItems="center" justifyContent="center" borderRadius="$10" borderWidth={1} borderColor="$borderColor" backgroundColor="$color3">
        <GitBranch size={24} />
      </XStack>
      <H3 fontSize="$3" fontWeight="500" color="$color" textAlign="center">Connect a Git provider</H3>
      <Paragraph alignSelf="center" marginTop="$1.5" maxWidth={320} fontSize="$3" color="$color11" textAlign="center">
        Connect GitHub or GitLab to import your repositories and deploy them with
        automatic builds on every push.
      </Paragraph>
      <XStack marginTop="$4.5" flexWrap="wrap" alignItems="center" justifyContent="center" gap="$2">
        <Button onClick={onConnect} disabled={Boolean(connecting)}>
          {connecting === "github" ? <Spinner size={16} /> : <Github size={16} />}
          Connect GitHub
        </Button>
        <Button variant="outline" onClick={onConnectGitlab} disabled={Boolean(connecting)}>
          {connecting === "gitlab" ? <Spinner size={16} /> : <GitlabIcon size={16} />}
          Connect GitLab
        </Button>
      </XStack>
      {/* A badge INSIDE a button is a control wearing a label, and it read as one
          — the pill ran into the button's own edge. The state belongs to the
          section, so it is one sentence under both buttons, and it is gone
          entirely once the connector is configured. */}
      {!gitlabConnectable && (
        <Paragraph alignSelf="center" marginTop="$3" maxWidth={320} fontSize="$1" color="$color11" textAlign="center">
          GitLab is not configured on this deployment yet.
        </Paragraph>
      )}
    </YStack>
  );
}
