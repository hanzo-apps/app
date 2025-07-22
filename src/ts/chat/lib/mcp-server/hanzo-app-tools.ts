/**
 * Hanzo App MCP Tools
 * 
 * Exposes all Tauri plugin functionality as MCP tools
 * Uses the same pattern as @hanzo/cli-tools from the extension
 */

import type { MCPTool } from '../types/mcp'
import { invoke } from '@tauri-apps/api/core'
import { 
  readDir, 
  readFile, 
  writeFile, 
  exists, 
  create,
  remove,
  rename,
  copyFile,
  metadata
} from '@tauri-apps/plugin-fs'
import { Command, open as shellOpen } from '@tauri-apps/plugin-shell'
import { exit, relaunch } from '@tauri-apps/plugin-process'
import { platform, version, arch, hostname, locale, type as osType } from '@tauri-apps/plugin-os'
import { open as dialogOpen, save, message, ask, confirm } from '@tauri-apps/plugin-dialog'
import { fetch } from '@tauri-apps/plugin-http'
import { sendNotification, isPermissionGranted, requestPermission } from '@tauri-apps/plugin-notification'
import { readText, writeText } from '@tauri-apps/plugin-clipboard-manager'
import { register, unregister, isRegistered } from '@tauri-apps/plugin-global-shortcut'
import { load as loadStore } from '@tauri-apps/plugin-store'
import { trace, debug, info, warn, error } from '@tauri-apps/plugin-log'
import { check as checkUpdate } from '@tauri-apps/plugin-updater'

/**
 * Create Hanzo App-specific MCP tools
 */
export function createHanzoAppTools(): MCPTool[] {
  return [
    // App Launcher Tools
    {
      name: 'search_apps',
      description: 'Search for installed applications',
      inputSchema: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Search query' }
        },
        required: ['query']
      },
      handler: async (args: any) => {
        try {
          const apps = await invoke<any[]>('get_apps')
          const filtered = apps.filter(app => 
            app.name.toLowerCase().includes(args.query.toLowerCase())
          )
          return JSON.stringify(filtered, null, 2)
        } catch (error) {
          return `Error searching apps: ${error}`
        }
      }
    },

    {
      name: 'launch_app',
      description: 'Launch an application',
      inputSchema: {
        type: 'object',
        properties: {
          appId: { type: 'string', description: 'Application ID or path' }
        },
        required: ['appId']
      },
      handler: async (args: any) => {
        try {
          await invoke('launch_application', { appId: args.appId })
          return `Launched application: ${args.appId}`
        } catch (error) {
          return `Error launching app: ${error}`
        }
      }
    },

    // File System Tools (enhanced with Tauri)
    {
      name: 'fs_read',
      description: 'Read file contents using Tauri file system plugin',
      inputSchema: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'File path' }
        },
        required: ['path']
      },
      handler: async (args: any) => {
        try {
          const content = await readFile(args.path)
          return new TextDecoder().decode(content)
        } catch (error) {
          return `Error reading file: ${error}`
        }
      }
    },

    {
      name: 'fs_write',
      description: 'Write content to a file',
      inputSchema: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'File path' },
          content: { type: 'string', description: 'Content to write' }
        },
        required: ['path', 'content']
      },
      handler: async (args: any) => {
        try {
          const encoder = new TextEncoder()
          await writeFile(args.path, encoder.encode(args.content))
          return `File written successfully: ${args.path}`
        } catch (error) {
          return `Error writing file: ${error}`
        }
      }
    },

    {
      name: 'fs_list',
      description: 'List directory contents',
      inputSchema: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'Directory path' },
          recursive: { type: 'boolean', default: false }
        },
        required: ['path']
      },
      handler: async (args: any) => {
        try {
          const entries = await readDir(args.path, { recursive: args.recursive })
          return JSON.stringify(entries, null, 2)
        } catch (error) {
          return `Error listing directory: ${error}`
        }
      }
    },

    // Shell/Process Tools
    {
      name: 'shell_run',
      description: 'Execute shell command',
      inputSchema: {
        type: 'object',
        properties: {
          command: { type: 'string', description: 'Command to execute' },
          args: { type: 'array', items: { type: 'string' } }
        },
        required: ['command']
      },
      handler: async (args: any) => {
        try {
          const cmd = new Command(args.command, args.args)
          const output = await cmd.execute()
          return JSON.stringify({
            code: output.code,
            stdout: output.stdout,
            stderr: output.stderr
          }, null, 2)
        } catch (error) {
          return `Error executing command: ${error}`
        }
      }
    },

    {
      name: 'shell_open',
      description: 'Open file or URL with default application',
      inputSchema: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'File path or URL' }
        },
        required: ['path']
      },
      handler: async (args: any) => {
        try {
          await shellOpen(args.path)
          return `Opened: ${args.path}`
        } catch (error) {
          return `Error opening: ${error}`
        }
      }
    },

    // System Info Tools
    {
      name: 'system_info',
      description: 'Get system information',
      inputSchema: {
        type: 'object',
        properties: {}
      },
      handler: async () => {
        try {
          const info = {
            platform: platform(),
            version: version(),
            arch: arch(),
            hostname: await hostname(),
            locale: await locale(),
            type: osType()
          }
          return JSON.stringify(info, null, 2)
        } catch (error) {
          return `Error getting system info: ${error}`
        }
      }
    },

    // Clipboard Tools
    {
      name: 'clipboard_read',
      description: 'Read text from clipboard',
      inputSchema: {
        type: 'object',
        properties: {}
      },
      handler: async () => {
        try {
          const text = await readText()
          return text || ''
        } catch (error) {
          return `Error reading clipboard: ${error}`
        }
      }
    },

    {
      name: 'clipboard_write',
      description: 'Write text to clipboard',
      inputSchema: {
        type: 'object',
        properties: {
          text: { type: 'string', description: 'Text to copy' }
        },
        required: ['text']
      },
      handler: async (args: any) => {
        try {
          await writeText(args.text)
          return 'Text copied to clipboard'
        } catch (error) {
          return `Error writing clipboard: ${error}`
        }
      }
    },

    // Notification Tools
    {
      name: 'notify',
      description: 'Send system notification',
      inputSchema: {
        type: 'object',
        properties: {
          title: { type: 'string', description: 'Title' },
          body: { type: 'string', description: 'Body text' }
        },
        required: ['title', 'body']
      },
      handler: async (args: any) => {
        try {
          let granted = await isPermissionGranted()
          if (!granted) {
            const permission = await requestPermission()
            granted = permission === 'granted'
          }
          
          if (granted) {
            await sendNotification({ title: args.title, body: args.body })
            return 'Notification sent'
          } else {
            return 'Notification permission denied'
          }
        } catch (error) {
          return `Error sending notification: ${error}`
        }
      }
    },

    // Dialog Tools
    {
      name: 'dialog_file_open',
      description: 'Show file open dialog',
      inputSchema: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          multiple: { type: 'boolean', default: false },
          directory: { type: 'boolean', default: false }
        }
      },
      handler: async (args: any) => {
        try {
          const result = await dialogOpen({
            title: args.title,
            multiple: args.multiple,
            directory: args.directory
          })
          return JSON.stringify(result, null, 2)
        } catch (error) {
          return `Error showing dialog: ${error}`
        }
      }
    },

    {
      name: 'dialog_confirm',
      description: 'Show confirmation dialog',
      inputSchema: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          message: { type: 'string' }
        },
        required: ['message']
      },
      handler: async (args: any) => {
        try {
          const result = await confirm(args.message, { title: args.title })
          return result ? 'Confirmed' : 'Cancelled'
        } catch (error) {
          return `Error showing dialog: ${error}`
        }
      }
    },

    // HTTP Tools
    {
      name: 'http_fetch',
      description: 'Make HTTP request',
      inputSchema: {
        type: 'object',
        properties: {
          url: { type: 'string', description: 'URL' },
          method: { 
            type: 'string', 
            enum: ['GET', 'POST', 'PUT', 'DELETE'],
            default: 'GET'
          },
          headers: { type: 'object' },
          body: { type: 'string' }
        },
        required: ['url']
      },
      handler: async (args: any) => {
        try {
          const response = await fetch(args.url, {
            method: args.method || 'GET',
            headers: args.headers,
            body: args.body
          })
          
          const text = await response.text()
          return JSON.stringify({
            status: response.status,
            statusText: response.statusText,
            body: text
          }, null, 2)
        } catch (error) {
          return `Error fetching: ${error}`
        }
      }
    },

    // Store/Settings Tools
    {
      name: 'store_get',
      description: 'Get value from persistent store',
      inputSchema: {
        type: 'object',
        properties: {
          key: { type: 'string', description: 'Key to retrieve' },
          storeName: { type: 'string', default: 'default' }
        },
        required: ['key']
      },
      handler: async (args: any) => {
        try {
          const store = await loadStore(`${args.storeName}.json`)
          const value = await store.get(args.key)
          return JSON.stringify(value, null, 2)
        } catch (error) {
          return `Error getting from store: ${error}`
        }
      }
    },

    {
      name: 'store_set',
      description: 'Set value in persistent store',
      inputSchema: {
        type: 'object',
        properties: {
          key: { type: 'string', description: 'Key' },
          value: { description: 'Value (any JSON type)' },
          storeName: { type: 'string', default: 'default' }
        },
        required: ['key', 'value']
      },
      handler: async (args: any) => {
        try {
          const store = await loadStore(`${args.storeName}.json`)
          await store.set(args.key, args.value)
          await store.save()
          return 'Value stored successfully'
        } catch (error) {
          return `Error storing value: ${error}`
        }
      }
    }
  ]
}

