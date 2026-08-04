"use client";

import { XStack, YStack, H1, Paragraph, H3, Image } from '@hanzo/gui';
import { useState, useEffect } from "react";
import {
  Sparkles,
  Zap,
  Github,
  Upload,
  FolderOpen,
  Brain,
  Palette,
  Database,
  Globe,
} from "lucide-react";
import { Button, Textarea, Card, Badge } from '@hanzo/ui';
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  type GalleryTemplate,
  snapshotCatalog,
  popularTemplates,
} from "@/lib/gallery-catalog";
import { repoImportLink } from "@/lib/api/git";
import { isGitUrl } from "@/lib/git/url";

// Fork a real template into the editor.
function forkHref(t: GalleryTemplate) {
  return `/dev?template=hanzo-apps/${t.slug}&action=edit`;
}

interface DevOnboardingProps {
  initialPrompt?: string;
  onComplete: (prompt: string, plan?: string) => void;
}

const features = [
  {
    title: "Instant Generation",
    description: "Streams as it builds",
    icon: <Zap size={16} />
  },
  {
    title: "400+ AI Models",
    description: "Latest LLMs available",
    icon: <Brain size={16} />
  },
  {
    title: "Real Data",
    description: "Hanzo Base, built in",
    icon: <Database size={16} />
  },
  {
    title: "Beautiful UIs",
    description: "Tailored & shadowui",
    icon: <Palette size={16} />
  }
];

