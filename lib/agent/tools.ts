/**
 * Track B — the D1 agent toolset.
 *
 * A MINIMAL, MCP-shaped toolset the model calls to inspect and edit the project:
 * `list_files`, `read_file`, `search_files`, `write_file`, `apply_patch`. These
 * mirror a subset of the canonical hanzo MCP `fs` surface
 * (`mcp__hanzo__fs` read/write/tree/grep) so that D2 can point the same loop at
 * the real 260-tool MCP server with no change to the loop or the UI — only the
 * executor binding moves from this in-memory FS to the MCP client.
 *
 * Tools are defined once (OpenAI function-calling schema) and executed through a
 * single dispatch table — one way to add a tool, no if/else chains. Every
 * executor returns a plain string (what the model sees next turn); errors are
 * returned as strings too (never thrown) so a bad tool call never kills the run.
 */

import { canExec, type PatchOp, type ProjectFs } from "./fs";

/** OpenAI-compatible tool definition (what we send in `tools`). */
export interface OpenAITool {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
}

export interface ToolOutcome {
  result: string;
  isError: boolean;
}

type ToolFn = (fs: ProjectFs, args: Record<string, unknown>) => Promise<ToolOutcome>;

interface AgentTool {
  def: OpenAITool;
  run: ToolFn;
}

function tool(
  name: string,
  description: string,
  parameters: Record<string, unknown>,
  run: ToolFn
): AgentTool {
  return { def: { type: "function", function: { name, description, parameters } }, run };
}

function ok(result: string): ToolOutcome {
  return { result, isError: false };
}
function err(result: string): ToolOutcome {
  return { result: `Error: ${result}`, isError: true };
}

function asString(v: unknown): string | null {
  return typeof v === "string" ? v : null;
}

/**
 * Coerce the model's `operations` arg into a PatchOp[]. Models frequently emit
 * the array as a JSON string, or double-encode it — tolerate both (the same
 * hardening `lib/llm/tool-registry.ts` applies client-side).
 */
function coerceOps(raw: unknown): PatchOp[] | null {
  let ops = raw;
  if (typeof ops === "string") {
    try {
      ops = JSON.parse(ops);
    } catch {
      return null;
    }
  }
  if (!Array.isArray(ops)) return null;
  const out: PatchOp[] = [];
  for (let o of ops) {
    if (typeof o === "string") {
      try {
        o = JSON.parse(o);
      } catch {
        return null;
      }
    }
    if (o && typeof o === "object") out.push(o as PatchOp);
    else return null;
  }
  return out;
}

