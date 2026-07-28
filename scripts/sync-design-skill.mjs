#!/usr/bin/env node
// The design-system skill has ONE author: @hanzo/design. This copies it into the
// built-in registry's string form (the registry cannot import at build time) so
// the two can never drift — regenerate, never hand-edit the output.
//
//   node scripts/sync-design-skill.mjs
//
// Reads the installed package; falls back to a sibling checkout for local work.
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const REL = 'skills/design-system/SKILL.md'
const candidates = [
  process.env.HANZO_DESIGN_DIR && join(process.env.HANZO_DESIGN_DIR, REL),
  join(root, 'node_modules/@hanzo/design', REL),
  join(root, '../design', REL),
].filter(Boolean)

const src = candidates.find(existsSync)
if (!src) {
  console.error(`sync-design-skill: no @hanzo/design found. Looked in:\n  ${candidates.join('\n  ')}`)
  process.exit(1)
}

const md = readFileSync(src, 'utf8').trimEnd()
if (!md.startsWith('---') || !/\nname:\s*design-system/.test(md)) {
  console.error('sync-design-skill: source is not a design-system SKILL.md')
  process.exit(1)
}
// NOT String.raw. Its raw text keeps the backslash you needed to escape a
// backtick, so every ``` fence in a skill arrives at the model as \`\`\` —
// silently, since nothing parses the skill text. A JSON literal is exact.

const out = join(root, 'lib/vfs/skills/built-in/design-system.ts')
writeFileSync(out, `/**
 * Design System - Built-in Skill
 *
 * GENERATED from @hanzo/design ${REL} by scripts/sync-design-skill.mjs.
 * Do not edit here — edit the design system and re-run the sync.
 */

export const DESIGN_SYSTEM_SKILL: string = ${JSON.stringify(md)};
`)
console.log(`sync-design-skill: ${out} <- ${src} (${md.length} bytes)`)
