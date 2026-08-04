'use client';

import { SizableText, YStack, Paragraph } from '@hanzo/gui';
import { Check, Settings as SettingsIcon } from "lucide-react";

import { Popover, PopoverContent, PopoverTrigger, Button } from '@hanzo/ui';
import { ModelSelector, type ModelCatalogEntry } from '@hanzo/ui/models';
import {
  AUTO_MODEL,
  FALLBACK_MODELS,
  isBuildModel,
  isDeadModelId,
  type ModelOption,
} from "@/lib/providers";
import { useModels } from "@/lib/hooks/use-models";
import { useMemo } from "react";

/**
 * Adapt the builder's live model ladder (from /v1/models via useModels — the
 * gateway list is already build-filtered server-side, and useModels falls back
 * to FALLBACK_MODELS when the fetch fails, so this is never fed an empty list)
 * into the unified selector's catalog shape. The build-model policy is
 * re-applied here (isBuildModel + isDeadModelId) ON TOP of the selector's
 * `chatOnly`, so the builder only ever offers models that can actually build —
 * the family-grouped selector shows Enso, Zen, Anthropic and OpenAI (whatever
 * the predicate admits). Family is derived from the id by the selector.
 */
function toCatalogEntries(models: ModelOption[]): ModelCatalogEntry[] {
  return models
    .filter(({ value }) => !isDeadModelId(value)) // show ALL live models — the user picks, we do not pre-hide
    .map(({ value, label, description }) => ({
      id: value,
      label,
      ...(description ? { description } : {}),
    }));
}

/** One selectable row in the model list — a plain button (no nested Radix Select
 *  portal, which was rendering a second floating layer that overlapped the
 *  popover body). Solid hover, a single check when active. */
function ModelRow({
  label,
  hint,
  selected,
  onClick,
}: {
  label: string;
  hint?: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <Button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      group
      width="100%" alignItems="center" gap="$2" borderRadius="$3" paddingHorizontal="$2.5" paddingVertical="$2" {...{ backgroundColor: selected ? "$color3" : undefined, hoverStyle: selected ? undefined : { backgroundColor: "$color3" } }}
    >
      <YStack minWidth={0} flex={1}>
        <SizableText numberOfLines={1} fontWeight="500" textAlign="left" fontSize="$3" color={selected ? "$color" : "$color11"} $group-hover={{ color: "$color" }}>{label}</SizableText>
        {hint && (
          <SizableText marginTop="$0.5" numberOfLines={1} fontSize="$1" color="$color11">
            {hint}
          </SizableText>
        )}
      </YStack>
      {selected && <Check size={16} color="$color" />}
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
}) {
  // The list is live from the gateway (via /v1/models); never a static catalog.
  const { models } = useModels();

  // The unified, family-grouped selector's catalog. Never empty: useModels
  // already returns FALLBACK_MODELS on a failed fetch, and this guards once more.
  const entries = useMemo(
    () => toCatalogEntries(models.length ? models : FALLBACK_MODELS),
    [models]
  );

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
        <YStack borderBottomWidth={1} borderColor="$borderColor" backgroundColor="$background" paddingHorizontal="$4" paddingVertical="$3">
          <SizableText textAlign="center" fontSize="$3" fontWeight="500" color="$color">Model</SizableText>
        </YStack>
        <YStack rowGap="$2.5" paddingHorizontal="$4" paddingTop="$4" paddingBottom="$4.5">
          {error && error !== "" && (
            <Paragraph alignItems="center" justifyContent="space-between" borderRadius="$3" backgroundColor="$red9" padding="$2" fontSize="$3" fontWeight="500" color="$red9">
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
            <ModelRow
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
            chatOnly
  />
        </YStack>
      </PopoverContent>
    </Popover>
  );
}
