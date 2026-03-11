import { createLogger } from '@/lib/logger'
import type { MCPTool } from '@/chat/types/completion'

// Import all Tauri plugins
import { 
  readDir, 
  readFile, 
  writeFile, 
  exists, 
  create,
  remove,
  rename,
  copyFile,
  metadata,
  BaseDirectory
} from '@tauri-apps/plugin-fs'
import { join, dirname, basename, resolve } from '@tauri-apps/api/path'
import { Command, open as shellOpen } from '@tauri-apps/plugin-shell'
import { exit, relaunch } from '@tauri-apps/plugin-process'
import { 
  platform, 
  version as osVersion, 
  arch, 
  hostname,
  locale,
  type as osType
} from '@tauri-apps/plugin-os'
import { open as dialogOpen, save, message, ask, confirm } from '@tauri-apps/plugin-dialog'
import { fetch, FetchOptions } from '@tauri-apps/plugin-http'
import { 
  sendNotification, 
  isPermissionGranted, 
  requestPermission 
} from '@tauri-apps/plugin-notification'
import { readText, writeText, readImage, writeImage } from '@tauri-apps/plugin-clipboard-manager'
import { register, unregister, isRegistered } from '@tauri-apps/plugin-global-shortcut'
import { load as loadStore, Store } from '@tauri-apps/plugin-store'
import { trace, debug, info, warn, error } from '@tauri-apps/plugin-log'
import { check as checkUpdate } from '@tauri-apps/plugin-updater'

const logger = createLogger('MCP:TauriPlugins')

/**
 * File System MCP Tools
 */
export const fileSystemTools: Record<string, MCPTool> = {
  fs_read_file: {
    name: 'fs_read_file',
    description: 'Read a file from the file system',
    inputSchema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'File path' },
        encoding: { 
          type: 'string', 
          enum: ['utf8', 'binary'],
          default: 'utf8',
          description: 'File encoding' 
        }
      },
      required: ['path']
    }
  },

  fs_write_file: {
    name: 'fs_write_file',
    description: 'Write content to a file',
    inputSchema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'File path' },
        content: { type: 'string', description: 'File content' },
        append: { type: 'boolean', default: false, description: 'Append to file' }
      },
      required: ['path', 'content']
    }
  },

  fs_list_directory: {
    name: 'fs_list_directory',
    description: 'List files and directories in a path',
    inputSchema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Directory path' },
        recursive: { type: 'boolean', default: false }
      },
      required: ['path']
    }
  },

  fs_create_directory: {
    name: 'fs_create_directory',
    description: 'Create a directory',
    inputSchema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Directory path' },
        recursive: { type: 'boolean', default: true }
      },
      required: ['path']
    }
  },

  fs_delete: {
    name: 'fs_delete',
    description: 'Delete a file or directory',
    inputSchema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Path to delete' },
        recursive: { type: 'boolean', default: false }
      },
      required: ['path']
    }
  },

  fs_exists: {
    name: 'fs_exists',
    description: 'Check if a file or directory exists',
    inputSchema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Path to check' }
      },
      required: ['path']
    }
  },

  fs_metadata: {
    name: 'fs_metadata',
    description: 'Get file or directory metadata',
    inputSchema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Path to check' }
      },
      required: ['path']
    }
  },

  fs_copy: {
    name: 'fs_copy',
    description: 'Copy a file',
    inputSchema: {
      type: 'object',
      properties: {
        source: { type: 'string', description: 'Source path' },
        destination: { type: 'string', description: 'Destination path' }
      },
      required: ['source', 'destination']
    }
  },

  fs_rename: {
    name: 'fs_rename',
    description: 'Rename or move a file/directory',
    inputSchema: {
      type: 'object',
      properties: {
        oldPath: { type: 'string', description: 'Current path' },
        newPath: { type: 'string', description: 'New path' }
      },
      required: ['oldPath', 'newPath']
    }
  }
}

/**
 * Shell/Process MCP Tools
 */
