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

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { LockKeyhole } from "lucide-react";
import { AppEditor } from "@/components/editor";
import { fetchProject, fetchProjectSite } from "@/lib/api/projects";
import { currentOrg, setCurrentOrg } from "@/lib/org-scope";
import type { Page } from "@/types";

type Phase = "loading" | "open" | "denied";

export default function ProjectDevPage() {
  const params = useParams<{ org: string; project: string }>();
  const org = decodeURIComponent(params.org || "");
  const slug = decodeURIComponent(params.project || "");

  const [phase, setPhase] = useState<Phase>("loading");
  const [pages, setPages] = useState<Page[] | null>(null);
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
      if (site.pages.length > 0) {
        setPages(site.pages);
        // Only promise the clock-icon history when a durable source backs it.
        // Working edits seed [] and VFS checkpoints are per-device, so on a
        // fresh/cross-device open the panel is empty UNLESS the project has a
        // git repo (its commits reconstruct the timeline). Otherwise omit the
        // clause rather than point at an empty panel.
        const hasHistory = !!record?.repo?.url;
        (window as any).__assistantGreeting = hasHistory
          ? `${name} is loaded — your live site is in the preview, and its history is in the clock icon up top. ` +
            `Tell me what to change and I'll build it.`
          : `${name} is loaded — your live site is in the preview. ` +
            `Tell me what to change and I'll build it.`;
      }
      setPhase("open");
    })();

    return () => {
      alive = false;
    };
  }, [org, slug]);

  if (phase === "loading") {
    return (
      <div className="h-[100dvh] bg-background flex items-center justify-center text-muted-foreground text-sm">
        Opening {slug}…
      </div>
    );
  }

  if (phase === "denied") {
    const wrongOrg = !!signedInOrg && !!org && signedInOrg !== org;
    return (
      <div className="flex h-[100dvh] items-center justify-center bg-background px-6 text-center">
        <div className="max-w-md">
          <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-muted">
            <LockKeyhole className="h-6 w-6 text-muted-foreground" />
          </div>
          <h1 className="text-lg font-medium text-foreground">
            Can’t open <span className="font-mono">{org}/{slug}</span>
          </h1>
          <p className="mx-auto mt-2 text-sm leading-relaxed text-muted-foreground">
            {wrongOrg ? (
              <>
                This project is in the <span className="text-foreground/80">{org}</span> organization,
                but you’re signed in under <span className="text-foreground/80">{signedInOrg}</span>.
                Its files and history are safe — sign in with an account in{" "}
                <span className="text-foreground/80">{org}</span> to open it, with its full
                version history.
              </>
            ) : (
              <>
                This project isn’t available to your account. It may belong to another
                organization, or the link may be wrong. Its files and history are not lost —
                they’re scoped to the owning account.
              </>
            )}
          </p>
          <div className="mt-6 flex items-center justify-center gap-3">
            <Link
              href="/dashboard"
              className="rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Go to your dashboard
            </Link>
            <Link
              href="/login"
              className="rounded-full border border-border px-5 py-2.5 text-sm text-muted-foreground transition-colors hover:border-foreground/40 hover:text-foreground"
            >
              Switch account
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <AppEditor isNew pages={pages ?? undefined} />;
}
