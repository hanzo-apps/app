/**
 * Track B — agentic coding harness (D1) public surface.
 * See docs/AGENTIC-CODING.md for the full D1→D5 architecture.
 */
export type { AgentEvent, AgentFile, EmitEvent } from "./types";
export { InMemoryProjectFs } from "./fs";
export type { PatchOp, PatchResult, SearchMatch } from "./fs";
export { AGENT_TOOL_DEFS, executeAgentTool } from "./tools";
export type { OpenAITool, ToolOutcome } from "./tools";
export { runAgent } from "./loop";
export type { RunAgentOptions } from "./loop";
