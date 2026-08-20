'use client';

import { SizableText, YStack, Paragraph } from '@hanzo/ui';
import { Check, ChevronDown } from "lucide-react";

import { Popover, PopoverContent, PopoverTrigger, Button } from '@hanzo/ui';
import { ModelIcon } from '@/components/model-icon';
import { ModelSelector } from '@/components/model-selector';
import { AUTO_MODEL, FALLBACK_MODELS, familyOf, labelOf } from "@/lib/providers";
import { useModels } from "@/lib/hooks/use-models";
import type { Runtime } from "@/lib/agent/sandbox";

/**
 * The isolation boundaries a session can ask for, and what picking one costs.
 *
 * EVERY LEASE FIGURE IS FROM THE BURST OF 50, not from a quiet cluster, and the
 * two are not close enough to round together. Measured with all three given the
 * same 39-of-50 scheduling so the comparison is fair:
 *
 *      runtime    p50        p90
 *      runc       2,161ms    3,064ms
 *      gvisor     3,948ms    5,274ms
 *      kata-fc   26,957ms  174,877ms
 *
 * On an idle cluster a microVM leases in 4–8s; under load its p90 is 175
 * SECONDS. Both are true, and only one of them describes a working day, so the
 * row states the one somebody schedules around.
 *
 * The steady-state win is real and stays: once running, git status inside a
 * microVM takes 21–53ms against gVisor's 156–195ms. So the row says both — the
 * fastest at files, the worst at starting — and lets a person decide, which is
 * the entire reason there is a picker rather than a house opinion.
 *
 * This list is COPY, not policy. Cloud owns which of these an org may actually
 * have and refuses the rest in its own words; nothing here tries to predict that
 * answer, because a picker that quietly hid an option would be deciding policy
 * in the one place that cannot see it.
 */
const RUNTIMES: { value: Runtime; label: string; hint: string }[] = [
  { value: "", label: "Default", hint: "Whatever the fleet runs. Pick another only to measure one." },
  { value: "runc", label: "Shared kernel", hint: "Fastest to start: 2.2s, 3.1s busy. Our own code only." },
  {
    value: "gvisor",
    label: "gVisor",
    hint: "Balanced, and what the fleet runs. Starts 3.9s, 5.3s busy; git status 156–195ms.",
  },
  {
    value: "kata-fc",
    label: "microVM",
    hint: "Fastest on files: git status 21–53ms. Slowest to start: 27s, 175s busy. No project disk.",
  },
];

/** A group heading — the rung `@hanzo/ui` gives a list's own section labels, so
 *  "Model" and "Sandbox" read as headings rather than as two more rows.
 *
 *  Sentence case, which is a house rule and not a preference here: the small
 *  rung plus the muted colour already say "heading", and `ui-centralization`
 *  fails the build on `textTransform="uppercase"` anywhere in the chrome. */
function Section({ children }: { children: string }) {
  return (
    <SizableText
      fontSize="$1" fontWeight="500" color="$color11"
      letterSpacing={0.3} paddingHorizontal="$2" paddingVertical="$1.5"
    >
      {children}
    </SizableText>
  );
}

/** The hairline between groups: a menu separator, inset from the panel's edge
 *  so it reads as a division inside one surface rather than as an edge. */
function Rule() {
  return <YStack height={1} backgroundColor="$borderColor" marginHorizontal="$1" marginVertical="$1" />;
}

/** One selectable row.
 *
 *  A MENU ROW, so it paints nothing at rest: the panel underneath is glass, and
 *  a row that carries its own fill and border stacks an opaque box on top of the
 *  material and hides it. State is the whole treatment — the pointer and the
 *  keyboard cursor light the row, the current pick keeps a fill and a check. */
function Choice({
  label,
  hint,
  rows = 1,
  selected,
  onClick,
  testid,
}: {
  label: string;
  hint?: string;
  /** How many lines the hint may take. The row's floor is sized from it. */
  rows?: number;
  selected: boolean;
  onClick: () => void;
  testid?: string;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      onClick={onClick}
      aria-pressed={selected}
      data-testid={testid}
      // THE FLOOR IS A MEASUREMENT, not a taste: 21px of label, 2px of margin,
      // 19px per hint line, 16px of padding. A Button carries a fixed height
      // from its size variant, so a row sized under its own text cuts the top
      // off its label — which no assertion on the text would ever notice.
      //
      // A floor rather than a height because min-height beats height in CSS,
      // which is the one way to state this the size variant cannot overrule.
      // flexShrink because the body scrolls: a flex child in a height-capped
      // column gives way by default, and the row is the fixed thing here — the
      // list is what should give.
      width="100%" minHeight={39 + 19 * rows} flexShrink={0} alignItems="center" gap="$2"
      borderWidth={0} borderRadius="$3" paddingVertical="$2"
      backgroundColor={selected ? "$color4" : "transparent"}
      hoverStyle={{ backgroundColor: "$color5" }}
      focusStyle={{ backgroundColor: "$color5" }}
      pressStyle={{ backgroundColor: "$color6" }}
    >
      <YStack minWidth={0} flex={1}>
        <SizableText numberOfLines={1} fontWeight="500" textAlign="left" fontSize="$3" color="$color12">{label}</SizableText>
        {/* The hint wraps to `rows` and the row is sized for exactly that. A
            Button has a fixed height, so a hint that wraps further does not make
            room — it slides up under its own label and out through the sides of
            the popover. Which is a thing a screenshot shows and no assertion on
            the text would ever notice. */}
        {hint && (
          <SizableText marginTop="$0.5" numberOfLines={rows} textAlign="left" fontSize="$1" color="$color11">
            {hint}
          </SizableText>
        )}
      </YStack>
      {selected && <Check size={16} />}
    </Button>
  );
}

