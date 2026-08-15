#!/usr/bin/env node
// Catch gui style props given a value gui SILENTLY misreads or throws away.
//
// This is one bug class, not six bugs. An unknown prop is harmless — gui passes
// it through to the DOM where you can see it sitting there in devtools. The
// dangerous shape is a prop gui RECOGNIZES holding a value it cannot use: the
// declaration vanishes with no attribute, no console warning, and a green
// build. Every defect from the Tailwind->prop rewrite has that shape, which is
// why a passing `next build` said nothing about any of them.
//
// Each rule below was measured in Chromium against this app's real config
// (getComputedStyle on a rendered probe), never inferred from the gui source:
//
//   lineHeight={1.05}      -> line-height: 1.05px      (h1 box 2px tall)
//   lineHeight="1.05"      -> line-height: 42px @40px  <- how you spell a ratio
//   letterSpacing={0.02}   -> letter-spacing: 0.02px   (invisible)
//   letterSpacing="0.02em" -> letter-spacing: 0.8px
//   top="-3"               -> top: 0px                 (declaration dropped)
//   y="-3"                 -> transform: none          (WHOLE transform dropped)
//   top={-3}               -> top: -3px
//   color="1.9rem"         -> falls back to theme color
//   width="#fff"           -> dropped; box stretched to the viewport
//   $gtSm={{fontSize:99}}  -> inert at every viewport width
//   $sm={{fontSize:99}}    -> 99px >=640, base <640
//   left="50%" x="50%"     -> left edge at 600 of a 1000 host (should be 400)
//   left="50%" x="-50%"    -> left edge at 400  <- the centering idiom
//
// Note what is NOT flagged, because measurement said it is correct: `x="-50%"`
// keeps its unit (translateX(-50%) of a 200px box = -100px, exactly right), and
// a bare number IS the right spelling when you mean pixels (`lineHeight={10}`
// under a 10px font). Flagging those would make this noisy, and a noisy lint
// gets switched off — after which nothing is checked at all.
//
// Facts come from gui itself, never a copy: the unitless-prop table and the
// color-prop table are gui's own, and the breakpoint names are the config's.
// A hardcoded list here would drift the first time gui changed.
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { execFileSync } from 'node:child_process'
import ts from 'typescript'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const require_ = createRequire(import.meta.url)

// ── gui's own tables ────────────────────────────────────────────────────────
// `stylePropsUnitless` is the exact table gui's normalizeValueWithProperty
// consults before appending `px`, so it is also the exact set of props for
// which a bare numeric string is legitimate CSS (fontWeight="500", opacity="0.5").
// pnpm does not hoist gui's own deps, so resolve them from gui's directory.
const load = () => {
  const guiDir = path.dirname(require_.resolve('@hanzo/gui/package.json'))
  const helpers = require_(require_.resolve('@hanzogui/helpers', { paths: [guiDir] }))
  return {
    unitless: helpers.stylePropsUnitless,
    styleProps: helpers.stylePropsAll,
    colorProps: helpers.tokenCategories.color,
  }
}

// The breakpoint names this config actually defines. `defaultConfig` is the
// object the app's `lib/gui.ts` config is built from; createGui passes `media`
// through untouched, and importing the assembled config instead would drag in
// the whole React Native Web runtime (measured: it never finished).
const loadMedia = async () => (await import('@hanzogui/config/v5')).defaultConfig.media

// ── value shapes ────────────────────────────────────────────────────────────
const BARE_NUMBER = /^-?(\d+\.?\d*|\.\d+)$/
const UNIT = /^-?(\d+\.?\d*|\.\d+)(px|rem|em|%|vh|vw|vmin|vmax|ch|ex|pt|cm|mm|in|pc|fr)$/

// Props where a bare numeric STRING is legitimate, over and above gui's own
// unitless table. That table answers a different question — when gui appends
// `px` to a NUMBER — so using it alone flagged 128 correct `lineHeight="1.625"`
// call sites. What actually decides this is whether CSS accepts a bare number
// for the property, so it was measured rather than reasoned about (Chromium,
// this app's config, bare numeric string in every case):
//   lineHeight="1.5"  -> 60px on a 40px font   ACCEPTED (CSS ratio)
//   borderWidth="3"   -> 3px                   ACCEPTED (gui expands border)
//   fontSize="30"     -> 14px                  dropped
//   letterSpacing="2" -> normal                dropped
//   width="123"       -> 1000px (stretched)    dropped
//   marginTop="13"    -> 0px                   dropped
//   top="21"          -> 0px                   dropped
//   y="25"            -> transform: none       dropped, and voids the transform
const CSS_ACCEPTS_BARE_NUMBER = /^(lineHeight|(border|outline)[A-Za-z]*Width)$/

