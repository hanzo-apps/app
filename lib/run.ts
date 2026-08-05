/**
 * Run one command from the ⌘K bar, and say honestly what happened.
 *
 * A command names a route, so running it is a same-origin call to that very path:
 * the app already mirrors the cloud's `/v1/*` namespace with its own handlers,
 * and each of those attaches the signed-in user's IAM token server-side. So the
 * bar needs no credential, no key and no second gateway — it asks this origin for
 * the path the registry gave it, exactly as every other feature does.
 *
 * A path the app does not proxy answers 404, and that is the truth: the operation
 * exists in the fleet and this surface has no window onto it. Better a sentence
 * saying so than a command hidden from a list that claims to be total.
 *
 * REFUSALS ARE NOT OUTAGES. `refusal` is the app's one translation and it is used
 * verbatim here, so a command refused for credit, for permission or for a dead
 * credential reads the same in the bar as it does in the builder:
 *
 *   401  the credential behind the session — signing in again changes nothing
 *   403  permission — retrying cannot help, so it is never suggested
 *   402  credit
 *   else the service, the only case where "try again" is honest
 */
import { refusal } from "@/lib/gateway";
import { missing, spell, type Command } from "@/hooks/useCommands";

/** Methods that carry their inputs in the body rather than the URL. */
const BODIED = new Set(["POST", "PUT", "PATCH"]);

/**
 * Perform the command. Returns the sentence to show, and whether it succeeded —
 * the caller decides how to present it, which is the one thing a shared bar
 * cannot decide for every surface.
 */
export async function run(c: Command): Promise<{ ok: boolean; message: string }> {
  // Argument prompting is not built yet, so an operation that needs input says
  // what it needs instead of being run without it. Naming the fields is what
  // makes this a step rather than a dead end.
  const needs = missing(c);
  if (needs.length > 0) {
    return {
      ok: false,
      message: `${spell(c)} needs ${needs.join(", ")} — run it from the CLI until the bar can ask.`,
    };
  }

  let res: Response;
  try {
    res = await fetch(c.Path, {
      method: c.Method,
      headers: BODIED.has(c.Method) ? { "Content-Type": "application/json" } : undefined,
      body: BODIED.has(c.Method) ? "{}" : undefined,
    });
  } catch {
    return { ok: false, message: refusal(0, "").body.message };
  }

  if (!res.ok) {
    return { ok: false, message: refusal(res.status, await res.text()).body.message };
  }
  return { ok: true, message: `${spell(c)} — ${res.status}` };
}