export const shellTools: Record<string, MCPTool> = {
  shell_execute: {
    name: 'shell_execute',
    description: 'Execute a shell command',
    inputSchema: {
      type: 'object',
      properties: {
        command: { type: 'string', description: 'Command to execute' },
        args: { 
          type: 'array', 
          items: { type: 'string' },
          description: 'Command arguments' 
        },
        cwd: { type: 'string', description: 'Working directory' }
      },
      required: ['command']
    }
  },

  shell_open: {
    name: 'shell_open',
    description: 'Open a file or URL with the default application',
    inputSchema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'File path or URL to open' }
      },
      required: ['path']
    }
  },

  process_exit: {
    name: 'process_exit',
    description: 'Exit the application',
    inputSchema: {
      type: 'object',
      properties: {
        code: { type: 'number', default: 0, description: 'Exit code' }
      }
    }
  },

  process_relaunch: {
    name: 'process_relaunch',
    description: 'Relaunch the application',
    inputSchema: {
      type: 'object',
      properties: {}
    }
  }
}

/**
 * OS Information MCP Tools
 */
export const osTools: Record<string, MCPTool> = {
  os_info: {
    name: 'os_info',
    description: 'Get operating system information',
    inputSchema: {
      type: 'object',
      properties: {}
    }
  },

  os_hostname: {
    name: 'os_hostname',
    description: 'Get system hostname',
    inputSchema: {
      type: 'object',
      properties: {}
    }
  },

  os_locale: {
    name: 'os_locale',
    description: 'Get system locale',
    inputSchema: {
      type: 'object',
      properties: {}
    }
  }
}

/**
 * Dialog MCP Tools
 */
export const dialogTools: Record<string, MCPTool> = {
  dialog_open_file: {
    name: 'dialog_open_file',
    description: 'Show file open dialog',
    inputSchema: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Dialog title' },
        filters: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              extensions: { type: 'array', items: { type: 'string' } }
            }
          },
          description: 'File type filters'
        },
        multiple: { type: 'boolean', default: false },
        directory: { type: 'boolean', default: false }
      }
    }
  },

  dialog_save_file: {
    name: 'dialog_save_file',
    description: 'Show file save dialog',
    inputSchema: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Dialog title' },
        defaultPath: { type: 'string', description: 'Default save path' },
        filters: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              extensions: { type: 'array', items: { type: 'string' } }
            }
          }
        }
      }
    }
  },

  dialog_message: {
    name: 'dialog_message',
    description: 'Show message dialog',
    inputSchema: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Dialog title' },
        message: { type: 'string', description: 'Message content' },
        type: { 
          type: 'string', 
          enum: ['info', 'warning', 'error'],
          default: 'info'
        }
      },
      required: ['message']
    }
  },

  dialog_confirm: {
    name: 'dialog_confirm',
    description: 'Show confirmation dialog',
    inputSchema: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Dialog title' },
        message: { type: 'string', description: 'Confirmation message' },
        okLabel: { type: 'string', default: 'OK' },
        cancelLabel: { type: 'string', default: 'Cancel' }
      },
      required: ['message']
    }
  },

  dialog_ask: {
    name: 'dialog_ask',
    description: 'Show yes/no dialog',
    inputSchema: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Dialog title' },
        message: { type: 'string', description: 'Question to ask' }
      },
      required: ['message']
    }
  }
}

/**
 * HTTP MCP Tools
 */
export const httpTools: Record<string, MCPTool> = {
  http_fetch: {
    name: 'http_fetch',
    description: 'Make HTTP request',
    inputSchema: {
      type: 'object',
      properties: {
        url: { type: 'string', description: 'URL to fetch' },
        method: { 
          type: 'string', 
          enum: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
          default: 'GET'
        },
        headers: { 
          type: 'object',
          additionalProperties: { type: 'string' },
          description: 'Request headers'
        },
        body: { type: 'string', description: 'Request body' }
      },
      required: ['url']
    }
  }
}

/**
 * Notification MCP Tools
 */
