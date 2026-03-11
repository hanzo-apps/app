/**
 * MCP Tool type definition
 * Compatible with both @hanzo/mcp and @modelcontextprotocol/sdk
 */
export interface MCPTool {
  name: string
  description: string
  inputSchema: {
    type: 'object'
    properties: Record<string, any>
    required?: string[]
  }
  handler: (args: any) => Promise<string>
}