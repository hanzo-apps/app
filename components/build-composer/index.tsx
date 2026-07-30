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

import { YStack, H1, XStack, Anchor, SizableText, Paragraph } from '@hanzo/gui';
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
  Plus,
  Sparkles,
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, Textarea, Button } from '@hanzo/ui';
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
    <YStack alignSelf="center" width="100%" maxWidth={672} className={`${className}`}>
      {greetingName && (
        <H1 marginBottom="$2" textAlign="center" fontSize="$10" fontWeight="500" letterSpacing={-0.4} color="$color" $sm={{ fontSize: "$11" }}>
          Ready to build, {greetingName}?
        </H1>
      )}

      {showPill && (
        <XStack marginBottom="$5" justifyContent="center">
          <Anchor
            href="https://cloud.hanzo.ai"
            target="_blank"
            rel="noopener noreferrer"
            group alignItems="center" gap="$2" borderRadius="$10" borderWidth={1} borderColor="$borderColor" backgroundColor="$color3" paddingHorizontal="$3" paddingVertical="$1.5" fontSize="$1" color="$color11" hoverStyle={{ borderColor: "$borderColor", color: "$color" }}
          >
            <SizableText borderRadius="$10" backgroundColor="$color3" paddingHorizontal="$1.5" paddingVertical="$0.5" fontSize={10} fontWeight="500" textTransform="uppercase" letterSpacing={0.4} color="$color">
              New
            </SizableText>
            Hanzo apps now run in Hanzo Cloud
            <SizableText $group-hover={{ x: "$0.5" }}>→</SizableText>
          </Anchor>
        </XStack>
      )}

      {/* The gradient bubble: padded gradient host + opaque inner panel. */}
      <YStack borderRadius="$8" elevation={6} className="hz-composer">
        <YStack borderRadius={14} backgroundColor="$background">
          <Textarea
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
            width="100%" resize="none" backgroundColor="transparent" paddingHorizontal="$4" paddingBottom="$2" paddingTop="$4" fontSize={15} lineHeight={1.625} color="$color" placeholderTextColor="$color11" focusStyle={{ outlineWidth: 0 }}
  />
          <XStack alignItems="center" justifyContent="space-between" gap="$2" paddingHorizontal="$2.5" paddingBottom="$2.5">
            <XStack alignItems="center" gap="$1">
              {/* Build / Plan mode */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    alignItems="center" gap="$1.5" borderRadius="$5" borderWidth={1} borderColor="$borderColor" paddingHorizontal="$2.5" paddingVertical="$1.5" fontSize="$1" color="$color" hoverStyle={{ borderColor: "$borderColor", color: "$color" }}
                  >
                    <CurrentMode.icon size={14} />
                    {CurrentMode.label}
                    <ChevronDown size={12} color="$color11" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="start"
                  width={224}
                >
                  {MODES.map((m) => (
                    <DropdownMenuItem
                      key={m.value}
                      onClick={() => setMode(m.value)}
                      flexDirection="column" alignItems="flex-start" gap="$0.5"
                    >
                      <SizableText alignItems="center" gap="$2" fontWeight="500">
                        <m.icon size={16} />
                        {m.label}
                      </SizableText>
                      <SizableText paddingLeft="$5" fontSize="$1" color="$color11">{m.hint}</SizableText>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Base backend toggle — spawn a Hanzo Base for this app. */}
              <Button
                type="button"
                onClick={toggleBase}
                aria-pressed={withBase}
                title="Hanzo Base backend — database, auth, realtime for this app"
                alignItems="center" gap="$1.5" borderRadius="$5" borderWidth={1} paddingHorizontal="$2.5" paddingVertical="$1.5" fontSize="$1" {...{ borderColor: withBase ? "$borderColor" : "$borderColor", backgroundColor: withBase ? "$color3" : undefined, color: withBase ? "$color" : "$color11", hoverStyle: withBase ? undefined : {"borderColor":"$borderColor","color":"$color"} }}
              >
                <Database size={14} />
                Base
              </Button>

              <Button
                type="button"
                aria-label="Attach"
                borderRadius="$5" padding="$2" color="$color11" hoverStyle={{ backgroundColor: "$color3", color: "$color" }}
              >
                <Plus size={16} />
              </Button>
            </XStack>

            <XStack alignItems="center" gap="$1">
              <Voice
                voice={voice}
                className="voice-control"
              >
                {(state) => (
                  <Mic size={16} />
                )}
              </Voice>
              <Button
                type="button"
                onClick={() => submit()}
                disabled={!idea.trim()}
                aria-label="Start building"
                height="$6" width="$6" alignItems="center" justifyContent="center" borderRadius="$10" backgroundColor="$color12" color="$background" hoverStyle={{ backgroundColor: "$color12" }} disabledStyle={{ cursor: "not-allowed", backgroundColor: "$color3", color: "$color11" }}
              >
                <ArrowUp size={16} strokeWidth={2.5} />
              </Button>
            </XStack>
          </XStack>
        </YStack>
      </YStack>

      {/* Starter prompts — honest app types. Clicking one IS the intent, so it
          submits through the same `submit` the send button and Enter use; the
          draft is set too so it stays visible if submit bounces to login. */}
      {!!starters?.length && (
        <XStack marginTop="$4" flexWrap="wrap" justifyContent="center" gap="$2">
          {starters.map((s) => (
            <Button
              key={s}
              type="button"
              onClick={() => {
                setIdea(s);
                submit(s);
              }}
              borderRadius="$10" borderWidth={1} borderColor="$borderColor" backgroundColor="$color3" paddingHorizontal="$3.5" paddingVertical="$1.5" fontSize="$1" color="$color11" hoverStyle={{ borderColor: "$borderColor", color: "$color" }}
            >
              {s}
            </Button>
          ))}
        </XStack>
      )}

      {/* Subtle honest sub-line — no fabricated claims. */}
      {subline && (
        <Paragraph marginTop="$3" alignItems="center" justifyContent="center" gap="$1.5" textAlign="center" fontSize="$1" color="$color11">
          <Sparkles size={12} />
          UI, database, auth, and 400+ AI models — wired in and deployed to Hanzo Cloud.
        </Paragraph>
      )}
    </YStack>
  );
}

export default BuildComposer;
