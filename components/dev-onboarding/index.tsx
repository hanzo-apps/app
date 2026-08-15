"use client";

import { XStack, YStack, H1, Paragraph, H3 } from '@hanzo/ui';
import { useState, useEffect } from "react";
import {
  Zap,
  Github,
  GitBranch,
  FolderOpen,
  Brain,
  Palette,
  Database,
  Globe,
} from "lucide-react";
import { Button, Card, Badge } from '@hanzo/ui';
import { BuildComposer } from '@/components/build-composer';
import { TemplateThumb } from '@/components/template-thumb';
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

/** The two hosts this screen offers by name. Every other remote still imports —
 *  `isGitUrl` recognises any git host — these are just the two worth a row. */
const LABEL = { github: "GitHub", gitlab: "GitLab" } as const;

interface DevOnboardingProps {
  initialPrompt?: string;
  onComplete: (prompt: string, plan?: string) => void;
}

const features = [
  {
    title: "Writes as you watch",
    description: "Files appear as they are written",
    icon: <Zap size={16} />
  },
  {
    title: "Zen and Enso",
    description: "Plus Anthropic, OpenAI, Google and Mistral",
    icon: <Brain size={16} />
  },
  {
    title: "A real database",
    description: "Hanzo Base, in every app",
    icon: <Database size={16} />
  },
  {
    title: "Screens, not wireframes",
    description: "Laid out and styled from the start",
    icon: <Palette size={16} />
  }
];

export function DevOnboarding({ initialPrompt = "", onComplete }: DevOnboardingProps) {
  // No local draft: BuildComposer owns the text it is holding.
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
  const handleImportProject = (source: "github" | "gitlab") => {
    const url = window.prompt(`Paste a public ${LABEL[source]} repository URL`)?.trim();
    if (!url || !isGitUrl(url)) return;
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
              Describe an app and it gets built
            </H1>
          </YStack>

          {/* Quick Start Options */}
          <YStack gap="$5" marginBottom="$6">
            {/* THE COMPOSER, and it is the one the landing and the dashboard
                already use. This card used to be a Textarea and a "Start
                building" button — a form, on the screen whose whole subject is a
                conversation, and the sixth hand-rolled Enter handler in a repo
                that documents the cost of the other five: none of them checked
                `isComposing`, so an open IME candidate submitted the turn
                instead of accepting the word. `BuildComposer` carries `sends()`
                from @hanzo/ui/chat, the model picker, attachments and the
                build/plan modes, so this screen gains all of them by asking for
                the component rather than by growing a second one. */}
            <BuildComposer
              showPill={false}
              subline={false}
              autoFocus
              onSubmit={(text) => text.trim() && onComplete(text)}
            />

            <Card backgroundColor="$background" borderColor="$borderColor" padding="$5">
              <H3 fontSize="$6" fontWeight="500" color="$color" marginBottom="$4">
                Or start from code you have
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
                {/* GitLab, which was missing while the wire behind it already
                    worked: `repoImportLink` takes any git remote and
                    `parseGitUrl` already names gitlab as a provider, so the only
                    thing absent was the row offering it.

                    "Import from Hanzo" is gone rather than joined by it. A
                    project on git.hanzo.ai is already IN the projects list —
                    offering to import what you already have is a door onto the
                    room you are standing in, and the prompt behind it asked for
                    a URL nobody would have to type. */}
                <Button
                  variant="outline"
                  width="100%" justifyContent="flex-start" gap="$2"
                  onClick={() => handleImportProject("gitlab")}
                >
                  <GitBranch size={16} />
                  Import from GitLab
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
              <Link href="/templates">
                <Button variant="ghost" size="sm" gap="$2">
                  <Globe size={16} />
                  Browse all
                </Button>
              </Link>
            </XStack>

            {/* CARDS, not controls, in a real grid. @hanzo/ui's Button pins its
                size variant's height over anything the caller passes, so each of
                these rendered as a full-width ~40px band with the shot cover-
                cropped to a sliver. A clickable stack sizes from its content and
                the aspect wrapper gives every shot the same 16:10 frame at any
                column width — the exact shape /templates' ResourceCard uses. */}
            <div className="card-grid">
              {popular.map((template) => (
                <YStack
                  key={template.slug}
                  role="button"
                  tabIndex={0}
                  aria-label={`Use the ${template.displayName} template`}
                  onClick={() => handleTemplateSelect(template)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleTemplateSelect(template);
                    }
                  }}
                  cursor="pointer" flexDirection="column" overflow="hidden" borderRadius="$5" borderWidth={1} borderColor="$borderColor" backgroundColor="$background" group className="zoom-scope" hoverStyle={{ borderColor: "$color", y: "$-0.5" }}
                >
                  <YStack position="relative" overflow="hidden" aspectRatio={16 / 10} backgroundColor="$background">
                    {/* `TemplateThumb`, which is the ONE component that answers
                        "what does this template look like". This card asked a
                        host we do not own instead — `template.screenshotUrl` —
                        and then hid the failure: `onError` set display:none, so
                        a broken image became a silent blank rectangle that reads
                        as a dark design rather than a defect. Measured on
                        /templates before it was converted: 0 of 66 loaded.
                        /dev was simply never converted with it.

                        The thumb is self-hosted first (`/templates/<slug>.webp`)
                        and falls through to the drawn `TemplateSchematic`, so
                        the tile is always a picture of an app and never a hole. */}
                    <TemplateThumb
                      slug={template.slug}
                      name={template.displayName}
                      category={template.category}
                      className="zoom-target"
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
                </YStack>
              ))}
            </div>
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

          {/* Proof — real only: Techstars '17 backing + the models Hanzo builds
              itself. The second tile used to read "400+ / AI models"; a count
              that has to be re-verified every quarter is a worse fact than the
              names, and the landing dropped it for the same reason. */}
          <XStack justifyContent="center" gap="$6" marginTop="$6">
            <div>
              <Paragraph fontSize="$8" fontWeight="500" color="$color" textAlign="center">Techstars &apos;17</Paragraph>
              <Paragraph fontSize="$1" color="$color11" textAlign="center">backed</Paragraph>
            </div>
            <div>
              <Paragraph fontSize="$8" fontWeight="500" color="$color" textAlign="center">Zen &amp; Enso</Paragraph>
              <Paragraph fontSize="$1" color="$color11" textAlign="center">our own models</Paragraph>
            </div>
          </XStack>
        </YStack>
      </XStack>
    );
}