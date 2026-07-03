"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { AppEditor } from "@/components/editor";
import { DevOnboarding } from "@/components/dev-onboarding";
import { TemplateLoader } from "@/components/template-loader";

export default function DevPage() {
  const searchParams = useSearchParams();
  const [initialPrompt, setInitialPrompt] = useState("");
  const repoUrl = searchParams.get("repo") || searchParams.get("template") || "";
  const action = searchParams.get("action") || "edit"; // edit or deploy
  const seedPrompt = searchParams.get("prompt") || ""; // fork → builder seed
  // Stable deep-link into the builder for an existing org-scoped project
  // (console.hanzo.ai's "Edit in hanzo.app" links here). Opening a project by
  // slug skips onboarding and reuses the same shared record on re-publish.
  const projectSlug = searchParams.get("project") || "";

  // Onboarding shows only when we're not opening a repo/template fork AND not a
  // deep-linked existing project.
  const [showOnboarding, setShowOnboarding] = useState(!repoUrl && !projectSlug);
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
  const [showTemplateLoader, setShowTemplateLoader] = useState(false);
  const [finalPrompt, setFinalPrompt] = useState("");
  const [generatedPlan, setGeneratedPlan] = useState("");
  const [repoData, setRepoData] = useState<any>(null);

  useEffect(() => {
    if (repoUrl) {
      // Parse repo URL to extract info
      let repoInfo: any = {};

      // Handle different URL formats
      if (repoUrl.includes("github.com")) {
        // GitHub URL: https://github.com/owner/repo or https://github.com/hanzo-community/template-name
        const match = repoUrl.match(/github\.com\/([^\/]+)\/([^\/\?]+)/);
        if (match) {
          repoInfo = {
            platform: "github",
            owner: match[1],
            name: match[2],
            fullUrl: repoUrl
          };
        }
      } else if (repoUrl.includes("gallery.hanzo.ai")) {
        // Starter-kit gallery template: https://gallery.hanzo.ai/templates/<slug>
        // (checked BEFORE the hanzo.ai project branch — the gallery host also
        // contains the "hanzo.ai" substring.)
        const match = repoUrl.match(/gallery\.hanzo\.ai\/templates\/([^\/\?]+)/);
        if (match) {
          repoInfo = {
            platform: "gallery",
            owner: "hanzoai/gallery",
            name: match[1],
            fullUrl: repoUrl
          };
        }
      } else if (repoUrl.includes("hanzo.ai") || repoUrl.includes("hanzo.app")) {
        // Hanzo project URL: https://hanzo.ai/projects/owner/project-name
        const match = repoUrl.match(/hanzo\.(ai|app)\/projects\/([^\/]+)\/([^\/\?]+)/);
        if (match) {
          repoInfo = {
            platform: "hanzo",
            owner: match[2],
            name: match[3],
            fullUrl: repoUrl
          };
        }
      } else if (repoUrl.includes("/")) {
        // Simple owner/repo format
        const [owner, name] = repoUrl.split("/");
        repoInfo = {
          platform: "github",
          owner,
          name,
          fullUrl: `https://github.com/${owner}/${name}`
        };
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

  const handleTemplateAction = (mode: "fork" | "edit" | "deploy") => {
    let prompt = "";

    switch(mode) {
      case "edit":
        prompt = `Load and edit the ${repoData.name} template from ${repoData.platform}. Make it ready for customization.`;
        break;
      case "fork":
        prompt = `Fork the ${repoData.name} template and set it up as a new project with my own repository.`;
        break;
      case "deploy":
        prompt = `Deploy the ${repoData.name} template to Hanzo Cloud with automatic SSL and a custom subdomain.`;
        break;
    }

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

  // Pass the prompt to AppEditor
  return (
    <AppEditor
      isNew
    />
  );
}