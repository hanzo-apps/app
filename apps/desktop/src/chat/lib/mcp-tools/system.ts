import { invoke } from '@tauri-apps/api/core'
import { Command } from '@tauri-apps/plugin-shell'
import { readText, writeText } from '@tauri-apps/plugin-clipboard-manager'
import { createLogger } from '@/lib/logger'
import type { MCPTool } from '@/chat/types/completion'

const logger = createLogger('MCP:System')

/**
 * MCP tools for system operations
 */
export const systemTools: Record<string, MCPTool> = {
  // Execute AppleScript
  execute_applescript: {
    name: 'execute_applescript',
    description: 'Execute an AppleScript command',
    inputSchema: {
      type: 'object',
      properties: {
        script: {
          type: 'string',
          description: 'AppleScript code to execute'
        }
      },
      required: ['script']
    }
  },

  // Get clipboard history
  get_clipboard_history: {
    name: 'get_clipboard_history',
    description: 'Get clipboard history entries',
    inputSchema: {
      type: 'object',
      properties: {
        limit: {
          type: 'number',
          default: 20
        },
        includeImages: {
          type: 'boolean',
          default: false
        }
      }
    }
  },

  // Get clipboard content
  get_clipboard: {
    name: 'get_clipboard',
    description: 'Get current clipboard content',
    inputSchema: {
      type: 'object',
      properties: {}
    }
  },

  // Set clipboard content
  set_clipboard: {
    name: 'set_clipboard',
    description: 'Set clipboard content',
    inputSchema: {
      type: 'object',
      properties: {
        text: {
          type: 'string',
          description: 'Text to copy to clipboard'
        }
      },
      required: ['text']
    }
  },

  // Take screenshot
  take_screenshot: {
    name: 'take_screenshot',
    description: 'Take a screenshot of screen or window',
    inputSchema: {
      type: 'object',
      properties: {
        target: {
          type: 'string',
          enum: ['fullscreen', 'window', 'selection'],
          default: 'fullscreen'
        },
        windowId: {
          type: 'number',
          description: 'Window ID for window screenshots'
        },
        path: {
          type: 'string',
          description: 'Path to save screenshot'
        }
      }
    }
  },

  // System information
  get_system_info: {
    name: 'get_system_info',
    description: 'Get system information',
    inputSchema: {
      type: 'object',
      properties: {}
    }
  },

  // Open URL or file
  open_path: {
    name: 'open_path',
    description: 'Open a URL or file with the default application',
    inputSchema: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'URL or file path to open'
        }
      },
      required: ['path']
    }
  },

  // Show notification
  show_notification: {
    name: 'show_notification',
    description: 'Show a system notification',
    inputSchema: {
      type: 'object',
      properties: {
        title: {
          type: 'string',
          description: 'Notification title'
        },
        body: {
          type: 'string',
          description: 'Notification body'
        },
        sound: {
          type: 'boolean',
          description: 'Play notification sound',
          default: true
        }
      },
      required: ['title', 'body']
    }
  }
}

// Store clipboard history in memory (would be better in persistent storage)
const clipboardHistory: string[] = []

/**
 * Tool handlers for system operations
 */
