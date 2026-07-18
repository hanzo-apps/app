import classNames from "classnames";
import { PiGearSixFill } from "react-icons/pi";
import { RiCheckboxCircleFill } from "react-icons/ri";
import { Check } from "lucide-react";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@hanzo/ui";
import { PROVIDERS, AUTO_MODEL } from "@/lib/providers";
import { useModels } from "@/lib/hooks/use-models";
import { Button } from "@hanzo/ui";
import { useMemo } from "react";
import { useUpdateEffect } from "react-use";
import Image from "next/image";

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
  provider,
  model,
  error,
  onChange,
  onModelChange,
}: {
  open: boolean;
  provider: string;
  model: string;
  error?: string;
  onClose: React.Dispatch<React.SetStateAction<boolean>>;
  onChange: (provider: string) => void;
  onModelChange: (model: string) => void;
}) {
  // The list is live from the gateway (via /v1/models); never a static catalog.
  const { models } = useModels();

  // Every gateway model is served by the single `hanzo` provider, so the
  // available providers are simply the provider set.
  const modelAvailableProviders = useMemo(() => Object.keys(PROVIDERS), []);

  useUpdateEffect(() => {
    if (provider !== "auto" && !modelAvailableProviders.includes(provider)) {
      onChange("auto");
    }
  }, [provider]);

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
          Model &amp; routing
        </header>
        <main className="max-h-[70vh] space-y-5 overflow-y-auto px-4 pt-5 pb-6">
          {error && error !== "" && (
            <p className="mb-2 flex items-center justify-between rounded-md bg-red-500/10 p-2 text-sm font-medium text-red-500">
              {error}
            </p>
          )}

          <div>
            <p className="mb-2.5 text-sm text-neutral-300">Choose a model</p>
            {/* ONE clean scrollable list. Auto (smart routing) first, then every
                live gateway model. */}
            <div className="max-h-64 space-y-0.5 overflow-y-auto rounded-xl border border-neutral-800 bg-neutral-950/60 p-1">
              <ModelRow
                label="Auto"
                hint="Best/cheapest model per request · smart routing"
                selected={isAuto}
                onClick={() => onModelChange(AUTO_MODEL)}
              />
              {models.map(({ value, label, description }) => (
                <ModelRow
                  key={value}
                  label={label}
                  hint={description}
                  selected={!isAuto && model === value}
                  onClick={() => onModelChange(value)}
                />
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="mb-1.5 text-sm text-neutral-300">
                  Use auto-provider
                </p>
                <p className="text-xs text-neutral-400/70">
                  We&apos;ll automatically select the best provider for you
                  based on your prompt.
                </p>
              </div>
              <div
                className={classNames(
                  "flex h-6 w-10 min-w-10 cursor-pointer items-center justify-between rounded-full bg-neutral-700 p-1 transition-all duration-200",
                  {
                    "!bg-white": provider === "auto",
                  }
                )}
                onClick={() => {
                  onChange(
                    provider === "auto" ? modelAvailableProviders[0] : "auto"
                  );
                }}
              >
                <div
                  className={classNames(
                    "h-4 w-4 rounded-full shadow-md transition-all duration-200",
                    {
                      "translate-x-4 bg-neutral-900": provider === "auto",
                      "bg-neutral-200": provider !== "auto",
                    }
                  )}
                />
              </div>
            </div>
            <label className="block">
              <p className="mb-2 text-sm text-neutral-300">Inference Provider</p>
              <div className="grid grid-cols-2 gap-1.5">
                {modelAvailableProviders.map((id: string) => (
                  <Button
                    key={id}
                    variant={id === provider ? "default" : "secondary"}
                    size="sm"
                    onClick={() => {
                      onChange(id);
                    }}
                  >
                    <Image
                      src={`/providers/${id}.svg`}
                      alt={PROVIDERS[id as keyof typeof PROVIDERS].name}
                      className="mr-2 size-5"
                      width={20}
                      height={20}
                    />
                    {PROVIDERS[id as keyof typeof PROVIDERS].name}
                    {id === provider && (
                      <RiCheckboxCircleFill className="ml-2 size-4 text-white" />
                    )}
                  </Button>
                ))}
              </div>
            </label>
          </div>
        </main>
      </PopoverContent>
    </Popover>
  );
}
