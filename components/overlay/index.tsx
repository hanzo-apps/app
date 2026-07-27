'use client';

/**
 * The ONE floating surface.
 *
 * Everything that leaves the document flow and paints above the page — the Build
 * menu, every Select, every Popover, the file-tree context menu, every tooltip —
 * is built here, on Radix, wearing one `surface`, one `motion`, one `fit` and one
 * `item`. There is no second place to change how a menu looks.
 *
 * Why it is not `@hanzo/ui`: that library paints itself with utility class NAMES
 * drawn from its own private token space, plus a nine-digit elevation. Tailwind
 * never scans `node_modules`, so those names reach the DOM with no rule behind
 * them. A menu then computes `z-index: auto`; Radix's popper copies that computed
 * value onto the wrapper it portals into <body>; and the panel is painted UNDER
 * `<main class="relative z-10">`, which reads as "the menu is transparent" when
 * it is merely occluded. The lesson generalizes: a distributed library must never
 * leave its surface and its elevation to the consumer's compiler. So the app owns
 * both, in app source, where the compiler can see them.
 */

import * as React from 'react';
import * as DropdownPrimitive from '@radix-ui/react-dropdown-menu';
import * as SelectPrimitive from '@radix-ui/react-select';
import * as PopoverPrimitive from '@radix-ui/react-popover';
import * as ContextPrimitive from '@radix-ui/react-context-menu';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import { Check, ChevronDown, ChevronRight, ChevronUp, Circle } from 'lucide-react';

import { cn } from '@/lib/utils';
// The ONE control geometry, so a SelectTrigger and the Input beside it are the
// same height, radius and type size by construction rather than by coincidence.
import { field } from '@/components/control';

/**
 * Opaque panel, hairline border, one radius, one shadow — and a REAL elevation.
 * `z-50` is the app's overlay layer (dialogs); menus sit one step above it at 100
 * so a Select inside a Dialog is reachable. Radix reads this computed value off
 * the content and puts it on the portaled wrapper, so it must be a class the app
 * compiles, never one only the library knows about.
 */
export const surface =
  'z-[100] rounded-xl border border-border bg-popover text-popover-foreground ' +
  'shadow-[0_16px_40px_-16px_rgba(0,0,0,0.9),0_0_0_0.5px_rgba(255,255,255,0.04)]';

/** One open/close transition for every surface. */
export const motion =
  'data-[state=open]:animate-in data-[state=closed]:animate-out ' +
  'data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0 ' +
  'data-[state=open]:zoom-in-95 data-[state=closed]:zoom-out-95 ' +
  'data-[side=bottom]:slide-in-from-top-1 data-[side=top]:slide-in-from-bottom-1 ' +
  'data-[side=left]:slide-in-from-right-1 data-[side=right]:slide-in-from-left-1';

/**
 * Never taller than the room Radix measured, never wider than the phone. This is
 * what keeps a menu from being clipped at 390px instead of hoping it is short.
 */
export const fit =
  'max-h-[var(--radix-popper-available-height)] max-w-[calc(100vw-1.5rem)] overflow-y-auto overscroll-contain';

/** One row. Every family's item, checkbox, radio and option share it. */
export const item =
  'relative flex cursor-default select-none items-center gap-2 rounded-lg px-2 py-1.5 text-sm outline-none ' +
  'transition-colors focus:bg-accent focus:text-accent-foreground ' +
  'data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground ' +
  'data-[disabled]:pointer-events-none data-[disabled]:opacity-50 ' +
  '[&_svg]:size-4 [&_svg]:shrink-0';

const label = 'px-2 py-1.5 text-xs font-medium text-muted-foreground';
const separator = '-mx-1 my-1 h-px bg-border';
/** Room for the tick a checkbox/radio/option draws in the gutter. */
const marked = 'pl-8';

/** Distance from the trigger, and from the viewport edge, for every surface. */
const OFFSET = 6;
const PADDING = 12;

/* ── Menu (dropdown) ─────────────────────────────────────────────────────── */

