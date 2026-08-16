/**
 * Drive a real browser against a running hanzo.app and capture what breaks.
 *
 * This exists because the error plane cannot be relied on to answer: browser
 * errors are POSTed to an ingest endpoint that has refused every key, so for
 * long stretches nothing this app throws in a browser has been recorded
 * anywhere. A crash report then arrives as one sentence — "it says This page
 * crashed" — with no message, no stack and no digest, and the only way to turn
 * that into a defect is to reproduce it while holding an instrument.
 *
 * It found one: `global-error` reachable from a module-scope `window.localStorage`
 * read in the root layout's chunk, above every error boundary, whenever storage
 * is denied. `INIT` produced the condition and `PATCH` proved the fix against
 * the live bundle before it was built or deployed.
 *
 *   node scripts/probe.mjs <path-and-query> <outdir>
 *
 * Env:
 *   E2E_EMAIL / E2E_PASSWORD  hanzo.id credentials — only needed to mint STATE
 *   STATE                     storageState json, reused when present
 *   BASE                      origin to drive (default https://hanzo.app)
 *   WIDTH                     viewport width (default 1440; <600 turns on touch)
 *   STEPS                     '|'-separated script, see the switch below
 *   INIT                      JS run before any app script — used to CREATE a
 *                             condition (deny storage, make a call throw)
 *   PATCH                     'literal::replacement' rewritten into every chunk
 *                             on the way to the browser — try a fix on the real
 *                             page before building it
 *   KILL                      regex; once `arm` runs, matches answer 404, which
 *                             is what a tab left open across a deploy sees
 *
 * Steps: turn:<text> · wait:<ms> · stop · reload · goto:<path> · back · forward
 *        click:<css> · role:<name> · key:<Key> · offline · online · arm · disarm
 *        dump · dumpall · frames · cookies · shot:<name> · soak:<seconds>
 *
 * Two things it does that a hand-rolled check does not, both learned the hard
 * way. It reads EVERY frame, because the crash screen renders inside the
 * preview iframe as readily as in the top document, and a main-frame-only check
 * misses it while the transcript beside it looks healthy. And it reports the
 * app's own `hanzo_error_log` — `lib/error-handling/error-logger` keeps the last
 * 50 errors, with message, stack and reference, in localStorage — which is the
 * record when the ingest plane has none.
 */
import { chromium } from '@playwright/test'
import { mkdirSync, existsSync } from 'node:fs'

const target = process.argv[2]
const out = process.argv[3]
if (!target || !out) {
  console.error('usage: node scripts/probe.mjs <path-and-query> <outdir>')
  process.exit(2)
}
mkdirSync(out, { recursive: true })

const BASE = process.env.BASE || 'https://hanzo.app'
const state = process.env.STATE || `${out}/state.json`
const width = Number(process.env.WIDTH || 1440)
const CRASH = /This page crashed|Hanzo hit an error|This page hit an error|This part didn't load/i

const b = await chromium.launch()
const ctx = await b.newContext({
  viewport: { width, height: width < 600 ? 844 : 950 },
  ...(existsSync(state) ? { storageState: state } : {}),
  ...(width < 600 ? { hasTouch: true, isMobile: true } : {}),
})

if (process.env.INIT) await ctx.addInitScript({ content: process.env.INIT })

const p = await ctx.newPage()

// ---- record every channel of failure, from the first navigation ----
const errs = []
const bad = []
p.on('pageerror', (e) =>
  errs.push({
    kind: 'pageerror',
    url: p.url().slice(0, 120),
    msg: e.message,
    stack: (e.stack || '').split('\n').slice(0, 20).join('\n'),
  }),
)
p.on('console', (m) => {
  if (m.type() === 'error') errs.push({ kind: 'console', msg: m.text().slice(0, 900) })
})
p.on('response', async (r) => {
  if (r.status() < 400) return
  let body = ''
  try {
    body = (await r.text()).slice(0, 300)
  } catch {}
  bad.push(`${r.status()} ${r.request().method()} ${r.url().slice(0, 160)}${body ? ' :: ' + body : ''}`)
})
p.on('crash', () => errs.push({ kind: 'pagecrash', msg: 'renderer process crashed' }))

