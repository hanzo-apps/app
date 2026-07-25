"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import classNames from "classnames";
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
  const scrollRef = useRef<HTMLDivElement>(null);

  // Smooth scroll-to-bottom on every new message OR streamed update. Scrolls
  // only this container (never the page) so the layout can't jump.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const reduce =
      typeof window !== "undefined" &&
      !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    el.scrollTo({ top: el.scrollHeight, behavior: reduce ? "auto" : "smooth" });
  }, [messages]);

  if (messages.length === 0) return null;

  return (
    <div ref={scrollRef} className={classNames("overflow-y-auto px-3 pt-2", className)}>
      <div
        className={classNames("flex flex-col gap-2 pb-2", {
          "min-h-full justify-center": messages.length <= 1,
        })}
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
      </div>
    </div>
  );
}

function UserBubble({ text }: { text: string }) {
  return (
    <div className="flex justify-end">
      <div className="max-w-[85%] whitespace-pre-wrap break-words rounded-lg rounded-br-sm bg-secondary px-3 py-1.5 text-[13px] text-foreground">
        {text}
      </div>
    </div>
  );
}

function SystemLine({ text }: { text: string }) {
  return (
    <div className="py-0.5 text-center text-[11.5px] text-muted-foreground">{text}</div>
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
        <div className="text-[12.5px] text-red-400/90">
          {text || "Something went wrong — please try again."}
        </div>
      );
    }
    return (
      <div className="flex w-full justify-start">
        <div className="max-w-[95%] break-words rounded-lg bg-muted/20 px-3 py-1.5 text-[13px] text-foreground">
          {text ? (
            <div className="flex flex-wrap items-end">
              {/* Render the assistant reply as formatted markdown (headings, lists,
                  bold/italic, hr, links, fenced code) in the tight monochrome
                  register — never raw "## …" / "**…**" text. */}
              <MarkdownRenderer content={text} compact />
              {building && (
                <span className="ml-0.5 inline-block h-3.5 w-[2px] translate-y-0.5 animate-pulse bg-foreground align-middle motion-reduce:animate-none" />
              )}
            </div>
          ) : (
            <span className="thread-shimmer-text text-[13px]">Thinking…</span>
          )}
        </div>
      </div>
    );
  }

  // Assistant build turn — collapsible sections (Plan ▼ / Generated files ▼), the
  // settled summary, or an error line. Reasoning collapses so the thread reads like
  // an IDE activity log, not a wall of text.
  const hasPlanBody = (plan?.trim().length ?? 0) > 0;
  const showPlanCard = plan !== undefined && (planning || hasPlanBody);
  const files = activity ?? [];

  return (
    <div className="flex w-full flex-col items-start gap-2">
      {showPlanCard && (
        <CollapsibleSection
          title={planning ? "Designing…" : "Plan"}
          defaultOpen={planning}
          live={planning}
        >
          {hasPlanBody ? (
            <div className="max-h-[220px] overflow-y-auto whitespace-pre-line text-[12.5px] leading-relaxed text-muted-foreground">
              {plan}
            </div>
          ) : (
            <div className="text-[12.5px] text-muted-foreground">Analyzing your request…</div>
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
          <div className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
            <Check className="size-3.5 text-[var(--brand-accent-muted)]" />
            <span>{text || "Done"}</span>
          </div>
        </>
      )}

      {error && (
        <div className="text-[12.5px] text-red-400/90">
          {text || "Something went wrong — please try again."}
        </div>
      )}
    </div>
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
    <div className="w-full overflow-hidden rounded-lg border border-border bg-muted/20">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between px-3 py-1.5 text-left transition-colors duration-150 hover:bg-accent"
      >
        <span
          className={classNames(
            "text-[13px] font-medium",
            live ? "thread-shimmer-text" : "text-muted-foreground"
          )}
        >
          {title}
          {typeof count === "number" && !live ? (
            <span className="text-muted-foreground/60"> · {count}</span>
          ) : null}
        </span>
        <ChevronDown
          className={classNames(
            "size-3.5 text-muted-foreground transition-transform duration-200",
            open && "rotate-180"
          )}
        />
      </button>
      {open && <div className="border-t border-border/70 px-3 py-2">{children}</div>}
    </div>
  );
}

function ActivityItems({ labels, settled = false }: { labels: string[]; settled?: boolean }) {
  const shown = labels.length ? labels : ["Working…"];
  return (
    <ul className="flex flex-col gap-1">
      {shown.map((label, i) => {
        // While live, the LAST line is in flight (a pulsing accent dot); once
        // settled every line is a ✓. Concise task states — never a spinner.
        const active = !settled && i === shown.length - 1;
        return (
          <li key={`${i}-${label}`} className="flex items-center gap-2 text-[12px]">
            {active ? (
              <span className="relative flex size-2 shrink-0 items-center justify-center">
                <span className="absolute inline-flex size-2 animate-ping rounded-full bg-[var(--brand-accent)] opacity-60 motion-reduce:animate-none" />
                <span className="relative inline-flex size-1.5 rounded-full bg-[var(--brand-accent)]" />
              </span>
            ) : (
              <Check className="size-3 shrink-0 text-muted-foreground" />
            )}
            <span className={active ? "thread-shimmer-text" : "text-muted-foreground"}>
              {label}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