const TOOLS: AgentTool[] = [
  tool(
    "list_files",
    "List every file path in the project. Call this first to learn the project layout.",
    { type: "object", properties: {}, required: [] },
    async (fs) => {
      const files = await fs.list();
      return ok(files.length ? files.join("\n") : "(empty project)");
    }
  ),

  tool(
    "read_file",
    "Read the full contents of one file. Returns an error if the file does not exist.",
    {
      type: "object",
      properties: { path: { type: "string", description: "File path, e.g. /index.html" } },
      required: ["path"],
    },
    async (fs, args) => {
      const path = asString(args.path);
      if (!path) return err("`path` (string) is required");
      const content = await fs.read(path);
      if (content === null) return err(`file not found: ${path}`);
      return ok(content);
    }
  ),

  tool(
    "search_files",
    "Case-insensitive substring search across all files. Returns path:line matches.",
    {
      type: "object",
      properties: { query: { type: "string", description: "Text to search for" } },
      required: ["query"],
    },
    async (fs, args) => {
      const query = asString(args.query);
      if (!query) return err("`query` (string) is required");
      const matches = await fs.search(query);
      if (!matches.length) return ok(`No matches for "${query}"`);
      return ok(matches.map((m) => `${m.path}:${m.line}: ${m.text}`).join("\n"));
    }
  ),

  tool(
    "write_file",
    "Create a new file or fully overwrite an existing one with `content`. Use apply_patch for surgical edits to a large file.",
    {
      type: "object",
      properties: {
        path: { type: "string", description: "File path, e.g. /styles.css" },
        content: { type: "string", description: "Complete file contents" },
      },
      required: ["path", "content"],
    },
    async (fs, args) => {
      const path = asString(args.path);
      const content = asString(args.content);
      if (!path) return err("`path` (string) is required");
      if (content === null) return err("`content` (string) is required");
      const existed = await fs.exists(path);
      await fs.write(path, content);
      return ok(`${existed ? "Overwrote" : "Created"} ${path} (${content.length} bytes)`);
    }
  ),

  tool(
    "apply_patch",
    "Apply structured edits to a file. operations is an array; each item is either {\"type\":\"update\",\"oldStr\":\"UNIQUE existing text\",\"newStr\":\"replacement\"} or {\"type\":\"rewrite\",\"content\":\"whole new file\"}. oldStr must match exactly and be unique.",
    {
      type: "object",
      properties: {
        path: { type: "string", description: "File path to edit" },
        operations: {
          type: "array",
          description: "Array of update/rewrite operations (a direct array, not a JSON string)",
          items: { type: "object" },
        },
      },
      required: ["path", "operations"],
    },
    async (fs, args) => {
      const path = asString(args.path);
      if (!path) return err("`path` (string) is required");
      const ops = coerceOps(args.operations);
      if (!ops) return err("`operations` must be an array of {type:'update'|'rewrite', …} objects");
      const res = await fs.applyPatch(path, ops);
      const warn = res.warnings.length ? `\nWarnings:\n${res.warnings.map((w) => `• ${w}`).join("\n")}` : "";
      return res.applied ? ok(res.summary + warn) : err(res.summary + warn);
    }
  ),

  // Offered ONLY when the filesystem is a box (see `agentToolDefs`). Listing it
  // unconditionally would advertise a capability an in-memory project does not
  // have, and a model that believes it can run the tests it just wrote will
  // report a green suite it never ran.
  tool(
    "run_command",
    "Run a shell command in the project directory and return its exit code, stdout and stderr. Use it to install dependencies, build, run tests, and check your work. Only available when the project is a real checkout in a box.",
    {
      type: "object",
      properties: {
        command: { type: "string", description: "Shell command, e.g. `pnpm test`" },
        timeoutSec: { type: "number", description: "Seconds before the command is killed (default 120)" },
      },
      required: ["command"],
    },
    async (fs, args) => {
      const command = asString(args.command);
      if (!command) return err("`command` (string) is required");
      if (!canExec(fs)) return err("this project has no box, so there is nothing to run commands on");
      const timeoutSec =
        typeof args.timeoutSec === "number" && Number.isFinite(args.timeoutSec)
          ? Math.max(1, Math.min(args.timeoutSec, 900))
          : undefined;

      const r = await fs.exec(command, timeoutSec);
      // Tail, not head: a failing build says why at the END of its output, and
      // the first 4 KB of a webpack log is the part nobody needs.
      const body = [
        r.stdout.trim() && `stdout:\n${tail(r.stdout)}`,
        r.stderr.trim() && `stderr:\n${tail(r.stderr)}`,
      ]
        .filter(Boolean)
        .join("\n\n");
      const head = r.timedOut
        ? `Command timed out (exit ${r.exitCode})`
        : `Exit code ${r.exitCode}`;
      // A non-zero exit is NOT a tool error: the call worked and the program
      // failed. Reporting it as an error would tell the model its command was
      // malformed when the truth is that its code is.
      return ok(`${head}\n\n${body || "(no output)"}`);
    }
  ),
];

const BY_NAME = new Map<string, AgentTool>(TOOLS.map((t) => [t.def.function.name, t]));

/** Last `max` characters — where a failing build actually explains itself. */
function tail(s: string, max = 4000): string {
  const t = s.trimEnd();
  return t.length <= max ? t : `…(${t.length - max} bytes trimmed)…\n${t.slice(-max)}`;
}

/**
 * The tool schemas to send to the gateway, for THIS filesystem.
 *
 * A function rather than a constant because the toolset is not a fixed fact
 * about the agent — it is a fact about where the agent is running. A box gets
 * `run_command`; an in-memory project does not, and never sees it.
 */
export function agentToolDefs(fs: ProjectFs): OpenAITool[] {
  const exec = canExec(fs);
  return TOOLS.filter((t) => exec || t.def.function.name !== "run_command").map((t) => t.def);
}

/**
 * Execute a tool call against the project FS. `argsJson` is the raw arguments
 * string from the model. Never throws: malformed JSON, unknown tools, and
 * executor failures all come back as an error `ToolOutcome` the model can read
 * and recover from.
 */
export async function executeAgentTool(
  fs: ProjectFs,
  name: string,
  argsJson: string
): Promise<ToolOutcome> {
  const t = BY_NAME.get(name);
  if (!t) return err(`unknown tool "${name}". Available: ${[...BY_NAME.keys()].join(", ")}`);

  let args: Record<string, unknown>;
  try {
    const parsed = argsJson.trim() ? JSON.parse(argsJson) : {};
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return err(`arguments for "${name}" must be a JSON object`);
    }
    args = parsed as Record<string, unknown>;
  } catch {
    return err(`arguments for "${name}" were not valid JSON: ${argsJson.slice(0, 200)}`);
  }

  try {
    return await t.run(fs, args);
  } catch (e) {
    return err(e instanceof Error ? e.message : String(e));
  }
}
