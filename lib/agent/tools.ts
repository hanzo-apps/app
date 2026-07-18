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

import { InMemoryProjectFs, type PatchOp } from "./fs";

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

type ToolFn = (fs: InMemoryProjectFs, args: Record<string, unknown>) => ToolOutcome;

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
    (fs) => {
      const files = fs.list();
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
    (fs, args) => {
      const path = asString(args.path);
      if (!path) return err("`path` (string) is required");
      const content = fs.read(path);
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
    (fs, args) => {
      const query = asString(args.query);
      if (!query) return err("`query` (string) is required");
      const matches = fs.search(query);
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
    (fs, args) => {
      const path = asString(args.path);
      const content = asString(args.content);
      if (!path) return err("`path` (string) is required");
      if (content === null) return err("`content` (string) is required");
      const existed = fs.exists(path);
      fs.write(path, content);
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
    (fs, args) => {
      const path = asString(args.path);
      if (!path) return err("`path` (string) is required");
      const ops = coerceOps(args.operations);
      if (!ops) return err("`operations` must be an array of {type:'update'|'rewrite', …} objects");
      const res = fs.applyPatch(path, ops);
      const warn = res.warnings.length ? `\nWarnings:\n${res.warnings.map((w) => `• ${w}`).join("\n")}` : "";
      return res.applied ? ok(res.summary + warn) : err(res.summary + warn);
    }
  ),
];

const BY_NAME = new Map<string, AgentTool>(TOOLS.map((t) => [t.def.function.name, t]));

/** The tool schemas to send to the gateway in the `tools` field. */
export const AGENT_TOOL_DEFS: OpenAITool[] = TOOLS.map((t) => t.def);

/**
 * Execute a tool call against the project FS. `argsJson` is the raw arguments
 * string from the model. Never throws: malformed JSON, unknown tools, and
 * executor failures all come back as an error `ToolOutcome` the model can read
 * and recover from.
 */
export function executeAgentTool(
  fs: InMemoryProjectFs,
  name: string,
  argsJson: string
): ToolOutcome {
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
    return t.run(fs, args);
  } catch (e) {
    return err(e instanceof Error ? e.message : String(e));
  }
}
