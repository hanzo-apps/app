'use client';

/**
 * BuildComposer — the ONE "Ask Hanzo to build…" composer.
 *
 * The dashboard hero's centerpiece and the single colorful flourish on an
 * otherwise monochrome surface: the input bubble wears a slow living gradient
 * (see `.hz-composer` in assets/globals.css — blue→violet→pink→warm, ~10s loop,
 * static under prefers-reduced-motion). Everything else stays restrained.
 *
 * Seed contract (PRESERVED — the builder reads these on /dev mount): submitting
 * stores `localStorage.initialPrompt` and pushes `/dev`. It additionally stores
 * `localStorage.initialMode` = the Build/Plan toggle ('build' | 'plan') so the
 * builder can start in that mode — the only new key. Callers that need a
 * different submit (e.g. the landing's anon-login bounce) pass `onSubmit`.
 */

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { EVENTS } from '@hanzo/event';
import { useAnalytics } from '@hanzo/event/react';
import { Voice, useVoice } from '@hanzo/voice';
import {
  ArrowUp,
  Mic,
  Hammer,
  ListTodo,
  ChevronDown,
  Database,
  Sparkles,
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/overlay';
import { cn } from '@/lib/utils';
import { baseEnabled, setBaseEnabled } from '@/lib/base/flag';

export type ComposerMode = 'build' | 'plan';

const MODES: { value: ComposerMode; label: string; icon: React.ElementType; hint: string }[] = [
  { value: 'build', label: 'Build', icon: Hammer, hint: 'Generate and edit the app directly' },
  { value: 'plan', label: 'Plan', icon: ListTodo, hint: 'Draft a plan before writing code' },
];

export function BuildComposer({
  greetingName,
  showPill = true,
  autoFocus = false,
  className,
  onSubmit,
  typewriter,
  starters,
  subline = true,
}: {
  greetingName?: string;
  showPill?: boolean;
  autoFocus?: boolean;
  className?: string;
  onSubmit?: (text: string, mode: ComposerMode) => void;
  /** Idle typewriter phrases completing "Ask Hanzo to build …" (landing hero). */
  typewriter?: string[];
  /** Starter prompts rendered as pills under the bubble; clicking submits. */
  starters?: string[];
  subline?: boolean;
}) {
  const router = useRouter();
  const analytics = useAnalytics();
  const [idea, setIdea] = useState('');
  const [mode, setMode] = useState<ComposerMode>('build');
  // Base backend: ON by default — every new app ships with a real data plane
  // unless the user opts out. Persisted so the builder + publish read the same value.
  const [withBase, setWithBase] = useState(true);
  const [focused, setFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setWithBase(baseEnabled());
  }, []);

  useEffect(() => {
    if (autoFocus) textareaRef.current?.focus();
  }, [autoFocus]);

  // Idle typewriter placeholder — pauses on focus/typing; static first phrase
  // under prefers-reduced-motion (mirrors the Reveal contract).
  const [typed, setTyped] = useState('');
  const idle = !!typewriter?.length && !focused && idea.length === 0;
  const phraseRef = useRef(0);
  const charRef = useRef(0);
  const delRef = useRef(false);
  useEffect(() => {
    if (!idle || !typewriter?.length) return;
    if (
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    ) {
      setTyped(typewriter[0]);
      return;
    }
    let t: ReturnType<typeof setTimeout>;
    const tick = () => {
      const phrase = typewriter[phraseRef.current % typewriter.length];
      if (!delRef.current) {
        charRef.current += 1;
        setTyped(phrase.slice(0, charRef.current));
        if (charRef.current >= phrase.length) {
          delRef.current = true;
          t = setTimeout(tick, 1800);
          return;
        }
        t = setTimeout(tick, 38);
      } else {
        charRef.current -= 1;
        setTyped(phrase.slice(0, Math.max(0, charRef.current)));
        if (charRef.current <= 0) {
          delRef.current = false;
          phraseRef.current += 1;
          t = setTimeout(tick, 320);
          return;
        }
        t = setTimeout(tick, 18);
      }
    };
    t = setTimeout(tick, 400);
    return () => clearTimeout(t);
  }, [idle, typewriter]);

  const placeholder = idle && typed
    ? `Ask Hanzo to build ${typed}█`
    : 'Ask Hanzo to build…';

  const toggleBase = () => {
    setWithBase((v) => {
      setBaseEnabled(!v);
      return !v;
    });
  };

  /**
   * The ONE submit. `raw` defaults to the composer's draft, so the send button
   * and Enter submit what was typed; a starter pill passes its own text (state
   * updates are async — the click cannot rely on `idea` having landed yet).
   */
  const submit = (raw: string = idea) => {
    const text = raw.trim();
    if (!text) return;
    // Top-of-funnel build INTENT — the landing composer fires this for logged-out
    // visitors too, and no app exists yet (that is `app_created`, at publish).
    // FUNNELS.appShip step 2. Enumerated props only; never the prompt text.
    analytics.capture(EVENTS.BUILD_STARTED, { mode, withBase });
    setBaseEnabled(withBase);
    if (onSubmit) {
      onSubmit(text, mode);
      return;
    }
    // Default seed pipeline (PRESERVED contract + the one new mode key).
    try {
      localStorage.setItem('initialPrompt', text);
      localStorage.setItem('initialMode', mode);
    } catch {
      // localStorage may be unavailable; /dev also accepts ?prompt= / ?mode=.
    }
    router.push('/dev');
  };

  // Say the idea instead of typing it. The same machine hanzo.chat and the
  // builder use — here there is no reply to read back, so the turn simply goes
  // through `submit`, exactly as the send button does.
  const kept = useRef<string | null>(null);
  const held = useRef(idea);
  held.current = idea;
  const join = (heard: string) => (kept.current ? `${kept.current} ${heard}` : heard);

  const voice = useVoice({
    onPartial: (heard) => {
      if (kept.current === null) kept.current = held.current.trim();
      setIdea(join(heard));
    },
    onUtterance: (said) => {
      const turn = join(said);
      kept.current = null;
      submit(turn);
    },
  });

  const CurrentMode = MODES.find((m) => m.value === mode) ?? MODES[0];

  return (
    <div className={cn('mx-auto w-full max-w-2xl', className)}>
      {greetingName && (
        <h1 className="mb-2 text-center text-3xl font-medium tracking-tight text-foreground text-balance sm:text-4xl">
          Ready to build, {greetingName}?
        </h1>
      )}

      {showPill && (
        <div className="mb-6 flex justify-center">
          <a
            href="https://cloud.hanzo.ai"
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex items-center gap-2 rounded-full border border-border bg-muted px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-border hover:text-foreground"
          >
            <span className="rounded-full bg-accent px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-foreground">
              New
            </span>
            Hanzo apps now run in Hanzo Cloud
            <span className="transition-transform group-hover:translate-x-0.5">→</span>
          </a>
        </div>
      )}

      {/* The gradient bubble: padded gradient host + opaque inner panel. */}
      <div className="hz-composer rounded-2xl shadow-2xl">
        <div className="rounded-[14px] bg-card">
          <textarea
            ref={textareaRef}
            value={idea}
            onChange={(e) => setIdea(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                submit();
              }
            }}
            rows={2}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder={placeholder}
            aria-label="Ask Hanzo to build"
            className="w-full resize-none bg-transparent px-4 pb-2 pt-4 text-[15px] leading-relaxed text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
          <div className="flex items-center justify-between gap-2 px-2.5 pb-2.5">
            <div className="flex items-center gap-1">
              {/* Build / Plan mode */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs text-foreground transition-colors hover:border-border hover:text-foreground"
                  >
                    <CurrentMode.icon className="h-3.5 w-3.5" />
                    {CurrentMode.label}
                    <ChevronDown className="h-3 w-3 text-muted-foreground" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="start"
                  className="w-56"
                >
                  {MODES.map((m) => (
                    <DropdownMenuItem
                      key={m.value}
                      onClick={() => setMode(m.value)}
                      className="flex-col items-start gap-0.5"
                    >
                      <span className="flex items-center gap-2 font-medium">
                        <m.icon className="h-4 w-4" />
                        {m.label}
                      </span>
                      <span className="pl-6 text-xs text-muted-foreground">{m.hint}</span>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Base backend toggle — spawn a Hanzo Base for this app. */}
              <button
                type="button"
                onClick={toggleBase}
                aria-pressed={withBase}
                title="Hanzo Base backend — database, auth, realtime for this app"
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs transition-colors',
                  withBase
                    ? 'border-border bg-accent text-foreground'
                    : 'border-border text-muted-foreground hover:border-border hover:text-foreground',
                )}
              >
                <Database className="h-3.5 w-3.5" />
                Base
              </button>

            </div>

            <div className="flex items-center gap-1">
              <Voice
                voice={voice}
                className={cn(
                  'rounded-lg p-2 text-muted-foreground transition-colors',
                  'hover:bg-muted hover:text-foreground disabled:opacity-40',
                  'data-[state=listening]:bg-accent data-[state=listening]:text-foreground',
                  '[&_svg]:h-4 [&_svg]:w-4',
                )}
              >
                {(state) => (
                  <Mic className={cn('h-4 w-4', state === 'listening' && 'animate-pulse')} />
                )}
              </Voice>
              <button
                type="button"
                onClick={() => submit()}
                disabled={!idea.trim()}
                aria-label="Start building"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground transition-all hover:bg-primary/90 disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground"
              >
                <ArrowUp className="h-4 w-4" strokeWidth={2.5} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Starter prompts — honest app types. Clicking one IS the intent, so it
          submits through the same `submit` the send button and Enter use; the
          draft is set too so it stays visible if submit bounces to login. */}
      {!!starters?.length && (
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {starters.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => {
                setIdea(s);
                submit(s);
              }}
              className="rounded-full border border-border bg-muted px-3.5 py-1.5 text-xs text-muted-foreground transition-all hover:border-border hover:text-foreground"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Subtle honest sub-line — no fabricated claims. */}
      {subline && (
        <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground">
          <Sparkles className="h-3 w-3 hidden sm:inline-block" />
          UI, database, auth, and 400+ AI models — wired in and deployed to Hanzo Cloud.
        </p>
      )}
    </div>
  );
}

export default BuildComposer;
