import { createLogger } from '@/lib/logger'
import { 
  registerTauriMCPTools, 
  handleTauriMCPTool, 
  listTauriMCPTools 
} from '../mcp-tools'
import type { MCPTool } from '@/chat/types/completion'

const logger = createLogger('MCP:InternalServer')

/**
 * Internal MCP server that exposes Tauri functionality
 * This acts as a bridge between the MCP protocol and Tauri commands
 */
export class InternalMCPServer {
  private tools: Record<string, MCPTool> = {}
  private isInitialized = false

  constructor() {
    logger.info('Creating internal MCP server')
  }

  /**
   * Initialize the internal MCP server
   */
  async initialize() {
    if (this.isInitialized) {
      logger.warn('Internal MCP server already initialized')
      return
    }

    logger.info('Initializing internal MCP server')
    
    // Register all Tauri tools
    this.tools = registerTauriMCPTools()
    
    this.isInitialized = true
    
    logger.info('Internal MCP server initialized', {
      toolCount: Object.keys(this.tools).length
    })
  }

  /**
   * List all available tools
   */
  async listTools(): Promise<MCPTool[]> {
    if (!this.isInitialized) {
      await this.initialize()
    }
    
    const tools = listTauriMCPTools()
    logger.debug('Listing internal MCP tools', { count: tools.length })
    return tools
  }

  /**
   * Execute a tool
   */
  async executeTool(toolName: string, parameters: any): Promise<any> {
    if (!this.isInitialized) {
      await this.initialize()
    }
    
    logger.info('Executing internal MCP tool', { toolName })
    
    const startTime = Date.now()
    try {
      const result = await handleTauriMCPTool(toolName, parameters)
      const duration = Date.now() - startTime
      
      logger.info('Internal MCP tool executed', { 
        toolName, 
        duration,
        hasError: !!result.error 
      })
      
      return result
    } catch (error) {
      const duration = Date.now() - startTime
      logger.error('Internal MCP tool execution failed', { 
        toolName, 
        error,
        duration 
      })
      throw error
    }
  }

  /**
   * Get server information
   */
  getServerInfo() {
    return {
      name: 'hanzo-internal-mcp',
      version: '1.0.0',
      description: 'Internal MCP server for Tauri functionality',
      capabilities: {
        tools: true,
        resources: false,
        prompts: false
      }
    }
  }
}

// Create singleton instance
let internalServer: InternalMCPServer | null = null

/**
 * Get or create the internal MCP server instance
 */
export function getInternalMCPServer(): InternalMCPServer {
  if (!internalServer) {
    internalServer = new InternalMCPServer()
  }
  return internalServer
}

/**
 * Hook to integrate with the existing MCP system
 */
export async function integrateInternalMCPServer() {
  logger.info('Integrating internal MCP server with system')
  
  const server = getInternalMCPServer()
  await server.initialize()
  
  // Make tools available to the window.core.api if it exists
  if (window.core?.api) {
    const originalGetTools = window.core.api.getTools
    const originalCallTool = window.core.api.callTool
    
    // Wrap getTools to include internal tools
    window.core.api.getTools = async () => {
      logger.debug('Getting tools including internal MCP')
      
      // Get external MCP tools
      const externalTools = originalGetTools ? await originalGetTools() : []
      
      // Get internal tools
      const internalTools = await server.listTools()
      
      // Combine and return
      const allTools = [...externalTools, ...internalTools]
      logger.info('Combined MCP tools', { 
        externalCount: externalTools.length,
        internalCount: internalTools.length,
        totalCount: allTools.length
      })
      
      return allTools
    }
    
    // Wrap callTool to handle internal tools
    window.core.api.callTool = async (args: { toolName: string; arguments: object }) => {
      logger.debug('Calling MCP tool', { toolName: args.toolName })
      
      // Check if it's an internal tool
      const internalTools = await server.listTools()
      const isInternalTool = internalTools.some(t => t.name === args.toolName)
      
      if (isInternalTool) {
        logger.info('Routing to internal MCP server', { toolName: args.toolName })
        return await server.executeTool(args.toolName, args.arguments)
      } else {
        logger.info('Routing to external MCP server', { toolName: args.toolName })
        return originalCallTool ? await originalCallTool(args) : { error: 'No external MCP handler', content: [] }
      }
    }
    
    logger.info('Internal MCP server integrated successfully')
  } else {
    logger.warn('window.core.api not available, internal MCP server not integrated')
  }
}

// Auto-initialize when module loads
if (typeof window !== 'undefined') {
  // Wait for window.core to be available
  const checkAndIntegrate = () => {
    if (window.core?.api) {
      integrateInternalMCPServer().catch(error => {
        logger.error('Failed to integrate internal MCP server', { error })
      })
    } else {
      // Retry after a short delay
      setTimeout(checkAndIntegrate, 100)
    }
  }
  
  // Start checking after DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', checkAndIntegrate)
  } else {
    checkAndIntegrate()
  }
}