export const notificationTools: Record<string, MCPTool> = {
  notification_send: {
    name: 'notification_send',
    description: 'Send system notification',
    inputSchema: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Notification title' },
        body: { type: 'string', description: 'Notification body' },
        icon: { type: 'string', description: 'Icon path' }
      },
      required: ['title', 'body']
    }
  },

  notification_check_permission: {
    name: 'notification_check_permission',
    description: 'Check notification permission',
    inputSchema: {
      type: 'object',
      properties: {}
    }
  },

  notification_request_permission: {
    name: 'notification_request_permission',
    description: 'Request notification permission',
    inputSchema: {
      type: 'object',
      properties: {}
    }
  }
}

/**
 * Clipboard MCP Tools (already defined in system.ts, but let's extend)
 */
export const clipboardTools: Record<string, MCPTool> = {
  clipboard_read_text: {
    name: 'clipboard_read_text',
    description: 'Read text from clipboard',
    inputSchema: {
      type: 'object',
      properties: {}
    }
  },

  clipboard_write_text: {
    name: 'clipboard_write_text',
    description: 'Write text to clipboard',
    inputSchema: {
      type: 'object',
      properties: {
        text: { type: 'string', description: 'Text to write' }
      },
      required: ['text']
    }
  },

  clipboard_read_image: {
    name: 'clipboard_read_image',
    description: 'Read image from clipboard',
    inputSchema: {
      type: 'object',
      properties: {}
    }
  },

  clipboard_write_image: {
    name: 'clipboard_write_image',
    description: 'Write image to clipboard',
    inputSchema: {
      type: 'object',
      properties: {
        imageData: { type: 'string', description: 'Base64 encoded image data' }
      },
      required: ['imageData']
    }
  }
}

/**
 * Global Shortcut MCP Tools
 */
export const shortcutTools: Record<string, MCPTool> = {
  shortcut_register: {
    name: 'shortcut_register',
    description: 'Register a global keyboard shortcut',
    inputSchema: {
      type: 'object',
      properties: {
        shortcut: { 
          type: 'string', 
          description: 'Shortcut string (e.g., "Cmd+Shift+A")' 
        },
        id: { type: 'string', description: 'Unique shortcut ID' }
      },
      required: ['shortcut', 'id']
    }
  },

  shortcut_unregister: {
    name: 'shortcut_unregister',
    description: 'Unregister a global shortcut',
    inputSchema: {
      type: 'object',
      properties: {
        shortcut: { type: 'string', description: 'Shortcut to unregister' }
      },
      required: ['shortcut']
    }
  },

  shortcut_is_registered: {
    name: 'shortcut_is_registered',
    description: 'Check if a shortcut is registered',
    inputSchema: {
      type: 'object',
      properties: {
        shortcut: { type: 'string', description: 'Shortcut to check' }
      },
      required: ['shortcut']
    }
  }
}

/**
 * Store MCP Tools
 */
export const storeTools: Record<string, MCPTool> = {
  store_get: {
    name: 'store_get',
    description: 'Get value from persistent store',
    inputSchema: {
      type: 'object',
      properties: {
        key: { type: 'string', description: 'Key to retrieve' },
        storeName: { type: 'string', default: 'default', description: 'Store name' }
      },
      required: ['key']
    }
  },

  store_set: {
    name: 'store_set',
    description: 'Set value in persistent store',
    inputSchema: {
      type: 'object',
      properties: {
        key: { type: 'string', description: 'Key to set' },
        value: { description: 'Value to store (any JSON-serializable type)' },
        storeName: { type: 'string', default: 'default', description: 'Store name' }
      },
      required: ['key', 'value']
    }
  },

  store_delete: {
    name: 'store_delete',
    description: 'Delete value from store',
    inputSchema: {
      type: 'object',
      properties: {
        key: { type: 'string', description: 'Key to delete' },
        storeName: { type: 'string', default: 'default', description: 'Store name' }
      },
      required: ['key']
    }
  },

  store_clear: {
    name: 'store_clear',
    description: 'Clear all values from store',
    inputSchema: {
      type: 'object',
      properties: {
        storeName: { type: 'string', default: 'default', description: 'Store name' }
      }
    }
  },

  store_list_keys: {
    name: 'store_list_keys',
    description: 'List all keys in store',
    inputSchema: {
      type: 'object',
      properties: {
        storeName: { type: 'string', default: 'default', description: 'Store name' }
      }
    }
  }
}

