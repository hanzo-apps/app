/**
 * The model picker — one component, every surface that chooses a model.
 *
 * It is PRESENTATIONAL: it takes a list and gives back an id. It does not fetch,
 * cache, persist, or know where models come from. That is what let four pickers
 * exist here at once — each one that had to load its own catalog grew its own
 * loading, its own labels and its own idea of a family. Callers bring the list
 * (`useModels()` for the gateway catalog, `useProviderModels()` for a BYOK one)
 * and both get the same picker.
 *
 * Grouping, display names and marks are all decided upstream, in lib/providers
 * and components/model-icon. Nothing here re-derives a family from an id string.
 *
 * `mode="inline"` is the same list without the popover, for settings panels
 * where the picker IS the section rather than a control that opens one.
 */
'use client';

import { useMemo, useState } from 'react';
import { XStack, YStack, SizableText } from '@hanzo/gui';
import {
  Button,
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@hanzo/ui';
import { Check, ChevronsUpDown } from 'lucide-react';

import { ModelIcon } from '@/components/model-icon';
import { groupByFamily, type ModelOption } from '@/lib/providers';

/** Show the search field once scanning the list stops being practical. */
const SEARCH_AT = 10;
/** The panel tracks its trigger, but never narrows past this or overruns that. */
const MIN_WIDTH = 280;
const MAX_WIDTH = 480;
const MAX_HEIGHT = 380;

export type ModelSelectorProps = {
  models: ModelOption[];
  value?: string;
  onChange: (id: string) => void;
  disabled?: boolean;
  size?: 'sm' | 'md';
  placeholder?: string;
  /** `inline` drops the popover and renders the list directly. */
  mode?: 'popover' | 'inline';
  className?: string;
  'data-testid'?: string;
};

/** "200K" / "1M" — a context window at a glance, never the raw token count. */
function contextLabel(tokens?: number): string {
  if (!tokens) return '';
  if (tokens >= 1_000_000) {
    const m = tokens / 1_000_000;
    return `${m % 1 === 0 ? m : m.toFixed(1)}M`;
  }
  if (tokens >= 1000) return `${Math.round(tokens / 1000)}K`;
  return String(tokens);
}

export function ModelSelector({
  models,
  value,
  onChange,
  disabled = false,
  size = 'md',
  placeholder = 'Select a model',
  mode = 'popover',
  className,
  'data-testid': testId,
}: ModelSelectorProps) {
  const [open, setOpen] = useState(false);
  // The panel matches the trigger it hangs off, measured rather than guessed —
  // gui implements onLayout on web, and no Radix width variable exists to read.
  const [triggerWidth, setTriggerWidth] = useState(0);

  const groups = useMemo(() => groupByFamily(models), [models]);
  const selected = useMemo(
    () => models.find((m) => m.value === value),
    [models, value]
  );
  const small = size === 'sm';

  const list = (
    <Command backgroundColor="transparent" shouldFilter={models.length > SEARCH_AT}>
      {models.length > SEARCH_AT && <CommandInput placeholder="Search models…" />}
      <CommandList maxHeight={MAX_HEIGHT}>
        <CommandEmpty>No models found.</CommandEmpty>
        {groups.map((group) => (
          <CommandGroup key={group.key} heading={group.label}>
            {group.models.map((model) => {
              const current = model.value === value;
              const context = contextLabel(model.context);
              return (
                <CommandItem
                  key={model.value}
                  // Search reads the family, the display name AND the raw id, so
                  // "claude", "opus" and "claude-opus-4.8" all find the same row.
                  value={`${group.label} ${model.label} ${model.value}`}
                  onSelect={() => {
                    onChange(model.value);
                    if (mode === 'popover') setOpen(false);
                  }}
                >
                  {/* The chosen row keeps a rail, so the current pick stays
                      findable when the cursor has moved elsewhere. */}
                  <YStack
                    width={2}
                    alignSelf="stretch"
                    marginVertical="$1.5"
                    borderRadius={1}
                    backgroundColor={current ? '$color' : 'transparent'}
                  />
                  <ModelIcon family={model.family} label={model.label} size={18} />
                  <SizableText numberOfLines={1} fontSize="$3" color="$color12">
                    {model.label}
                  </SizableText>
                  {model.premium && (
                    <SizableText fontSize="$2" color="$color11" aria-label="Premium">
                      ✦
                    </SizableText>
                  )}
                  <XStack marginLeft="auto" alignItems="center" gap="$2" flexShrink={0}>
                    {/* `? … : null`, never `&&`: an absent context window makes
                        this the EMPTY STRING, and `'' && x` is `''`, which React
                        renders as a text node — which a gui View rejects. */}
                    {context ? (
                      <SizableText fontSize="$1" color="$color11">
                        {context}
                      </SizableText>
                    ) : null}
                    <Check size={14} opacity={current ? 1 : 0} />
                  </XStack>
                </CommandItem>
              );
            })}
          </CommandGroup>
        ))}
      </CommandList>
    </Command>
  );

  if (mode === 'inline') {
    return (
      <YStack
        className={className}
        borderWidth={1}
        borderColor="$borderColor"
        borderRadius="$4"
        overflow="hidden"
        data-testid={testId}
      >
        {list}
      </YStack>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <XStack
        width="100%"
        onLayout={(e) => setTriggerWidth(e.nativeEvent.layout.width)}
      >
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size={small ? 'sm' : 'default'}
            role="combobox"
            aria-expanded={open}
            aria-label={selected ? `Model: ${selected.label}` : placeholder}
            disabled={disabled}
            width="100%"
            justifyContent="flex-start"
            gap="$2"
            className={className}
            data-testid={testId}
          >
            {selected ? (
              <>
                <ModelIcon
                  family={selected.family}
                  label={selected.label}
                  size={small ? 14 : 16}
                />
                <SizableText
                  numberOfLines={1}
                  fontSize={small ? '$2' : '$3'}
                  color="$color12"
                >
                  {selected.label}
                </SizableText>
              </>
            ) : (
              <SizableText fontSize={small ? '$2' : '$3'} color="$color11">
                {placeholder}
              </SizableText>
            )}
            <ChevronsUpDown
              size={small ? 12 : 14}
              opacity={0.5}
              style={{ marginLeft: 'auto', flexShrink: 0 }}
            />
          </Button>
        </PopoverTrigger>
      </XStack>
      <PopoverContent
        align="start"
        sideOffset={6}
        padding="$0"
        overflow="hidden"
        width={Math.min(Math.max(triggerWidth, MIN_WIDTH), MAX_WIDTH)}
        className="frosted"
        borderWidth={1}
        borderColor="$borderColor"
      >
        {list}
      </PopoverContent>
    </Popover>
  );
}

export default ModelSelector;
