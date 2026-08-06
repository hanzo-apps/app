/**
 * Track B — agentic coding harness (D1) public surface.
 * See docs/AGENTIC-CODING.md for the full D1→D5 architecture.
 */
export type { AgentEvent, AgentFile, EmitEvent } from "./types";
export { InMemoryProjectFs, canExec } from "./fs";
export type { ExecResult, PatchOp, PatchResult, ProjectExec, ProjectFs, SearchMatch } from "./fs";
export { SandboxProjectFs, openBox } from "./sandbox-fs";
export type { Box, BoxClass, SandboxFsOptions } from "./sandbox-fs";
export { agentToolDefs, executeAgentTool } from "./tools";
export type { OpenAITool, ToolOutcome } from "./tools";
export { runAgent } from "./loop";
export type { RunAgentOptions } from "./loop";
