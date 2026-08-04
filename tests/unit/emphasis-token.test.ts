/**
 * Emphasis survives nesting, or it is not emphasis.
 *
 * `@hanzo/gui` themes NEST, and a component that mounts its own scope re-bases
 * the theme's foreground inside it. Measured in the browser on /settings: at the
 * page scope `--color` is `hsl(0 0% 100%)`, but inside a `@hanzo/ui` Button's
 * own scope (and inside the sidebar's) it is `hsl(0 0% 80%)` — bit for bit the
 * value of `--color11`, the QUIET foreground.
 *
 * So a recipe that marks something as the loud thing by asking for `$color`
 * silently gets the quiet colour, and only in the places that nest. It has now
 * happened twice: `selected` painted the "you are here" row exactly like its
 * neighbours, and `accent` painted the primary action rgb(204,204,204) while the
 * `outline` button beside it — which resolves `$color12` inside the library —
 * painted rgb(255,255,255). The loudest control on the page read quieter than
 * the secondary next to it.
 *
 * `$color12` is full strength in EVERY scope, so this pins the rule rather than
 * the two call sites that have already been caught by it.
 */
import { accent, selected } from '@/lib/chrome';

describe('the chrome recipes that mean "emphasised"', () => {
  it('paint the foreground with $color12, never $color', () => {
    expect(accent.color).toBe('$color12');
    expect(selected(true).color).toBe('$color12');
  });

  it('keep the emphasis through hover, where the fill changes but the rank does not', () => {
    expect(accent.hoverStyle.color).toBe('$color12');
  });

  it('leave $color11 to the recipes that mean quiet', () => {
    expect(selected(false).color).toBe('$color11');
  });
});
