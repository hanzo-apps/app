'use client';

/**
 * The ONE form control.
 *
 * Everything a person types into or toggles — every Input, Textarea, Label and
 * Switch — is built here, wearing one height, one radius, one type size and one
 * focus ring. There is no second place to change how a control looks.
 *
 * Why it is not `@hanzo/ui`: the same reason `components/overlay` is not. That
 * library paints itself with utility class NAMES drawn from its own private token
 * space, and Tailwind v4 never scans `node_modules`, so those names reach the DOM
 * with no rule behind them. The consequences were not cosmetic:
 *
 *   - Its Switch asks for `w-[36px] h-[20px]`, `data-[state=checked]:bg-brand`,
 *     `data-[state=unchecked]:bg-bg-secondary` and `data-[state=checked]:translate-x-4`.
 *     None were compiled, so checked and unchecked rendered PIXEL-IDENTICAL — a
 *     20x20 transparent box with a white dot that never moved. A setting you
 *     cannot read the state of is worse than an ugly one.
 *   - Its Input is a floating-LABEL field (`pt-8`, `placeholder-transparent`,
 *     absolutely-positioned adornments) that this app used as a compact one-line
 *     control. The geometry only looked right because ~60 lines of `!important`
 *     in globals.css held it down — and that override clobbered the `pl-9` a call
 *     site needs to make room for a search icon, so the magnifier painted on top
 *     of the placeholder text.
 *
 * The lesson generalizes, and it is the same one the overlay module records: a
 * distributed library must never leave its surface, its geometry or its STATE to
 * the consumer's compiler. So the app owns them, in app source, where the compiler
 * can see them — and no `!important` is needed anywhere below.
 *
 * Every class here resolves against the app's own semantic tokens (--control-h,
 * --control-radius, --control-fs, border/input/muted/primary/ring), which are
 * white-label by domain. Nothing brand-specific is hardcoded.
 */

import * as React from 'react';

import { cn } from '@/lib/utils';

/**
 * The ONE control geometry — 30px tall, 10px radius, 13px text. Shared verbatim by
 * the input and (via the tokens) by every button, so a field and the button beside
 * it line up. Written as arbitrary-value utilities so `cn()`'s twMerge can still
 * let a call site override a single axis (`pl-9`, `h-10`) without fighting.
 */
export const field =
  'flex w-full rounded-[var(--control-radius)] border border-border bg-input/70 ' +
  // `length:` is load-bearing. `text-[var(--control-fs)]` is ambiguous — Tailwind
  // and tailwind-merge both read a bare `text-[…]` as a COLOR, so `cn()` treated it
  // as conflicting with `text-foreground` and dropped it outright; the field
  // silently rendered at the 14px body size instead of the 13px control size.
  // Measured, not assumed: computed font-size was 14px until this prefix was added.
  'h-[var(--control-h)] px-2.5 text-[length:var(--control-fs)] leading-[1.1] text-foreground ' +
  'placeholder:text-muted-foreground ' +
  'transition-[border-color,background-color,box-shadow] ' +
  'hover:border-foreground/20 ' +
  // Focus is NOT the control's business: one unlayered `:focus-visible` rule in
  // globals.css rings every focusable thing in the app. A `focus:outline-none` here
  // would be a second focus system arguing with the first.
  'focus:border-ring focus:bg-input ' +
  'disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground disabled:border-transparent';

export type InputProps = React.ComponentPropsWithoutRef<'input'>;

/**
 * A one-line field. A plain <input> — not a fragment with adornment siblings — so
 * `ref` is the element, and a call site that wants an icon inside the field keeps
 * doing what it already does: a `relative` wrapper, an `absolute` icon, and a
 * padding class on the input. That padding now WINS (twMerge resolves px-2.5 vs
 * pl-9 in the class string) instead of losing to an `!important` rule.
 */
export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = 'text', ...props }, ref) => (
    <input ref={ref} type={type} data-slot="input" className={cn(field, className)} {...props} />
  ),
);
Input.displayName = 'Input';

export type TextareaProps = React.ComponentPropsWithoutRef<'textarea'>;

/**
 * The multi-line field. Same border, fill, radius and type size as Input; height
 * is the only thing it does differently, because it is the only thing that should
 * be.
 */
export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, rows = 3, ...props }, ref) => (
    <textarea
      ref={ref}
      rows={rows}
      data-slot="textarea"
      className={cn(field, 'h-auto min-h-16 resize-y py-2', className)}
      {...props}
    />
  ),
);
Textarea.displayName = 'Textarea';

/**
 * Label and Switch come from @hanzo/ui — they are not reimplemented here.
 *
 * The local Switch was a Radix + Tailwind copy of a component @hanzo/ui already
 * ships on the gui substrate with the SAME geometry (36x20 track, 16px thumb),
 * plus the 44px touch floor this copy never had. Consumers pass only
 * `checked`/`onCheckedChange`, which both accept, so the swap is transparent —
 * and it removes @radix-ui/react-switch and @radix-ui/react-label entirely.
 */
export { Label, Switch } from '@hanzo/ui';
export type { LabelProps, SwitchProps } from '@hanzo/ui';
