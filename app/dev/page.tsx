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
      } else if (repoUrl.includes("huggingface.co")) {
        // HuggingFace URL: https://huggingface.co/spaces/Hanzo-Community/template-name
        const match = repoUrl.match(/huggingface\.co\/spaces\/([^\/]+)\/([^\/\?]+)/);
        if (match) {
          repoInfo = {
            platform: "huggingface",
            owner: match[1],
            name: match[2],
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
  }, [repoUrl, action]);

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

  // Store the prompt in localStorage for AppEditor to pick up
  useEffect(() => {
    if (finalPrompt) {
      localStorage.setItem("initialPrompt", finalPrompt);
    }
  }, [finalPrompt]);

  // Pass the prompt to AppEditor
  return (
    <AppEditor
      isNew
    />
  );
}