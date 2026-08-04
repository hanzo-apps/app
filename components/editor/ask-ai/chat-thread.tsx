"use client";

import { Button } from '@hanzo/ui';
import { YStack, XStack, SizableText, type GuiElement } from '@hanzo/gui';
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Check, ChevronDown } from "lucide-react";
import { MarkdownRenderer } from "@/components/markdown-renderer";

// ONE conversation turn as rendered in the builder chat thread. The thread is a
// pure VIEW concern (kept separate from `prompts`, which is AI context, and
// `htmlHistory`, which is the version timeline): AskAI owns the array and
// mutates the active assistant message as the single /v1/generate stream
// arrives — user bubble → plan (reasoning) → live build activity → summary.
export interface ThreadMessage {
  id: string;
  role: "user" | "assistant" | "system";
  /** "build" = plan→build turn; "chat" = Plan-mode conversational reply. */
  kind?: "build" | "chat";
  /** User text, the assistant's settled summary / error line, or (chat) reply. */
  text?: string;
  /** Assistant reasoning/plan, streamed from the model's <think> block. */
  plan?: string;
  /** Assistant live activity labels while building (one per file / edit). */
  activity?: string[];
  phase?: "planning" | "building" | "done" | "error";
}

/**
 * The builder chat thread. Renders above the composer and scrolls independently;
 * returns null when empty so the composer stays docked at the bottom exactly as
 * before any conversation starts.
 */
export function ChatThread({
  messages,
  className,
}: {
  messages: ThreadMessage[];
  className?: string;
}) {
  const scrollRef = useRef<GuiElement>(null);

  // Smooth scroll-to-bottom on every new message OR streamed update. Scrolls
  // only this container (never the page) so the layout can't jump.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el || !('scrollTo' in el)) return;
    const reduce =
      typeof window !== "undefined" &&
      !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    el.scrollTo({ top: el.scrollHeight, behavior: reduce ? "auto" : "smooth" });
  }, [messages]);

  if (messages.length === 0) return null;

  return (
    <YStack ref={scrollRef} minHeight={0} flex={1} paddingHorizontal="$3" paddingTop="$2" overflow="scroll" className={`${className}`}>
      <YStack
        gap="$2" paddingBottom="$2" {...{ minHeight: messages.length <= 1 ? "100%" : undefined, justifyContent: messages.length <= 1 ? "center" : undefined }}
      >
        {messages.map((m) =>
          m.role === "user" ? (
            <UserBubble key={m.id} text={m.text ?? ""} />
          ) : m.role === "system" ? (
            <SystemLine key={m.id} text={m.text ?? ""} />
          ) : (
            <AssistantMessage key={m.id} message={m} />
          )
        )}
      </YStack>
    </YStack>
  );
}

function UserBubble({ text }: { text: string }) {
  return (
    <XStack justifyContent="flex-end">
      <YStack maxWidth="85%" borderRadius="$5" borderBottomRightRadius="$1" borderWidth={1} borderColor="$borderColor" backgroundColor="$color3" paddingHorizontal="$3" paddingVertical="$1.5">
        <SizableText whiteSpace="pre-wrap" fontSize={13} color="$color">
          {text}
        </SizableText>
      </YStack>
    </XStack>
  );
}

function SystemLine({ text }: { text: string }) {
  return (
    <YStack paddingVertical="$0.5"><SizableText textAlign="center" fontSize={11.5} color="$color11">{text}</SizableText></YStack>
  );
}

