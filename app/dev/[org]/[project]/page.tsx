"use client";

/**
 * /dev/:org/:project — the canonical URL of an existing project in the builder.
 *
 * ONE deep link per project (org-scoped, shareable, bookmarkable): opening it
 *   1. aligns the client org scope with the URL's org,
 *   2. loads the project record (real name) AND the deployed site's pages back
 *      into the editor via /v1/apps/:slug/site — so the app you shipped opens
 *      ready to edit on ANY device, with its durable history panel keyed by the
 *      same slug,
 *   3. greets in chat instead of generating (an open is never a build).
 *
 * The legacy `/dev?project=<slug>` form canonicalizes here once the record
 * resolves (app/dev/page.tsx). Auth: middleware already gates the /dev prefix.
 */

import { SizableText, YStack, XStack, H1, Paragraph } from '@hanzo/gui';
import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { LockKeyhole } from "lucide-react";
import { AppEditor } from "@/components/editor";
import { fetchProject, fetchProjectSite, toEditorProject } from "@/lib/api/projects";
import { providerFromRepoUrl, fetchGitCommits, fetchCommitPages } from "@/lib/api/git";
import { currentOrg, setCurrentOrg } from "@/lib/org-scope";
import type { Page, Project as EditorProject } from "@/types";

type Phase = "loading" | "open" | "denied";

