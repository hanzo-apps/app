// What this app DELIVERS per route, and how much of it the markup uses.
//
//   node scripts/measure-css.mjs <baseUrl> [label]
//
// Four ways to get this wrong, all of them found the hard way in this repo:
//
//   1. @hanzo/gui's runtime writes atomic rules through `CSSStyleSheet.insertRule`.
//      A <style> filled that way has EMPTY textContent, so counting text gives a
//      false zero and someone concludes the sheet is missing. We read
//      `sheet.cssRules`, which sees rules however they arrived.
//   2. Rules arrive BOTH inline in the document and in linked .css files. Counting
//      only the linked files misses the runtime half; only inline misses the build
//      half. Every rule is attributed to its own sheet's origin.
//   3. Atomic selectors are `:root ._bg-color5`, never `._bg-color5` on its own —
//      a `startsWith('._')` test reports 9 atomic rules where there are a thousand.
//   4. CSS Nesting gives every CSSStyleRule its own `.cssRules` list, so a
//      recursion that tests `cssRules` before `selectorText` walks into every style
//      rule, finds nothing, and reads 500 KB of sheet as 4 KB. At-rules only.
//
// Two verdicts come out of it. COVERAGE decides whether a change broke anything:
// every atomic class the markup renders must have a rule somewhere. DELIVERY
// decides whether it was worth it: CSS that moves from the document into a linked
// file is a win only if the total did not grow — and JS is reported beside it
// because the extractor pays for flattening in bundle bytes.
import { chromium } from '@playwright/test'

const base = process.argv[2] || 'http://127.0.0.1:3000'
const label = process.argv[3] || 'run'

const ROUTES = ['/', '/pricing', '/templates', '/gallery', '/community', '/enterprise', '/new', '/install']

// Classes no stylesheet is expected to declare: state markers the runtime reads
// (`is_Text`), framework hooks, lucide's icon handles, and the app's own data
// attributes. A marker with no rule is not a missing style, it is a flag.
const MARKER = /^(is_|t_|tm_|_dsp-contents$|font-|__variable|__className|lucide|dark$|light$|group$|peer$)/

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })

const allClasses = new Set()
const allRuleClasses = new Set()
const perRoute = []

for (const route of ROUTES) {
  const resp = await page.goto(base + route, { waitUntil: 'networkidle', timeout: 60000 }).catch(() => null)
  if (!resp || resp.status() >= 400) {
    perRoute.push({ route, status: resp ? resp.status() : 'ERR', skipped: true })
    continue
  }
  // Let the runtime finish inserting; gui inserts on mount and on theme resolve.
  await page.waitForTimeout(1200)

  const m = await page.evaluate(() => {
    const CLASS = /\.((?:[_a-zA-Z0-9-]|\\.)+)/g
    const classesIn = (sel) => {
      const out = []
      let hit
      CLASS.lastIndex = 0
      while ((hit = CLASS.exec(sel))) out.push(hit[1].replace(/\\/g, ''))
      return out
    }

    // `cond` carries the enclosing at-rule text so two identical rule bodies under
    // different media queries are not counted as duplicates of each other.
    const walk = (rules, out, cond) => {
      for (const r of rules) {
        if (r.selectorText) out.push({ sel: r.selectorText, text: r.cssText, cond })
        else if (r.cssRules) walk(r.cssRules, out, `${cond}|${r.conditionText || r.cssText.slice(0, 40)}`)
        else if (r.cssText) out.push({ sel: '@', text: r.cssText, cond })
      }
    }

    const inline = []
    const linked = []
    for (const sheet of document.styleSheets) {
      let rules
      try {
        rules = sheet.cssRules
      } catch {
        continue // cross-origin, cannot read — none expected, fonts are self-hosted
      }
      const out = []
      walk(rules, out, '')
      ;(sheet.href ? linked : inline).push(...out)
    }

    const bytes = (a) => a.reduce((n, r) => n + r.text.length, 0)
    const atomic = (a) => a.filter((r) => /\._/.test(r.sel))
    const stat = (a) => ({
      rules: a.length,
      distinct: new Set(a.map((r) => r.cond + r.text)).size,
      bytes: bytes(a),
    })

    const ruleClasses = new Set()
    for (const { sel } of [...inline, ...linked]) for (const c of classesIn(sel)) ruleClasses.add(c)

    const classes = new Set()
    for (const el of document.querySelectorAll('*')) {
      const cn = el.getAttribute('class')
      if (cn) for (const c of cn.split(/\s+/)) if (c) classes.add(c)
    }

    // Wire bytes: what the browser really pulls. cssRules serialization is
    // normalized text, not the file on disk, and JS is the extractor's other bill.
    const wire = { doc: performance.getEntriesByType('navigation')[0]?.decodedBodySize || 0, css: 0, js: 0 }
    for (const e of performance.getEntriesByType('resource')) {
      if (e.name.endsWith('.css')) wire.css += e.decodedBodySize || 0
      else if (/\.m?js(\?|$)/.test(e.name)) wire.js += e.decodedBodySize || 0
    }

    return {
      inline: bytes(inline),
      linked: bytes(linked),
      inlineRules: inline.length,
      linkedRules: linked.length,
      inlineAtomic: stat(atomic(inline)),
      linkedAtomic: stat(atomic(linked)),
      wire,
      classes: [...classes],
      ruleClasses: [...ruleClasses],
    }
  })

  m.classes.forEach((c) => allClasses.add(c))
  m.ruleClasses.forEach((c) => allRuleClasses.add(c))

  const rendered = m.classes.filter((c) => c.startsWith('_'))
  perRoute.push({
    route,
    wire: m.wire,
    delivered: m.wire.doc + m.wire.css,
    inline: m.inline,
    linked: m.linked,
    inlineAtomic: m.inlineAtomic,
    linkedAtomic: m.linkedAtomic,
    atomicBytes: m.inlineAtomic.bytes + m.linkedAtomic.bytes,
    atomicRendered: rendered.length,
    atomicUncovered: rendered.filter((c) => !m.ruleClasses.includes(c)).length,
  })
}

await browser.close()

const uncovered = [...allClasses].filter((c) => !allRuleClasses.has(c) && !MARKER.test(c))
const covered = allClasses.size - uncovered.length

console.log(
  JSON.stringify(
    {
      label,
      perRoute,
      union: {
        classesRendered: allClasses.size,
        ruleClassesDelivered: allRuleClasses.size,
        // The verdict. Atomic classes are what extraction is responsible for;
        // anything else uncovered is pre-existing debt this tool only reports.
        atomicUncovered: uncovered.filter((c) => c.startsWith('_')).sort(),
        otherUncovered: uncovered.filter((c) => !c.startsWith('_')).sort(),
        coveragePct: ((covered / allClasses.size) * 100).toFixed(2),
      },
    },
    null,
    2,
  ),
)