// ---- session ----
if (!existsSync(state)) {
  const email = process.env.E2E_EMAIL
  const password = process.env.E2E_PASSWORD
  if (!email || !password) throw new Error('E2E_EMAIL / E2E_PASSWORD required to mint a session')
  await p.goto(`${BASE}/dashboard`, { waitUntil: 'domcontentloaded', timeout: 90000 })
  await p.waitForURL(/hanzo\.id\/login\/oauth\/authorize/, { timeout: 45000 })
  await p.waitForLoadState('networkidle').catch(() => {})
  const identity = p
    .getByLabel(/email|username/i)
    .or(p.locator('input[type="email"]'))
    .or(p.locator('input[type="text"]'))
    .first()
  await identity.waitFor({ state: 'visible', timeout: 20000 })
  await identity.fill(email)
  const secret = p.getByLabel(/password/i).or(p.locator('input[type="password"]')).first()
  await secret.fill(password)
  await secret.press('Enter')
  await p.waitForURL(new RegExp(BASE.replace(/^https?:\/\//, '').replace('.', '\\.')), { timeout: 90000 }).catch(() => {})
  await p.waitForTimeout(5000)
  await ctx.storageState({ path: state })
  console.log('SESSION MINTED ->', state)
}

// ---- helpers ----
let shots = 0
const shot = async (tag) => {
  const name = `${out}/${String(shots++).padStart(2, '0')}-${tag}.png`
  await p.screenshot({ path: name }).catch(() => {})
  return name
}

// The crash screen renders inside the preview iframe as readily as in the top
// document — and there the transcript survives beside it, which is exactly what
// a report of "it crashed while it was building" looks like. Read every frame.
const frameTexts = async () => {
  const out = []
  for (const f of p.frames()) {
    const t = await f.evaluate(() => document.body?.innerText || '').catch(() => '')
    if (t) out.push({ url: f.url().slice(0, 160), main: f === p.mainFrame(), text: t })
  }
  return out
}

let crashedAt = null
const check = async (where) => {
  if (crashedAt) return true
  for (const f of await frameTexts()) {
    if (!CRASH.test(f.text)) continue
    crashedAt = { where, frame: f.main ? 'MAIN DOCUMENT' : f.url, text: f.text.slice(0, 1500), shot: await shot('CRASH') }
    console.log(`*** CRASHED at step: ${where} — in ${crashedAt.frame}`)
    return true
  }
  return false
}

// The stop control is an icon-only destructive Button holding a lucide
// CircleStop. Ask for the glyph and the variant as well as the name.
const STOP_SEL = [
  'button:has(svg.lucide-circle-stop)',
  'button:has(svg.lucide-stop-circle)',
  'button[data-variant="destructive"]',
  '[aria-label*="stop" i]',
  'button[title*="stop" i]',
].join(', ')

const composer = () => p.locator('textarea, [contenteditable="true"]').first()

if (process.env.PATCH) {
  const [from, to] = process.env.PATCH.split('::')
  await p.route('**/_next/static/chunks/**', async (route) => {
    const res = await route.fetch()
    const body = await res.text()
    if (!body.includes(from)) return route.fulfill({ response: res, body })
    console.log('  PATCHED', route.request().url().slice(-40))
    await route.fulfill({ response: res, body: body.split(from).join(to) })
  })
}

let armed = false
if (process.env.KILL) {
  const kill = new RegExp(process.env.KILL)
  await p.route(
    (u) => kill.test(u.toString()),
    async (route) => {
      if (!armed) return route.continue()
      console.log('  KILLED', route.request().url().slice(0, 110))
      await route.fulfill({ status: 404, contentType: 'text/plain', body: 'Not Found' })
    },
  )
}

const dump = async () => {
  const info = await p.evaluate(() => {
    const box = document.querySelector('textarea, [contenteditable="true"]')
    let host = box
    for (let i = 0; i < 6 && host?.parentElement; i++) host = host.parentElement
    return [...(host?.querySelectorAll('button') || [])].map((el) => ({
      label: el.getAttribute('aria-label'),
      title: el.getAttribute('title'),
      variant: el.getAttribute('data-variant'),
      text: (el.innerText || '').trim().slice(0, 40),
      svg: [...el.querySelectorAll('svg')].map((s) => s.getAttribute('class')).join(','),
    }))
  })
  console.log('COMPOSER BUTTONS', JSON.stringify(info, null, 1))
}

const steps = (process.env.STEPS || '').split('|').filter(Boolean)

await p.goto(BASE + target, { waitUntil: 'domcontentloaded', timeout: 90000 })
await p.waitForTimeout(10000)
await shot('loaded')
await check('load')

for (const raw of steps) {
  if (crashedAt) break
  const i = raw.indexOf(':')
  const verb = i === -1 ? raw : raw.slice(0, i)
  const arg = i === -1 ? '' : raw.slice(i + 1)
  console.log('STEP', verb, arg.slice(0, 80))
  try {
    switch (verb) {
      case 'turn': {
        const box = composer()
        await box.waitFor({ state: 'visible', timeout: 30000 })
        await box.click()
        await box.fill(arg)
        await p.waitForTimeout(300)
        await box.press('Enter')
        break
      }
      case 'wait':
        for (let t = 0; t < Number(arg); t += 2500) {
          await p.waitForTimeout(Math.min(2500, Number(arg) - t))
          if (await check(`wait@${t + 2500}`)) break
        }
        break
      case 'stop': {
        const s = p.locator(STOP_SEL).first()
        if (await s.count()) {
          await s.click({ timeout: 5000, force: true })
          console.log('  stop clicked')
        } else {
          console.log('  NO STOP CONTROL PRESENT')
          await dump()
        }
        break
      }
      case 'reload':
        await p.reload({ waitUntil: 'domcontentloaded', timeout: 60000 }).catch(() => {})
        break
      case 'goto':
        await p.goto(BASE + arg, { waitUntil: 'domcontentloaded', timeout: 60000 }).catch(() => {})
        break
      case 'back':
        await p.goBack({ waitUntil: 'domcontentloaded', timeout: 60000 }).catch(() => {})
        break
      case 'forward':
        await p.goForward({ waitUntil: 'domcontentloaded', timeout: 60000 }).catch(() => {})
        break
      case 'click': {
        const l = p.locator(arg).first()
        if (await l.count()) await l.click({ timeout: 8000, force: true })
        else console.log('  no match for', arg)
        break
      }
      case 'role': {
        const l = p.getByRole('button', { name: new RegExp(arg, 'i') }).first()
        if (await l.count()) await l.click({ timeout: 8000, force: true })
        else console.log('  no button named', arg)
        break
      }
      case 'key':
        await p.keyboard.press(arg)
        break
      case 'offline':
        await ctx.setOffline(true)
        break
      case 'online':
        await ctx.setOffline(false)
        break
      case 'arm':
        armed = true
        break
      case 'disarm':
        armed = false
        break
      case 'dump':
        await dump()
        break
      case 'dumpall': {
        const all = await p.evaluate(() =>
          [...document.querySelectorAll('button,[role="button"],[role="tab"],a[href^="/"]')]
            .map((el) => {
              const r = el.getBoundingClientRect()
              return {
                label: el.getAttribute('aria-label') || el.getAttribute('title') || (el.innerText || '').trim().slice(0, 30),
                href: el.getAttribute('href'),
                box: [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)],
              }
            })
            .filter((x) => x.box[2] > 0),
        )
        // A box here is LAYOUT position and ignores clipping, so a control
        // scrolled out of an overflow ancestor reads as sitting on its
        // neighbour. Compare clusters, never individual buttons.
        console.log('ALL CONTROLS', JSON.stringify(all))
        break
      }
      case 'frames':
        for (const f of await frameTexts())
          console.log(`  FRAME ${f.main ? '[main]' : '[sub] ' + f.url}\n    ${f.text.slice(0, 300).replace(/\n/g, ' / ')}`)
        break
      case 'cookies':
        await ctx.storageState({ path: `${out}/state-full.json` })
        console.log('COOKIES ->', `${out}/state-full.json`)
        break
      case 'soak': {
        // Volume, not cleverness. Pick a real control at random, sometimes send
        // a turn, sometimes stop mid-stream, sometimes reload — checking after
        // every single action.
        const until = Date.now() + Number(arg || 300) * 1000
        const asks = [
          'Completely redesign this site with a new hero, pricing, testimonials, FAQ and footer',
          'Add a contact form to the homepage',
          'Make the header sticky and add a dark mode toggle',
        ]
        let n = 0
        while (Date.now() < until && !crashedAt) {
          n++
          const roll = Math.random()
          const controls = await p.evaluate(() =>
            [...document.querySelectorAll('button[aria-label]')]
              .filter((el) => {
                const r = el.getBoundingClientRect()
                return r.width > 4 && r.height > 4
              })
              .map((el) => el.getAttribute('aria-label') || ''),
          )
          if (roll < 0.22) {
            const box = composer()
            if (await box.count()) {
              await box.click({ timeout: 5000 }).catch(() => {})
              await box.fill(asks[n % asks.length]).catch(() => {})
              await box.press('Enter').catch(() => {})
            }
          } else if (roll < 0.38) {
            const s = p.locator(STOP_SEL).first()
            if (await s.count()) await s.click({ timeout: 4000, force: true }).catch(() => {})
          } else if (roll < 0.44) {
            await p.reload({ waitUntil: 'domcontentloaded', timeout: 45000 }).catch(() => {})
          } else if (roll < 0.48) {
            await p.keyboard.press('Escape').catch(() => {})
          } else {
            const label = controls[Math.floor(Math.random() * controls.length)]
            if (label)
              await p
                .locator(`[aria-label="${label.replace(/"/g, '\\"')}"]`)
                .first()
                .click({ timeout: 4000, force: true })
                .catch(() => {})
          }
          await p.waitForTimeout(400 + Math.floor(Math.random() * 2600))
          if (await check(`soak#${n}`)) break
        }
        console.log('  soak actions:', n)
        break
      }
      case 'shot':
        console.log('  ->', await shot(arg || 'shot'))
        break
      default:
        console.log('  unknown verb', verb)
    }
  } catch (e) {
    console.log('  STEP THREW:', String(e).slice(0, 300))
  }
  await shot(verb)
  await check(verb + ':' + arg.slice(0, 30))
}

if (!crashedAt) {
  for (let i = 0; i < 6; i++) {
    await p.waitForTimeout(3000)
    if (await check(`settle${i}`)) break
  }
  await shot('final')
}

// The app's own record, which survives when the ingest plane has nothing.
const stored = await p
  .evaluate(() => {
    try {
      return JSON.parse(localStorage.getItem('hanzo_error_log') || '[]')
    } catch (e) {
      return { unreadable: String(e) }
    }
  })
  .catch((e) => ({ evaluateFailed: String(e) }))
console.log('hanzo_error_log', JSON.stringify(stored, null, 1).slice(0, 6000))

const seen = await p
  .evaluate(() => {
    const t = document.body?.innerText || ''
    return {
      url: location.href,
      crashed: /This page crashed/i.test(t),
      reference: (t.match(/Reference:\s*([0-9A-Za-z_]+)/) || [])[1] || null,
      text: t.slice(0, 2000),
    }
  })
  .catch((e) => ({ evaluateFailed: String(e) }))

console.log('SEEN', JSON.stringify(seen, null, 1))
if (crashedAt) console.log('CRASHED', JSON.stringify(crashedAt, null, 1))
console.log('BAD', JSON.stringify(bad.slice(0, 40), null, 1))
console.log('ERRORS', JSON.stringify(errs.slice(0, 30), null, 1))
await b.close()
process.exit(crashedAt ? 1 : 0)
