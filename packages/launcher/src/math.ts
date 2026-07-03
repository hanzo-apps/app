/**
 * Pure, safe arithmetic evaluation for the launcher's calculator command.
 *
 * Portable (no DOM, no RN) so both the web/desktop and native hosts build their
 * "= result" row from the same logic — they differ only in how they copy the
 * result (browser clipboard vs a native clipboard module), which stays in each
 * host's action layer.
 */
export function evalMathExpression(query: string): number | null {
  const q = query.trim()
  if (!/^[\d\s+\-*/().%]+$/.test(q) || !/\d/.test(q)) return null
  try {
    // eslint-disable-next-line no-new-func
    const value = Function(`"use strict"; return (${q})`)()
    return typeof value === 'number' && Number.isFinite(value) ? value : null
  } catch {
    return null
  }
}
