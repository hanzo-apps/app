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
import { useParams } from "next/navigation";
import { AppEditor } from "@/components/editor";
import { fetchProject, fetchProjectSite } from "@/lib/api/projects";
import { currentOrg, setCurrentOrg } from "@/lib/org-scope";
import type { Page } from "@/types";

export default function ProjectDevPage() {
  const params = useParams<{ org: string; project: string }>();
  const org = decodeURIComponent(params.org || "");
  const slug = decodeURIComponent(params.project || "");

  const [ready, setReady] = useState(false);
  const [pages, setPages] = useState<Page[] | null>(null);

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
      // Record (name) + deployed site (pages) in parallel; both are best-effort —
      // an unknown slug still opens the builder as a new project keyed by it.
      const [record, site] = await Promise.all([
        fetchProject(slug).catch(() => null),
        fetchProjectSite(slug).catch(() => ({ liveUrl: null, pages: [] })),
      ]);
      if (!alive) return;
      const name = record?.name || slug;
      (window as any).__projectName = name;
      if (site.pages.length > 0) {
        setPages(site.pages);
        (window as any).__assistantGreeting =
          `${name} is loaded — your live site is in the preview, and its history is in the clock icon up top. ` +
          `Tell me what to change and I'll build it.`;
      }
      setReady(true);
    })();

    return () => {
      alive = false;
    };
  }, [org, slug]);

  if (!ready) {
    return (
      <div className="h-[100dvh] bg-neutral-950 flex items-center justify-center text-neutral-400 text-sm">
        Opening {slug}…
      </div>
    );
  }

  return <AppEditor isNew pages={pages ?? undefined} />;
}
