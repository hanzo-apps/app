'use client';

import { SizableText, YStack, XStack, H1, Paragraph, Anchor } from '@hanzo/gui';
// The readable build — the agent session that produced a product, turn by turn.
//
// A visitor lands here from a product and follows how it was actually made: the
// prompt, the reasoning, the tool calls, and the commit each turn produced. Every
// bound turn is a fork point, because a commit sha plus a repo IS the fork
// instruction — no new API is needed to leave from the middle of a build.
//
// HONESTY IS THE WHOLE FEATURE. Nothing on this page is composed for the reader:
// it renders exactly what /v1/agents/builds returned, which is the harness's own
// session log, and the commits are the ones git records against those turns. The
// "verify" line is the literal `git log` that re-derives every binding shown, so
// a sceptical reader can check the page against the repository in one command.
// Turns with no commit are shown WITHOUT one rather than being hidden or
// decorated — most turns change nothing, and pretending otherwise would be the
// same lie as a fabricated transcript.
//
// Server component: pure presentation over data the page already fetched.

import Link from "next/link";
import { ChevronRight, GitCommit, ArrowUpRight, Terminal, User, Bot } from "lucide-react";
import Header from "@/components/layout/header";
import SiteFooter from "@/components/landing/site-footer";
import { MarkdownRenderer } from "@/components/markdown-renderer";

export type BuildTurn = {
  turn: number;
  kind: string;
  actor?: string;
  body: string;
  commit?: string;
  subject?: string;
  at: string;
};

export type Build = {
  org: string;
  project: string;
  session: string;
  title?: string;
  agent: string;
  status: string;
  repo?: string;
  model?: string;
  startedAt: string;
  endedAt?: string;
  turns: BuildTurn[];
  verify: string;
};

const EYEBROW = "font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground";

// A turn's body is MARKDOWN — the agent writes it, so it arrives with headings,
// emphasis, code fences and lists. It goes through the app's one renderer at its
// compact density, the same treatment the builder's own chat thread uses, rather
// than a <p> that would show literal `**` and backticks to the reader.
//
// Shown whole, never truncated: an elided transcript is the thing this feature
// exists to replace.
function TurnBody({ text }: { text: string }) {
  return <MarkdownRenderer content={text} compact muted />;
}

// forkCommand is the real, runnable way to leave from this turn. It is built
// from facts the API returned (repo + commit) and nothing else — when either is
// missing there is no command, and none is shown.
function forkCommand(repo: string | undefined, commit: string) {
  if (!repo) return null;
  return `git clone ${repo} && cd ${repo.split("/").pop()?.replace(/\.git$/, "")} && git checkout ${commit}`;
}

