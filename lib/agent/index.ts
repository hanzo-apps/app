/**
 * Track B — agentic coding harness (D1) public surface.
 * See docs/AGENTIC-CODING.md for the full D1→D5 architecture.
 */
export type { AgentEvent, AgentFile, EmitEvent } from "./types";
export { InMemoryProjectFs, canExec } from "./fs";
export type { ExecResult, PatchOp, PatchResult, ProjectExec, ProjectFs, SearchMatch } from "./fs";
export { Sandbox, openSandbox, releaseSandbox } from "./sandbox";
export type { Info, SandboxClass, SandboxOptions } from "./sandbox";
export { agentToolDefs, executeAgentTool } from "./tools";
export type { OpenAITool, ToolOutcome } from "./tools";
export { runAgent } from "./loop";
export type { RunAgentOptions } from "./loop";