export default function ProjectDevPage() {
  const params = useParams<{ org: string; project: string }>();
  const org = decodeURIComponent(params.org || "");
  const slug = decodeURIComponent(params.project || "");

  const [phase, setPhase] = useState<Phase>("loading");
  const [pages, setPages] = useState<Page[] | null>(null);
  // The editor-shaped project record. WITHOUT it the editor treats an existing
  // project as brand-new — "Not saved · 1 file", DeployButton, a minted repo. See
  // toEditorProject; passed to <AppEditor project> below.
  const [project, setProject] = useState<EditorProject | null>(null);
  // The org the signed-in user actually acts in (their bearer owner), read from
  // the ONE org context BFF. Used only to explain a denied open ("you're in X").
  const [signedInOrg, setSignedInOrg] = useState("");

  useEffect(() => {
    if (!slug) return;
    let alive = true;

    // The URL is the org scope — align the client value BEFORE any scoped fetch.
    if (org && currentOrg() !== org) setCurrentOrg(org);

    // Opening a project edits it — never auto-build from a stale composer seed.
    try {
      localStorage.removeItem("initialPrompt");
    } catch {
      /* storage unavailable */
    }
    (window as any).__projectSlug = slug;

    (async () => {
      // Record (name) + deployed site (pages) in parallel.
      const [record, site] = await Promise.all([
        fetchProject(slug).catch(() => null),
        fetchProjectSite(slug).catch(() => ({ liveUrl: null, pages: [] })),
      ]);
      if (!alive) return;

      // HONEST access gate: this is an EXPLICIT org/slug deep link. If neither the
      // record nor a deployed site is visible in the current scope, the project is
      // NOT accessible as this user — show why (wrong org / no access) instead of
      // silently opening an empty "new project" that reads as data loss.
      if (!record && site.pages.length === 0) {
        // Learn the caller's real org so the message can name it (best-effort).
        const home = await fetch("/v1/orgs", { credentials: "include" })
          .then((r) => (r.ok ? r.json() : null))
          .then((ctx) => ctx?.currentOrg || ctx?.homeOrg || ctx?.effectiveOrg || "")
          .catch(() => "");
        if (!alive) return;
        setSignedInOrg(typeof home === "string" ? home : "");
        setPhase("denied");
        return;
      }

      const name = record?.name || slug;
      (window as any).__projectName = name;
      // Pages: the published artifact first. But the wildcard currently serves the
      // console shell for many hosts, so site.pages comes back empty — and opening
      // a blank canvas over a project with real committed work reads as data loss.
      // When empty and the project has a repo, reconstruct the latest SAVED version
      // from git (the same forge reconstruction the history Preview uses).
      let restoredPages = site.pages;
      if (restoredPages.length === 0 && record?.repo?.url) {
        const provider = providerFromRepoUrl(record.repo.url);
        const repoRef = provider === "hanzo" ? slug : record.repo.url;
        try {
          const { commits } = await fetchGitCommits(provider, repoRef, record.repo.branch || "main");
          if (commits.length) {
            const gitPages = await fetchCommitPages(provider, repoRef, commits[0].sha);
            if (gitPages?.length) restoredPages = gitPages;
          }
        } catch {
          /* forge unreachable — fall through to whatever the site returned */
        }
        if (!alive) return;
      }
      if (restoredPages.length > 0) setPages(restoredPages);
      // Give the editor the project's real IDENTITY (name, slug, repo). This is
      // what stops an open from reading as "new" — it fixes the status bar
      // ("Not saved · 1 file"), the Save-vs-Deploy button, per-turn commits
      // landing in the slug repo, and restored prompts, because the editor
      // already consumes `project` fully.
      setProject(record ? toEditorProject(record) : null);
      // Greet UNCONDITIONALLY. This used to sit inside `if (pages.length > 0)`, so
      // when the published artifact came back empty (or was the wildcard shell)
      // the chat opened 100% blank — reading as data loss on a project that in
      // fact has a full conversation. The clock-icon clause only when a git repo
      // actually backs the history.
      const hasHistory = !!record?.repo?.url;
      (window as any).__assistantGreeting = hasHistory
        ? `${name} is loaded — your site is in the preview, and its history is in the clock icon up top. ` +
          `Tell me what to change and I'll build it.`
        : `${name} is loaded — your site is in the preview. ` +
          `Tell me what to change and I'll build it.`;
      setPhase("open");
    })();

    return () => {
      alive = false;
    };
  }, [org, slug]);

  if (phase === "loading") {
    return (
      <XStack height="100dvh" backgroundColor="$background" alignItems="center" justifyContent="center">
        <SizableText color="$color11" fontSize="$3">Opening {slug}…</SizableText>
      </XStack>
    );
  }

  if (phase === "denied") {
    const wrongOrg = !!signedInOrg && !!org && signedInOrg !== org;
    return (
      <XStack height="100dvh" alignItems="center" justifyContent="center" backgroundColor="$background" paddingHorizontal="$5">
        <YStack maxWidth={448}>
          <XStack alignSelf="center" marginBottom="$4.5" height="$8" width="$8" alignItems="center" justifyContent="center" borderRadius="$6" backgroundColor="$color3">
            <LockKeyhole size={24} />
          </XStack>
          <H1 fontSize="$6" fontWeight="500" color="$color" textAlign="center">
            Can’t open <SizableText fontFamily="$mono">{org}/{slug}</SizableText>
          </H1>
          <Paragraph alignSelf="center" marginTop="$2" fontSize="$3" lineHeight="1.625" color="$color11" textAlign="center">
            {wrongOrg ? (
              <>
                This project is in the <SizableText color="$color">{org}</SizableText> organization,
                but you’re signed in under <SizableText color="$color">{signedInOrg}</SizableText>.
                Its files and history are safe — sign in with an account in{" "}
                <SizableText color="$color">{org}</SizableText> to open it, with its full
                version history.
              </>
            ) : (
              <>
                This project isn’t available to your account. It may belong to another
                organization, or the link may be wrong. Its files and history are not lost —
                they’re scoped to the owning account.
              </>
            )}
          </Paragraph>
          <XStack marginTop="$5" alignItems="center" justifyContent="center" gap="$3">
            <Link
              href="/dashboard"
            ><SizableText borderRadius="$10" backgroundColor="$color12" paddingHorizontal="$4.5" paddingVertical="$2.5" fontSize="$3" fontWeight="500" color="$background" hoverStyle={{ backgroundColor: "$color12" }}>
              Go to your dashboard
            </SizableText></Link>
            <Link
              href="/login"
            ><SizableText borderRadius="$10" borderWidth={1} borderColor="$borderColor" paddingHorizontal="$4.5" paddingVertical="$2.5" fontSize="$3" color="$color11" hoverStyle={{ borderColor: "$color", color: "$color" }}>
              Switch account
            </SizableText></Link>
          </XStack>
        </YStack>
      </XStack>
    );
  }

  // An EXISTING project passes its identity + isNew=false so the editor never
  // auto-runs a stale composer seed (an open is never a build). Only a truly
  // record-less open (site-only edge case) falls back to new.
  return <AppEditor project={project ?? undefined} pages={pages ?? undefined} isNew={!project} />;
}
