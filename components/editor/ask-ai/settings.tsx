'use client';

import { SizableText, YStack, Paragraph } from '@hanzo/ui';
import { Check, Settings as SettingsIcon } from "lucide-react";

import { Popover, PopoverContent, PopoverTrigger, Button } from '@hanzo/ui';
import { ModelSelector } from '@/components/model-selector';
import { AUTO_MODEL, FALLBACK_MODELS } from "@/lib/providers";
import { useModels } from "@/lib/hooks/use-models";
import type { Runtime } from "@/lib/agent/sandbox";

/**
 * The isolation boundaries a session can ask for, and what picking one costs.
 *
 * Every figure here is MEASURED on the real lease path, not estimated, and the
 * two that matter pull in opposite directions: a microVM takes longer to hand
 * you a machine and is then several times faster at touching files. For a long
 * editing session that trade is probably worth taking, which is exactly the sort
 * of claim nobody should have to accept on somebody's word — hence the picker.
 *
 * This list is COPY, not policy. Cloud owns which of these an org may actually
 * have and refuses the rest in its own words; nothing here tries to predict that
 * answer, because a picker that quietly hid an option would be deciding policy
 * in the one place that cannot see it.
 */
const RUNTIMES: { value: Runtime; label: string; hint: string }[] = [
  { value: "", label: "Default", hint: "Whatever the fleet runs" },
  { value: "runc", label: "Shared kernel", hint: "Fastest to start · our own code only" },
  { value: "gvisor", label: "gVisor", hint: "Leases 2.8s · git status 156–195ms" },
  { value: "kata-fc", label: "microVM", hint: "Leases 4–8s · git status 21–53ms · no project disk" },
];

/** One selectable row — a plain button (no nested Radix Select portal, which was
 *  rendering a second floating layer that overlapped the popover body). Solid
 *  hover, a single check when active.
 *
 *  It was `ModelRow`. Nothing about it was ever about models, and the runtime
 *  list below needs exactly the same row, so it is named for what it does. */
