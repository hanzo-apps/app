"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { AppEditor } from "@/components/editor";
import { DevOnboarding } from "@/components/dev-onboarding";
import { TemplateLoader } from "@/components/template-loader";
import { parseGitUrl } from "@/lib/git/url";
import { readStagedProject, clearStagedProject } from "@/lib/import/staging";
import { resolveTemplateSeedMeta, buildTemplateSeedPrompt } from "@/lib/api/templates";
import type { Page } from "@/types";

/** Order staged files so the editor opens on a page: index.html, other HTML, rest. */
function stagedRank(path: string): number {
  if (/(^|\/)index\.html?$/i.test(path)) return 0;
  if (/\.html?$/i.test(path)) return 1;
  return 2;
}

export default function DevPage() {
  const searchParams = useSearchParams();
  const repoUrl = searchParams.get("repo") || searchParams.get("template") || "";
  const action = searchParams.get("action") || "edit"; // edit or deploy
  const seedPrompt = searchParams.get("prompt") || ""; // fork → builder seed
  // Seed the onboarding prompt SYNCHRONOUSLY from ?prompt= on the very first
  // render. DevOnboarding locks its stage (welcome vs planning) from this value
  // in a once-only initializer, so a value that arrives later (via effect) would
  // never flip it to "planning" — the composer/chat handoff would dead-end at a
  // disabled "Start Building". Initializing here makes the auto-start reliable.
  const [initialPrompt, setInitialPrompt] = useState(seedPrompt);
  // Stable deep-link into the builder for an existing org-scoped project
  // (console.hanzo.ai's "Edit in hanzo.app" links here). Opening a project by
  // slug skips onboarding and reuses the same shared record on re-publish.
  const projectSlug = searchParams.get("project") || "";
  // Drag-and-drop import: /new stages the dropped project and routes here with
  // ?action=import. We load it into the editor as the project's files.
  const isImport = action === "import";

  // Onboarding shows only when we're not opening a repo/template fork, a
  // deep-linked existing project, or a drag-and-drop import.
  const [showOnboarding, setShowOnboarding] = useState(
    !repoUrl && !projectSlug && !isImport,
  );
  // Dropped-project import: null until the staged files are read (or found none).
  const [importedPages, setImportedPages] = useState<Page[] | null>(null);
  const [importDone, setImportDone] = useState(false);
  // Fork → builder auto-start: when the console's "Open in builder" deep-links
  // here with ?template=&prompt=&action=edit, hold the editor until the seed is
  // staged for AskAI (which reads window.__initialPrompt on mount) so the first
  // generation starts automatically — no manual TemplateLoader click.
  const [seedReady, setSeedReady] = useState(false);

  // Load initialPrompt from localStorage on client-side only
  useEffect(() => {
    const prompt = searchParams.get("prompt") || localStorage.getItem("initialPrompt") || "";
    setInitialPrompt(prompt);
  }, [searchParams]);

  // Open an existing org-scoped project by slug: validate it exists in the
  // shared store, prefill its name, and stash the slug so a re-publish updates
  // the SAME record (not a new one). Honest: if the slug is unknown we still open
  // the builder (a new project keyed by that slug).
  useEffect(() => {
    if (!projectSlug) return;
    (window as any).__projectSlug = projectSlug;
    setShowOnboarding(false);
    fetch(`/v1/projects/${encodeURIComponent(projectSlug)}`, { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((p) => {
        if (p?.name) (window as any).__projectName = p.name;
      })
      .catch(() => {});
  }, [projectSlug]);

  // Load the staged drag-and-drop project (once) and seed the editor with its
  // files. Cleared after read so the import is one-shot; a missing/empty stage
  // falls through to an empty new project rather than dead-ending.
  useEffect(() => {
    if (!isImport || importDone) return;
    let alive = true;
    setShowOnboarding(false);
    // No AI auto-run for a file import: drop any stale seed the editor would
    // otherwise pick up on mount.
    try {
      localStorage.removeItem("initialPrompt");
    } catch {
      /* storage unavailable */
    }
    (async () => {
      const staged = await readStagedProject();
      if (!alive) return;
      if (staged?.files?.length) {
        const pages: Page[] = staged.files
          .map((f) => ({ path: f.path, html: f.text }))
          .sort((a, b) => stagedRank(a.path) - stagedRank(b.path));
        setImportedPages(pages);
        if (staged.name) (window as any).__projectName = staged.name;
      }
      await clearStagedProject();
      if (alive) setImportDone(true);
    })();
    return () => {
      alive = false;
    };
  }, [isImport, importDone]);
  const [showTemplateLoader, setShowTemplateLoader] = useState(false);
  const [finalPrompt, setFinalPrompt] = useState("");
  const [generatedPlan, setGeneratedPlan] = useState("");
  const [repoData, setRepoData] = useState<any>(null);

  useEffect(() => {
    if (repoUrl) {
      // Parse repo URL to extract info
      let repoInfo: any = {};

      // Handle different URL formats. Gallery + Hanzo-project deep-links are
      // matched by their exact hosts FIRST; everything else is parsed by the
      // shared git recognizer so ANY host (github, gitlab, git.sr.ht, a private
      // `.git`, …) flows through honestly — never silently rewritten to github.
      if (repoUrl.includes("gallery.hanzo.ai")) {
        // Starter-kit gallery template: https://gallery.hanzo.ai/templates/<slug>
        const match = repoUrl.match(/gallery\.hanzo\.ai\/templates\/([^\/\?]+)/);
        if (match) {
          repoInfo = {
            platform: "gallery",
            owner: "hanzoai/gallery",
            name: match[1],
            fullUrl: repoUrl,
          };
        }
      } else if (parseGitUrl(repoUrl)) {
        // Any git remote — github/gitlab/bitbucket/self-hosted/arbitrary.
        const g = parseGitUrl(repoUrl)!;
        repoInfo = {
          platform: g.provider === "other" ? "git" : g.provider,
          host: g.host,
          owner: g.owner,
          name: g.name,
          fullUrl: g.httpsUrl,
        };
      } else if (repoUrl.includes("hanzo.ai") || repoUrl.includes("hanzo.app")) {
        // Hanzo project URL: https://hanzo.ai/projects/owner/project-name
        const match = repoUrl.match(/hanzo\.(ai|app)\/projects\/([^\/]+)\/([^\/\?]+)/);
        if (match) {
          repoInfo = {
            platform: "hanzo",
            owner: match[2],
            name: match[3],
            fullUrl: repoUrl,
          };
        }
      }

      setRepoData(repoInfo);

      // Keep the template provenance for the deploy path.
      if (repoInfo.name) {
        (window as any).__templateRepo = repoInfo;
      }

      // Show the manual template loader ONLY when we did NOT arrive with a seed
      // prompt. With a seed (fork → builder) we auto-start below instead of
      // gating on a click, so the /new template deploy flow (no prompt) is
      // unchanged while the console "Open in builder" flow lands on a first
      // edition directly.
      if (repoInfo.name && !seedPrompt.trim()) {
        setShowTemplateLoader(true);
        setShowOnboarding(false);
      }
    }
  }, [repoUrl, action, seedPrompt]);

  // Stage the fork → builder seed for the editor. The seed already carries the
  // template context (title/framework/description + the user's ask), so we hand
  // it straight to AskAI via window.__initialPrompt (+ localStorage as backup)
  // and flip seedReady so AppEditor mounts AFTER the global is set — AskAI's
  // mount effect then auto-starts callAiNewProject with no extra click.
  useEffect(() => {
    if (seedReady || !repoUrl || !seedPrompt.trim()) return;
    setShowTemplateLoader(false);
    setShowOnboarding(false);
    (window as any).__initialPrompt = seedPrompt;
    try {
      localStorage.setItem("initialPrompt", seedPrompt);
    } catch {
      // localStorage may be unavailable; window.__initialPrompt is sufficient.
    }
    setSeedReady(true);
  }, [repoUrl, seedPrompt, seedReady]);

  const handleOnboardingComplete = (prompt: string, plan?: string) => {
    setFinalPrompt(prompt);
    setGeneratedPlan(plan || "");
    setShowOnboarding(false);
    setShowTemplateLoader(false);

    // Store prompt for AskAI component
    (window as any).__initialPrompt = prompt;
    (window as any).__generatedPlan = plan;
    if (repoData) {
      (window as any).__templateRepo = repoData;
    }
  };

  const handleTemplateAction = async (mode: "fork" | "edit" | "deploy") => {
    // Seed the builder from the template's REAL fields (name/category/features/
    // framework/useCase + the real preview screenshot as a visual reference) so
    // the editor recreates the actual template — not a generic stub. The shared
    // resolver checks BOTH gallery catalogs, so a card from /new (cloud slugs)
    // and a card from /gallery (snapshot slugs) both seed correctly — the prior
    // single-catalog lookup silently missed ~60% of /new's slugs.
    const meta = await resolveTemplateSeedMeta(repoData.name);
    const prompt = buildTemplateSeedPrompt(meta, repoData.name, mode);
    handleOnboardingComplete(prompt);
  };

  // Store the prompt in localStorage for AppEditor to pick up
  // This hook must be before any conditional returns to follow Rules of Hooks
  useEffect(() => {
    if (finalPrompt) {
      localStorage.setItem("initialPrompt", finalPrompt);
    }
  }, [finalPrompt]);

  if (showTemplateLoader && repoData) {
    return (
      <TemplateLoader
        templateRepo={repoData}
        action={action as "edit" | "deploy"}
        onProceed={handleTemplateAction}
      />
    );
  }

  if (showOnboarding) {
    return (
      <DevOnboarding
        initialPrompt={initialPrompt}
        onComplete={handleOnboardingComplete}
      />
    );
  }

  // Fork → builder: while the seed is being staged, hold a brief splash so the
  // editor mounts only AFTER window.__initialPrompt is set — AskAI reads it on
  // mount to auto-start the first generation.
  if (repoUrl && seedPrompt.trim() && !seedReady) {
    return (
      <div className="h-[100dvh] bg-neutral-950 flex items-center justify-center text-neutral-400 text-sm">
        Preparing your first edition…
      </div>
    );
  }

  // Drag-and-drop import: hold a splash until the staged files are read, then
  // mount the editor seeded with the imported project's files.
  if (isImport && !importDone) {
    return (
      <div className="h-[100dvh] bg-neutral-950 flex items-center justify-center text-neutral-400 text-sm">
        Importing your project…
      </div>
    );
  }

  // Pass the prompt (or imported pages) to AppEditor.
  return (
    <AppEditor
      isNew
      pages={importedPages ?? undefined}
    />
  );
}