'use client';

/**
 * SearchField — the filter input, with its icon actually inside it.
 *
 * Six pages had hand-rolled the same three parts: a `position="relative"`
 * wrapper, an `<Input>` carrying a left padding to reserve a gutter, and a
 * `<Search>` icon meant to sit in that gutter. In every one of them the icon
 * was never positioned, so it laid out as an ordinary flow child and rendered
 * ABOVE the field, leaving an empty indent beside the placeholder. Six copies
 * of one arrangement, all wrong the same way, because the arrangement was
 * retyped instead of shared.
 *
 * Distinct from `components/layout/header-search.tsx`, which is the ⌘K palette
 * trigger — that one opens a switcher, this one filters a list in place.
 */
import { Input } from '@hanzo/ui';
import { YStack } from '@hanzo/gui';
import { Search } from 'lucide-react';
import type { ComponentProps } from 'react';

export interface SearchFieldProps
  extends Omit<ComponentProps<typeof Input>, 'onChange' | 'onChangeText' | 'value'> {
  value: string;
  /**
   * Receives the TEXT. The field is a gui primitive, so it emits
   * `onChangeText` — the DOM spelling `onChange={(e) => e.target.value}` type
   * checks and then never fires, which is how six handlers in this app became
   * dead code, the agents filter among them. Taking the text here means a call
   * site cannot reach for the event and get silence.
   */
  onValueChange: (value: string) => void;
}

export function SearchField({ value, onValueChange, placeholder = 'Search…', ...rest }: SearchFieldProps) {
  return (
    <YStack position="relative" width="100%">
      {/* pointerEvents none so the icon never eats a click meant for the field. */}
      <YStack
        position="absolute"
        left="$3"
        top={0}
        bottom={0}
        justifyContent="center"
        zIndex={1}
        pointerEvents="none"
      >
        <Search size={16} />
      </YStack>
      <Input
        placeholder={placeholder}
        paddingLeft="$7"
        backgroundColor="$background"
        borderColor="$borderColor"
        value={value}
        onChangeText={onValueChange}
        {...rest}
      />
    </YStack>
  );
}
