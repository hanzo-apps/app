"use client";

import { Button } from '@hanzo/ui';
import { YStack, XStack, SizableText } from '@hanzo/ui';
// `GuiElement` is a TYPE, and @hanzo/ui's dts build drops a two-hop
// type-only re-export, so it is not on the barrel yet. A type is erased at
// build and cannot create a second runtime, so this does not reintroduce
// the two-copies problem the rest of this migration exists to prevent.
import type { GuiElement } from '@hanzo/gui';
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Check, ChevronDown, Copy, ThumbsDown, ThumbsUp } from "lucide-react";
import { useAnalytics } from "@hanzo/event/react";
import { EVENTS } from "@hanzo/event";
import { MarkdownRenderer } from "@/components/markdown-renderer";
import { fold, sheet } from "@/lib/chrome";
import { useThinking } from "@/lib/thinking";

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
  /** Reference images the user attached to this turn — echoed as thumbnails. */
  images?: string[];
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
      {/* Top-anchored ALWAYS. A lone message (the boot line) used to be
          vertically centered, which floated it over ~200px of dead air and
          read as a hero, not a transcript — the reference starts the
          conversation under the header from the first message on. */}
      <YStack gap="$2" paddingBottom="$2">
        {messages.map((m) =>
          m.role === "user" ? (
            <UserBubble key={m.id} text={m.text ?? ""} images={m.images} />
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

/**
 * What you asked for, as a pill.
 *
 * A tail (`borderBottomRightRadius: $1`) and a hairline made this a speech
 * BUBBLE — the shape a messaging app uses because two people are talking and
 * the tail says which one. Here only one side ever speaks in this shape, so the
 * tail pointed at nothing and the border drew a box around a sentence that
 * needs no box. Fully rounded, no border: the prompt reads as a thing you
 * placed, and the assistant's cards below it are the only rectangles in the
 * column, which is what makes them scannable.
 *
 * `borderRadius={999}` rather than a token: this is a pill, and a pill's radius
 * is not a rung on a ramp — it is "half my own height", whatever that turns out
 * to be. A `$` value would be a specific number that happens to look round at
 * one line and stops looking round at three.
 */
function UserBubble({ text, images }: { text: string; images?: string[] }) {
  return (
    <YStack alignItems="flex-end" gap="$1.5">
      {/* What the agent is READING, shown as what it is. The reference draws a
          "Read <file>" card with the image inline; here the images are the
          user's own attachments, so they belong on the user's turn — the same
          fact from the honest side. Real thumbnails, never a filename alone. */}
      {images && images.length > 0 && (
        <XStack flexWrap="wrap" justifyContent="flex-end" gap="$1.5" maxWidth="85%">
          {images.map((src) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={src}
              src={src}
              alt="Attached reference"
              style={{ width: 88, height: 66, objectFit: "cover", borderRadius: 8, border: "1px solid var(--border, rgba(255,255,255,0.08))" }}
  />
          ))}
        </XStack>
      )}
      {text ? (
        <XStack justifyContent="flex-end" width="100%">
          <YStack maxWidth="85%" borderRadius={999} backgroundColor="$color3" paddingHorizontal="$4" paddingVertical="$2">
            <SizableText whiteSpace="pre-wrap" fontSize="$2" lineHeight="1.45" color="$color">
              {text}
            </SizableText>
          </YStack>
        </XStack>
      ) : null}
    </YStack>
  );
}

function SystemLine({ text }: { text: string }) {
  return (
    <YStack paddingVertical="$0.5"><SizableText textAlign="center" fontSize="$1" color="$color11">{text}</SizableText></YStack>
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
          <SizableText fontSize="$2" color="$red8">
            {text || "Something went wrong — please try again."}
          </SizableText>
        </YStack>
      );
    }
    return (
      <XStack width="100%" justifyContent="flex-start" className="turn">
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
            <Thinking />
          )}
          {done && text ? <Feedback text={text} /> : null}
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
    <YStack width="100%" alignItems="flex-start" gap="$2" className="turn">
      {/* While planning with NOTHING to show yet, this is a compact shimmer
          line — not a full collapsible box for one word. A bulky "Designing…"
          card wrapping "Analyzing your request…" was dead space at the top of
          every build; the box appears only once there is a plan to collapse. */}
      {showPlanCard && (
        hasPlanBody ? (
          <CollapsibleSection title="Plan" defaultOpen={planning} live={planning}>
            <YStack maxHeight={220} overflow="scroll">
              <SizableText whiteSpace="pre-line" fontSize="$2" lineHeight="1.625" color="$color11">
                {plan}
              </SizableText>
            </YStack>
          </CollapsibleSection>
        ) : (
          <SizableText className="thread-shimmer-text" fontSize="$2">Designing…</SizableText>
        )
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
          {/* The settled summary is PROSE, at body weight. It rendered as a
              $1 $color11 footnote beside a check — the one part of the turn
              written for the person to READ was the most muted thing in the
              column, while the reference sets it as plain paragraphs under
              the card. The check survives only for a turn with no words. */}
          {text ? (
            <YStack width="100%">
              <MarkdownRenderer content={text} compact />
            </YStack>
          ) : (
            <XStack alignItems="center" gap="$1.5">
              <Check size={14} color="var(--brand-accent-muted)" />
              <SizableText fontSize="$1" color="$color11">Done</SizableText>
            </XStack>
          )}
          <Feedback text={text} />
        </>
      )}

      {error && (
        <YStack>
          <SizableText fontSize="$2" color="$red8">
            {text || "Something went wrong — please try again."}
          </SizableText>
        </YStack>
      )}
    </YStack>
  );
}