export const systemHandlers = {
  execute_applescript: async (params: any) => {
    logger.info('Executing AppleScript')
    try {
      const output = await Command.sidecar('bin/osascript', ['-e', params.script]).execute()
      
      if (output.code !== 0) {
        throw new Error(`AppleScript failed: ${output.stderr}`)
      }
      
      logger.info('AppleScript executed successfully')
      
      return {
        content: [{
          text: output.stdout || 'Script executed successfully'
        }]
      }
    } catch (error) {
      logger.error('Failed to execute AppleScript', { error })
      return {
        error: `Failed to execute AppleScript: ${error}`,
        content: []
      }
    }
  },

  get_clipboard_history: async (params: any) => {
    logger.info('Getting clipboard history', { limit: params.limit })
    try {
      // Return stored history (limited to requested count)
      const history = clipboardHistory.slice(0, params.limit)
      
      logger.info('Retrieved clipboard history', { count: history.length })
      
      return {
        content: [{
          text: JSON.stringify(history, null, 2)
        }]
      }
    } catch (error) {
      logger.error('Failed to get clipboard history', { error })
      return {
        error: `Failed to get clipboard history: ${error}`,
        content: []
      }
    }
  },

  get_clipboard: async (params: any) => {
    logger.info('Getting clipboard content')
    try {
      const text = await readText()
      
      logger.info('Retrieved clipboard content', { 
        contentLength: text?.length || 0 
      })
      
      return {
        content: [{
          text: text || ''
        }]
      }
    } catch (error) {
      logger.error('Failed to get clipboard', { error })
      return {
        error: `Failed to get clipboard: ${error}`,
        content: []
      }
    }
  },

  set_clipboard: async (params: any) => {
    logger.info('Setting clipboard content', { 
      textLength: params.text.length 
    })
    try {
      await writeText(params.text)
      
      // Add to history
      clipboardHistory.unshift(params.text)
      if (clipboardHistory.length > 100) {
        clipboardHistory.splice(100)
      }
      
      logger.info('Clipboard content set successfully')
      
      return {
        content: [{
          text: 'Clipboard updated successfully'
        }]
      }
    } catch (error) {
      logger.error('Failed to set clipboard', { error })
      return {
        error: `Failed to set clipboard: ${error}`,
        content: []
      }
    }
  },

  take_screenshot: async (params: any) => {
    logger.info('Taking screenshot', { target: params.target })
    try {
      const args = []
      
      if (params.target === 'window' && params.windowId) {
        args.push('-l', params.windowId.toString())
      } else if (params.target === 'selection') {
        args.push('-i')
      }
      
      if (params.path) {
        args.push(params.path)
      } else {
        // Default to desktop with timestamp
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
        args.push(`~/Desktop/Screenshot-${timestamp}.png`)
      }
      
      const output = await Command.sidecar('bin/screencapture', args).execute()
      
      if (output.code !== 0) {
        throw new Error(`Screenshot failed: ${output.stderr}`)
      }
      
      logger.info('Screenshot taken successfully')
      
      return {
        content: [{
          text: `Screenshot saved to ${params.path || 'Desktop'}`
        }]
      }
    } catch (error) {
      logger.error('Failed to take screenshot', { error })
      return {
        error: `Failed to take screenshot: ${error}`,
        content: []
      }
    }
  },

  get_system_info: async (params: any) => {
    logger.info('Getting system information')
    try {
      const { platform, version, arch } = await import('@tauri-apps/plugin-os')
      
      const info = {
        platform: platform(),
        version: version(),
        arch: arch(),
        // Add more system info as needed
      }
      
      logger.info('Retrieved system information', info)
      
      return {
        content: [{
          text: JSON.stringify(info, null, 2)
        }]
      }
    } catch (error) {
      logger.error('Failed to get system info', { error })
      return {
        error: `Failed to get system info: ${error}`,
        content: []
      }
    }
  },

  open_path: async (params: any) => {
    logger.info('Opening path', { path: params.path })
    try {
      const { open } = await import('@tauri-apps/plugin-shell')
      await open(params.path)
      
      logger.info('Path opened successfully')
      
      return {
        content: [{
          text: `Opened: ${params.path}`
        }]
      }
    } catch (error) {
      logger.error('Failed to open path', { error })
      return {
        error: `Failed to open path: ${error}`,
        content: []
      }
    }
  },

  show_notification: async (params: any) => {
    logger.info('Showing notification', { title: params.title })
    try {
      const { sendNotification } = await import('@tauri-apps/plugin-notification')
      
      await sendNotification({
        title: params.title,
        body: params.body,
        // sound: params.sound // Not supported in current API
      })
      
      logger.info('Notification shown successfully')
      
      return {
        content: [{
          text: 'Notification displayed'
        }]
      }
    } catch (error) {
      logger.error('Failed to show notification', { error })
      return {
        error: `Failed to show notification: ${error}`,
        content: []
      }
    }
  }
}