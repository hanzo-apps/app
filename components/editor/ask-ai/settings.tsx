import { PiGearSixFill } from "react-icons/pi";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@hanzo/ui";
import { MODELS } from "@/lib/providers";
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

export function Settings({
  open,
  onClose,
  model,
  error,
  isFollowUp = false,
  onModelChange,
}: {
  open: boolean;
  provider?: string;
  model: string;
  error?: string;
  isFollowUp?: boolean;
  onClose: React.Dispatch<React.SetStateAction<boolean>>;
  onChange?: (provider: string) => void;
  onModelChange: (model: string) => void;
}) {
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
          <header className="flex items-center justify-center text-sm px-4 py-3 border-b gap-2 bg-neutral-950 border-neutral-800 font-semibold text-neutral-200">
            Customize Settings
          </header>
          <main className="px-4 pt-5 pb-6 space-y-5">
            {error !== "" && (
              <p className="text-red-500 text-sm font-medium mb-2 flex items-center justify-between bg-red-500/10 p-2 rounded-md">
                {error}
              </p>
            )}
            <label className="block">
              <p className="text-neutral-300 text-sm mb-2.5">Choose a Zen model</p>
              <Select defaultValue={model} onValueChange={onModelChange}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a model" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Zen Models</SelectLabel>
                    {MODELS.map(
                      ({
                        value,
                        label,
                        isNew = false,
                        isThinker = false,
                      }: {
                        value: string;
                        label: string;
                        isNew?: boolean;
                        isThinker?: boolean;
                      }) => (
                        <SelectItem
                          key={value}
                          value={value}
                          className=""
                          disabled={isThinker && isFollowUp}
                        >
                          {label}
                          {isNew && (
                            <span className="text-xs bg-gradient-to-br from-sky-400 to-sky-600 text-white rounded-full px-1.5 py-0.5">
                              New
                            </span>
                          )}
                        </SelectItem>
                      )
                    )}
                  </SelectGroup>
                </SelectContent>
              </Select>
              <p className="text-xs text-neutral-400/70 mt-2">
                Powered by Hanzo AI. All inference runs on the Hanzo Cloud gateway.
              </p>
            </label>
          </main>
        </PopoverContent>
      </Popover>
    </div>
  );
}