/**
 * Log MCP Tools
 */
export const logTools: Record<string, MCPTool> = {
  log_trace: {
    name: 'log_trace',
    description: 'Log trace message',
    inputSchema: {
      type: 'object',
      properties: {
        message: { type: 'string', description: 'Message to log' }
      },
      required: ['message']
    }
  },

  log_debug: {
    name: 'log_debug',
    description: 'Log debug message',
    inputSchema: {
      type: 'object',
      properties: {
        message: { type: 'string', description: 'Message to log' }
      },
      required: ['message']
    }
  },

  log_info: {
    name: 'log_info',
    description: 'Log info message',
    inputSchema: {
      type: 'object',
      properties: {
        message: { type: 'string', description: 'Message to log' }
      },
      required: ['message']
    }
  },

  log_warn: {
    name: 'log_warn',
    description: 'Log warning message',
    inputSchema: {
      type: 'object',
      properties: {
        message: { type: 'string', description: 'Message to log' }
      },
      required: ['message']
    }
  },

  log_error: {
    name: 'log_error',
    description: 'Log error message',
    inputSchema: {
      type: 'object',
      properties: {
        message: { type: 'string', description: 'Message to log' }
      },
      required: ['message']
    }
  }
}

/**
 * Updater MCP Tools
 */
export const updaterTools: Record<string, MCPTool> = {
  updater_check: {
    name: 'updater_check',
    description: 'Check for application updates',
    inputSchema: {
      type: 'object',
      properties: {}
    }
  }
}

/**
 * Combined Tauri Plugin Tools
 */
export const tauriPluginTools: Record<string, MCPTool> = {
  ...fileSystemTools,
  ...shellTools,
  ...osTools,
  ...dialogTools,
  ...httpTools,
  ...notificationTools,
  ...clipboardTools,
  ...shortcutTools,
  ...storeTools,
  ...logTools,
  ...updaterTools
}

// Store instances
const stores = new Map<string, Store>()

/**
 * Get or create a store instance
 */
async function getStore(name: string = 'default'): Promise<Store> {
  if (!stores.has(name)) {
    const store = await loadStore(`${name}.json`)
    stores.set(name, store)
  }
  return stores.get(name)!
}

/**
 * Handlers for all Tauri plugin tools
 */
