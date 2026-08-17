/**
 * How much output to ask a model for.
 *
 * A model's window holds its INPUT and its OUTPUT together, so one ceiling sized
 * for the largest model refuses every smaller one before a byte is generated.
 * Measured live across the whole picker, the gateway answered "maximum context
 * length is 128000 tokens. However, you requested about 131205 (3205 of text
 * input, 128000 in the output)" — half of every failing model, reported to the
 * reader as the AI being unavailable.
 *
 * A pure function, in its own module, so the tests can read it: importing the
 * route pulls in the IAM session and its crypto, and the suite dies at import
 * rather than failing — which reads as a pass.
 */

/**
 * How much output a build asks for.
 *
 * Sized to what a build PRODUCES, not to what a model can hold: a generated page
 * is one self-contained HTML document, the reference implementations in
 * `templates/` run 7–16 KB each, and a whole site is a handful of those. 64000
 * tokens is around 256 KB — room for a dozen of the largest — and the ask is
 * paid on every turn, in reserved capacity and in time to the first byte, while
 * a build that does outrun it is resumed by the continuation flow rather than
 * lost.
 */
export const MAX_TOKENS = 64_000;

/**
 * Enough output to be worth streaming. Below this a generation cannot produce a
 * usable page, so the honest answer is the gateway's refusal rather than a
 * truncated one.
 */
export const MIN_TOKENS = 4_000;

/** Room for what the model adds around our messages, which we cannot see. */
const RESERVE = 2_000;

export type Message = { role: "system" | "user" | "assistant"; content: string };

/** ~4 characters per token. It only has to be close; the ceiling absorbs the rest. */
export const estimate = (messages: Message[]): number =>
  Math.ceil(JSON.stringify(messages).length / 4);

/**
 * The ceiling, or whatever the model's window has left after the messages,
 * whichever is smaller. A model that states no window keeps the ceiling — the
 * gateway is then the one that knows, and it says so in its refusal.
 */
export function outputCap(context: number | undefined, messages: Message[]): number {
  if (!context) return MAX_TOKENS;
  return Math.max(MIN_TOKENS, Math.min(MAX_TOKENS, context - estimate(messages) - RESERVE));
}
