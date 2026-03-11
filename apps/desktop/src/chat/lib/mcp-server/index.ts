/**
 * Hanzo App MCP Server
 * 
 * Integrates with @hanzo/mcp framework to expose Tauri functionality
 * Runs alongside the LLM router when the app is running
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { createLogger } from '@/lib/logger'
import { createHanzoAppTools, createNativeTools } from './hanzo-app-tools'
import type { MCPTool } from '../types/mcp'

const logger = createLogger('MCP:HanzoApp')

export class HanzoAppMCPServer {
  private server: Server
  private tools: Map<string, MCPTool> = new Map()
  private isRunning = false

  constructor() {
    logger.info('Initializing Hanzo App MCP Server')
    
    this.server = new Server(
      {
        name: 'hanzo-app',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
          resources: {},
          prompts: {},
        },
      }
    )

    this.registerTools()
    this.setupHandlers()
  }

  private registerTools() {
    // Get all Hanzo App tools
    const appTools = createHanzoAppTools()
    const nativeTools = createNativeTools()
    const allTools = [...appTools, ...nativeTools]

    // Register tools
    for (const tool of allTools) {
      this.tools.set(tool.name, tool)
    }

    logger.info(`Registered ${this.tools.size} MCP tools`)
  }

  private setupHandlers() {
    // Handle list tools
    this.server.setRequestHandler('tools/list', async () => {
      const tools = Array.from(this.tools.values()).map(tool => ({
        name: tool.name,
        description: tool.description,
        inputSchema: tool.inputSchema,
      }))

      return { tools }
    })

    // Handle tool calls
    this.server.setRequestHandler('tools/call', async (request: any) => {
      const { name, arguments: args } = request.params
      
      logger.info('Executing tool', { name, args })
      
      const tool = this.tools.get(name)
      if (!tool) {
        throw new Error(`Unknown tool: ${name}`)
      }

      try {
        const result = await tool.handler(args)
        
        return {
          content: [{ type: 'text', text: result }],
        }
      } catch (error) {
        logger.error('Tool execution failed', { name, error })
        return {
          content: [{ type: 'text', text: `Error: ${error}` }],
          isError: true,
        }
      }
    })

    // Handle resources (if needed)
    this.server.setRequestHandler('resources/list', async () => {
      return { resources: [] }
    })

    // Handle prompts (if needed)
    this.server.setRequestHandler('prompts/list', async () => {
      return { prompts: [] }
    })
  }

  /**
   * Start as stdio server (for standalone MCP)
   */
  async startStdio() {
    if (this.isRunning) return
    
    logger.info('Starting MCP server with stdio transport')
    const transport = new StdioServerTransport()
    await this.server.connect(transport)
    this.isRunning = true
    logger.info('MCP server started')
  }

  /**
   * Start with custom transport (for embedding)
   */
  async startWithTransport(transport: any) {
    if (this.isRunning) return
    
    logger.info('Starting MCP server with custom transport')
    await this.server.connect(transport)
    this.isRunning = true
    logger.info('MCP server connected')
  }

  /**
   * Stop the server
   */
  async stop() {
    if (!this.isRunning) return
    
    logger.info('Stopping MCP server')
    await this.server.close()
    this.isRunning = false
  }

  /**
   * Get server instance
   */
  getServer() {
    return this.server
  }

  /**
   * Get all tools (for internal use)
   */
  getTools() {
    return Array.from(this.tools.values())
  }

  /**
   * Execute a tool directly (for internal use)
   */
  async executeTool(name: string, args: any) {
    const tool = this.tools.get(name)
    if (!tool) {
      throw new Error(`Unknown tool: ${name}`)
    }
    
    return await tool.handler(args)
  }
}

// Singleton instance
let mcpServer: HanzoAppMCPServer | null = null

/**
 * Get or create the MCP server instance
 */
export function getMCPServer(): HanzoAppMCPServer {
  if (!mcpServer) {
    mcpServer = new HanzoAppMCPServer()
  }
  return mcpServer
}

/**
 * Start the MCP server alongside the app
 */
export async function startMCPServer() {
  const server = getMCPServer()
  
  // Check if we should start as stdio (standalone) or embedded
  if (process.env.MCP_TRANSPORT === 'stdio') {
    await server.startStdio()
  } else {
    logger.info('MCP server ready for embedding')
  }
  
  return server
}

// Export types
export type { MCPTool } from '../types/mcp'