export const DropdownMenu = DropdownPrimitive.Root;
export const DropdownMenuTrigger = DropdownPrimitive.Trigger;
export const DropdownMenuGroup = DropdownPrimitive.Group;
export const DropdownMenuPortal = DropdownPrimitive.Portal;
export const DropdownMenuSub = DropdownPrimitive.Sub;
export const DropdownMenuRadioGroup = DropdownPrimitive.RadioGroup;

export const DropdownMenuContent = React.forwardRef<
  React.ComponentRef<typeof DropdownPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DropdownPrimitive.Content>
>(({ className, sideOffset = OFFSET, collisionPadding = PADDING, ...props }, ref) => (
  <DropdownPrimitive.Portal>
    <DropdownPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      collisionPadding={collisionPadding}
      className={cn(surface, motion, fit, 'min-w-[8rem] p-1', className)}
      {...props}
    />
  </DropdownPrimitive.Portal>
));
DropdownMenuContent.displayName = 'DropdownMenuContent';

export const DropdownMenuItem = React.forwardRef<
  React.ComponentRef<typeof DropdownPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof DropdownPrimitive.Item> & { inset?: boolean }
>(({ className, inset, ...props }, ref) => (
  <DropdownPrimitive.Item ref={ref} className={cn(item, inset && marked, className)} {...props} />
));
DropdownMenuItem.displayName = 'DropdownMenuItem';

export const DropdownMenuCheckboxItem = React.forwardRef<
  React.ComponentRef<typeof DropdownPrimitive.CheckboxItem>,
  React.ComponentPropsWithoutRef<typeof DropdownPrimitive.CheckboxItem>
>(({ className, children, checked, ...props }, ref) => (
  <DropdownPrimitive.CheckboxItem
    ref={ref}
    checked={checked}
    className={cn(item, marked, className)}
    {...props}
  >
    <span className="absolute left-2 flex size-4 items-center justify-center">
      <DropdownPrimitive.ItemIndicator>
        <Check className="size-4" />
      </DropdownPrimitive.ItemIndicator>
    </span>
    {children}
  </DropdownPrimitive.CheckboxItem>
));
DropdownMenuCheckboxItem.displayName = 'DropdownMenuCheckboxItem';

export const DropdownMenuRadioItem = React.forwardRef<
  React.ComponentRef<typeof DropdownPrimitive.RadioItem>,
  React.ComponentPropsWithoutRef<typeof DropdownPrimitive.RadioItem>
>(({ className, children, ...props }, ref) => (
  <DropdownPrimitive.RadioItem ref={ref} className={cn(item, marked, className)} {...props}>
    <span className="absolute left-2 flex size-4 items-center justify-center">
      <DropdownPrimitive.ItemIndicator>
        <Circle className="size-2 fill-current" />
      </DropdownPrimitive.ItemIndicator>
    </span>
    {children}
  </DropdownPrimitive.RadioItem>
));
DropdownMenuRadioItem.displayName = 'DropdownMenuRadioItem';

export const DropdownMenuLabel = React.forwardRef<
  React.ComponentRef<typeof DropdownPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof DropdownPrimitive.Label> & { inset?: boolean }
>(({ className, inset, ...props }, ref) => (
  <DropdownPrimitive.Label ref={ref} className={cn(label, inset && marked, className)} {...props} />
));
DropdownMenuLabel.displayName = 'DropdownMenuLabel';

export const DropdownMenuSeparator = React.forwardRef<
  React.ComponentRef<typeof DropdownPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof DropdownPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <DropdownPrimitive.Separator ref={ref} className={cn(separator, className)} {...props} />
));
DropdownMenuSeparator.displayName = 'DropdownMenuSeparator';

export const DropdownMenuSubTrigger = React.forwardRef<
  React.ComponentRef<typeof DropdownPrimitive.SubTrigger>,
  React.ComponentPropsWithoutRef<typeof DropdownPrimitive.SubTrigger> & { inset?: boolean }
