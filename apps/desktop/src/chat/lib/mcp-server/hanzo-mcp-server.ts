import { Server, CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/server/index.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { createLogger } from '@/lib/logger'

// Import all tool handlers
import { applicationTools, applicationHandlers } from '../mcp-tools/applications'
import { fileSearchTools, fileSearchHandlers } from '../mcp-tools/files'
import { windowTools, windowHandlers } from '../mcp-tools/windows'
import { systemTools, systemHandlers } from '../mcp-tools/system'
import { tauriPluginTools, tauriPluginHandlers } from '../mcp-tools/tauri-plugins'

const logger = createLogger('MCP:HanzoServer')

/**
 * Hanzo MCP Server
 * 
 * A comprehensive MCP server that exposes ALL Tauri functionality and native features
 * to provide complete computer control when installed as an MCP server.
 * 
 * This server can be used:
 * 1. Internally by the Hanzo app for AI chat integration
 * 2. Externally by Claude Desktop or other MCP clients
 * 3. As a standalone MCP server for system automation
 */
export class HanzoMCPServer {
  private server: Server
  private allTools: Record<string, any> = {}
  private allHandlers: Record<string, any> = {}

  constructor() {
    logger.info('Creating Hanzo MCP Server')
    
    // Initialize MCP server
    this.server = new Server(
      {
        name: 'hanzo-mcp-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
          resources: {},
        },
      }
    )

    // Combine all tools and handlers
    this.allTools = {
      ...applicationTools,
      ...fileSearchTools,
      ...windowTools,
      ...systemTools,
      ...tauriPluginTools,
    }

    this.allHandlers = {
      ...applicationHandlers,
      ...fileSearchHandlers,
      ...windowHandlers,
      ...systemHandlers,
      ...tauriPluginHandlers,
    }

    this.setupHandlers()
  }

  private setupHandlers() {
    // Handle list tools request
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      logger.info('Listing all MCP tools', { count: Object.keys(this.allTools).length })
      
      return {
        tools: Object.values(this.allTools),
      }
    })

    // Handle tool execution
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params
      
      logger.info('Executing MCP tool', { name, args })
      
      const handler = this.allHandlers[name]
      if (!handler) {
        throw new Error(`Unknown tool: ${name}`)
      }

      try {
        const result = await handler(args)
        
        // Convert our format to MCP format
        if (result.error) {
          return {
            content: [{ type: 'text', text: result.error }],
            isError: true,
          }
        }

        return {
          content: result.content.map((c: any) => ({
            type: 'text',
            text: c.text,
          })),
        }
      } catch (error) {
        logger.error('Tool execution failed', { name, error })
        return {
          content: [{ type: 'text', text: `Error: ${error}` }],
          isError: true,
        }
      }
    })
  }

  /**
   * Start the server with stdio transport (for Claude Desktop)
   */
  async startStdio() {
    logger.info('Starting Hanzo MCP Server with stdio transport')
    const transport = new StdioServerTransport()
    await this.server.connect(transport)
    logger.info('Hanzo MCP Server started successfully')
  }

  /**
   * Start the server with custom transport (for internal use)
   */
  async startWithTransport(transport: any) {
    logger.info('Starting Hanzo MCP Server with custom transport')
    await this.server.connect(transport)
    logger.info('Hanzo MCP Server connected')
  }

  /**
   * Get the server instance for direct integration
   */
  getServer() {
    return this.server
  }
}

// Export for different use cases
export function createHanzoMCPServer() {
  return new HanzoMCPServer()
}

// Standalone entry point
if (require.main === module) {
  (async () => {
    try {
      const server = createHanzoMCPServer()
      await server.startStdio()
      
      // Keep the process alive
      process.stdin.resume()
    } catch (error) {
      logger.error('Failed to start MCP server', { error })
      process.exit(1)
    }
  })()
}