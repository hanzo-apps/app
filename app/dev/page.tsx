"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AppEditor } from "@/components/editor";
import { builderLink, fetchProject } from "@/lib/api/projects";
import { DevOnboarding } from "@/components/dev-onboarding";
import { TemplateLoader } from "@/components/template-loader";
import { parseGitUrl } from "@/lib/git/url";
import { readStagedProject, clearStagedProject } from "@/lib/import/staging";
import {
  resolveTemplateSeedMeta,
  buildTemplateSeedPrompt,
} from "@/lib/api/templates";
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

  // Onboarding shows ONLY for a truly bare `/dev` (no prompt, repo, project, or
  // import). A prompt from the dashboard/landing composer (`?prompt=…`) goes
  // STRAIGHT to the editor, which auto-generates and renders the page — no
  // canned "Development Plan" interstitial in between (that theater was the
  // "it stops on the chat prompt and never renders" bug).
  const [showOnboarding, setShowOnboarding] = useState(
    !repoUrl && !projectSlug && !isImport && !seedPrompt.trim(),
  );
  // Dropped-project import: null until the staged files are read (or found none).
  const [importedPages, setImportedPages] = useState<Page[] | null>(null);
  const [importDone, setImportDone] = useState(false);
  // Fork → builder auto-start: when the console's "Open in builder" deep-links
  // here with ?template=&prompt=&action=edit, hold the editor until the seed is
  // staged for AskAI (which reads window.__initialPrompt on mount) so the first
  // generation starts automatically — no manual TemplateLoader click.
  const [seedReady, setSeedReady] = useState(false);
  // Edit-mode template: the template's ready HTML, loaded into the editor so the
  // preview renders IMMEDIATELY (before/without any AI call). null until fetched.
  // Templates no longer preload page HTML (they generate their landing page);
  // kept for the imported-project path which passes pages through unchanged.
  const [templatePages] = useState<Page[] | null>(null);
  const [templateEditDone, setTemplateEditDone] = useState(false);

  // Load initialPrompt from localStorage on client-side only
  useEffect(() => {
    const prompt = searchParams.get("prompt") || localStorage.getItem("initialPrompt") || "";
    setInitialPrompt(prompt);
  }, [searchParams]);

  // Open an existing org-scoped project by slug. The query form is LEGACY: once
  // the record resolves (it carries the org) we canonicalize to the ONE nice URL
  // — /dev/<org>/<slug> — which loads the deployed site + history. Honest: if
  // the slug is unknown we still open the builder here (a new project keyed by
  // that slug), exactly as before.
  const router = useRouter();
  const [projectResolving, setProjectResolving] = useState(!!projectSlug);
  useEffect(() => {
    if (!projectSlug) return;
    let alive = true;
    (window as any).__projectSlug = projectSlug;
    setShowOnboarding(false);
    fetchProject(projectSlug)
      .then((p) => {
        if (!alive) return;
        if (p?.name) (window as any).__projectName = p.name;
        if (p?.org) {
          // Canonical nice URL — the org-scoped page takes over from the splash.
          router.replace(builderLink(p.slug || projectSlug, p.org));
          return;
        }
        setProjectResolving(false);
      })
      .catch(() => {
        if (alive) setProjectResolving(false);
      });
    return () => {
      alive = false;
    };
  }, [projectSlug, router]);

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
        // Persist the source repo so it rides through to publish as provenance —
        // this is what makes a deploy attributable to the OSS AUTHOR who owns the
        // repo (Hanzo OSS Author program → /v1/authors/deploys/record). Only real
        // git remotes (host set by parseGitUrl) carry an author; gallery/
        // hanzo-project sources do not.
        try {
          if (repoInfo.host && repoInfo.fullUrl) {
            localStorage.setItem("sourceRepo", repoInfo.fullUrl);
          }
        } catch {}
      }

      // Show the manual template loader ONLY when we did NOT arrive with a seed
      // prompt. With a seed (fork → builder) we auto-start below instead of
      // gating on a click, so the /new template deploy flow (no prompt) is
      // unchanged while the console "Open in builder" flow lands on a first
      // edition directly.
      if (repoInfo.name && !seedPrompt.trim()) {
        setShowOnboarding(false);
        // EDIT mode (ANY template — gallery / hanzo-apps / git) skips the chooser
        // and drops straight into the editor with the template loaded in the
        // preview + an assistant greeting — NO generation. Only fork/deploy use
        // the chooser. (Edit used to route non-gallery templates through the
        // chooser → a doomed "make no changes" generation → the red
        // "didn't return a usable page" error with an empty preview.)
        setShowTemplateLoader(action !== "edit");
      }
    }
  }, [repoUrl, action, seedPrompt]);

  // Edit-mode template: BUILD the template's ONE landing page. Gallery templates
  // are full running apps (Next.js, multi-page), NOT fetchable single-page HTML —
  // the old path loaded a dead SCREENSHOT (and non-gallery slugs fell back to a
  // directory-of-pages), neither of which is a usable, editable template. Instead
  // we resolve the template's design brief (category · use case · features) and
  // seed a REAL generation of the SINGLE primary landing page (the dashboard/home)
  // as editable HTML the user immediately builds on. A rich, concrete brief (never
  // a no-op) avoids the old "didn't return a usable page" failure. Applies to ANY
  // template edit; falls back to a slug-derived brief when the catalog is silent.
  useEffect(() => {
    if (seedPrompt.trim()) return; // a seeded fork already auto-generates
    if (action !== "edit" || !repoData?.name || templateEditDone) return;
    let alive = true;
    (async () => {
      const slug = repoData.name as string;
      let title = slug.replace(/[-/]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
      let brief = "";
      try {
        const meta = await resolveTemplateSeedMeta(slug);
        if (meta) {
          title = meta.displayName || title;
          const feats = meta.features?.length
            ? ` Include these areas: ${meta.features.join(", ")}.`
            : "";
          const use = meta.useCase ? ` It is used for: ${meta.useCase}.` : "";
          const desc = meta.description ? ` ${meta.description}` : "";
          const cat = meta.category || "modern";
          brief =
            `Build the primary landing page for "${title}" — a ${cat} app.${desc}${use}${feats} ` +
            `Design ONE polished, self-contained, fully responsive page (the main ${cat.toLowerCase()} view): ` +
            `real navigation, a hero/summary, KPI or content cards, charts or sections, and a footer. ` +
            `Production-quality, modern, dark-mode friendly, realistic placeholder content (no lorem).`;
        }
      } catch {
        /* fall through to the generic brief */
      }
      if (!brief) {
        brief =
          `Build the primary, self-contained, responsive landing page for "${title}" — one polished view ` +
          `with real navigation, a hero/summary, content cards or sections, and a footer. Modern, production-quality, dark-mode friendly.`;
      }
      if (!alive) return;
      // Leave templatePages null: AppEditor mounts BLANK (no screenshot) and
      // AskAI reads __initialPrompt on mount to auto-build the real landing page.
      (window as any).__projectName = title;
      (window as any).__initialPrompt = brief;
      try {
        localStorage.setItem("initialPrompt", brief);
      } catch {
        /* window.__initialPrompt is sufficient */
      }
      setTemplateEditDone(true); // lift the "Loading template…" splash → generate
    })();
    return () => {
      alive = false;
    };
  }, [repoData, action, seedPrompt, templateEditDone]);

  // Stage the fork → builder seed for the editor. The seed already carries the
  // template context (title/framework/description + the user's ask), so we hand
  // it straight to AskAI via window.__initialPrompt (+ localStorage as backup)
  // and flip seedReady so AppEditor mounts AFTER the global is set — AskAI's
  // mount effect then auto-starts callAiNewProject with no extra click.
  useEffect(() => {
    // Stage for ANY seed prompt — a bare `?prompt=` (dashboard/landing composer)
    // OR a repo/template fork. Both skip onboarding and auto-start generation.
    if (seedReady || !seedPrompt.trim()) return;
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

  const handleTemplateAction = async (
    mode: "fork" | "edit" | "deploy",
    firstMessage?: string,
  ) => {
    // A template is a READY starting point: it loads and previews immediately.
    // The seed frames the FIRST change the user wants built ON TOP (firstMessage
    // from the template screen's chat input) — never a "recreate from scratch".
    // The shared resolver checks BOTH gallery catalogs so /new (cloud slugs) and
    // /gallery (snapshot slugs) both seed correctly.
    const meta = await resolveTemplateSeedMeta(repoData.name);
    const prompt = buildTemplateSeedPrompt(meta, repoData.name, mode, firstMessage);
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

  // Legacy ?project= deep link: hold a splash while the record resolves so the
  // canonical /dev/<org>/<slug> page (site + history loaded) takes over without
  // an empty editor flashing first.
  if (projectSlug && projectResolving) {
    return (
      <div className="h-[100dvh] bg-neutral-950 flex items-center justify-center text-neutral-400 text-sm">
        Opening {projectSlug}…
      </div>
    );
  }

  // Fork → builder: while the seed is being staged, hold a brief splash so the
  // editor mounts only AFTER window.__initialPrompt is set — AskAI reads it on
  // mount to auto-start the first generation.
  if (seedPrompt.trim() && !seedReady) {
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

  // A template/repo URL is still resolving, OR a gallery edit whose preview HTML
  // is still being fetched — hold a splash so the empty editor never flashes
  // first, then mount it with the template already rendered in the preview.
  const resolvingTemplate =
    !!repoUrl &&
    !isImport &&
    !seedPrompt.trim() &&
    !showOnboarding &&
    !showTemplateLoader &&
    (!repoData ||
      (action === "edit" && !!repoData?.name && !templateEditDone));
  if (resolvingTemplate) {
    return (
      <div className="h-[100dvh] bg-neutral-950 flex items-center justify-center text-neutral-400 text-sm">
        Loading template…
      </div>
    );
  }

  // Pass the seeded template pages (or imported pages) to AppEditor.
  return (
    <AppEditor
      isNew
      pages={templatePages ?? importedPages ?? undefined}
    />
  );
}