>(({ className, inset, children, ...props }, ref) => (
  <DropdownPrimitive.SubTrigger
    ref={ref}
    className={cn(item, 'data-[state=open]:bg-accent', inset && marked, className)}
    {...props}
  >
    {children}
    <ChevronRight className="ml-auto size-4" />
  </DropdownPrimitive.SubTrigger>
));
DropdownMenuSubTrigger.displayName = 'DropdownMenuSubTrigger';

export const DropdownMenuSubContent = React.forwardRef<
  React.ComponentRef<typeof DropdownPrimitive.SubContent>,
  React.ComponentPropsWithoutRef<typeof DropdownPrimitive.SubContent>
>(({ className, collisionPadding = PADDING, ...props }, ref) => (
  <DropdownPrimitive.SubContent
    ref={ref}
    collisionPadding={collisionPadding}
    className={cn(surface, motion, fit, 'min-w-[8rem] p-1', className)}
    {...props}
  />
));
DropdownMenuSubContent.displayName = 'DropdownMenuSubContent';

/* ── Select (listbox) ────────────────────────────────────────────────────── */

export const Select = SelectPrimitive.Root;
export const SelectGroup = SelectPrimitive.Group;
export const SelectValue = SelectPrimitive.Value;

export const SelectTrigger = React.forwardRef<
  React.ComponentRef<typeof SelectPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Trigger
    ref={ref}
    /*
     * The trigger is the one part of a Select that is NOT a floating surface — it
     * is a control, and it sits next to inputs. It used to carry its own geometry
     * (36px tall, 8px radius, 14px text) while `components/control` built fields at
     * 30/10/13, so a select and the input beside it never lined up. It now wears the
     * SAME `field` spec; the panel below is still this module's business.
     */
    className={cn(
      field,
      'items-center justify-between gap-2',
      'data-[placeholder]:text-muted-foreground',
      'disabled:opacity-50 [&>span]:line-clamp-1 [&>span]:text-left',
      className,
    )}
    {...props}
  >
    {children}
    <SelectPrimitive.Icon asChild>
      <ChevronDown className="size-4 shrink-0 opacity-50" />
    </SelectPrimitive.Icon>
  </SelectPrimitive.Trigger>
));
SelectTrigger.displayName = 'SelectTrigger';

export const SelectContent = React.forwardRef<
  React.ComponentRef<typeof SelectPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(({ className, children, position = 'popper', ...props }, ref) => (
  <SelectPrimitive.Portal>
    <SelectPrimitive.Content
      ref={ref}
      position={position}
      sideOffset={OFFSET}
      className={cn(
        surface,
        motion,
        'max-h-[var(--radix-select-content-available-height)] max-w-[calc(100vw-1.5rem)] min-w-[8rem] overflow-hidden',
        className,
      )}
      {...props}
    >
      <SelectPrimitive.ScrollUpButton className="flex h-6 items-center justify-center">
        <ChevronUp className="size-4" />
      </SelectPrimitive.ScrollUpButton>
      <SelectPrimitive.Viewport
        className={cn(
          'p-1',
          position === 'popper' && 'w-full min-w-[var(--radix-select-trigger-width)]',
        )}
      >
        {children}
      </SelectPrimitive.Viewport>
      <SelectPrimitive.ScrollDownButton className="flex h-6 items-center justify-center">
        <ChevronDown className="size-4" />
      </SelectPrimitive.ScrollDownButton>
    </SelectPrimitive.Content>
  </SelectPrimitive.Portal>
));
SelectContent.displayName = 'SelectContent';

export const SelectItem = React.forwardRef<
  React.ComponentRef<typeof SelectPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Item ref={ref} className={cn(item, marked, className)} {...props}>
    <span className="absolute left-2 flex size-4 items-center justify-center">
      <SelectPrimitive.ItemIndicator>
        <Check className="size-4" />
      </SelectPrimitive.ItemIndicator>
    </span>
    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
  </SelectPrimitive.Item>
));
SelectItem.displayName = 'SelectItem';

export const SelectLabel = React.forwardRef<
  React.ComponentRef<typeof SelectPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Label>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Label ref={ref} className={cn(label, className)} {...props} />
));
SelectLabel.displayName = 'SelectLabel';

