import { createLogger } from '@/lib/logger'
import { applicationTools, applicationHandlers } from './applications'
import { fileSearchTools, fileSearchHandlers } from './files'
import { windowTools, windowHandlers } from './windows'
import { systemTools, systemHandlers } from './system'
import type { MCPTool } from '@/chat/types/completion'

const logger = createLogger('MCP:TauriTools')

/**
 * All Tauri-based MCP tools
 */
export const tauriMCPTools: Record<string, MCPTool> = {
  ...applicationTools,
  ...fileSearchTools,
  ...windowTools,
  ...systemTools
}

/**
 * All Tauri-based MCP tool handlers
 */
export const tauriMCPHandlers: Record<string, (params: any) => Promise<any>> = {
  ...applicationHandlers,
  ...fileSearchHandlers,
  ...windowHandlers,
  ...systemHandlers
}

/**
 * Register all Tauri MCP tools with the system
 */
export function registerTauriMCPTools() {
  logger.info('Registering Tauri MCP tools', {
    toolCount: Object.keys(tauriMCPTools).length,
    tools: Object.keys(tauriMCPTools)
  })

  // Tools are automatically available when the MCP server lists them
  return tauriMCPTools
}

/**
 * Handle MCP tool execution
 */
export async function handleTauriMCPTool(toolName: string, parameters: any) {
  logger.info('Executing Tauri MCP tool', { toolName, parameters })
  
  const handler = tauriMCPHandlers[toolName]
  if (!handler) {
    logger.error('Unknown Tauri MCP tool', { toolName })
    return {
      error: `Unknown tool: ${toolName}`,
      content: []
    }
  }

  try {
    const result = await handler(parameters)
    logger.info('Tauri MCP tool executed successfully', { toolName })
    return result
  } catch (error) {
    logger.error('Tauri MCP tool execution failed', { toolName, error })
    return {
      error: `Tool execution failed: ${error}`,
      content: []
    }
  }
}

/**
 * Get tool definition by name
 */
export function getTauriMCPTool(toolName: string): MCPTool | undefined {
  return tauriMCPTools[toolName]
}

/**
 * List all available Tauri MCP tools
 */
export function listTauriMCPTools(): MCPTool[] {
  return Object.values(tauriMCPTools)
}

/**
 * Extension API for easier access
 */
export const hanzoSol = {
  // Application management
  searchApplications: async (query: string) => {
    return handleTauriMCPTool('search_applications', { query })
  },
  
  launchApplication: async (appId: string) => {
    return handleTauriMCPTool('launch_application', { appId })
  },
  
  getRunningApplications: async () => {
    return handleTauriMCPTool('get_running_applications', {})
  },
  
  // File search
  searchFiles: async (query: string, options?: any) => {
    return handleTauriMCPTool('search_files', { query, ...options })
  },
  
  // Window management
  listWindows: async () => {
    return handleTauriMCPTool('list_windows', {})
  },
  
  focusWindow: async (windowId: number) => {
    return handleTauriMCPTool('focus_window', { windowId })
  },
  
  arrangeWindows: async (layout: string) => {
    return handleTauriMCPTool('arrange_windows', { layout })
  },
  
  // System operations
  executeAppleScript: async (script: string) => {
    return handleTauriMCPTool('execute_applescript', { script })
  },
  
  getClipboard: async () => {
    return handleTauriMCPTool('get_clipboard', {})
  },
  
  setClipboard: async (text: string) => {
    return handleTauriMCPTool('set_clipboard', { text })
  },
  
  takeScreenshot: async (target?: string) => {
    return handleTauriMCPTool('take_screenshot', { target: target || 'fullscreen' })
  }
}

// Export for global access
if (typeof window !== 'undefined') {
  (window as any).hanzoSol = hanzoSol
}