export function DevOnboarding({ initialPrompt = "", onComplete }: DevOnboardingProps) {
  const [prompt, setPrompt] = useState(initialPrompt);
  const router = useRouter();

  // Real "popular" templates from the gallery catalog. Seed from the bundled
  // snapshot (instant, never empty) then refresh from the live catalog.
  const [popular, setPopular] = useState<GalleryTemplate[]>(
    () => popularTemplates(snapshotCatalog().templates, 6),
  );
  useEffect(() => {
    let alive = true;
    fetch("/v1/gallery")
      .then((r) => r.json())
      .then((d) => {
        if (alive && Array.isArray(d.templates) && d.templates.length) {
          setPopular(popularTemplates(d.templates, 6));
        }
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  // A prompt handed in from the landing composer or a fork goes STRAIGHT to the
  // real builder — no fake "planning" interstitial. AskAI reads
  // window.__initialPrompt on mount and streams the ACTUAL generation.
  useEffect(() => {
    if (initialPrompt) onComplete(initialPrompt);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialPrompt]);

  // Selecting a real template forks it into the editor (clone + customize),
  // rather than running the canned plan animation.
  const handleTemplateSelect = (template: GalleryTemplate) => {
    router.push(forkHref(template));
  };

  // Import a real repository: collect the URL, then hand it to the shared /dev
  // import wire (repoImportLink → parseGitUrl / TemplateLoader / hanzo matcher).
  // Only a real URL navigates — an empty or cancelled prompt is a no-op.
  const handleImportProject = (source: "github" | "hanzo") => {
    const url = window.prompt(
      source === "github"
        ? "Paste a public GitHub repository URL"
        : "Paste a Hanzo project URL",
    )?.trim();
    if (!url) return;
    if (source === "github" && !isGitUrl(url)) return;
    router.push(repoImportLink(url));
  };

    // `flex-1` and not `h-screen`: this renders inside AppShell, and a full
    // viewport height here would add the header's height to the page and push the
    // foot of the content off-screen.
    return (
      <XStack flex={1} backgroundColor="$background" justifyContent="center" alignItems="flex-start" paddingHorizontal="$5" paddingVertical="$10" overflow="scroll">
        <YStack maxWidth={1152} width="100%">
          <YStack marginBottom="$8">
            {/* Names the ACTION, not the company. Someone who clicked "build with
                app" has already chosen Hanzo — greeting them by brand answers a
                question they did not ask and hides the one they did. Each surface
                states its own verb: hanzo.app builds, hanzo.chat asks, the
                extension (which drives the browser) does. */}
            <H1 fontSize="$11" fontWeight="500" color="$color" marginBottom="$4" textAlign="center">
              Build anything
            </H1>
          </YStack>

          {/* Quick Start Options */}
          <YStack gap="$5" marginBottom="$6">
            <Card backgroundColor="$background" borderColor="$borderColor" padding="$5">
              <H3 fontSize="$6" fontWeight="500" color="$color" marginBottom="$4">
                Start with a prompt
              </H3>
              <Textarea
                placeholder="Describe what you want to build..."
                backgroundColor="$color3" borderColor="$borderColor" color="$color" marginBottom="$4" minHeight={100}
                value={prompt}
                onChangeText={(t) => setPrompt(t)}
  />
              <Button
                width="100%" gap="$2" backgroundColor="$color5" borderWidth={1} borderColor="$color6" hoverStyle={{ backgroundColor: "$color6" }}
                onClick={() => prompt && onComplete(prompt)}
                disabled={!prompt.trim()}
              >
                <Sparkles size={16} />
                Start Building
              </Button>
            </Card>

            <Card backgroundColor="$background" borderColor="$borderColor" padding="$5">
              <H3 fontSize="$6" fontWeight="500" color="$color" marginBottom="$4">
                Import existing project
              </H3>
              <YStack rowGap="$3">
                <Button
                  variant="outline"
                  width="100%" justifyContent="flex-start" gap="$2"
                  onClick={() => handleImportProject("github")}
                >
                  <Github size={16} />
                  Import from GitHub
                </Button>
                <Button
                  variant="outline"
                  width="100%" justifyContent="flex-start" gap="$2"
                  onClick={() => handleImportProject("hanzo")}
                >
                  <Upload size={16} />
                  Import from Hanzo
                </Button>
                <Button
                  variant="outline"
                  width="100%" justifyContent="flex-start" gap="$2"
                  onClick={() => router.push("/new")}
                >
                  <FolderOpen size={16} />
                  Upload project files
                </Button>
              </YStack>
            </Card>
          </YStack>

          {/* Popular templates — real gallery templates with real previews */}
          <YStack marginBottom="$6">
            <XStack alignItems="center" justifyContent="space-between" marginBottom="$4">
              <H3 fontSize="$6" fontWeight="500" color="$color">
                Start from a template
              </H3>
              <Link href="/gallery">
                <Button variant="ghost" size="sm" gap="$2">
                  <Globe size={16} />
                  Browse all
                </Button>
              </Link>
            </XStack>

            <YStack gap="$3">
              {popular.map((template) => (
                <Button
                  key={template.slug}
                  onClick={() => handleTemplateSelect(template)}
                  flexDirection="column" overflow="hidden" borderRadius="$5" borderWidth={1} borderColor="$borderColor" backgroundColor="$background" group className="zoom-scope" hoverStyle={{ borderColor: "$color", y: "-0.5" }}
                >
                  <YStack position="relative" backgroundColor="$background" overflow="hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <Image
                      src={template.screenshotUrl}
                      alt={`${template.displayName} preview`}
                      loading="lazy"
                      width="100%" height="100%" objectFit="cover" objectPosition="top" className="zoom-target"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).style.display = "none";
                      }}
  />
                    <YStack position="absolute" top="$1.5" right="$1.5">
                      <Badge variant="tags">{template.category}</Badge>
                    </YStack>
                  </YStack>
                  <YStack padding="$3">
                    <Paragraph color="$color" fontWeight="500" fontSize="$3" numberOfLines={1}>{template.displayName}</Paragraph>
                    <Paragraph color="$color11" fontSize="$1" marginTop="$0.5" numberOfLines={1}>
                      {template.description || template.framework}
                    </Paragraph>
                  </YStack>
                </Button>
              ))}
            </YStack>
          </YStack>

          {/* Features Grid */}
          <YStack gap="$4">
            {features.map((feature, i) => (
              <YStack key={i}>
                <XStack width="$8" height="$8" backgroundColor="$background" borderRadius="$5" alignItems="center" justifyContent="center" marginBottom="$2" alignSelf="center">
                  {feature.icon}
                </XStack>
                <Paragraph color="$color" fontSize="$3" fontWeight="500" textAlign="center">{feature.title}</Paragraph>
                <Paragraph color="$color11" fontSize="$1" textAlign="center">{feature.description}</Paragraph>
              </YStack>
            ))}
          </YStack>

          {/* Proof — real only: Techstars '17 backing + the real model count. */}
          <XStack justifyContent="center" gap="$6" marginTop="$6">
            <div>
              <Paragraph fontSize="$8" fontWeight="500" color="$color" textAlign="center">Techstars &apos;17</Paragraph>
              <Paragraph fontSize="$1" color="$color11" textAlign="center">backed</Paragraph>
            </div>
            <div>
              <Paragraph fontSize="$8" fontWeight="500" color="$color" textAlign="center">400+</Paragraph>
              <Paragraph fontSize="$1" color="$color11" textAlign="center">AI models</Paragraph>
            </div>
          </XStack>
        </YStack>
      </XStack>
    );
}