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

import { YStack, H1, XStack, SizableText, Paragraph } from '@hanzo/ui';
// `Anchor` is not on @hanzo/ui's barrel yet — the dts build drops it, the
// same way it drops the GuiElement type. Tracked; everything else in this
// file comes from @hanzo/ui.
import { Anchor } from '@hanzo/gui';
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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, Textarea, Button } from '@hanzo/ui';
import { sends } from '@hanzo/ui/chat';
import { baseEnabled, setBaseEnabled } from '@/lib/base/flag';
import { startNewBuild } from '@/lib/dev/workspace';

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

  /**
   * Grow to fit what has been typed.
   *
   * `rows={2}` sets the floor and the CSS `max-height` sets the ceiling; between
   * them the box tracks its own content, so a three-line idea is not read
   * through a two-line slot. The height is cleared before it is measured
   * because `scrollHeight` never shrinks below the height already set — without
   * that reset the field only ever grows, and deleting a line leaves a gap.
   *
   * It runs on `idea` rather than on a keystroke handler so that the suggestion
   * chips, which set the value directly, size the box too.
   */
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, [idea]);

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
      // A fresh prompt is a NEW project — drop the previous unsaved build's
      // minted repo id so this one does not commit into that one's history.
      startNewBuild();
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
    <YStack alignSelf="center" width="100%" maxWidth={608} className={`${className}`}>
      {greetingName && (
        <H1 marginBottom="$2" textAlign="center" fontSize="$10" fontWeight="500" letterSpacing={-0.4} color="$color" $sm={{ fontSize: "$11" }} lineHeight="1.1">
          Ready to build, {greetingName}?
        </H1>
      )}

      {showPill && (
        <XStack marginBottom="$5" justifyContent="center">
          {/* A text host (Anchor) cannot row-lay mixed children — it collapsed
              to its padding. The XStack is the pill; the bare <a> only carries
              the link (quiet by the global anchor reset). */}
          <a href="https://cloud.hanzo.ai" target="_blank" rel="noopener noreferrer">
            <XStack group alignItems="center" gap="$2" borderRadius="$10" borderWidth={1} borderColor="$borderColor" backgroundColor="$color005" paddingHorizontal="$3" paddingVertical="$1.5" hoverStyle={{ borderColor: "$color06" }}>
              <SizableText borderRadius="$10" backgroundColor="$color3" paddingHorizontal="$1.5" paddingVertical="$0.5" fontSize="$1" fontWeight="500" letterSpacing={0.4} color="$color">
                New
              </SizableText>
              <SizableText whiteSpace="nowrap" fontSize="$1" color="$color11" $group-hover={{ color: "$color" }}>
                Hanzo apps now run in Hanzo Cloud
              </SizableText>
              <SizableText color="$color11" $group-hover={{ x: "$0.5", color: "$color" }}>→</SizableText>
            </XStack>
          </a>
        </XStack>
      )}

      {/* The gradient bubble: padded gradient host + opaque inner panel.
          28 outside, 26.5 inside, because the host pads 1.5px and a nested
          radius is only flush when it is the parent's MINUS the padding. It was
          12 outside and 14 inside — the inner corner rounder than the corner
          containing it, so the gradient showed a fatter sliver at the corners
          than along the edges. Change the two together or the seam comes back. */}
      <YStack borderRadius={28} elevation={6} className="hz-composer">
        <YStack data-field-box borderRadius={26.5} backgroundColor="$background">
          <Textarea
            ref={textareaRef}
            value={idea}
            onChangeText={(t) => setIdea(t)}
            onKeyDown={(e: React.KeyboardEvent) => {
              if (sends(e.key, e.nativeEvent)) {
                e.preventDefault();
                submit();
              }
            }}
            rows={2}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder={placeholder}
            aria-label="Ask Hanzo to build"
            width="100%" backgroundColor="transparent" borderWidth={0} paddingHorizontal="$4" paddingBottom="$2" paddingTop="$4" fontSize={16} lineHeight="1.375" color="$color" placeholderTextColor="$color11" focusStyle={{ borderWidth: 0 }}
  />
          <XStack alignItems="center" justifyContent="space-between" gap="$2" paddingHorizontal="$2.5" paddingBottom="$2.5">
            <XStack alignItems="center" gap="$1">
              {/* Build / Plan mode */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    alignItems="center" gap="$1.5" borderRadius="$5" borderWidth={1} borderColor="$borderColor" backgroundColor="$color005" paddingHorizontal="$2.5" paddingVertical="$1.5" hoverStyle={{ borderColor: "$color06" }}
                  >
                    <XStack alignItems="center" gap="$1.5">
                      <CurrentMode.icon size={14} />
                      <SizableText fontSize="$1" color="$color">{CurrentMode.label}</SizableText>
                      <ChevronDown size={12} />
                    </XStack>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  width={224}
                >
                  {MODES.map((m) => (
                    <DropdownMenuItem
                      key={m.value}
                      onClick={() => setMode(m.value)}
                      flexDirection="column" alignItems="flex-start" gap="$0.5"
                    >
                      <XStack alignItems="center" gap="$2">
                        <m.icon size={16} />
                        <SizableText fontWeight="500">{m.label}</SizableText>
                      </XStack>
                      <SizableText paddingLeft="$5" fontSize="$1" color="$color11">{m.hint}</SizableText>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Base backend toggle — spawn a Hanzo Base for this app. Active
                  is said by the BORDER alone (white, monochrome) — a fill made
                  the chip read as a pressed gray slab. */}
              <Button
                type="button"
                variant="ghost"
                onClick={toggleBase}
                aria-pressed={withBase}
                title="Hanzo Base backend — database, auth, realtime for this app"
                group alignItems="center" gap="$1.5" borderRadius="$5" borderWidth={1} backgroundColor="$color005" {...{ borderColor: withBase ? "$color8" : "$borderColor" }} paddingHorizontal="$2.5" paddingVertical="$1.5" hoverStyle={{ borderColor: withBase ? "$color" : "$color06" }}
              >
                <XStack alignItems="center" gap="$1.5">
                  <Database size={14} />
                  <SizableText fontSize="$1" color={withBase ? "$color" : "$color11"} $group-hover={{ color: "$color" }}>Base</SizableText>
                </XStack>
              </Button>
            </XStack>

            <XStack alignItems="center" gap="$1">
              <Voice
                voice={voice}
                className="voice-control"
              >
                {(state) => (
                  <Mic size={16} fill={state === "idle" ? "none" : "currentColor"} />
                )}
              </Voice>
              <Button size="icon"
                type="button"
                onClick={() => submit()}
                disabled={!idea.trim()}
                aria-label="Start building"
                variant="outline"
                alignItems="center" justifyContent="center" borderRadius={999} backgroundColor="$color5" borderWidth={1} borderColor="$color6" hoverStyle={{ backgroundColor: "$color6" }} disabledStyle={{ cursor: "not-allowed", backgroundColor: "$color3", borderColor: "$borderColor" }}
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
            <SizableText
              key={s}
              role="button"
              tabIndex={0}
              onClick={() => {
                setIdea(s);
                submit(s);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setIdea(s);
                  submit(s);
                }
              }}
              className="hz-tap"
              cursor="pointer" flexShrink={0} whiteSpace="nowrap" borderRadius="$10" borderWidth={1} borderColor="$borderColor" backgroundColor="$color3" paddingHorizontal="$3.5" paddingVertical="$1.5" fontSize="$1" color="$color11" hoverStyle={{ borderColor: "$color5", backgroundColor: "$color4", color: "$color" }}
            >
              {s}
            </SizableText>
          ))}
        </XStack>
      )}

      {/* Subtle honest sub-line — no fabricated claims.

          The row is an XStack because the icon sits BESIDE the sentence, and only
          a stack can say that: `alignItems`/`justifyContent`/`gap` on the
          Paragraph were flex properties on a text host, where they do nothing.
          The icon then took its own line — svg is display:block under the reset,
          and a block box ignores the parent's `textAlign` — so it hung off the
          left edge while the sentence stayed centered under it. */}
      {subline && (
        <XStack marginTop="$3" alignItems="center" justifyContent="center" gap="$1.5">
          <Sparkles size={12} />
          <Paragraph textAlign="center" fontSize="$1" color="$color11">
            UI, database, auth, and 400+ AI models — wired in and deployed to Hanzo Cloud.
          </Paragraph>
        </XStack>
      )}
    </YStack>
  );
}

export default BuildComposer;