function Choice({
  label,
  hint,
  selected,
  onClick,
  testid,
}: {
  label: string;
  hint?: string;
  selected: boolean;
  onClick: () => void;
  testid?: string;
}) {
  return (
    <Button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      data-testid={testid}
      group
      // 58 IS A MEASUREMENT, not a taste. A Button carries a fixed 36px height
      // from its size variant; a label over a single-line hint measures 42px,
      // and paddingVertical $2 adds 8 above and below. So a two-line row was
      // drawing 58px of text into a 36px box and cutting the top off its own
      // label — which every model row has done since the day it was written,
      // and which no assertion on the text would ever notice.
      //
      // A floor rather than a height because min-height beats height in CSS,
      // which is the one way to state this that the size variant cannot
      // overrule; `height="auto"` was tried and the variant won at 30px.
      // flexShrink because the body scrolls: a flex child in a height-capped
      // column gives way by default, and the row is the fixed thing here — the
      // list is what should give.
      width="100%" minHeight={58} flexShrink={0} alignItems="center" gap="$2" borderRadius="$3" paddingHorizontal="$2.5" paddingVertical="$2" {...{ backgroundColor: selected ? "$color3" : undefined, hoverStyle: selected ? undefined : { backgroundColor: "$color3" } }}
    >
      <YStack minWidth={0} flex={1}>
        <SizableText numberOfLines={1} fontWeight="500" textAlign="left" fontSize="$3" color={selected ? "$color" : "$color11"} $group-hover={{ color: "$color" }}>{label}</SizableText>
        {/* ONE LINE, and the rows are written to fit it. The row is a Button and
            a Button has a fixed height, so a hint that wraps does not make room
            — it slides up under its own label and out through the sides of the
            popover. Which is a thing a screenshot shows and no assertion on the
            text would ever notice. */}
        {hint && (
          <SizableText marginTop="$0.5" numberOfLines={1} textAlign="left" fontSize="$1" color="$color11">
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
        <Button
          variant="ghost"
          size="icon"
          title="Settings — model, mode & options"
          aria-label="Settings"
          group
          borderRadius="$10" hoverStyle={{ backgroundColor: "$color3" }}
        >
          <SizableText color="$color11" $group-hover={{ color: "$color" }}>
            <SettingsIcon size={16} />
          </SizableText>
        </Button>
      </PopoverTrigger>
      {/* ONE popover surface: solid bg-card, a single hairline border, high
          z-index. The model list is inline (not a nested Select portal), so the
          menu can no longer render a second overlapping layer. */}
      <PopoverContent
        align="end"
        sideOffset={8}
        width={384} overflow="hidden" padding="$0"
      >
        {/* THE BODY SCROLLS. Two sections plus a refusal do not fit above the
            composer on a laptop, and a popover that is merely `overflow: hidden`
            answers that by cutting the last option off with nothing to say it
            did. Half the window is what actually fits: the popover opens upward
            from a trigger sitting near the bottom, so anything taller runs off
            the TOP of the screen instead — which is how a long refusal pushed
            the model section out of view entirely. */}
        <YStack maxHeight="50vh" overflow="scroll">
        <YStack borderBottomWidth={1} borderColor="$borderColor" backgroundColor="$background" paddingHorizontal="$4" paddingVertical="$3">
          <SizableText textAlign="center" fontSize="$3" fontWeight="500" color="$color">Model</SizableText>
        </YStack>
        <YStack rowGap="$2.5" paddingHorizontal="$4" paddingTop="$4" paddingBottom="$4.5">
          {error && error !== "" && (
            <Paragraph display="flex" alignItems="center" justifyContent="space-between" borderRadius="$3" backgroundColor="$red9" padding="$2" fontSize="$3" fontWeight="500" color="$red9">
              {error}
            </Paragraph>
          )}

          {/* `auto` is a first-class VALUE of the persisted `model` — the
              builder's "Routed: …" banner and the smart-routing card read it. It
              is the gateway's OWN cross-family router (cheapest capable across
              Enso / Zen / Anthropic / OpenAI), which is NOT what Enso does, so
              it says so rather than borrowing Enso's name. It is no longer the
              fresh-session default: that is Enso, in the list below. */}
          <YStack borderRadius="$6" borderWidth={1} borderColor="$borderColor" backgroundColor="$background" padding="$1">
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
          </YStack>
          <ModelSelector
            models={entries}
            value={isAuto ? undefined : model}
            onChange={onModelChange}
            size="sm"
            placeholder="Pick a model"
            data-testid="model-picker"
  />
        </YStack>

        {/* THE SANDBOX SECTION. A second header rather than a second popover:
            model and runtime are the two things a coding session is configured
            with, and they are chosen in the same breath. */}
        <YStack borderTopWidth={1} borderBottomWidth={1} borderColor="$borderColor" backgroundColor="$background" paddingHorizontal="$4" paddingVertical="$3">
          <SizableText textAlign="center" fontSize="$3" fontWeight="500" color="$color">Sandbox</SizableText>
        </YStack>
        <YStack rowGap="$2.5" paddingHorizontal="$4" paddingTop="$4" paddingBottom="$4.5">
          {/* THE REFUSAL, in cloud's own words and above the list, so the next
              thing read after "that did not work" is the thing to change. A
              silent fallback is the failure this exists to prevent: it is how
              somebody ends up benchmarking gVisor believing it was Firecracker. */}
          {refused && (
            <Paragraph
              role="alert"
              data-testid="runtime-refused"
              borderRadius="$3" borderWidth={1} borderColor="$red9" padding="$2.5"
              fontSize="$2" lineHeight="$1" color="$red10"
            >
              {refused}
            </Paragraph>
          )}
          <YStack
            role="group"
            aria-label="Sandbox runtime"
            data-testid="runtime-picker"
            borderRadius="$6" borderWidth={1} borderColor="$borderColor" backgroundColor="$background" padding="$1"
          >
            {RUNTIMES.map((r) => (
              <Choice
                key={r.value || "default"}
                testid={`runtime-${r.value || "default"}`}
                label={r.label}
                hint={r.hint}
                selected={runtime === r.value}
                onClick={() => onRuntimeChange(r.value)}
    />
            ))}
          </YStack>
          {/* WHAT IT GOT, never what it asked for. Absent until a run has one,
              because before that there is nothing true to say. */}
          {granted !== undefined && (
            <SizableText data-testid="runtime-granted" fontSize="$1" color="$color11">
              {`Running on ${granted || "the fleet's own runtime"}` +
                (runtime && granted !== runtime ? ` — you asked for ${runtime}` : "")}
            </SizableText>
          )}
        </YStack>
        </YStack>
      </PopoverContent>
    </Popover>
  );
}
