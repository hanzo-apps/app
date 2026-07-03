import classNames from "classnames";
import { PiGearSixFill } from "react-icons/pi";
import { RiCheckboxCircleFill } from "react-icons/ri";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@hanzo/ui";
import { PROVIDERS } from "@/lib/providers";
import { useModels } from "@/lib/hooks/use-models";
import { Button } from "@hanzo/ui";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@hanzo/ui";
import { useMemo } from "react";
import { useUpdateEffect } from "react-use";
import Image from "next/image";

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

  return (
    <div className="">
      <Popover open={open} onOpenChange={onClose}>
        <PopoverTrigger asChild>
          <Button variant="black" size="sm">
            <PiGearSixFill className="size-4" />
            Settings
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="!rounded-2xl p-0 !w-96 overflow-hidden !bg-neutral-900"
          align="center"
        >
          <header className="flex items-center justify-center text-sm px-4 py-3 border-b gap-2 bg-neutral-950 border-neutral-800 font-medium text-neutral-200">
            Customize Settings
          </header>
          <main className="px-4 pt-5 pb-6 space-y-5">
            {error !== "" && (
              <p className="text-red-500 text-sm font-medium mb-2 flex items-center justify-between bg-red-500/10 p-2 rounded-md">
                {error}
              </p>
            )}
            <label className="block">
              <p className="text-neutral-300 text-sm mb-2.5">Choose a model</p>
              <Select defaultValue={model} onValueChange={onModelChange}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a model" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Models</SelectLabel>
                    {models.map(({ value, label, description }) => (
                      <SelectItem key={value} value={value}>
                        {label}
                        {description && (
                          <span className="ml-2 text-xs text-neutral-400">
                            {description}
                          </span>
                        )}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </label>
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-neutral-300 text-sm mb-1.5">
                    Use auto-provider
                  </p>
                  <p className="text-xs text-neutral-400/70">
                    We&apos;ll automatically select the best provider for you
                    based on your prompt.
                  </p>
                </div>
                <div
                  className={classNames(
                    "bg-neutral-700 rounded-full min-w-10 w-10 h-6 flex items-center justify-between p-1 cursor-pointer transition-all duration-200",
                    {
                      "!bg-sky-500": provider === "auto",
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
                      "w-4 h-4 rounded-full shadow-md transition-all duration-200 bg-neutral-200",
                      {
                        "translate-x-4": provider === "auto",
                      }
                    )}
                  />
                </div>
              </div>
              <label className="block">
                <p className="text-neutral-300 text-sm mb-2">
                  Inference Provider
                </p>
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
                        className="size-5 mr-2"
                        width={20}
                        height={20}
                      />
                      {PROVIDERS[id as keyof typeof PROVIDERS].name}
                      {id === provider && (
                        <RiCheckboxCircleFill className="ml-2 size-4 text-blue-500" />
                      )}
                    </Button>
                  ))}
                </div>
              </label>
            </div>
          </main>
        </PopoverContent>
      </Popover>
    </div>
  );
}
