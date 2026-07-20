"use client";

import { useEffect, useRef, useState } from "react";
import classNames from "classnames";
import { Check, ChevronDown, Loader2 } from "lucide-react";

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
    <div ref={scrollRef} className={classNames("overflow-y-auto px-3 pt-3", className)}>
      <div
        className={classNames("flex flex-col gap-3 pb-2", {
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
      <div className="max-w-[85%] whitespace-pre-wrap break-words rounded-2xl rounded-br-md bg-white/10 px-3.5 py-2 text-sm text-white">
        {text}
      </div>
    </div>
  );
}

function SystemLine({ text }: { text: string }) {
  return (
    <div className="py-0.5 text-center text-[11.5px] text-neutral-500">{text}</div>
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
        <div className="max-w-[92%] whitespace-pre-wrap break-words rounded-2xl rounded-bl-md border border-neutral-700 bg-neutral-800/40 px-3.5 py-2 text-sm text-neutral-200">
          {text ? (
            <>
              {text}
              {building && (
                <span className="ml-0.5 inline-block h-3.5 w-[2px] translate-y-0.5 animate-pulse bg-neutral-300 align-middle motion-reduce:animate-none" />
              )}
            </>
          ) : (
            <span className="thread-shimmer-text text-[13px]">Thinking…</span>
          )}
        </div>
      </div>
    );
  }

  // The plan card is expanded live while designing, then settles collapsed with
  // a click-to-expand affordance once the build takes over.
  const [userOpen, setUserOpen] = useState(false);
  const planOpen = planning || userOpen;
  const hasPlanBody = (plan?.trim().length ?? 0) > 0;
  const showPlanCard = plan !== undefined && (planning || hasPlanBody);

  return (
    <div className="flex w-full flex-col items-start gap-2">
      {showPlanCard && (
        <div className="w-full overflow-hidden rounded-xl border border-neutral-700 bg-neutral-800/40">
          <button
            type="button"
            onClick={() => setUserOpen((o) => !o)}
            className="flex w-full items-center justify-between px-3.5 py-2.5 text-left transition-colors hover:bg-white/[0.03]"
          >
            <span
              className={classNames(
                "text-[13px] font-medium",
                planning ? "thread-shimmer-text" : "text-neutral-300"
              )}
            >
              {planning ? "Designing…" : "Plan"}
            </span>
            <ChevronDown
              className={classNames(
                "size-3.5 text-neutral-500 transition-transform duration-200",
                planOpen && "rotate-180"
              )}
            />
          </button>
          {planOpen &&
            (hasPlanBody ? (
              <div className="max-h-[220px] overflow-y-auto border-t border-neutral-700/70 px-3.5 py-2.5 text-[12.5px] leading-relaxed text-neutral-400 whitespace-pre-line">
                {plan}
              </div>
            ) : planning ? (
              <div className="border-t border-neutral-700/70 px-3.5 py-2.5 text-[12.5px] text-neutral-500">
                Analyzing your request…
              </div>
            ) : null)}
        </div>
      )}

      {building && <ActivityList labels={activity ?? []} />}

      {done && (
        <div className="flex items-center gap-1.5 text-[12.5px] text-neutral-400">
          <Check className="size-3.5 text-emerald-400/80" />
          <span>{text || "Done"}</span>
        </div>
      )}

      {error && (
        <div className="text-[12.5px] text-red-400/90">
          {text || "Something went wrong — please try again."}
        </div>
      )}
    </div>
  );
}

function ActivityList({ labels }: { labels: string[] }) {
  const shown = labels.length ? labels : ["Working…"];
  return (
    <div className="w-full rounded-xl border border-neutral-700 bg-neutral-800/40 px-3.5 py-2.5">
      <ul className="flex flex-col gap-1.5">
        {shown.map((label, i) => {
          // The last line is the one currently in flight; earlier lines have
          // already streamed in and are marked settled.
          const active = i === shown.length - 1;
          return (
            <li key={`${i}-${label}`} className="flex items-center gap-2 text-[12.5px]">
              {active ? (
                <Loader2 className="size-3 shrink-0 animate-spin text-neutral-400" />
              ) : (
                <Check className="size-3 shrink-0 text-neutral-500" />
              )}
              <span className={active ? "thread-shimmer-text" : "text-neutral-500"}>
                {label}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
