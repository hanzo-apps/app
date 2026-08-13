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
  Plus,
  GitBranch,
  Paperclip,
  FileText,
  Table,
  Image as Picture,
  X,
} from 'lucide-react';
import { ACCEPT, inline, seed, take, type Attachment, type Read } from '@/lib/attach';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, Textarea, Button } from '@hanzo/ui';
import { sends } from '@hanzo/ui/chat';
import { baseEnabled, setBaseEnabled } from '@/lib/base/flag';
import { startNewBuild } from '@/lib/dev/workspace';

export type ComposerMode = 'build' | 'plan';

// A spreadsheet gets the table, a picture the frame, a container we cannot open
// the clip. Everything else we can read is a page.
const mark = (read: Read, name: string) =>
  read === 'image'
    ? Picture
    : read === 'open'
      ? Paperclip
      : name.toLowerCase().endsWith('.csv')
        ? Table
        : FileText;

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

  /**
   * Files dropped on the bubble, or picked from [+].
   *
   * The drop target is the WHOLE bubble, which is what a person aims at. That
   * makes `over` a counter rather than a flag: dragenter/dragleave fire again for
   * every child the pointer crosses, so a boolean flickers off the moment the
   * pointer passes over the textarea inside.
   */
  const [files, setFiles] = useState<Attachment[]>([]);
  const [refused, setRefused] = useState<string[]>([]);
  const [over, setOver] = useState(false);
  const depth = useRef(0);
  const pickerRef = useRef<HTMLInputElement>(null);

  const add = (incoming: File[]) => {
    const { kept, refused: no } = take(incoming);
    setRefused(no);
    // Same file twice is one attachment — the id is name+size+mtime.
    setFiles((prev) => [...prev, ...kept.filter((k) => !prev.some((p) => p.id === k.id))]);
  };

  const dragging = {
    onDragEnter: (e: React.DragEvent) => {
      if (!Array.from(e.dataTransfer.types).includes('Files')) return;
      e.preventDefault();
      depth.current += 1;
      setOver(true);
    },
    onDragOver: (e: React.DragEvent) => {
      if (!Array.from(e.dataTransfer.types).includes('Files')) return;
      // Without this the browser navigates to the file instead of dropping it.
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
    },
    onDragLeave: () => {
      depth.current -= 1;
      if (depth.current <= 0) {
        depth.current = 0;
        setOver(false);
      }
    },
    onDrop: (e: React.DragEvent) => {
      e.preventDefault();
      depth.current = 0;
      setOver(false);
      const dropped = Array.from(e.dataTransfer.files);
      if (dropped.length) add(dropped);
    },
  };

  // A starter/crawl chip FILLS the composer — it does not submit. The draft
  // appears so it can be read and edited, then sent with the send button or
  // Enter. (A moving chip is hard to "submit" by tap; filling is the fix.)
  const fillIdea = (s: string) => {
    setIdea(s);
    textareaRef.current?.focus();
  };

  // Hold the crawl still around a press. Hover pauses it for a pointer and a
  // touch has no hover, so the chip a thumb aimed at keeps sliding: the press
  // lands between two chips, or on the track, and nothing fills. `:active`
  // (assets/globals.css) freezes it for the press itself; this keeps it frozen
  // afterwards so a correction lands too, then lets the motif resume.
  const [paused, setPaused] = useState(false);
  const pauseRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const pause = () => {
    clearTimeout(pauseRef.current);
    setPaused(true);
    pauseRef.current = setTimeout(() => setPaused(false), 3000);
  };
  useEffect(() => () => clearTimeout(pauseRef.current), []);

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
  //
  // A fully-typed phrase is ARMED: for the ~3s it rests on screen (the read
  // window) the send button builds THAT example, so a reader who likes what
  // they see ships it in one tap without typing a word. That 3s is the whole
  // window for pointer and touch; keyboard focus on send additionally HOLDS the
  // phrase (freezeRef, via its onFocus/onBlur) so a Tab-then-Enter reach never
  // races the erase. A mouse can't extend it the same way — @hanzo/ui's Button
  // narrows out onHoverIn — so the 3s is deliberately generous.
  const [typed, setTyped] = useState('');
  const [armed, setArmed] = useState<string | null>(null);
  const armedRef = useRef<string | null>(null);
  armedRef.current = armed;
  const freezeRef = useRef(false);
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
      setArmed(typewriter[0]); // static, but still one-tap buildable
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
          setArmed(phrase);           // readable — and buildable in one tap
          t = setTimeout(tick, 3000);  // the read/act pause
          return;
        }
        t = setTimeout(tick, 38);
      } else {
        // Holding on the full phrase. Keep it up while a pointer or focus rests
        // on send, so the tap that builds it never lands on a half-erased line.
        if (armedRef.current) {
          if (freezeRef.current) {
            t = setTimeout(tick, 150);
            return;
          }
          setArmed(null);
        }
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

  // The example a bare send would build — only while the composer is genuinely
  // idle (focusing or typing takes over and hands send the draft instead).
  const armedIdea = idle ? armed : null;

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
    // A file on its own is a request too, so it carries the prompt the builder
    // would otherwise have to ask for.
    const text = raw.trim() || (files.length ? 'Build an app from these files.' : '');
    if (!text) return;
    // Top-of-funnel build INTENT — the landing composer fires this for logged-out
    // visitors too, and no app exists yet (that is `app_created`, at publish).
    // FUNNELS.appShip step 2. Enumerated props only; never the prompt text.
    analytics.capture(EVENTS.BUILD_STARTED, { mode, withBase });
    setBaseEnabled(withBase);

    // Default seed pipeline (PRESERVED contract + the one new mode key).
    const go = (brief: string) => {
      if (onSubmit) {
        onSubmit(brief, mode);
        return;
      }
      try {
        // A fresh prompt is a NEW project — drop the previous unsaved build's
        // minted repo id so this one does not commit into that one's history.
        startNewBuild();
        localStorage.setItem('initialPrompt', brief);
        localStorage.setItem('initialMode', mode);
      } catch {
        // localStorage may be unavailable; /dev also accepts ?prompt= / ?mode=.
      }
      router.push('/dev');
    };

    // With nothing attached this stays SYNCHRONOUS, which is the contract every
    // caller already has: a click seeds and pushes before it returns. Reading a
    // file is the only reason to defer, so it is the only case that defers.
    if (!files.length) return go(text);

    void (async () => {
      // What can be read joins the prompt HERE. An image cannot: it has to be
      // uploaded, and uploading needs a project, which does not exist until the
      // builder makes one — so images travel as files and the builder ingests
      // them through its own ONE upload path.
      const brief = `${text}\n\n${await inline(files)}`;
      // Awaited: the login bounce is a top-level navigation, and a write still
      // in flight when the page goes away never lands.
      await seed(files.filter((f) => f.read === 'image'));
      go(brief);
    })();
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
      <YStack borderRadius={28} elevation={6} className="hz-composer" {...dragging}>
        <YStack
          data-field-box
          borderRadius={26.5}
          backgroundColor="$background"
          // Drawn INSIDE the bubble (negative offset) so the gradient rim stays
          // the outermost edge and the pill does not appear to grow on hover.
          outlineWidth={over ? 2 : 0}
          outlineStyle="dashed"
          outlineColor="$color8"
          outlineOffset={-6}
        >
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
            // The idle placeholder needs a third line on the narrowest phones,
            // and `rows` is a two-line floor the auto-grow above never lifts —
            // it measures the typed value, and the placeholder is not one.
            // `.hz-ask` (assets/globals.css) is that floor; the arithmetic and
            // the width it starts at are stated there.
            className="hz-ask"
            width="100%" backgroundColor="transparent" borderWidth={0} paddingHorizontal="$3.5" paddingBottom="$1.5" paddingTop="$3" fontSize={16} lineHeight="1.375" color="$color" placeholderTextColor="$color11" focusStyle={{ borderWidth: 0 }}
  />
          {/* What is attached, and what was turned away, between the field and
              its controls — the answer to "did that land?" belongs next to the
              thing it was dropped on. */}
          {files.length > 0 && (
            <XStack flexWrap="wrap" gap="$1.5" paddingHorizontal="$3.5" paddingBottom="$1.5">
              {files.map(({ id, file, read }) => {
                const Mark = mark(read, file.name);
                return (
                  <XStack
                    key={id}
                    alignItems="center"
                    gap="$1.5"
                    maxWidth={208}
                    borderRadius="$10"
                    borderWidth={1}
                    borderColor="$borderColor"
                    backgroundColor="$color2"
                    paddingLeft="$2.5"
                    paddingRight="$1"
                    paddingVertical="$1"
                  >
                    <Mark size={12} />
                    <SizableText fontSize="$1" color="$color11" numberOfLines={1}>
                      {file.name}
                    </SizableText>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label={`Remove ${file.name}`}
                      onClick={() => setFiles((p) => p.filter((f) => f.id !== id))}
                      width={18} height={18} borderWidth={0} backgroundColor="transparent"
                    >
                      <X size={11} />
                    </Button>
                  </XStack>
                );
              })}
            </XStack>
          )}
          {refused.length > 0 && (
            <SizableText paddingHorizontal="$3.5" paddingBottom="$1.5" fontSize="$1" color="$color11">
              {refused.join(' · ')}
            </SizableText>
          )}
          {/* The picker offers exactly what a drop accepts. Cleared after every
              change so choosing the same file twice still fires. */}
          <input
            ref={pickerRef}
            type="file"
            multiple
            accept={ACCEPT}
            style={{ display: 'none' }}
            onChange={(e) => {
              add(Array.from(e.target.files ?? []));
              e.target.value = '';
            }}
          />
          {/* `.hz-dense`: the field is the tap target here, this row is its
              secondary chrome, so it keeps the library's own 32px controls on a
              phone instead of the 44px coarse floor (assets/globals.css states
              both halves). */}
          <XStack className="hz-dense" alignItems="center" justifyContent="space-between" gap="$2" paddingHorizontal="$2" paddingBottom="$2">
            <XStack alignItems="center" gap="$1">
              {/* [+] — bring in existing code, the same affordance the builder's
                  composer has, on the left of the row. Import routes to /new
                  (Git import); attach opens the picker HERE, because files now
                  land on this composer and travel with the prompt. It used to
                  send you to the builder to find an uploader. */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  {/* A real circle. The Button's size variant pins a rounded-
                      rectangle shape with !important that a Tamagui prop or an
                      inline `style` can't outrank, so `.hz-round` (globals.css,
                      scoped under `.hz-composer` to outweigh it) carries the
                      whole shape — the 36px square and the round corner. */}
                  <Button
                    type="button"
                    variant="ghost"
                    aria-label="Add to this build"
                    className="hz-round"
                    alignItems="center" justifyContent="center" borderWidth={0} backgroundColor="$color3" hoverStyle={{ backgroundColor: "$color4" }}
                  >
                    <Plus size={16} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent width={236}>
                  <DropdownMenuItem onClick={() => router.push('/new')}>
                    <XStack alignItems="center" gap="$2">
                      <GitBranch size={15} />
                      <SizableText>Import a repo or site</SizableText>
                    </XStack>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => pickerRef.current?.click()}>
                    <XStack alignItems="center" gap="$2">
                      <Paperclip size={15} />
                      <SizableText>Attach files</SizableText>
                    </XStack>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Build / Plan mode */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    height={34} alignItems="center" gap="$1.5" borderWidth={0} borderRadius="$5" backgroundColor="$color005" paddingHorizontal="$2.5" hoverStyle={{ backgroundColor: "$color3" }}
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

              {/* Base backend toggle — spawn a Hanzo Base for this app. The row
                  carries no outlines, so active is said by the label and icon
                  going bright (monochrome) — a fill read as a pressed slab. */}
              <Button
                type="button"
                variant="ghost"
                onClick={toggleBase}
                aria-pressed={withBase}
                title="Hanzo Base backend — database, auth, realtime for this app"
                group height={34} alignItems="center" gap="$1.5" borderWidth={0} borderRadius="$5" backgroundColor="$color005" paddingHorizontal="$2.5" hoverStyle={{ backgroundColor: "$color3" }}
              >
                <XStack alignItems="center" gap="$1.5" opacity={withBase ? 1 : 0.5} $group-hover={{ opacity: 1 }}>
                  <Database size={14} />
                  <SizableText fontSize="$1">Base</SizableText>
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
              <Button
                type="button"
                onClick={() => submit(idea.trim() ? idea : (armedIdea ?? ''))}
                onFocus={() => { freezeRef.current = true; }}
                onBlur={() => { freezeRef.current = false; }}
                disabled={!(idea.trim() || armedIdea || files.length)}
                aria-label={armedIdea && !idea.trim() ? `Build ${armedIdea}` : "Start building"}
                variant="ghost"
                className="hz-round"
                alignItems="center" justifyContent="center" borderWidth={0} backgroundColor="$color5" hoverStyle={{ backgroundColor: "$color6" }} disabledStyle={{ cursor: "not-allowed", backgroundColor: "$color3" }}
              >
                <ArrowUp size={16} strokeWidth={2.5} />
              </Button>
            </XStack>
          </XStack>
        </YStack>
      </YStack>

      {/* Starter prompts — honest app types, as ONE continuous "news crawl"
          (the .hz-crawl marquee in globals.css): the set is rendered twice and
          the track translates exactly one copy, so the loop never seams.
          Clicking one fills the draft (`fillIdea`) so it can be read and edited
          before it is sent, by the same send button and Enter a typed idea uses.
          Hover, focus and a press each hold the crawl still so a moving chip can
          be caught; the second copy is decorative (aria-hidden). */}
      {!!starters?.length && (
        <YStack
          marginTop="$4"
          width="100%"
          className={paused ? "hz-crawl hz-hold" : "hz-crawl"}
          onPointerDown={pause}
        >
          <XStack className="hz-crawl-track">
            {[0, 1].map((copy) => (
              <XStack key={copy} className="hz-crawl-group" {...(copy === 1 ? { "aria-hidden": true } : {})}>
                {starters.map((s) => {
                  const clone = copy === 1;
                  return (
                    <SizableText
                      key={`${copy}-${s}`}
                      {...(clone ? {} : { role: "button", tabIndex: 0 })}
                      onClick={() => fillIdea(s)}
                      onKeyDown={
                        clone
                          ? undefined
                          : (e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                fillIdea(s);
                              }
                            }
                      }
                      className="hz-tap"
                      cursor="pointer" flexShrink={0} whiteSpace="nowrap" borderRadius="$10" borderWidth={1} borderColor="$borderColor" backgroundColor="$color3" paddingHorizontal="$3.5" paddingVertical="$1.5" fontSize="$1" color="$color11" hoverStyle={{ borderColor: "$color5", backgroundColor: "$color4", color: "$color" }}
                    >
                      {s}
                    </SizableText>
                  );
                })}
              </XStack>
            ))}
          </XStack>
        </YStack>
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
