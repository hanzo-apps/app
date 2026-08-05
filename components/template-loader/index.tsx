"use client";

import { XStack, SizableText, YStack, Image, H1, Paragraph, Anchor, H3, H4 } from '@hanzo/gui';
import { glass } from "@/lib/chrome";
import { useState, useEffect } from "react";
import { Button, Label, Textarea } from '@hanzo/ui';
import {
  Sparkles,
  Code,
  Copy,
  Github,
  Rocket,
  ArrowRight,
  Check,
  type LucideIcon,
} from "lucide-react";
import { resolveTemplateSeedMeta, type TemplateSeedMeta } from "@/lib/api/templates";
import { Spinner } from "@/components/ui/spinner";

type StartMode = "fork" | "edit" | "deploy";

const START_OPTIONS: { mode: StartMode; icon: LucideIcon; title: string; desc: string }[] = [
  { mode: "edit", icon: Code, title: "Edit in Hanzo", desc: "Opens in the editor — the app runs live in the preview beside your code, with the AI assistant on hand." },
  { mode: "fork", icon: Copy, title: "Fork to your account", desc: "Your own copy as a fresh repository — customize it, keep version control, and deploy independently." },
  { mode: "deploy", icon: Rocket, title: "Deploy to Hanzo Cloud", desc: "Ship it live in seconds — a public URL with automatic SSL on Hanzo Cloud." },
];

interface TemplateLoaderProps {
  templateRepo: {
    platform: string;
    owner: string;
    name: string;
    fullUrl: string;
    host?: string;
  };
  action: "edit" | "deploy";
  onProceed: (mode: StartMode, firstMessage?: string) => void;
}

/** Friendly provenance label for the repo source (any host, not just GitHub). */
function sourceLabel(platform: string, host?: string): string {
  switch (platform) {
    case "github":
      return "GitHub";
    case "gitlab":
      return "GitLab";
    case "bitbucket":
      return "Bitbucket";
    case "gallery":
      return "Hanzo Gallery";
    default:
      return host || "Git";
  }
}