export function Settings({
  open,
  onClose,
  model,
  error,
  onModelChange,
  routedModel,
  runtime,
  onRuntimeChange,
  granted,
  refused,
}: {
  open: boolean;
  // `provider`/`onChange` stay in the contract: the parent (ask-ai/index.tsx)
  // still owns a persisted `provider` value and passes both. Enso does the
  // smart routing (it auto-picks the provider AND the model per request), so
  // this popover renders NO provider control — the props are accepted, ignored.
  provider: string;
  model: string;
  error?: string;
  onClose: React.Dispatch<React.SetStateAction<boolean>>;
  onChange: (provider: string) => void;
  onModelChange: (model: string) => void;
  /** Which model smart routing actually served the last turn, when it did. */
  routedModel?: string | null;
  /** The isolation boundary this project asks for. `""` takes the fleet's own. */
  runtime: Runtime;
  onRuntimeChange: (runtime: Runtime) => void;
  /**
   * The runtime the last run's sandbox ACTUALLY got, when there was one.
   *
   * Shown separately from `runtime` because they can differ, and a picker that
   * only ever echoed its own selection back would be the most convincing way to
   * mislead somebody: they would time gVisor while reading "microVM".
   */
  granted?: string;
  /** Cloud's own sentence, when a run asked for a runtime and got no sandbox. */
  refused?: string;
}) {
  // The list is live from the gateway (via /v1/models); never a static catalog.
  // It arrives already filtered, named and grouped, so nothing is reshaped here
  // — the adapter that used to sit in this file was re-deriving what the BFF had
  // already decided, and the two could disagree.
  const { models } = useModels();
  const entries = models.length ? models : FALLBACK_MODELS;

  const isAuto = !model || model === AUTO_MODEL;

  return (
    <Popover open={open} onOpenChange={onClose} placement="top-end">
      <PopoverTrigger asChild>
        {/* The VISIBLE model chip — the composer's first-class "which model" the
            way the Mode pill beside it is the first-class "which mode". It names
            the current model (or Auto) so you can SEE what will answer, and opens
            this same model+runtime popover on press. It keeps its id so that
            [+] → Settings opens it too. */}
        <Button
          id="composer-settings"
          type="button"
          variant="ghost"
          aria-label={`Model: ${isAuto ? "Auto" : labelOf(model)}`}
          title="Model"
          height={26} minHeight={26} alignItems="center" gap="$1" borderRadius={999} backgroundColor="$color3" paddingHorizontal="$2.5" hoverStyle={{ backgroundColor: "$color4" }}
        >
          {/* The chosen model wears its own mark, from `ModelIcon` — the ONE
              path to @hanzo/logo's ENSO_MARK and to every maker's glyph. So the
              chip that says "Enso" draws the ensō, and it is the same 14px mark
              the picker's own trigger shows one press later. Auto is a routing
              POLICY across families, not a model, so it has no mark to wear. */}
          {!isAuto && (
            <ModelIcon family={familyOf(model)?.key} label={labelOf(model)} size={14} />
          )}
          <SizableText fontSize="$2" fontWeight="500" color="$color" numberOfLines={1} maxWidth="9rem">
            {isAuto ? "Auto" : labelOf(model)}
          </SizableText>
          <SizableText color="$color11"><ChevronDown size={12} /></SizableText>
        </Button>
      </PopoverTrigger>
      {/* ONE SURFACE, and it is glass because of what it is: `[data-slot=
          "popover-content"]` carries the frosted ground, the lit edge and rung 2
          of the elevation ladder from `@hanzo/ui/glass.css`. Nothing inside may
          paint an opaque fill over it, or the material is a border nobody sees.

          `hz-picker-panel` is the phone rule the model panel already uses: below
          40em a list this long becomes a sheet at the foot of the screen, because
          a panel hanging off a trigger that sits near the bottom opens into ~100px
          and runs off the top. 320 keeps the panel inside the builder's chat pane
          at every desktop width, and the 4px inset is the menu's own, so a row's
          lit background stops short of the panel's rounded edge. */}
      <PopoverContent
        align="end"
        sideOffset={8}
        className="hz-picker-panel"
        width={320} overflow="hidden" padding="$1"
      >
        {/* THE BODY SCROLLS. Two sections plus a refusal do not fit above the
            composer on a laptop, and a popover that is merely `overflow: hidden`
            answers that by cutting the last option off with nothing to say it
            did. Half the window is what actually fits: the popover opens upward
            from a trigger sitting near the bottom, so anything taller runs off
            the TOP of the screen instead. 60vh is what holds the whole sandbox
            list on a laptop: all four runtimes are there to be COMPARED, and a
            row you have to scroll to is one nobody weighs against the others. */}
        <YStack data-testid="settings-body" width="100%" maxHeight="60vh" overflow="scroll">
          <Section>Model</Section>
          {error && error !== "" && (
            <Paragraph role="alert" display="flex" alignItems="center" justifyContent="space-between" marginHorizontal="$1" marginBottom="$1" borderRadius="$3" borderWidth={1} borderColor="$red9" padding="$2" fontSize="$2" fontWeight="500" color="$red10">
              {error}
            </Paragraph>
          )}

          {/* `auto` is a first-class VALUE of the persisted `model` — the
              builder's "Routed: …" banner and the smart-routing card read it. It
              is the gateway's OWN cross-family router (cheapest capable across
              Enso / Zen / Anthropic / OpenAI), which is NOT what Enso does, so
              it says so rather than borrowing Enso's name. The fresh-session
              default is Enso, in the list below. */}
          <Choice
            label="Auto · smart routing"
            hint={
              isAuto && routedModel
                ? `Last request went to ${routedModel} — you are billed as what served you`
                : "Routes each request to the cheapest capable model"
            }
            selected={isAuto}
            onClick={() => onModelChange(AUTO_MODEL)}
  />
          {/* The model list keeps its own anchored panel, so it sits in the row
              a menu item would occupy rather than unrolling inside this one. */}
          <YStack paddingHorizontal="$1" paddingVertical="$1">
            <ModelSelector
              models={entries}
              value={isAuto ? undefined : model}
              onChange={onModelChange}
              size="sm"
              placeholder="Pick a model"
              data-testid="model-picker"
    />
          </YStack>

          <Rule />

          {/* THE SANDBOX SECTION. A second heading rather than a second popover:
              model and runtime are the two things a coding session is configured
              with, and they are chosen in the same breath. */}
          <Section>Sandbox</Section>
          {/* THE REFUSAL, in cloud's own words and above the list, so the next
              thing read after "that did not work" is the thing to change. A
              silent fallback is the failure this exists to prevent: it is how
              somebody ends up benchmarking gVisor believing it was Firecracker. */}
          {refused && (
            <Paragraph
              role="alert"
              data-testid="runtime-refused"
              marginHorizontal="$1" marginBottom="$1"
              borderRadius="$3" borderWidth={1} borderColor="$red9" padding="$2.5"
              fontSize="$2" lineHeight="$1" color="$red10"
            >
              {refused}
            </Paragraph>
          )}
          <YStack role="group" aria-label="Sandbox runtime" data-testid="runtime-picker">
            {/* Two lines for every row, not per-row. A runtime's hint has to say
                what it is fast at AND what it is slow at, which is two lines for
                the longest; and rows of differing heights invite the eye to read
                them as differing in importance, which is the opposite of what a
                list you are meant to COMPARE should do. Two is also what keeps
                all four inside one screen of the scroller — a comparison you
                have to scroll through is one nobody makes. */}
            {RUNTIMES.map((r) => (
              <Choice
                key={r.value || "default"}
                testid={`runtime-${r.value || "default"}`}
                label={r.label}
                hint={r.hint}
                rows={2}
                selected={runtime === r.value}
                onClick={() => onRuntimeChange(r.value)}
    />
            ))}
          </YStack>
          {/* WHAT IT GOT, never what it asked for. Absent until a run has one,
              because before that there is nothing true to say. */}
          {granted !== undefined && (
            <SizableText data-testid="runtime-granted" paddingHorizontal="$2" paddingVertical="$1.5" fontSize="$1" color="$color11">
              {`Running on ${granted || "the fleet's own runtime"}` +
                (runtime && granted !== runtime ? ` — you asked for ${runtime}` : "")}
            </SizableText>
          )}
        </YStack>
      </PopoverContent>
    </Popover>
  );
}