const COLORISH = /^(#[0-9a-fA-F]{3,8}$|(rgba?|hsla?|oklch|oklab|lab|lch|color)\()/
// A `$token` resolves through the config; `calc(...)`/`var(...)` are passed to
// CSS verbatim. Neither is this lint's business.
const OPAQUE = (v) => v.startsWith('$') || /^(calc|var|min|max|clamp|env)\(/.test(v)

// ── rules ───────────────────────────────────────────────────────────────────
// Each returns a message, or null. `prop` is the style prop name, `value` the
// literal the author wrote. Thresholds are set where the measured failure is
// unambiguous, so that every legitimate value already in this repo passes.
const rules = (facts) => [
  {
    id: 'line-height-px',
    // Nobody sets a line box to under 4 PIXELS. A number that small is a ratio
    // that lost its quotes, and gui renders it as `1.05px` — the hero h1 that
    // shipped 2px tall.
    test: ({ prop, num }) =>
      prop === 'lineHeight' && num !== null && num !== 0 && Math.abs(num) < 4
        ? `lineHeight={${num}} renders line-height:${num}px — a bare number is PIXELS in gui. `
          + `For a ratio quote it: lineHeight="${num}".`
        : null,
  },
  {
    id: 'letter-spacing-px',
    // Real tracking here is ±0.3-0.4px. Under a tenth of a pixel is an `em`
    // value that lost its unit and now renders as nothing.
    test: ({ prop, num }) =>
      prop === 'letterSpacing' && num !== null && num !== 0 && Math.abs(num) < 0.1
        ? `letterSpacing={${num}} renders letter-spacing:${num}px — invisible. `
          + `A bare number is PIXELS; for an em ratio write letterSpacing="${num}em".`
        : null,
  },
  {
    id: 'unitless-string',
    // `top="-3"` emits `top: -3`, which is not a length, so the browser drops
    // the whole declaration. On a transform shorthand it is worse: one bad
    // component voids the entire transform.
    test: ({ prop, str, facts: f }) =>
      str !== null
      && BARE_NUMBER.test(str)
      && f.styleProps[prop]
      && !f.unitless[prop]
      && !CSS_ACCEPTS_BARE_NUMBER.test(prop)
        ? `${prop}="${str}" emits an unusable value — the declaration is DROPPED. `
          + `Write ${prop}={${str}} for pixels, or ${prop}="$${str}" for the token.`
        : null,
  },
  {
    id: 'color-length-swap',
    // Measured both directions: a length on a color prop falls back to the
    // theme colour, a colour on a length prop is dropped and the box collapses
    // or stretches.
    test: ({ prop, str, facts: f }) => {
      if (str === null || OPAQUE(str)) return null
      if (f.colorProps[prop] && UNIT.test(str))
        return `${prop}="${str}" is a length on a COLOR prop — gui discards it and falls back to the theme.`
      if (!f.colorProps[prop] && f.styleProps[prop] && COLORISH.test(str))
        return `${prop}="${str}" is a color on a NON-COLOR prop — the declaration is dropped.`
      return null
    },
  },
]

// ── the checker ─────────────────────────────────────────────────────────────
const isUpper = (c) => c >= 'A' && c <= 'Z'

// Only gui/ui components. `<rect x="0" y="0">` inside an inline SVG is a real
// SVG attribute, not a transform shorthand — lowercase tags are left alone.
const componentName = (node) => {
  const tag = node.tagName
  const name = ts.isPropertyAccessExpression(tag) ? tag.name.text : tag.getText?.() ?? ''
  return name && isUpper(name[0]) ? name : null
}

function check(file, source, facts, media, out) {
  const sf = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
  const active = rules(facts)
  const at = (node) => {
    const { line, character } = sf.getLineAndCharacterOfPosition(node.getStart(sf))
    return { line: line + 1, col: character + 1 }
  }
  const report = (node, id, message) => out.push({ file, ...at(node), id, message })

  // A JSX literal, or an object-literal property value, reduced to the two
  // things the rules care about: the number written, or the string written.
  const literal = (expr) => {
    if (!expr) return { num: null, str: null }
    if (ts.isStringLiteral(expr)) return { num: null, str: expr.text }
    if (ts.isJsxExpression(expr)) return literal(expr.expression)
    if (ts.isNumericLiteral(expr)) return { num: Number(expr.text), str: null }
    if (ts.isPrefixUnaryExpression(expr) && expr.operator === ts.SyntaxKind.MinusToken)
      return ts.isNumericLiteral(expr.operand)
        ? { num: -Number(expr.operand.text), str: null }
        : { num: null, str: null }
    if (ts.isNoSubstitutionTemplateLiteral(expr)) return { num: null, str: expr.text }
    return { num: null, str: null }
  }

  const apply = (node, prop, expr) => {
    const { num, str } = literal(expr)
    if (num === null && str === null) return
    for (const rule of active) {
      const message = rule.test({ prop, num, str, facts })
      if (message) report(node, rule.id, message)
    }
  }

  const visit = (node) => {
    if (ts.isJsxOpeningLikeElement(node) && componentName(node)) {
      const props = new Map()
      for (const attr of node.attributes.properties) {
        if (!ts.isJsxAttribute(attr) || !ts.isIdentifier(attr.name)) continue
        const name = attr.name.text
        props.set(name, attr)

        if (name.startsWith('$')) {
          const key = name.slice(1)
          // `$group-*`, `$theme-*`, `$platform-*` are gui's own selector
          // families, not breakpoints — only media names are checked here.
          const isSelector = /^(group|theme|platform)(-|$)/.test(key)
          if (!isSelector && !(key in media)) {
            report(
              attr,
              'unknown-breakpoint',
              `$${key} is not a breakpoint in this config — it is silently INERT at every width. `
                + `Defined: ${Object.keys(media).filter((k) => !k.includes('height')).join(' ')}.`
            )
          }
          // The same bad values hide inside responsive overrides.
          const v = attr.initializer
          if (v && ts.isJsxExpression(v) && v.expression && ts.isObjectLiteralExpression(v.expression))
            for (const p of v.expression.properties)
              if (ts.isPropertyAssignment(p) && (ts.isIdentifier(p.name) || ts.isStringLiteral(p.name)))
                apply(p, p.name.text, p.initializer)
          continue
        }
        apply(attr, name, attr.initializer)
      }

      // The lost minus sign. `left:50%` + `translateX(50%)` puts the element a
      // full width to the RIGHT of centre; centring needs the negative. Every
      // occurrence of this came from `left-1/2 -translate-x-1/2` being rewritten
      // without its `-`. Requiring the companion prop keeps this to the
      // centring idiom and off anything deliberate.
      for (const [shorthand, companion, axis] of [['x', 'left', 'X'], ['y', 'top', 'Y']]) {
        const attr = props.get(shorthand)
        if (!attr || !props.has(companion)) continue
        const { str } = literal(attr.initializer)
        if (str === '50%')
          report(
            attr,
            'centering-sign',
            `${shorthand}="50%" beside ${companion} translates${axis} the WRONG WAY — it lands a full `
              + `element-size past centre. The centring idiom is ${shorthand}="-50%".`
          )
      }
    }
    ts.forEachChild(node, visit)
  }
  visit(sf)
}

// ── entry ───────────────────────────────────────────────────────────────────
// Same source set jest already collects coverage from. `templates/` is
// user-facing scaffolding, not this app's rendered surface, and is excluded
// there for the same reason.
export const DIRS = ['app', 'components', 'lib', 'hooks']

export async function run(root = ROOT) {
  const facts = load()
  const media = await loadMedia()
  // Directories, then filter by extension here. A `dir/**/*.tsx` pathspec looks
  // equivalent and is not: git's wildmatch wants `**` to span at least one
  // directory, so it skips `app/page.tsx` — the landing page, and the file the
  // original defect shipped in. The mutation test is what surfaced that.
  const files = execFileSync(
    'git',
    ['ls-files', '-z', '--cached', '--others', '--exclude-standard', '--', ...DIRS],
    { cwd: root, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }
  )
    .split('\0')
    .filter((f) => f.endsWith('.tsx'))

  const out = []
  for (const rel of files) check(rel, readFileSync(path.join(root, rel), 'utf8'), facts, media, out)
  out.sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line || a.col - b.col)
  return { findings: out, fileCount: files.length }
}

// Exported so the tests can drive the analysis on a fixture without touching
// the filesystem — one implementation, no second copy to keep in step.
export async function checkSource(source, file = 'test.tsx') {
  const out = []
  check(file, source, load(), await loadMedia(), out)
  return out
}

// Kept out of top-level await: the tests import this module through jest, which
// transforms it to CJS, where a top-level await is a syntax error.
if (import.meta.url === `file://${process.argv[1]}`) {
  run().then(({ findings, fileCount }) => {
    for (const f of findings) console.error(`${f.file}:${f.line}:${f.col}  ${f.id}  ${f.message}`)
    if (findings.length) {
      console.error(`\n${findings.length} gui prop value(s) that gui silently misreads, in ${fileCount} files.`)
      process.exit(1)
    }
    console.log(`gui prop values OK — ${fileCount} files, 0 findings.`)
  })
}
