"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { AppEditor } from "@/components/editor";
import { DevOnboarding } from "@/components/dev-onboarding";
import { TemplateLoader } from "@/components/template-loader";
import { templates as localTemplates, generatePlanFromTemplate } from "@/lib/templates";

export default function DevPage() {
  const searchParams = useSearchParams();
  const [initialPrompt, setInitialPrompt] = useState("");
  const templateParam = searchParams.get("template") || "";
  const repoUrl = searchParams.get("repo") || templateParam || "";
  const action = searchParams.get("action") || "edit"; // edit or deploy

  // A "template" param that is a bare catalog id (no slash / not a URL) refers
  // to a built-in template in lib/templates.ts — resolve it locally instead of
  // trying to git-clone a (non-existent) GitHub repo.
  const localTemplate =
    templateParam && !templateParam.includes("/")
      ? localTemplates.find((t) => t.id === templateParam) || null
      : null;

  const [showOnboarding, setShowOnboarding] = useState(!repoUrl);

  // Load initialPrompt from localStorage on client-side only
  useEffect(() => {
    const prompt = searchParams.get("prompt") || localStorage.getItem("initialPrompt") || "";
    setInitialPrompt(prompt);
  }, [searchParams]);
  const [showTemplateLoader, setShowTemplateLoader] = useState(false);
  const [finalPrompt, setFinalPrompt] = useState("");
  const [generatedPlan, setGeneratedPlan] = useState("");
  const [repoData, setRepoData] = useState<any>(null);

  useEffect(() => {
    // Built-in catalog template (e.g. ?template=ai-chat-interface): seed the
    // builder from the local plan — no clone, no 404. The TemplateLoader shows
    // the edit/fork/deploy choice and handleTemplateAction wires the prompt.
    if (localTemplate) {
      const repoInfo = {
        platform: "hanzo",
        owner: "hanzo",
        name: localTemplate.id,
        title: localTemplate.name,
        plan: generatePlanFromTemplate(localTemplate).join("\n"),
        fullUrl: `/templates/${localTemplate.id}`,
      };
      setRepoData(repoInfo);
      setShowTemplateLoader(true);
      setShowOnboarding(false);
      (window as any).__templateRepo = repoInfo;
      return;
    }

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

      // If we have repo data, show the template loader
      if (repoInfo.name) {
        setShowTemplateLoader(true);
        setShowOnboarding(false);
        (window as any).__templateRepo = repoInfo;
      }
    }
  }, [repoUrl, action, localTemplate]);

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
    const label = repoData?.title || repoData?.name;
    let prompt = "";

    // Built-in catalog templates carry a generated build plan — scaffold the
    // app from it rather than referencing an external repo.
    if (repoData?.plan) {
      switch (mode) {
        case "edit":
        case "fork":
          prompt = `Build the "${label}" app and open it for editing.\n\n${repoData.plan}`;
          break;
        case "deploy":
          prompt = `Build the "${label}" app and deploy it to Hanzo Cloud with automatic SSL and a custom subdomain.\n\n${repoData.plan}`;
          break;
      }
      handleOnboardingComplete(prompt, repoData.plan);
      return;
    }

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

  // Pass the prompt to AppEditor
  return (
    <AppEditor
      isNew
    />
  );
}