export function BuildTranscript({ build }: { build: Build }) {
  const bound = build.turns.filter((t) => t.commit).length;

  return (
    <SizableText position="relative" minHeight="100%" backgroundColor="$background" color="$color" overflow="hidden" display="flex" flexDirection="column">
      <YStack pointerEvents="none" position="fixed" top={0} right={0} bottom={0} left={0} zIndex={0} overflow="hidden">
        <YStack position="absolute" left="50%" top="-14%" height={520} width={860} marginLeft={-430} borderRadius="$10" backgroundColor="$color005" filter="blur(130px)" />
      </YStack>

      <Header />

      <YStack position="relative" zIndex={10}>
        <YStack paddingHorizontal="$4" paddingTop={36} $md={{ paddingHorizontal: "$6", paddingTop: "$9" }}>
          <YStack alignSelf="center" maxWidth={896}>
            <nav aria-label="Breadcrumb">
              <SizableText flexWrap="wrap" alignItems="center" gap="$1.5" fontFamily="$mono" fontSize={11} color="$color11" display="flex" flexDirection="row">
                <li>
                  <Link href="/builds"><SizableText hoverStyle={{ color: "$color" }}>
                    Builds
                  </SizableText></Link>
                </li>
                <li aria-hidden="true">
                  <ChevronRight size={12} />
                </li>
                <li>{build.org}</li>
                <li aria-hidden="true">
                  <ChevronRight size={12} />
                </li>
                <SizableText color="$color">{build.project}</SizableText>
              </SizableText>
            </nav>

            <H1 marginTop="$6" fontSize="$10" fontWeight="500" lineHeight="1.08" letterSpacing={-0.4} $sm={{ fontSize: "$11" }}>
              {build.title || `How ${build.project} was built`}
            </H1>

            <XStack marginTop="$4.5" flexWrap="wrap" alignItems="center" gap="$2">
              <SizableText display="inline-flex" alignItems="center" gap="$1.5" borderRadius="$10" borderWidth={1} borderColor="$borderColor" backgroundColor="$color3" paddingHorizontal="$3" paddingVertical="$1" fontFamily="$mono" fontSize={11} color="$color11">
                {build.agent}
              </SizableText>
              {build.model ? (
                <SizableText display="inline-flex" alignItems="center" borderRadius="$10" borderWidth={1} borderColor="$borderColor" backgroundColor="$color3" paddingHorizontal="$2.5" paddingVertical="$1" fontFamily="$mono" fontSize={10} color="$color11">
                  {build.model}
                </SizableText>
              ) : null}
              <SizableText display="inline-flex" alignItems="center" borderRadius="$10" borderWidth={1} borderColor="$borderColor" backgroundColor="$color3" paddingHorizontal="$2.5" paddingVertical="$1" fontFamily="$mono" fontSize={10} color="$color11">
                {build.turns.length} turns
              </SizableText>
              <SizableText display="inline-flex" alignItems="center" borderRadius="$10" borderWidth={1} borderColor="$borderColor" backgroundColor="$color3" paddingHorizontal="$2.5" paddingVertical="$1" fontFamily="$mono" fontSize={10} color="$color11">
                {bound} commits
              </SizableText>
            </XStack>

            {/* The claim and how to check it, side by side. */}
            <YStack marginTop="$6" borderRadius="$6" borderWidth={1} borderColor="$borderColor" backgroundColor="$color2" padding="$4">
              <Paragraph className={`${EYEBROW}`}>Verify</Paragraph>
              <Paragraph marginTop="$2" fontSize="$3" lineHeight="1.625" color="$color11">
                Every commit below is bound to its turn by a git trailer or note on the
                commit itself — not by a table on our side. Re-derive all of them:
              </Paragraph>
              <SizableText marginTop="$3" borderRadius="$5" borderWidth={1} borderColor="$borderColor" backgroundColor="$background" padding="$3" fontFamily="$mono" fontSize={11} color="$color11" overflow="scroll" whiteSpace="pre">
                {build.verify}
              </SizableText>
              {build.repo ? (
                <Anchor display="inline-flex"
                  href={build.repo}
                  target="_blank"
                  rel="noreferrer"
                  marginTop="$3" alignItems="center" gap="$1.5" fontFamily="$mono" fontSize={11} color="$color11" hoverStyle={{ color: "$color" }}
                >
                  {build.repo}
                  <ArrowUpRight size={12} />
                </Anchor>
              ) : null}
            </YStack>
          </YStack>
        </YStack>

        {/* ── The session ──────────────────────────────────────── */}
        <YStack paddingHorizontal="$4" paddingVertical="$10" $md={{ paddingHorizontal: "$6", paddingVertical: "$11" }}>
          <YStack alignSelf="center" maxWidth={896}>
            <YStack position="relative" borderLeftWidth={1} borderColor="$borderColor" paddingLeft="$5">
              {build.turns.map((t) => {
                const cmd = t.commit ? forkCommand(build.repo, t.commit) : null;
                const isUser = t.actor === "user" || t.kind === "message" && t.actor === "user";
                return (
                  <SizableText key={t.turn} position="relative" paddingBottom="$7" className="last-flat">
                    <SizableText position="absolute" left={-31} height="$4.5" width="$4.5" alignItems="center" justifyContent="center" borderRadius="$10" borderWidth={1} borderColor="$borderColor" backgroundColor="$background">
                      {isUser ? (
                        <User size={10} />
                      ) : t.kind === "status" ? (
                        <Terminal size={10} />
                      ) : (
                        <Bot size={10} />
                      )}
                    </SizableText>

                    <XStack flexWrap="wrap" alignItems="baseline" gap="$2">
                      <SizableText fontFamily="$mono" fontSize={11} color="$color11">
                        Turn {t.turn}
                      </SizableText>
                      {t.actor ? (
                        <SizableText fontFamily="$mono" fontSize={11} color="$color11">
                          {t.actor}
                        </SizableText>
                      ) : null}
                      <SizableText fontFamily="$mono" fontSize={11} color="$color11" opacity={0.7}>{t.at}</SizableText>
                    </XStack>

                    <YStack marginTop="$2">
                      <TurnBody text={t.body} />
                    </YStack>

                    {t.commit ? (
                      <YStack marginTop="$4" borderRadius="$5" borderWidth={1} borderColor="$borderColor" backgroundColor="$color2" padding="$3">
                        <XStack flexWrap="wrap" alignItems="center" gap="$2">
                          <GitCommit size={14} />
                          <SizableText fontFamily="$mono" fontSize={11} color="$color">
                            {t.commit.slice(0, 12)}
                          </SizableText>
                          {t.subject ? (
                            <SizableText fontSize="$3" color="$color11">{t.subject}</SizableText>
                          ) : null}
                        </XStack>
                        {cmd ? (
                          <>
                            <Paragraph marginTop="$3" className={`${EYEBROW}`}>Fork from here</Paragraph>
                            <SizableText marginTop="$1.5" borderRadius="$2" borderWidth={1} borderColor="$borderColor" backgroundColor="$background" padding="$2.5" fontFamily="$mono" fontSize={11} color="$color11" overflow="scroll" whiteSpace="pre">
                              {cmd}
                            </SizableText>
                          </>
                        ) : null}
                      </YStack>
                    ) : null}
                  </SizableText>
                );
              })}
            </YStack>
          </YStack>
        </YStack>
      </YStack>

      <SiteFooter />
    </SizableText>
  );
}