export function TemplateLoader({ templateRepo, action, onProceed }: TemplateLoaderProps) {
  const [loading, setLoading] = useState(false);
  const [selectedMode, setSelectedMode] = useState<"fork" | "edit" | "deploy">(
    action === "deploy" ? "deploy" : "edit"
  );

  // Real template metadata (preview screenshot + fields) for this slug, resolved
  // from WHICHEVER gallery catalog knows it (the same resolver the seed prompt
  // uses) — so the preview + title are correct no matter which surface linked in.
  const [meta, setMeta] = useState<TemplateSeedMeta | null>(null);
  useEffect(() => {
    let alive = true;
    resolveTemplateSeedMeta(templateRepo.name)
      .then((m) => {
        if (alive && m) setMeta(m);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [templateRepo.name]);

  const templateTitle =
    meta?.displayName ||
    templateRepo.name
      .replace(/-/g, " ")
      .replace(/\b\w/g, (l) => l.toUpperCase())
      .replace("Template ", "");

  // Honest one-line description from the template's real fields; a git-import
  // (no catalog match) falls back to its source provenance.
  const templateDescription =
    meta?.description ||
    meta?.useCase ||
    [meta?.framework, meta?.category].filter(Boolean).join(" · ") ||
    `From ${sourceLabel(templateRepo.platform, templateRepo.host)}: ${templateRepo.owner}/${templateRepo.name}`;

  // Optional first message — the change the user wants built ON TOP of the ready
  // template. Empty = load the template as-is and show its preview immediately.
  const [firstMessage, setFirstMessage] = useState("");

  const handleProceed = () => {
    setLoading(true);
    onProceed(selectedMode, firstMessage.trim() || undefined);
  };

  return (
    <XStack minHeight="100dvh" backgroundColor="$background" alignItems="center" justifyContent="center" padding="$4" $lg={{ padding: "$5" }}>
      <YStack {...glass(3)} width="100%" maxWidth={1024} overflow="hidden" borderRadius="$8" borderWidth={1} $lg={{ maxHeight: "calc(100dvh-3rem)" }}>
        {/* LEFT — template identity + live preview thumbnail. */}
        <YStack borderBottomWidth={1} borderColor="$borderColor" padding="$5" $lg={{ borderBottomWidth: 0, borderRightWidth: 1, padding: "$6" }}>
          <XStack marginBottom="$4" width="max-content" alignItems="center" gap="$2" borderRadius="$10" borderWidth={1} borderColor="$borderColor" backgroundColor="$color3" paddingHorizontal="$3" paddingVertical="$1">
            <SizableText fontFamily="$mono" fontSize={10} color="$color11">Start from this template</SizableText>
          </XStack>
          {meta?.screenshotUrl ? (
            <YStack marginBottom="$4.5" width="100%" aspectRatio={16 / 10} overflow="hidden" borderRadius="$6" borderWidth={1} borderColor="$borderColor" backgroundColor="$color3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <Image
                src={meta.screenshotUrl}
                alt={`${templateTitle} preview`}
                height="100%" width="100%" objectFit="cover" objectPosition="top"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.display = "none";
                }}
  />
            </YStack>
          ) : (
            <XStack marginBottom="$4.5" height="$10" width="$10" alignItems="center" justifyContent="center" borderRadius="$6" borderWidth={1} borderColor="$borderColor" backgroundColor="$color3">
              <Sparkles size={32} />
            </XStack>
          )}
          <H1 fontSize="$10" fontWeight="500" letterSpacing={-0.4}>{templateTitle}</H1>
          <Paragraph marginTop="$2" fontSize={15} lineHeight="1.625" color="$color11">{templateDescription}</Paragraph>
          <Paragraph marginTop="$3" fontSize="$3" lineHeight="1.625" color="$color11">
            A polished, production-quality starting point — edit it live in the
            preview panel, fork it to your account, or ship straight to Hanzo Cloud.
          </Paragraph>
          <YStack marginTop="auto" paddingTop="$5">
            <Anchor display="inline-flex"
              href={templateRepo.fullUrl}
              target="_blank"
              rel="noopener noreferrer"
              alignItems="center" gap="$1.5" fontSize="$3" color="$color11" hoverStyle={{ color: "$color" }}
            >
              <Github size={16} />
              View source
            </Anchor>
          </YStack>
        </YStack>

        {/* RIGHT — how to start + first message. The chat input and primary CTA
            are pinned (shrink-0) so they stay visible without scrolling; only the
            option list scrolls if the viewport is short. */}
        <YStack minHeight={0} padding="$5" $lg={{ maxHeight: "calc(100dvh-3rem)", padding: "$6" }}>
          <H3 marginBottom="$2.5" flexShrink={0} fontSize="$1" fontWeight="500" color="$color11">
            Choose how to start
          </H3>
          <YStack minHeight={0} flex={1} rowGap="$2" paddingRight="$1" overflow="scroll">
            {START_OPTIONS.map((opt) => {
              const active = selectedMode === opt.mode;
              return (
                <Button
                  key={opt.mode}
                  type="button"
                  onClick={() => setSelectedMode(opt.mode)}
                  aria-pressed={active}
                  group width="100%" alignItems="flex-start" gap="$3.5" borderRadius="$6" borderWidth={1} padding="$3.5" {...{ borderColor: active ? "$color" : "$borderColor", backgroundColor: active ? "$color3" : "$color005", hoverStyle: active ? undefined : {"borderColor":"$color06"} }}
                >
                  <XStack
                    height={36} width={36} flexShrink={0} alignItems="center" justifyContent="center" borderRadius="$5" borderWidth={1} {...(opt.mode === "deploy"
                      ? { borderColor: "$green7", backgroundColor: "$green3", color: "$green10" }
                      : active
                        ? { borderColor: "$color7", backgroundColor: "$color4", color: "$color" }
                        : { borderColor: "$borderColor", backgroundColor: "$color3", color: "$color" })}
                  >
                    <opt.icon size={16} />
                  </XStack>
                  <YStack minWidth={0} flex={1}>
                    <XStack alignItems="center" justifyContent="space-between" gap="$2">
                      <H4 fontSize="$3" fontWeight="500" color="$color">{opt.title}</H4>
                      <XStack
                        height="$4" width="$4" flexShrink={0} alignItems="center" justifyContent="center" borderRadius="$10" borderWidth={1} {...{ borderColor: active ? "$color12" : "$color06", backgroundColor: active ? "$color12" : undefined }}
                      >
                        {active && <SizableText color="$background" display="flex"><Check size={12} strokeWidth={3} /></SizableText>}
                      </XStack>
                    </XStack>
                    <Paragraph marginTop="$0.5" fontSize={13} lineHeight="1.375" color="$color11">{opt.desc}</Paragraph>
                  </YStack>
                </Button>
              );
            })}
          </YStack>

          {/* Optional first message — the change to build ON TOP of the ready
              template. Pinned below the option list, always in view. */}
          <YStack marginTop="$4.5" flexShrink={0}>
            <Label
              htmlFor="tpl-first-msg"
              marginBottom="$2" fontSize="$1" fontWeight="500" color="$color11"
            >
              What do you want to change?{" "}
              <SizableText textTransform="none" letterSpacing={0} color="$color11">(optional)</SizableText>
            </Label>
            <YStack borderRadius="$6" borderWidth={1} borderColor="$borderColor" backgroundColor="$color005" focusStyle={{ borderColor: "$color" }}>
              <Textarea
                id="tpl-first-msg"
                value={firstMessage}
                onChangeText={(t) => setFirstMessage(t)}
                onKeyDown={(e) => {
                  // Enter (without Shift) proceeds — a chat-like affordance.
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    if (!loading) handleProceed();
                  }
                }}
                rows={2}
                placeholder="e.g. rename the brand to Bean & Bloom and rewrite the hero copy…"
                className="resize-none"
                width="100%" backgroundColor="transparent" paddingHorizontal="$3.5" paddingVertical="$3" fontSize="$3" color="$color" placeholderTextColor="$color11" borderWidth={0} focusStyle={{ outlineWidth: 0 }}
  />
            </YStack>
            <Paragraph marginTop="$1.5" fontSize="$1" color="$color11">
              Leave blank to open the template as-is — it loads and previews instantly. Add a note and Hanzo builds it on top.
            </Paragraph>
          </YStack>

          {/* Actions — pinned. */}
          <XStack marginTop="$4.5" flexShrink={0} gap="$3">
            <Button
              variant="outline"
              onClick={() => window.history.back()}
              flex={1} borderColor="$borderColor" backgroundColor="transparent" hoverStyle={{ backgroundColor: "$color3" }}
              disabled={loading}
            >
              Back
            </Button>
            <Button
              onClick={handleProceed}
              flex={2}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Spinner size={16} />
                  Loading…
                </>
              ) : (
                <>
                  {selectedMode === "edit" && "Edit now"}
                  {selectedMode === "fork" && "Fork template"}
                  {selectedMode === "deploy" && "Deploy now"}
                  <ArrowRight size={16} />
                </>
              )}
            </Button>
          </XStack>
        </YStack>
      </YStack>
    </XStack>
  );
}