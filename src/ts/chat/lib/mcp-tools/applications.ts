import { invoke } from '@tauri-apps/api/core'
import { createLogger } from '@/lib/logger'
import type { MCPTool } from '@/chat/types/completion'

const logger = createLogger('MCP:Applications')

export interface Application {
  name: string
  id: string
  path: string
  icon?: string
  is_running: boolean
  pid?: number
}

/**
 * MCP tools for application management
 */
export const applicationTools: Record<string, MCPTool> = {
  // Search for applications
  search_applications: {
    name: 'search_applications',
    description: 'Search for installed applications on the system',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search query for application name'
        },
        includeSystemApps: {
          type: 'boolean',
          description: 'Include system applications in results',
          default: false
        }
      },
      required: ['query']
    }
  },

  // Launch an application
  launch_application: {
    name: 'launch_application',
    description: 'Launch an application by ID or path',
    inputSchema: {
      type: 'object',
      properties: {
        appId: {
          type: 'string',
          description: 'Application ID or path'
        },
        args: {
          type: 'array',
          items: { type: 'string' },
          description: 'Command line arguments'
        }
      },
      required: ['appId']
    }
  },

  // Get running applications
  get_running_applications: {
    name: 'get_running_applications',
    description: 'Get list of currently running applications',
    inputSchema: {
      type: 'object',
      properties: {
        includeBackgroundApps: {
          type: 'boolean',
          default: false
        }
      }
    }
  },

  // Get all applications
  get_all_applications: {
    name: 'get_all_applications',
    description: 'Get all installed applications',
    inputSchema: {
      type: 'object',
      properties: {
        includeSystemApps: {
          type: 'boolean',
          default: false
        }
      }
    }
  },

  // Quit an application
  quit_application: {
    name: 'quit_application',
    description: 'Quit a running application',
    inputSchema: {
      type: 'object',
      properties: {
        appId: {
          type: 'string',
          description: 'Application ID or process ID'
        },
        force: {
          type: 'boolean',
          description: 'Force quit the application',
          default: false
        }
      },
      required: ['appId']
    }
  }
}

/**
 * Tool handlers that actually execute the commands
 */
export const applicationHandlers = {
  search_applications: async (params: any) => {
    logger.info('Searching applications', { query: params.query })
    try {
      // Get all apps first
      const allApps = await invoke<Application[]>('get_apps')
      
      // Filter based on query
      const query = params.query.toLowerCase()
      const filtered = allApps.filter(app => 
        app.name.toLowerCase().includes(query) ||
        app.path.toLowerCase().includes(query)
      )

      // Filter out system apps if requested
      const result = params.includeSystemApps ? filtered : 
        filtered.filter(app => !app.path.includes('/System/'))

      logger.info('Application search complete', { 
        query: params.query,
        resultCount: result.length 
      })
      
      return {
        content: [{
          text: JSON.stringify(result, null, 2)
        }]
      }
    } catch (error) {
      logger.error('Failed to search applications', { error })
      return {
        error: `Failed to search applications: ${error}`,
        content: []
      }
    }
  },

  launch_application: async (params: any) => {
    logger.info('Launching application', { appId: params.appId })
    try {
      await invoke('launch_application', { appId: params.appId })
      
      return {
        content: [{
          text: `Successfully launched application: ${params.appId}`
        }]
      }
    } catch (error) {
      logger.error('Failed to launch application', { error })
      return {
        error: `Failed to launch application: ${error}`,
        content: []
      }
    }
  },

  get_running_applications: async (params: any) => {
    logger.info('Getting running applications')
    try {
      const allApps = await invoke<Application[]>('get_apps')
      const runningApps = allApps.filter(app => app.is_running)
      
      logger.info('Found running applications', { count: runningApps.length })
      
      return {
        content: [{
          text: JSON.stringify(runningApps, null, 2)
        }]
      }
    } catch (error) {
      logger.error('Failed to get running applications', { error })
      return {
        error: `Failed to get running applications: ${error}`,
        content: []
      }
    }
  },

  get_all_applications: async (params: any) => {
    logger.info('Getting all applications')
    try {
      const apps = await invoke<Application[]>('get_apps')
      
      const result = params.includeSystemApps ? apps :
        apps.filter(app => !app.path.includes('/System/'))
      
      logger.info('Retrieved all applications', { count: result.length })
      
      return {
        content: [{
          text: JSON.stringify(result, null, 2)
        }]
      }
    } catch (error) {
      logger.error('Failed to get all applications', { error })
      return {
        error: `Failed to get all applications: ${error}`,
        content: []
      }
    }
  },

  quit_application: async (params: any) => {
    logger.info('Quitting application', { appId: params.appId })
    try {
      // For now, we'll use the shell plugin to kill the process
      const { Command } = await import('@tauri-apps/plugin-shell')
      
      if (params.force) {
        await Command.sidecar('bin/kill', ['-9', params.appId]).execute()
      } else {
        await Command.sidecar('bin/kill', [params.appId]).execute()
      }
      
      return {
        content: [{
          text: `Successfully quit application: ${params.appId}`
        }]
      }
    } catch (error) {
      logger.error('Failed to quit application', { error })
      return {
        error: `Failed to quit application: ${error}`,
        content: []
      }
    }
  }
}