export const tauriPluginHandlers = {
  // File System handlers
  fs_read_file: async (params: any) => {
    try {
      const content = await readFile(params.path)
      const text = params.encoding === 'binary' 
        ? btoa(String.fromCharCode(...content))
        : new TextDecoder().decode(content)
      
      return { content: [{ text }] }
    } catch (error) {
      return { error: `Failed to read file: ${error}`, content: [] }
    }
  },

  fs_write_file: async (params: any) => {
    try {
      const encoder = new TextEncoder()
      const data = encoder.encode(params.content)
      
      if (params.append) {
        // Read existing content first
        try {
          const existing = await readFile(params.path)
          const combined = new Uint8Array(existing.length + data.length)
          combined.set(existing)
          combined.set(data, existing.length)
          await writeFile(params.path, combined)
        } catch {
          // File doesn't exist, just write
          await writeFile(params.path, data)
        }
      } else {
        await writeFile(params.path, data)
      }
      
      return { content: [{ text: 'File written successfully' }] }
    } catch (error) {
      return { error: `Failed to write file: ${error}`, content: [] }
    }
  },

  fs_list_directory: async (params: any) => {
    try {
      const entries = await readDir(params.path, { recursive: params.recursive })
      return { content: [{ text: JSON.stringify(entries, null, 2) }] }
    } catch (error) {
      return { error: `Failed to list directory: ${error}`, content: [] }
    }
  },

  fs_create_directory: async (params: any) => {
    try {
      await create(params.path, { recursive: params.recursive })
      return { content: [{ text: 'Directory created successfully' }] }
    } catch (error) {
      return { error: `Failed to create directory: ${error}`, content: [] }
    }
  },

  fs_delete: async (params: any) => {
    try {
      await remove(params.path, { recursive: params.recursive })
      return { content: [{ text: 'Path deleted successfully' }] }
    } catch (error) {
      return { error: `Failed to delete: ${error}`, content: [] }
    }
  },

  fs_exists: async (params: any) => {
    try {
      const result = await exists(params.path)
      return { content: [{ text: result.toString() }] }
    } catch (error) {
      return { error: `Failed to check existence: ${error}`, content: [] }
    }
  },

  fs_metadata: async (params: any) => {
    try {
      const meta = await metadata(params.path)
      return { content: [{ text: JSON.stringify(meta, null, 2) }] }
    } catch (error) {
      return { error: `Failed to get metadata: ${error}`, content: [] }
    }
  },

  fs_copy: async (params: any) => {
    try {
      await copyFile(params.source, params.destination)
      return { content: [{ text: 'File copied successfully' }] }
    } catch (error) {
      return { error: `Failed to copy file: ${error}`, content: [] }
    }
  },

  fs_rename: async (params: any) => {
    try {
      await rename(params.oldPath, params.newPath)
      return { content: [{ text: 'Path renamed successfully' }] }
    } catch (error) {
      return { error: `Failed to rename: ${error}`, content: [] }
    }
  },

  // Shell handlers
  shell_execute: async (params: any) => {
    try {
      const cmd = params.args 
        ? Command.sidecar('bin/' + params.command, params.args)
        : Command.sidecar('bin/' + params.command)
      
      if (params.cwd) {
        cmd.currentDir(params.cwd)
      }
      
      const output = await cmd.execute()
      return { 
        content: [{ 
          text: JSON.stringify({
            code: output.code,
            stdout: output.stdout,
            stderr: output.stderr
          }, null, 2)
        }] 
      }
    } catch (error) {
      return { error: `Failed to execute command: ${error}`, content: [] }
    }
  },

  shell_open: async (params: any) => {
    try {
      await shellOpen(params.path)
      return { content: [{ text: `Opened: ${params.path}` }] }
    } catch (error) {
      return { error: `Failed to open: ${error}`, content: [] }
    }
  },

  process_exit: async (params: any) => {
    try {
      await exit(params.code || 0)
      return { content: [{ text: 'Exiting...' }] }
    } catch (error) {
      return { error: `Failed to exit: ${error}`, content: [] }
    }
  },

  process_relaunch: async (params: any) => {
    try {
      await relaunch()
      return { content: [{ text: 'Relaunching...' }] }
    } catch (error) {
      return { error: `Failed to relaunch: ${error}`, content: [] }
    }
  },

  // OS handlers
  os_info: async (params: any) => {
    try {
      const info = {
        platform: platform(),
        version: osVersion(),
        arch: arch(),
        type: osType()
      }
      return { content: [{ text: JSON.stringify(info, null, 2) }] }
    } catch (error) {
      return { error: `Failed to get OS info: ${error}`, content: [] }
    }
  },

  os_hostname: async (params: any) => {
    try {
      const name = await hostname()
      return { content: [{ text: name }] }
    } catch (error) {
      return { error: `Failed to get hostname: ${error}`, content: [] }
    }
  },

  os_locale: async (params: any) => {
    try {
      const loc = await locale()
      return { content: [{ text: loc || 'Unknown' }] }
    } catch (error) {
      return { error: `Failed to get locale: ${error}`, content: [] }
    }
  },

  // Dialog handlers
  dialog_open_file: async (params: any) => {
    try {
      const result = await dialogOpen({
        title: params.title,
        filters: params.filters,
        multiple: params.multiple,
        directory: params.directory
      })
      return { content: [{ text: JSON.stringify(result, null, 2) }] }
    } catch (error) {
      return { error: `Failed to open dialog: ${error}`, content: [] }
    }
  },

  dialog_save_file: async (params: any) => {
    try {
      const result = await save({
        title: params.title,
        defaultPath: params.defaultPath,
        filters: params.filters
      })
      return { content: [{ text: result || 'Cancelled' }] }
    } catch (error) {
      return { error: `Failed to save dialog: ${error}`, content: [] }
    }
  },

  dialog_message: async (params: any) => {
    try {
      await message(params.message, { 
        title: params.title,
        kind: params.type
      })
      return { content: [{ text: 'Message shown' }] }
    } catch (error) {
      return { error: `Failed to show message: ${error}`, content: [] }
    }
  },

  dialog_confirm: async (params: any) => {
    try {
      const result = await confirm(params.message, {
        title: params.title,
        okLabel: params.okLabel,
        cancelLabel: params.cancelLabel
      })
      return { content: [{ text: result.toString() }] }
    } catch (error) {
      return { error: `Failed to show confirm: ${error}`, content: [] }
    }
  },

  dialog_ask: async (params: any) => {
    try {
      const result = await ask(params.message, {
        title: params.title
      })
      return { content: [{ text: result.toString() }] }
    } catch (error) {
      return { error: `Failed to ask: ${error}`, content: [] }
    }
  },

  // HTTP handlers
  http_fetch: async (params: any) => {
    try {
      const options: FetchOptions = {
        method: params.method || 'GET',
        headers: params.headers,
        body: params.body
      }
      
      const response = await fetch(params.url, options)
      const text = await response.text()
      
      return { 
        content: [{ 
          text: JSON.stringify({
            status: response.status,
            statusText: response.statusText,
            headers: Object.fromEntries(response.headers.entries()),
            body: text
          }, null, 2)
        }] 
      }
    } catch (error) {
      return { error: `Failed to fetch: ${error}`, content: [] }
    }
  },

  // Notification handlers
  notification_send: async (params: any) => {
    try {
      // Check permission first
      let permissionGranted = await isPermissionGranted()
      
      if (!permissionGranted) {
        const permission = await requestPermission()
        permissionGranted = permission === 'granted'
      }
      
      if (permissionGranted) {
        await sendNotification({
          title: params.title,
          body: params.body,
          icon: params.icon
        })
        return { content: [{ text: 'Notification sent' }] }
      } else {
        return { error: 'Notification permission denied', content: [] }
      }
    } catch (error) {
      return { error: `Failed to send notification: ${error}`, content: [] }
    }
  },

  notification_check_permission: async (params: any) => {
    try {
      const granted = await isPermissionGranted()
      return { content: [{ text: granted.toString() }] }
    } catch (error) {
      return { error: `Failed to check permission: ${error}`, content: [] }
    }
  },

  notification_request_permission: async (params: any) => {
    try {
      const result = await requestPermission()
      return { content: [{ text: result }] }
    } catch (error) {
      return { error: `Failed to request permission: ${error}`, content: [] }
    }
  },

  // Clipboard handlers
  clipboard_read_text: async (params: any) => {
    try {
      const text = await readText()
      return { content: [{ text: text || '' }] }
    } catch (error) {
      return { error: `Failed to read clipboard: ${error}`, content: [] }
    }
  },

  clipboard_write_text: async (params: any) => {
    try {
      await writeText(params.text)
      return { content: [{ text: 'Text written to clipboard' }] }
    } catch (error) {
      return { error: `Failed to write clipboard: ${error}`, content: [] }
    }
  },

  clipboard_read_image: async (params: any) => {
    try {
      const image = await readImage()
      // Convert to base64
      const base64 = btoa(String.fromCharCode(...image))
      return { content: [{ text: base64 }] }
    } catch (error) {
      return { error: `Failed to read image: ${error}`, content: [] }
    }
  },

  clipboard_write_image: async (params: any) => {
    try {
      // Convert from base64
      const binaryString = atob(params.imageData)
      const bytes = new Uint8Array(binaryString.length)
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i)
      }
      
      await writeImage(bytes)
      return { content: [{ text: 'Image written to clipboard' }] }
    } catch (error) {
      return { error: `Failed to write image: ${error}`, content: [] }
    }
  },

  // Global shortcut handlers
  shortcut_register: async (params: any) => {
    try {
      // Register with a callback
      await register(params.shortcut, () => {
        logger.info(`Shortcut triggered: ${params.shortcut}`)
        // Emit event or handle callback
      })
      return { content: [{ text: `Shortcut registered: ${params.shortcut}` }] }
    } catch (error) {
      return { error: `Failed to register shortcut: ${error}`, content: [] }
    }
  },

  shortcut_unregister: async (params: any) => {
    try {
      await unregister(params.shortcut)
      return { content: [{ text: `Shortcut unregistered: ${params.shortcut}` }] }
    } catch (error) {
      return { error: `Failed to unregister shortcut: ${error}`, content: [] }
    }
  },

  shortcut_is_registered: async (params: any) => {
    try {
      const registered = await isRegistered(params.shortcut)
      return { content: [{ text: registered.toString() }] }
    } catch (error) {
      return { error: `Failed to check shortcut: ${error}`, content: [] }
    }
  },

  // Store handlers
  store_get: async (params: any) => {
    try {
      const store = await getStore(params.storeName)
      const value = await store.get(params.key)
      return { content: [{ text: JSON.stringify(value, null, 2) }] }
    } catch (error) {
      return { error: `Failed to get from store: ${error}`, content: [] }
    }
  },

  store_set: async (params: any) => {
    try {
      const store = await getStore(params.storeName)
      await store.set(params.key, params.value)
      await store.save()
      return { content: [{ text: 'Value stored successfully' }] }
    } catch (error) {
      return { error: `Failed to set in store: ${error}`, content: [] }
    }
  },

  store_delete: async (params: any) => {
    try {
      const store = await getStore(params.storeName)
      await store.delete(params.key)
      await store.save()
      return { content: [{ text: 'Key deleted successfully' }] }
    } catch (error) {
      return { error: `Failed to delete from store: ${error}`, content: [] }
    }
  },

  store_clear: async (params: any) => {
    try {
      const store = await getStore(params.storeName)
      await store.clear()
      await store.save()
      return { content: [{ text: 'Store cleared successfully' }] }
    } catch (error) {
      return { error: `Failed to clear store: ${error}`, content: [] }
    }
  },

  store_list_keys: async (params: any) => {
    try {
      const store = await getStore(params.storeName)
      const keys = await store.keys()
      return { content: [{ text: JSON.stringify(keys, null, 2) }] }
    } catch (error) {
      return { error: `Failed to list keys: ${error}`, content: [] }
    }
  },

  // Log handlers
  log_trace: async (params: any) => {
    try {
      await trace(params.message)
      return { content: [{ text: 'Logged trace message' }] }
    } catch (error) {
      return { error: `Failed to log: ${error}`, content: [] }
    }
  },

  log_debug: async (params: any) => {
    try {
      await debug(params.message)
      return { content: [{ text: 'Logged debug message' }] }
    } catch (error) {
      return { error: `Failed to log: ${error}`, content: [] }
    }
  },

  log_info: async (params: any) => {
    try {
      await info(params.message)
      return { content: [{ text: 'Logged info message' }] }
    } catch (error) {
      return { error: `Failed to log: ${error}`, content: [] }
    }
  },

  log_warn: async (params: any) => {
    try {
      await warn(params.message)
      return { content: [{ text: 'Logged warning message' }] }
    } catch (error) {
      return { error: `Failed to log: ${error}`, content: [] }
    }
  },

  log_error: async (params: any) => {
    try {
      await error(params.message)
      return { content: [{ text: 'Logged error message' }] }
    } catch (error) {
      return { error: `Failed to log: ${error}`, content: [] }
    }
  },

  // Updater handlers
  updater_check: async (params: any) => {
    try {
      const update = await checkUpdate()
      return { 
        content: [{ 
          text: JSON.stringify({
            available: update.available,
            currentVersion: update.currentVersion,
            version: update.version,
            body: update.body,
            date: update.date
          }, null, 2)
        }] 
      }
    } catch (error) {
      return { error: `Failed to check update: ${error}`, content: [] }
    }
  }
}