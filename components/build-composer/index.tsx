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
import {
  ArrowUp,
  Mic,
  Hammer,
  ListTodo,
  ChevronDown,
  Database,
  Plus,
  Sparkles,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@hanzo/ui';
import { cn } from '@/lib/utils';
import { baseEnabled, setBaseEnabled } from '@/lib/base/flag';

export type ComposerMode = 'build' | 'plan';

const MODES: { value: ComposerMode; label: string; icon: React.ElementType; hint: string }[] = [
  { value: 'build', label: 'Build', icon: Hammer, hint: 'Generate and edit the app directly' },
  { value: 'plan', label: 'Plan', icon: ListTodo, hint: 'Draft a plan before writing code' },
];

/** Minimal shape of the Web Speech API we use (kept local — not in DOM libs). */
interface SpeechLike {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  start(): void;
  stop(): void;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
}

function speechCtor(): (new () => SpeechLike) | null {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as {
    SpeechRecognition?: new () => SpeechLike;
    webkitSpeechRecognition?: new () => SpeechLike;
  };
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

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
  /** Starter prompts rendered as pills under the bubble; clicking prefills. */
  starters?: string[];
  subline?: boolean;
}) {
  const router = useRouter();
  const [idea, setIdea] = useState('');
  const [mode, setMode] = useState<ComposerMode>('build');
  // Base backend: ON by default — every new app ships with a real data plane
  // unless the user opts out. Persisted so the builder + publish read the same value.
  const [withBase, setWithBase] = useState(true);
  const [focused, setFocused] = useState(false);
  const [listening, setListening] = useState(false);
  const [micSupported, setMicSupported] = useState(false);
  const recRef = useRef<SpeechLike | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setMicSupported(!!speechCtor());
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

  const submit = () => {
    const text = idea.trim();
    if (!text) return;
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

  const toggleDictation = () => {
    const Ctor = speechCtor();
    if (!Ctor) return;
    if (listening) {
      recRef.current?.stop();
      return;
    }
    const rec = new Ctor();
    rec.lang = 'en-US';
    rec.interimResults = true;
    rec.continuous = false;
    rec.onresult = (e) => {
      let transcript = '';
      for (let i = 0; i < e.results.length; i++) transcript += e.results[i][0].transcript;
      setIdea((prev) => (prev ? `${prev} ${transcript}`.replace(/\s+/g, ' ') : transcript));
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    recRef.current = rec;
    setListening(true);
    rec.start();
  };

  const CurrentMode = MODES.find((m) => m.value === mode) ?? MODES[0];

  return (
    <div className={cn('mx-auto w-full max-w-2xl', className)}>
      {greetingName && (
        <h1 className="mb-2 text-center text-3xl font-medium tracking-tight text-white text-balance sm:text-4xl">
          Ready to build, {greetingName}?
        </h1>
      )}

      {showPill && (
        <div className="mb-6 flex justify-center">
          <a
            href="https://cloud.hanzo.ai"
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs text-white/60 transition-colors hover:border-white/20 hover:text-white"
          >
            <span className="rounded-full bg-white/10 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-white/80">
              New
            </span>
            Hanzo apps now run in Hanzo Cloud
            <span className="transition-transform group-hover:translate-x-0.5">→</span>
          </a>
        </div>
      )}

      {/* The gradient bubble: padded gradient host + opaque inner panel. */}
      <div className="hz-composer rounded-2xl shadow-2xl">
        <div className="rounded-[14px] bg-[#0b0b0c]">
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
            className="w-full resize-none bg-transparent px-4 pb-2 pt-4 text-[15px] leading-relaxed text-white placeholder:text-white/30 focus:outline-none"
          />
          <div className="flex items-center justify-between gap-2 px-2.5 pb-2.5">
            <div className="flex items-center gap-1">
              {/* Build / Plan mode */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-2.5 py-1.5 text-xs text-white/70 transition-colors hover:border-white/20 hover:text-white"
                  >
                    <CurrentMode.icon className="h-3.5 w-3.5" />
                    {CurrentMode.label}
                    <ChevronDown className="h-3 w-3 text-white/40" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="start"
                  className="w-56 rounded-xl border border-white/10 bg-[#0e0e12] text-white shadow-2xl"
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
                      <span className="pl-6 text-xs text-white/45">{m.hint}</span>
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
                    ? 'border-white/25 bg-white/[0.07] text-white'
                    : 'border-white/10 text-white/40 hover:border-white/20 hover:text-white/70',
                )}
              >
                <Database className="h-3.5 w-3.5" />
                Base
              </button>

              <button
                type="button"
                aria-label="Attach"
                className="rounded-lg p-2 text-white/40 transition-colors hover:bg-white/5 hover:text-white/70"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>

            <div className="flex items-center gap-1">
              {micSupported && (
                <button
                  type="button"
                  onClick={toggleDictation}
                  aria-label={listening ? 'Stop dictation' : 'Dictate'}
                  aria-pressed={listening}
                  className={cn(
                    'rounded-lg p-2 transition-colors',
                    listening
                      ? 'bg-white/10 text-white'
                      : 'text-white/40 hover:bg-white/5 hover:text-white/70',
                  )}
                >
                  <Mic className={cn('h-4 w-4', listening && 'animate-pulse')} />
                </button>
              )}
              <button
                type="button"
                onClick={submit}
                disabled={!idea.trim()}
                aria-label="Start building"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-black transition-all hover:bg-white/90 disabled:cursor-not-allowed disabled:bg-white/20 disabled:text-white/40"
              >
                <ArrowUp className="h-4 w-4" strokeWidth={2.5} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Starter prompts — honest app types; clicking prefills the input. */}
      {!!starters?.length && (
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {starters.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => {
                setIdea(s);
                textareaRef.current?.focus();
              }}
              className="rounded-full border border-white/10 bg-white/[0.02] px-3.5 py-1.5 text-xs text-white/60 transition-all hover:border-white/20 hover:text-white"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Subtle honest sub-line — no fabricated claims. */}
      {subline && (
        <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-xs text-white/55">
          <Sparkles className="h-3 w-3 hidden sm:inline-block" />
          UI, database, auth, and 400+ AI models — wired in and deployed to Hanzo Cloud.
        </p>
      )}
    </div>
  );
}

export default BuildComposer;
