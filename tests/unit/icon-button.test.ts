import { readFileSync } from "node:fs";


import { rel, sources, tagEnd as jsxTagEnd } from '../source'

/**
 * An icon-only Button must say `size="icon"`.
 *
 * `@hanzo/ui` sets a Button's horizontal padding from
 * `[data-variant][data-size]:not([data-size^="icon"])… { padding-inline: .75rem }`.
 * That is (0,3,0); every style prop gui compiles is an atomic class at (0,2,0).
 * So the rule wins whatever the call site writes, and 24px of padding is
 * subtracted from the box before the glyph gets any. The `:not()` in that
 * selector IS the library's contract: declare the button an icon button and the
 * padding is 0 by design.
 *
 * Measured on production before this landed: the hero's replay control declared
 * `width={22}`, kept 24px of padding it could not refuse, and rendered its
 * icon at **0×0** — a control with nothing in it, on the first screen a visitor
 * sees. The comparison arrows declared 36 and drew a 10px glyph in it. Twenty
 * call sites were in this state.
 *
 * CLAUDE.md has stated the rule for a while. Nothing checked it, so the rule
 * lost twenty times. This is the check.
 *
 * Excluded below, each for a reason that is about the SHAPE and not the rule:
 * a control rendering two glyphs side by side (an icon plus a close ✕) is a
 * tab, not a square, and `size="icon"` would squash it; a control with a text
 * label is not icon-only; a switch track is not an icon box.
 */


const SKIP = new Set([
  // two glyphs side by side — a tab, not a square
  'components/chat-panel/index.tsx',
  'components/code-tabs/multi-tab-editor.tsx',
  'components/debug-panel/index.tsx',
  'components/editor/multi-tab-editor.tsx',
  'components/file-explorer/index.tsx',
  'components/preview/live-preview.tsx',
  'components/preview/multipage-preview.tsx',
  // a text label beside the glyph
  'components/editor/console/index.tsx',
  'components/editor/header/index.tsx',
  'components/editor/ask-ai/index.tsx',
  // the composer's model chip: the current model name (a dynamic expression the
  // scanner strips) sits beside a chevron — a labeled control, not an icon box.
  'components/editor/ask-ai/settings.tsx',
  // the same chip on the landing composer: `{Shown.label}` — Build or Plan —
  // beside a chevron. It reads as an offender only because the label is an
  // expression. Reachable at all from the day the tag walker learned to skip
  // comments; its `aria-label` sits behind one, so the old scan stopped short of
  // the prop and never asked about this control. Its other three icon buttons
  // are `size="icon"` or `.hz-round`, so the file hides nothing.
  'components/build-composer/index.tsx',
  // a switch track
  'components/usage/smart-routing-card.tsx',
])

/** Index just PAST the `>`, where `tests/jsx` answers with the `>` itself. */
function tagEnd(s: string, i: number): number {
  const end = jsxTagEnd(s, i)
  return end < 0 ? -1 : end + 1
}

function closeOf(s: string, from: number): number {
  let depth = 1
  let j = from
  while (j < s.length) {
    const o = s.indexOf('<Button', j)
    const c = s.indexOf('</Button', j)
    if (c < 0) return -1
    if (o >= 0 && o < c) {
      depth++
      j = o + 7
    } else {
      if (--depth === 0) return c
      j = c + 8
    }
  }
  return -1
}

it('gives every icon-only Button size="icon"', () => {
  const offenders: string[] = []
  for (const file of sources(['components', 'app'], /\.tsx$/)) {
    const relPath = rel(file)
    if (SKIP.has(relPath)) continue
    const s = readFileSync(file, 'utf8')
    for (let i = s.indexOf('<Button'); i >= 0; i = s.indexOf('<Button', i + 7)) {
      const end = tagEnd(s, i)
      if (end < 0) continue
      const props = s.slice(i, end)
      if (!props.includes('aria-label')) continue
      if (/size=\{?["']icon/.test(props)) continue
      // `.hz-round` is the second legitimate answer, and this guard exists for
      // the INVARIANT — a glyph that is not squashed — rather than for one
      // spelling of it. `size="icon"` earns its pass by zeroing the padding from
      // inside the component; `html:root .hz-composer .hz-round` (globals.css)
      // earns the same pass by pinning a 36px box AND `padding: 0`, both
      // `!important`. It exists because the size variant also pins a
      // rounded-RECTANGLE with `!important`, which no prop or inline style can
      // outrank — so a circular icon button cannot be spelled the first way.
      // Without this the composer's + and send read as offenders while being
      // measurably correct, and a guard that fails on correct code is one people
      // learn to switch off.
      if (/className=["'][^"']*\bhz-round\b/.test(props)) continue
      const close = s[end - 2] === '/' ? end : closeOf(s, end)
      if (close < 0) continue
      const body = s[end - 2] === '/' ? '' : s.slice(end, close)
      // strip tags, then expressions; whatever is left is a visible label
      const label = body.replace(/<[^>]*>/g, '').replace(/\{[^{}]*\}/g, '').trim()
      if (label) continue
      offenders.push(`${relPath}:${s.slice(0, i).split('\n').length}`)
    }
  }
  expect(offenders).toEqual([])
})
