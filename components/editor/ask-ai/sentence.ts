/**
 * The same line, said rather than shown.
 *
 * A status bubble reads "Built · 3 files · 12s". Spoken, the middots are pauses
 * and `12s` is a duration. Nothing is added and no fact is restated — only the
 * punctuation changes register.
 */
export function sentence(text: string): string {
  return text
    .replace(/\s*·\s*/g, ", ")
    .replace(/\b(\d+)s\b/g, (_, n) => `${n} second${n === "1" ? "" : "s"}`);
}