/**
 * The row under a settled assistant turn: copy it, judge it.
 *
 * Three controls and every one DOES something, which is the bar for putting it
 * on screen at all. Copy puts the turn's text on the clipboard. The thumbs are
 * product telemetry through the ONE client (`@hanzo/event` — the same stream
 * pageviews and errors ride), so "was this build any good" becomes a queryable
 * series instead of a feeling. A row of decorative icons that swallow clicks
 * would be worse than no row: it teaches that the quiet controls here do
 * nothing.
 *
 * One verdict per turn. Voting again reverses it rather than stacking events —
 * aria-pressed carries which way it stands.
 */
function Feedback({ text }: { text?: string }) {
  const analytics = useAnalytics();
  const [copied, setCopied] = useState(false);
  const [verdict, setVerdict] = useState<"up" | "down" | null>(null);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text ?? "");
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard can be refused (permissions, insecure context); the button
      // simply not confirming is the honest rendering of that.
    }
  };

  const judge = (next: "up" | "down") => {
    const settled = verdict === next ? null : next;
    setVerdict(settled);
    if (settled) {
      analytics.capture(EVENTS.FEATURE_USED, { feature: "builder_turn_feedback", verdict: settled });
    }
  };

  const dim = { color: "$color11", hoverStyle: { backgroundColor: "$color3", color: "$color" } } as const;

  return (
    <XStack alignItems="center" gap="$0.5" className="turn-feedback">
      <Button type="button" variant="ghost" size="icon-sm" borderRadius="$4" title={copied ? "Copied" : "Copy"} aria-label="Copy reply" onClick={copy} {...dim}>
        {copied ? <Check size={13} /> : <Copy size={13} />}
      </Button>
      <Button type="button" variant="ghost" size="icon-sm" borderRadius="$4" title="Good result" aria-label="Good result" aria-pressed={verdict === "up"} onClick={() => judge("up")} {...(verdict === "up" ? { color: "$color", backgroundColor: "$color3" } : dim)}>
        <ThumbsUp size={13} />
      </Button>
      <Button type="button" variant="ghost" size="icon-sm" borderRadius="$4" title="Bad result" aria-label="Bad result" aria-pressed={verdict === "down"} onClick={() => judge("down")} {...(verdict === "down" ? { color: "$color", backgroundColor: "$color3" } : dim)}>
        <ThumbsDown size={13} />
      </Button>
    </XStack>
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
  // A LIVE phase (Generating / Planning) is transient — it reads as an inline
  // activity log. A SETTLED one (Plan ▼ once written, Generated files ▼) is a
  // thing a reader may reopen, and it used to say so with a box: a hairline, a
  // fill and a radius round three lines of text, mid-column, so a transcript of
  // four turns was a stack of cards with the prose trapped inside them.
  //
  // It is a ROW now, and what marks it is the FOLD — a corner turned back, the
  // one mark that means this opens. That is the whole trade the paper system
  // makes: reach for the fold before the border, so the transcript stays a
  // column of sentences and only the thing that expands wears a mark.
  //
  // The fold needs a corner to turn, so the row takes rung 1 — a wash, not a
  // box. Live phases wear neither: nothing to open yet.
  //
  // And the mark is spent on the CLOSED state alone. Open, the sheet rises a
  // rung and the corner lies flat, because a fold on something already open is
  // an affordance describing what you just did.
  const boxed = !live;
  return (
    <YStack
      width="100%"
      {...(boxed
        ? { overflow: "hidden", borderRadius: "$6", ...sheet(open ? 2 : 1), ...(open ? null : fold) }
        : {})}
    >
      <Button
        type="button"
        onClick={() => setOpen((o) => !o)}
        width="100%" alignItems="center" justifyContent="space-between" paddingHorizontal="$3" paddingVertical="$2" hoverStyle={{ backgroundColor: "$color3" }}
      >
        <SizableText
          fontSize="$2" fontWeight="500" {...{ color: live ? undefined : "$color11" }} className="thread-shimmer-text"
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
      {open && (
        <YStack
          paddingHorizontal="$3" paddingVertical="$2"
          {...(boxed ? { borderTopWidth: 1, borderColor: "$borderColor" } : {})}
        >
          {children}
        </YStack>
      )}
    </YStack>
  );
}

// The wait before the first token, narrated. Its own component so the hook it
// owns is not a branch in the turn above — that turn renders this or the reply,
// never both, and a conditional hook is not a thing React allows.
function Thinking() {
  const line = useThinking();
  return (
    <SizableText fontSize="$2" className="thread-shimmer-text">
      {line}
    </SizableText>
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
              // 12/6 in PX — the console's live-dot geometry, stated. The
              // $-scale sized this ~2x (the $6=64 family of trap), and with
              // --brand-accent resolving to white the "pulsing dot" painted as
              // a fat white disc beside 12px text. A status dot is smaller
              // than the words it decorates.
              <XStack position="relative" width={12} height={12} flexShrink={0} alignItems="center" justifyContent="center">
                <SizableText position="absolute" width={12} height={12} borderRadius="$10" backgroundColor="var(--brand-accent)" opacity={0.25} />
                <SizableText position="relative" width={6} height={6} borderRadius="$10" backgroundColor="var(--brand-accent)" />
              </XStack>
            ) : (
              <Check size={12} />
            )}
            <SizableText fontSize="$1" {...{ color: active ? undefined : "$color11" }} className="thread-shimmer-text">
              {label}
            </SizableText>
          </XStack>
        );
      })}
    </YStack>
  );
}
