/**
 * The lint RATCHET: the error count may only go down.
 *
 * The react-hooks 7 backlog (~300 compiler-semantics findings) cannot be fixed
 * mechanically — each site needs judgment — so a binary lint gate would stay
 * red for months and teach everyone to ignore it. This gate is the honest
 * middle: `.lint-ceiling` holds the count the repo has already reached, CI
 * fails on ANY new error above it, and whenever a change lands below the
 * ceiling the gate says so and demands the ceiling follow it down. Zero is the
 * end state; the ceiling is how the road there stays one-way.
 *
 * Run: node scripts/lint-ratchet.mjs   (exit 0 = at-or-below and tight)
 */
import { execSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'

const CEILING_FILE = new URL('../.lint-ceiling', import.meta.url)
const ceiling = Number(readFileSync(CEILING_FILE, 'utf8').trim())
if (!Number.isInteger(ceiling) || ceiling < 0) {
  console.error(`lint-ratchet: .lint-ceiling holds ${JSON.stringify(readFileSync(CEILING_FILE, 'utf8'))} — not a count`)
  process.exit(1)
}

let out = ''
try {
  out = execSync('pnpm exec eslint . --format json', {
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
    stdio: ['ignore', 'pipe', 'pipe'],
  })
} catch (e) {
  // eslint exits 1 when it finds errors; the JSON still arrives on stdout.
  out = e.stdout ?? ''
  if (!out) {
    console.error(`lint-ratchet: eslint itself crashed (exit 2):\n${e.stderr ?? e.message}`)
    process.exit(2)
  }
}

const results = JSON.parse(out)
const errors = results.reduce((n, f) => n + f.errorCount, 0)

if (errors > ceiling) {
  const worst = results
    .filter((f) => f.errorCount > 0)
    .sort((a, b) => b.errorCount - a.errorCount)
    .slice(0, 5)
    .map((f) => `  ${f.errorCount.toString().padStart(3)}  ${f.filePath}`)
    .join('\n')
  console.error(
    `lint-ratchet: ${errors} errors, ceiling is ${ceiling} — this change ADDS lint errors.\n` +
      `Fix the new ones (files with the most errors:\n${worst}\n), never raise the ceiling.`,
  )
  process.exit(1)
}

if (errors < ceiling) {
  if (process.env.RATCHET_WRITE === '1') {
    writeFileSync(CEILING_FILE, `${errors}\n`)
    console.log(`lint-ratchet: ${errors} < ${ceiling} — ceiling lowered to ${errors}.`)
    process.exit(0)
  }
  console.error(
    `lint-ratchet: ${errors} errors, ceiling is ${ceiling} — you fixed some! ` +
      `Lower the ceiling so it stays fixed: RATCHET_WRITE=1 node scripts/lint-ratchet.mjs, and commit .lint-ceiling.`,
  )
  process.exit(1)
}

console.log(`lint-ratchet: ${errors} errors, at the ceiling — no new debt.`)