export const SelectSeparator = React.forwardRef<
  React.ComponentRef<typeof SelectPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Separator ref={ref} className={cn(separator, className)} {...props} />
));
SelectSeparator.displayName = 'SelectSeparator';

/* ── Popover (anchored panel) ────────────────────────────────────────────── */

export const Popover = PopoverPrimitive.Root;
export const PopoverTrigger = PopoverPrimitive.Trigger;
export const PopoverAnchor = PopoverPrimitive.Anchor;
export const PopoverClose = PopoverPrimitive.Close;

export const PopoverContent = React.forwardRef<
  React.ComponentRef<typeof PopoverPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content>
>(
  (
    { className, align = 'center', sideOffset = OFFSET, collisionPadding = PADDING, ...props },
    ref,
  ) => (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        ref={ref}
        align={align}
        sideOffset={sideOffset}
        collisionPadding={collisionPadding}
        className={cn(surface, motion, fit, 'w-72 p-4', className)}
        {...props}
      />
    </PopoverPrimitive.Portal>
  ),
);
PopoverContent.displayName = 'PopoverContent';

/* ── Context menu (right-click) ──────────────────────────────────────────── */

export const ContextMenu = ContextPrimitive.Root;
export const ContextMenuTrigger = ContextPrimitive.Trigger;
export const ContextMenuGroup = ContextPrimitive.Group;
export const ContextMenuSub = ContextPrimitive.Sub;
export const ContextMenuRadioGroup = ContextPrimitive.RadioGroup;

export const ContextMenuContent = React.forwardRef<
  React.ComponentRef<typeof ContextPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof ContextPrimitive.Content>
>(({ className, collisionPadding = PADDING, ...props }, ref) => (
  <ContextPrimitive.Portal>
    <ContextPrimitive.Content
      ref={ref}
      collisionPadding={collisionPadding}
      className={cn(surface, motion, fit, 'min-w-[8rem] p-1', className)}
      {...props}
    />
  </ContextPrimitive.Portal>
));
ContextMenuContent.displayName = 'ContextMenuContent';

export const ContextMenuItem = React.forwardRef<
  React.ComponentRef<typeof ContextPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof ContextPrimitive.Item> & { inset?: boolean }
>(({ className, inset, ...props }, ref) => (
  <ContextPrimitive.Item ref={ref} className={cn(item, inset && marked, className)} {...props} />
));
ContextMenuItem.displayName = 'ContextMenuItem';

export const ContextMenuLabel = React.forwardRef<
  React.ComponentRef<typeof ContextPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof ContextPrimitive.Label>
>(({ className, ...props }, ref) => (
  <ContextPrimitive.Label ref={ref} className={cn(label, className)} {...props} />
));
ContextMenuLabel.displayName = 'ContextMenuLabel';

export const ContextMenuSeparator = React.forwardRef<
  React.ComponentRef<typeof ContextPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof ContextPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <ContextPrimitive.Separator ref={ref} className={cn(separator, className)} {...props} />
));
ContextMenuSeparator.displayName = 'ContextMenuSeparator';

/* ── Tooltip ─────────────────────────────────────────────────────────────── */

/**
 * Mounted ONCE, at the app root (see app/providers.tsx). Hover delay and the
 * grouped skip-delay describe the session, not the button — a provider per call
 * site gives every toolbar its own clock and breaks the grouping.
 */
export const TooltipProvider = TooltipPrimitive.Provider;
export const Tooltip = TooltipPrimitive.Root;
export const TooltipTrigger = TooltipPrimitive.Trigger;

export const TooltipContent = React.forwardRef<
  React.ComponentRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(({ className, sideOffset = OFFSET, collisionPadding = PADDING, ...props }, ref) => (
  <TooltipPrimitive.Portal>
    <TooltipPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      collisionPadding={collisionPadding}
      className={cn(surface, motion, 'max-w-[280px] px-2.5 py-1.5 text-xs', className)}
      {...props}
    />
  </TooltipPrimitive.Portal>
));
TooltipContent.displayName = 'TooltipContent';
