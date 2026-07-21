// A plain question or greeting typed in BUILD mode ("what can you do", "hi",
// "who are you") should be ANSWERED conversationally — never treated as a build
// instruction that silently regenerates and replaces the app.
//
// This is deliberately CONSERVATIVE: any build-intent verb, or anything long, is a
// real build prompt, so "build a chat app" / "add a login" are never intercepted.
// Only a short greeting, or a short question with no build verb, is conversational.
// A false positive merely answers instead of building (recoverable, retry); a false
// negative is the destructive default we're fixing (a question that nukes the app).

const BUILD_INTENT =
  /\b(build|make|create|add|change|update|edit|modif|fix|remove|delete|replace|generate|design|redesign|implement|write|refactor|rename|convert|scaffold|include|insert|append|clone|turn (it|this)|give me|i (want|need)|let'?s|set up|put a)\b/i;

export function isConversational(text: string): boolean {
  const s = text.trim();
  if (!s || s.length > 140) return false; // long → treat as a real instruction
  if (BUILD_INTENT.test(s)) return false; // has a build verb → build
  if (/^(hi|hey|hello|yo|sup|thanks|thank you|thx|ty|ok(ay)?|cool|nice|help|who are you)\b/i.test(s))
    return true;
  if (/^(what|who|how|why|can you|could you|do you|are you|is this|does this)\b/i.test(s))
    return true;
  return s.endsWith("?") && s.split(/\s+/).length <= 14;
}