function AssistantMessage({ message }: { message: ThreadMessage }) {
  const { plan, activity, phase, text, kind } = message;
  const planning = phase === "planning";
  const building = phase === "building";
  const done = phase === "done";
  const error = phase === "error";

  // Plan-mode conversational reply: a plain left-aligned assistant bubble whose
  // text streams in. No plan card / activity list.
  if (kind === "chat") {
    if (error) {
      return (
        <YStack>
          <SizableText fontSize={12.5} color="$red8">
            {text || "Something went wrong — please try again."}
          </SizableText>
        </YStack>
      );
    }
    return (
      <XStack width="100%" justifyContent="flex-start">
        <YStack maxWidth="95%" borderRadius="$5" paddingHorizontal="$3" paddingVertical="$1.5">
          {text ? (
            <XStack flexWrap="wrap" alignItems="flex-end">
              {/* Render the assistant reply as formatted markdown (headings, lists,
                  bold/italic, hr, links, fenced code) in the tight monochrome
                  register — never raw "## …" / "**…**" text. */}
              <MarkdownRenderer content={text} compact />
              {building && (
                <SizableText marginLeft="$0.5" height="$3.5" width={2} y="$0.5" backgroundColor="$color" verticalAlign="middle" />
              )}
            </XStack>
          ) : (
            <SizableText fontSize={13} className="thread-shimmer-text">Thinking…</SizableText>
          )}
        </YStack>
      </XStack>
    );
  }

  // Assistant build turn — collapsible sections (Plan ▼ / Generated files ▼), the
  // settled summary, or an error line. Reasoning collapses so the thread reads like
  // an IDE activity log, not a wall of text.
  const hasPlanBody = (plan?.trim().length ?? 0) > 0;
  const showPlanCard = plan !== undefined && (planning || hasPlanBody);
  const files = activity ?? [];

  return (
    <YStack width="100%" alignItems="flex-start" gap="$2">
      {showPlanCard && (
        <CollapsibleSection
          title={planning ? "Designing…" : "Plan"}
          defaultOpen={planning}
          live={planning}
        >
          {hasPlanBody ? (
            <YStack maxHeight={220} overflow="scroll">
              <SizableText whiteSpace="pre-line" fontSize={12.5} lineHeight="1.625" color="$color11">
                {plan}
              </SizableText>
            </YStack>
          ) : (
            <YStack><SizableText fontSize={12.5} color="$color11">Analyzing your request…</SizableText></YStack>
          )}
        </CollapsibleSection>
      )}

      {building && (
        <CollapsibleSection title="Generating" defaultOpen live>
          <ActivityItems labels={files} />
        </CollapsibleSection>
      )}

      {done && (
        <>
          {files.length > 0 && (
            <CollapsibleSection title="Generated files" count={files.length}>
              <ActivityItems labels={files} settled />
            </CollapsibleSection>
          )}
          <XStack alignItems="center" gap="$1.5">
            <Check size={14} color="var(--brand-accent-muted)" />
            <SizableText fontSize={12} color="$color11">{text || "Done"}</SizableText>
          </XStack>
        </>
      )}

      {error && (
        <YStack>
          <SizableText fontSize={12.5} color="$red8">
            {text || "Something went wrong — please try again."}
          </SizableText>
        </YStack>
      )}
    </YStack>
  );
}

/**
 * ONE collapsible section — the reusable Plan ▼ / Generated files ▼ / … disclosure.
 * `live` shimmers the title and hides the count while a phase streams; otherwise it
 * settles to a static header with an optional count. Reasoning + file lists collapse
 * so the thread stays scannable.
 */
function CollapsibleSection({
  title,
  count,
  defaultOpen = false,
  live = false,
  children,
}: {
  title: string;
  count?: number;
  defaultOpen?: boolean;
  live?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <YStack width="100%" overflow="hidden" borderRadius="$5" borderWidth={1} borderColor="$borderColor" backgroundColor="$color3">
      <Button
        type="button"
        onClick={() => setOpen((o) => !o)}
        width="100%" alignItems="center" justifyContent="space-between" paddingHorizontal="$3" paddingVertical="$1.5" hoverStyle={{ backgroundColor: "$color4" }}
      >
        <SizableText
          fontSize={13} fontWeight="500" {...{ color: live ? undefined : "$color11" }} className="thread-shimmer-text"
        >
          {title}
          {typeof count === "number" && !live ? (
            <SizableText color="$color11"> · {count}</SizableText>
          ) : null}
        </SizableText>
        <ChevronDown
          size={14}
  />
      </Button>
      {open && <YStack borderTopWidth={1} borderColor="$borderColor" paddingHorizontal="$3" paddingVertical="$2">{children}</YStack>}
    </YStack>
  );
}

function ActivityItems({ labels, settled = false }: { labels: string[]; settled?: boolean }) {
  const shown = labels.length ? labels : ["Working…"];
  return (
    <YStack gap="$1">
      {shown.map((label, i) => {
        // While live, the LAST line is in flight (a pulsing accent dot); once
        // settled every line is a ✓. Concise task states — never a spinner.
        const active = !settled && i === shown.length - 1;
        return (
          <XStack key={`${i}-${label}`} alignItems="center" gap="$2">
            {active ? (
              <XStack position="relative" width="$2" height="$2" flexShrink={0} alignItems="center" justifyContent="center">
                <SizableText position="absolute" width="$2" height="$2" borderRadius="$10" backgroundColor="var(--brand-accent)" opacity={0.6} />
                <SizableText position="relative" width="$1.5" height="$1.5" borderRadius="$10" backgroundColor="var(--brand-accent)" />
              </XStack>
            ) : (
              <Check size={12} />
            )}
            <SizableText fontSize={12} {...{ color: active ? undefined : "$color11" }} className="thread-shimmer-text">
              {label}
            </SizableText>
          </XStack>
        );
      })}
    </YStack>
  );
}
