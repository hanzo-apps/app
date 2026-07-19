import classNames from "classnames";
import { PiGearSixFill } from "react-icons/pi";
import { Check } from "lucide-react";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@hanzo/ui";
import { ModelSelector, type ModelCatalogEntry } from "@hanzo/ui/models";
import {
  AUTO_MODEL,
  FALLBACK_MODELS,
  isBuildModel,
  isDeadModelId,
  type ModelOption,
} from "@/lib/providers";
import { useModels } from "@/lib/hooks/use-models";
import { Button } from "@hanzo/ui";
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
    .filter(({ value }) => isBuildModel(value) && !isDeadModelId(value))
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
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={classNames(
        "flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-sm transition-colors",
        selected
          ? "bg-white/10 text-white"
          : "text-neutral-300 hover:bg-white/[0.06] hover:text-white"
      )}
    >
      <span className="min-w-0 flex-1">
        <span className="block truncate font-medium">{label}</span>
        {hint && (
          <span className="mt-0.5 block truncate text-xs text-neutral-400">
            {hint}
          </span>
        )}
      </span>
      {selected && <Check className="size-4 shrink-0 text-white" />}
    </button>
  );
}

export function Settings({
  open,
  onClose,
  model,
  error,
  onModelChange,
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
    <Popover open={open} onOpenChange={onClose}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5 !text-neutral-300 hover:!bg-white/10 hover:!text-white"
        >
          <PiGearSixFill className="size-4" />
          <span className="hidden sm:inline">Settings</span>
        </Button>
      </PopoverTrigger>
      {/* ONE popover surface: solid bg-neutral-900, a single hairline border, high
          z-index. The model list is inline (not a nested Select portal), so the
          menu can no longer render a second overlapping layer. */}
      <PopoverContent
        side="top"
        align="end"
        sideOffset={8}
        className="z-50 w-96 overflow-hidden !rounded-2xl !border !border-neutral-800 !bg-neutral-900 p-0 text-neutral-100 shadow-2xl shadow-black/60"
      >
        <header className="border-b border-neutral-800 bg-neutral-950 px-4 py-3 text-center text-sm font-medium text-neutral-200">
          Model
        </header>
        <main className="space-y-2.5 px-4 pt-4 pb-5">
          {error && error !== "" && (
            <p className="flex items-center justify-between rounded-md bg-red-500/10 p-2 text-sm font-medium text-red-500">
              {error}
            </p>
          )}

          {/* Auto (Enso smart routing) is the default and a first-class VALUE of
              the persisted `model` — the builder's "Routed: …" banner and the
              smart-routing card read it. Enso auto-picks the best model AND the
              provider per request, so there is no separate provider choice. The
              dropdown below is an optional explicit override (family-grouped:
              Enso / Zen / Anthropic / OpenAI). */}
          <div className="rounded-xl border border-neutral-800 bg-neutral-950/60 p-1">
            <ModelRow
              label="Auto · smart routing"
              hint="Enso picks the best model & provider per request"
              selected={isAuto}
              onClick={() => onModelChange(AUTO_MODEL)}
            />
          </div>
          <ModelSelector
            models={entries}
            value={isAuto ? undefined : model}
            onChange={onModelChange}
            size="sm"
            chatOnly
          />
        </main>
      </PopoverContent>
    </Popover>
  );
}
