// Regenerate app/gui.css — the @hanzo/gui sheet as a static asset, pruned to
// the themes this app actually uses. Run after changing lib/gui.config.ts:
//   node scripts/gen-gui-css.mjs
//
// GuiProvider renders with disableInjectCSS, so this file is the ONE source of
// gui styles; without it every HTML document carried the sheet inline (350KB,
// uncacheable, re-sent on every navigation).
//
// Pruning: config.getCSS() emits every theme in the config — 12 color families
// (blue/red/green/…) × light/dark × component sub-themes — but this app only
// ever mounts light/dark (+ accent and the component sub-themes gui activates
// itself: SwitchThumb, Tooltip, Button, Input, …). The color-family rules are
// ~280KB of the 350KB. We drop any selector referencing an unused color theme;
// the runtime cannot re-insert theme CSS (themes hydrate FROM this sheet via
// the `.tm_xxt` sentinel — see @hanzogui/web insertStyleRule/getThemeCSSRules),
// so anything kept here is what the app can render. A rule whose survivors are
// only the bare `.tm_xxt` sentinel is dead (the runtime requires selectors to
// start with `:root`) and is dropped whole.
import { execSync } from 'node:child_process'
import { writeFileSync, rmSync } from 'node:fs'

// Theme families the app never mounts (source of truth: grep app/components/lib
// for theme=/Theme name= — only light/dark appear). Extend if the config grows.
const DROP =
  /^t_(light_|dark_)?(black|white|blue|gray|green|orange|pink|purple|red|teal|yellow|neutral)(_|$)/

const splitRules = (s) => {
  let depth = 0,
    start = 0
  const out = []
  for (let i = 0; i < s.length; i++) {
    const c = s[i]
    if (c === '{') depth++
    else if (c === '}' && --depth === 0) {
      out.push(s.slice(start, i + 1))
      start = i + 1
    }
  }
  return out
}

const keepSelector = (sel) =>
  !(sel.match(/\.[A-Za-z0-9_-]+/g) || []).some((c) => DROP.test(c.slice(1)))

const pruneRules = (rules) => {
  const out = []
  for (const rule of rules) {
    const open = rule.indexOf('{')
    const sel = rule.slice(0, open).trim()
    if (sel.startsWith('@media') || sel.startsWith('@supports')) {
      const inner = pruneRules(splitRules(rule.slice(open + 1, rule.lastIndexOf('}')))).join('')
      if (inner.trim()) out.push(`${sel}{${inner}}`)
      continue
    }
    if (sel.startsWith('@')) {
      out.push(rule)
      continue
    }
    const kept = [...new Set(sel.split(',').map((s) => s.trim()))].filter(keepSelector)
    // a lone `.tm_xxt` survivor is an unused theme's hydration sentinel: dead
    if (!kept.length || kept.every((s) => s === '.tm_xxt')) continue
    out.push(kept.join(', ') + rule.slice(open))
  }
  return out
}

execSync(
  'npx esbuild lib/gui.config.ts --bundle --format=esm --platform=node --external:react --external:react-dom --external:react-native --alias:react-native=react-native-web --outfile=.guicfg.gen.mjs --log-level=error',
  { stdio: 'inherit' }
)
const { config } = await import(new URL('../.guicfg.gen.mjs', import.meta.url))
const full = config.getCSS()
const pruned = pruneRules(splitRules(full)).join('\n')
writeFileSync(new URL('../app/gui.css', import.meta.url), pruned)
rmSync(new URL('../.guicfg.gen.mjs', import.meta.url))
console.log(`app/gui.css regenerated: ${full.length} -> ${pruned.length} bytes`)