/**
 * Create additional native system tools that need Tauri plugin implementation
 */
export function createNativeTools(): MCPTool[] {
  return [
    {
      name: 'spotlight_search',
      description: 'Search files using macOS Spotlight (mdfind)',
      inputSchema: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Search query' },
          path: { type: 'string', description: 'Path to search in' }
        },
        required: ['query']
      },
      handler: async (args: any) => {
        try {
          // This will call a custom Tauri command that wraps mdfind
          const results = await invoke('spotlight_search', args)
          return JSON.stringify(results, null, 2)
        } catch (error) {
          return `Error searching: ${error}`
        }
      }
    },

    {
      name: 'window_list',
      description: 'List all open windows',
      inputSchema: {
        type: 'object',
        properties: {}
      },
      handler: async () => {
        try {
          // This will need a custom Tauri plugin
          const windows = await invoke('list_windows')
          return JSON.stringify(windows, null, 2)
        } catch (error) {
          return `Error listing windows: ${error}`
        }
      }
    },

    {
      name: 'calendar_events',
      description: 'Get calendar events',
      inputSchema: {
        type: 'object',
        properties: {
          startDate: { type: 'string', description: 'ISO date' },
          endDate: { type: 'string', description: 'ISO date' }
        },
        required: ['startDate', 'endDate']
      },
      handler: async (args: any) => {
        try {
          // This will need a custom Tauri plugin
          const events = await invoke('get_calendar_events', args)
          return JSON.stringify(events, null, 2)
        } catch (error) {
          return `Error getting calendar: ${error}`
        }
      }
    }
  ]
}