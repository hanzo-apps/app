import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

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

const ROOT = join(__dirname, '..', '..')

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
  // a switch track
  'components/usage/smart-routing-card.tsx',
])

/**
 * Index just past the `>` closing the tag that opens at `s[i]`.
 *
 * Brace- and quote-aware, and that is the whole point: `onClick={() => run()}`
 * contains a `>`, so a regex that treats the first `>` as the tag end stops in
 * the middle of the props and reports the wrong answer. A scan written that way
 * missed a third of these — including every one on the landing page.
 */
function tagEnd(s: string, i: number): number {
  let brace = 0
  let quote = ''
  for (let j = i; j < s.length; j++) {
    const c = s[j]
    if (quote) {
      if (c === quote && s[j - 1] !== '\\') quote = ''
    } else if (c === '"' || c === "'") quote = c
    else if (c === '{') brace++
    else if (c === '}') brace--
    else if (c === '>' && brace === 0) return j + 1
  }
  return -1
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

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name === '.next' || name === '.claude') continue
    const path = join(dir, name)
    if (statSync(path).isDirectory()) walk(path, out)
    else if (name.endsWith('.tsx')) out.push(path)
  }
  return out
}

it('gives every icon-only Button size="icon"', () => {
  const offenders: string[] = []
  for (const file of [...walk(join(ROOT, 'components')), ...walk(join(ROOT, 'app'))]) {
    const rel = file.slice(ROOT.length + 1)
    if (SKIP.has(rel)) continue
    const s = readFileSync(file, 'utf8')
    for (let i = s.indexOf('<Button'); i >= 0; i = s.indexOf('<Button', i + 7)) {
      const end = tagEnd(s, i)
      if (end < 0) continue
      const props = s.slice(i, end)
      if (!props.includes('aria-label')) continue
      if (/size=\{?["']icon/.test(props)) continue
      const close = s[end - 2] === '/' ? end : closeOf(s, end)
      if (close < 0) continue
      const body = s[end - 2] === '/' ? '' : s.slice(end, close)
      // strip tags, then expressions; whatever is left is a visible label
      const label = body.replace(/<[^>]*>/g, '').replace(/\{[^{}]*\}/g, '').trim()
      if (label) continue
      offenders.push(`${rel}:${s.slice(0, i).split('\n').length}`)
    }
  }
  expect(offenders).toEqual([])
})
