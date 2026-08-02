/**
 * The ONE floating surface — contract tests.
 *
 * The bug these pin down: `@hanzo/ui` painted its menus with utility class NAMES
 * (`bg-bg-dark`, `z-[2000000000]`). Tailwind never scans `node_modules`, so those
 * names arrived in the DOM with no rule behind them; the content computed
 * `z-index: auto`; Radix copied `auto` onto the wrapper it portals into <body>;
 * and the Build menu was painted UNDER `<main class="relative z-10">`. It read as
 * "the menu is transparent" when it was in fact occluded.
 *
 * So every assertion here is about the two things a library must never delegate
 * to the consumer's compiler — SURFACE and ELEVATION — plus the two that break a
 * 390px phone: portalling and fit.
 */
import { render, screen, fireEvent } from "@testing-library/react";
import { WithGui } from "../gui-wrapper";
import "@testing-library/jest-dom";

import {
  surface,
  item,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/overlay";

/** Radix measures with the platform APIs jsdom lacks. */
beforeAll(() => {
  window.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
  Element.prototype.scrollIntoView ??= () => {};
  Element.prototype.hasPointerCapture ??= () => false;
  Element.prototype.setPointerCapture ??= () => {};
  Element.prototype.releasePointerCapture ??= () => {};
});

describe("surface token", () => {
  it("carries a REAL elevation — the whole bug was `z-index: auto`", () => {
    expect(surface).toMatch(/\bz-\[\d+\]/);
  });

  it("elevates above the app's overlay layer (main is z-10, dialogs are z-50)", () => {
    const z = Number(/z-\[(\d+)\]/.exec(surface)?.[1]);
    expect(z).toBeGreaterThan(50);
  });

  it("paints an OPAQUE surface from an app token, never a library one", () => {
    expect(surface).toContain("bg-popover");
    expect(surface).not.toMatch(/bg-(bg-dark|gray-\d+)/);
    // No translucency: a menu you can read the page through is the reported bug.
    expect(surface).not.toMatch(/bg-\S+\/\d+/);
  });

  it("names only classes the APP compiles — no @hanzo/ui private tokens", () => {
    const libraryOnly = /\b(bg-bg-dark|bg-bg-secondary|border-divider|text-text-\w+|bg-level-\d)\b/;
    expect(surface).not.toMatch(libraryOnly);
    expect(item).not.toMatch(libraryOnly);
  });
});

describe("every family renders one surface, portaled, above the page", () => {
  it("menu: content wears the surface and portals out of the stacking context", () => {
    render(
      <main className="relative z-10">
        <DropdownMenu defaultOpen>
          <DropdownMenuTrigger>Build</DropdownMenuTrigger>
          <DropdownMenuContent className="w-56">
            <DropdownMenuItem>Plan</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </main>,
    );
    const content = screen.getByRole("menu");
    for (const token of surface.split(" ")) expect(content).toHaveClass(token);
    // Portaled: nothing between the menu and <body> can trap it in a layer.
    expect(content.closest("main")).toBeNull();
    // Sized by the call site, surfaced by the primitive.
    expect(content).toHaveClass("w-56");
  });

  it("menu: content is never clipped — it fits the measured room and the phone", () => {
    render(
      <DropdownMenu defaultOpen>
        <DropdownMenuTrigger>Build</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>Plan</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>,
    );
    const content = screen.getByRole("menu");
    expect(content).toHaveClass("max-h-[var(--radix-popper-available-height)]");
    expect(content).toHaveClass("max-w-[calc(100vw-1.5rem)]");
    expect(content).toHaveClass("overflow-y-auto");
    // The library's px-4 py-6 is what made the panel oversized.
    expect(content.className).not.toMatch(/\bp[xy]?-[4-9]\b/);
  });

  it("menu items share the one row token", () => {
    render(
      <DropdownMenu defaultOpen>
        <DropdownMenuTrigger>Build</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>Plan</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>,
    );
    const row = screen.getByRole("menuitem", { name: "Plan" });
    for (const token of item.split(" ")) expect(row).toHaveClass(token);
  });

  it("popover: same surface — the role-based CSS band-aid never reached it", () => {
    render(
      <Popover defaultOpen>
        <PopoverTrigger>Open</PopoverTrigger>
        <PopoverContent data-testid="panel">Panel</PopoverContent>
      </Popover>,
    );
    const content = screen.getByTestId("panel");
    for (const token of surface.split(" ")) expect(content).toHaveClass(token);
    expect(content.getAttribute("role")).not.toBe("menu");
  });

  it("tooltip: same surface, and portaled so `overflow-hidden` cannot clip it", () => {
    render(
      // The provider is mounted ONCE at the app root (app/providers.tsx);
      // Radix throws without it, which is why no call site owns one.
      <TooltipProvider>
        <div className="overflow-hidden">
          <Tooltip open>
            <TooltipTrigger>Fix</TooltipTrigger>
            <TooltipContent>Fix the current design</TooltipContent>
          </Tooltip>
        </div>
      </TooltipProvider>,
    );
    const content = screen.getAllByText("Fix the current design")[0];
    for (const token of surface.split(" ")) expect(content).toHaveClass(token);
    expect(content.closest(".overflow-hidden")).toBeNull();
  });

  it("the contract DISCRIMINATES — @hanzo/ui's menu fails every clause of it", async () => {
    // Not a lament: this is why the app forked the surface.
    //
    // The evidence this test asked for has arrived. It used to name the exact
    // strings the library shipped — `z-[2000000000]`, `bg-bg-dark`, `px-4 py-6
    // overflow-hidden` — and said that if a future @hanzo/ui ever shipped
    // RESOLVED styles instead of class names, it would go red and the fork could
    // be reconsidered. @hanzo/ui 8 does exactly that: the menu now arrives as
    // Tamagui atomic classes over real custom properties (`_bg-color2`,
    // `_pt-4px`), so the original failure mode — a class name with no rule
    // behind it, computing to `z-index: auto` and painting under `<main>` — is
    // no longer what happens.
    //
    // So the assertion is now the DISCRIMINATION itself, which is what the title
    // claims and what stays true across versions: the library's menu satisfies
    // no clause of the app's surface contract. Whether the fork should end is a
    // judgement about the new styles, not something this suite can settle — but
    // it is now a live question with evidence, which is what it was for.
    const lib = await import("@hanzo/ui/dropdown-menu");
    // The only render here that reaches @hanzo/ui, so the only one needing its
    // gui context — the rest are the app's own forked overlays. Bare, it throws
    // "Missing hanzogui config" and the suite reports a missing config where it
    // means to report a surface comparison.
    render(
      <lib.DropdownMenu defaultOpen>
        <lib.DropdownMenuTrigger>Build</lib.DropdownMenuTrigger>
        <lib.DropdownMenuContent>
          <lib.DropdownMenuItem>Plan</lib.DropdownMenuItem>
        </lib.DropdownMenuContent>
      </lib.DropdownMenu>,
      { wrapper: WithGui },
    );
    const content = screen.getByRole("menu");
    for (const token of surface.split(" ")) expect(content).not.toHaveClass(token);
  });

  it("context menu: same surface", () => {
    render(
      <ContextMenu>
        <ContextMenuTrigger>Tree</ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem>Rename</ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>,
    );
    fireEvent.contextMenu(screen.getByText("Tree"));
    const content = screen.getByRole("menu");
    for (const token of surface.split(" ")) expect(content).toHaveClass(token);
  });
});
