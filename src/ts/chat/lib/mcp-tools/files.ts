import { invoke } from '@tauri-apps/api/core'
import { Command } from '@tauri-apps/plugin-shell'
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
import { join, dirname, basename } from '@tauri-apps/api/path'
import { createLogger } from '@/lib/logger'
import type { MCPTool } from '@/chat/types/completion'

const logger = createLogger('MCP:Files')

/**
 * MCP tools for file search and management
 */
export const fileSearchTools: Record<string, MCPTool> = {
  // Spotlight search
  search_files: {
    name: 'search_files',
    description: 'Search for files using Spotlight (mdfind)',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search query'
        },
        searchIn: {
          type: 'array',
          items: { type: 'string' },
          description: 'Directories to search in',
          default: ['~']
        },
        fileTypes: {
          type: 'array',
          items: { type: 'string' },
          description: 'File extensions to filter',
          default: []
        },
        limit: {
          type: 'number',
          description: 'Maximum results',
          default: 50
        }
      },
      required: ['query']
    }
  },

  // Get file metadata
  get_file_metadata: {
    name: 'get_file_metadata',
    description: 'Get detailed metadata for a file',
    inputSchema: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'File path'
        }
      },
      required: ['path']
    }
  },

  // Search in file contents
  search_file_contents: {
    name: 'search_file_contents',
    description: 'Search for text within file contents',
    inputSchema: {
      type: 'object',
      properties: {
        pattern: {
          type: 'string',
          description: 'Text pattern to search for'
        },
        directory: {
          type: 'string',
          description: 'Directory to search in',
          default: '.'
        },
        filePattern: {
          type: 'string',
          description: 'File name pattern (glob)',
          default: '*'
        },
        caseSensitive: {
          type: 'boolean',
          description: 'Case sensitive search',
          default: false
        }
      },
      required: ['pattern']
    }
  }
}

/**
 * Tool handlers that execute the file operations
 */
export const fileSearchHandlers = {
  search_files: async (params: any) => {
    logger.info('Searching files with Spotlight', { query: params.query })
    try {
      // Build mdfind command
      const args = [params.query]
      
      // Add search directories
      if (params.searchIn && params.searchIn.length > 0) {
        for (const dir of params.searchIn) {
          args.push('-onlyin', dir.replace('~', process.env.HOME || ''))
        }
      }
      
      // Add file type filters
      if (params.fileTypes && params.fileTypes.length > 0) {
        const kindQuery = params.fileTypes
          .map(ext => `kMDItemFSName == "*.${ext}"`)
          .join(' || ')
        args.push('-name', `"(${kindQuery})"`)
      }
      
      logger.debug('Running mdfind', { args })
      
      const output = await Command.sidecar('bin/mdfind', args).execute()
      
      if (output.code !== 0) {
        throw new Error(`mdfind failed: ${output.stderr}`)
      }
      
      // Parse results
      const files = output.stdout
        .split('\n')
        .filter(line => line.trim())
        .slice(0, params.limit)
      
      logger.info('File search complete', { 
        query: params.query,
        resultCount: files.length 
      })
      
      return {
        content: [{
          text: JSON.stringify(files, null, 2)
        }]
      }
    } catch (error) {
      logger.error('Failed to search files', { error })
      return {
        error: `Failed to search files: ${error}`,
        content: []
      }
    }
  },

  get_file_metadata: async (params: any) => {
    logger.info('Getting file metadata', { path: params.path })
    try {
      // Use mdls to get metadata
      const output = await Command.sidecar('bin/mdls', [params.path]).execute()
      
      if (output.code !== 0) {
        throw new Error(`mdls failed: ${output.stderr}`)
      }
      
      // Parse mdls output into object
      const metadata: Record<string, any> = {}
      const lines = output.stdout.split('\n')
      
      for (const line of lines) {
        const match = line.match(/^(\w+)\s+=\s+(.+)$/)
        if (match) {
          const [, key, value] = match
          // Try to parse value
          try {
            if (value === '(null)') {
              metadata[key] = null
            } else if (value.startsWith('"') && value.endsWith('"')) {
              metadata[key] = value.slice(1, -1)
            } else if (value.startsWith('(') && value.endsWith(')')) {
              // Array value
              metadata[key] = value.slice(1, -1).split(',').map(v => v.trim())
            } else if (!isNaN(Number(value))) {
              metadata[key] = Number(value)
            } else {
              metadata[key] = value
            }
          } catch {
            metadata[key] = value
          }
        }
      }
      
      logger.info('Retrieved file metadata', { 
        path: params.path,
        metadataKeys: Object.keys(metadata).length 
      })
      
      return {
        content: [{
          text: JSON.stringify(metadata, null, 2)
        }]
      }
    } catch (error) {
      logger.error('Failed to get file metadata', { error })
      return {
        error: `Failed to get file metadata: ${error}`,
        content: []
      }
    }
  },

  search_file_contents: async (params: any) => {
    logger.info('Searching file contents', { 
      pattern: params.pattern,
      directory: params.directory 
    })
    try {
      // Use ripgrep for content search
      const args = [params.pattern, params.directory]
      
      // Add case sensitivity
      if (!params.caseSensitive) {
        args.unshift('-i')
      }
      
      // Add file pattern
      if (params.filePattern && params.filePattern !== '*') {
        args.push('--glob', params.filePattern)
      }
      
      // Add JSON output for easier parsing
      args.push('--json')
      
      logger.debug('Running ripgrep', { args })
      
      const output = await Command.sidecar('bin/rg', args).execute()
      
      // Parse JSON lines output
      const results = []
      const lines = output.stdout.split('\n').filter(line => line.trim())
      
      for (const line of lines) {
        try {
          const data = JSON.parse(line)
          if (data.type === 'match') {
            results.push({
              file: data.data.path.text,
              line: data.data.line_number,
              column: data.data.submatches[0]?.start || 0,
              text: data.data.lines.text.trim(),
              match: data.data.submatches[0]?.match.text || params.pattern
            })
          }
        } catch {
          // Skip invalid JSON lines
        }
      }
      
      logger.info('File content search complete', { 
        pattern: params.pattern,
        resultCount: results.length 
      })
      
      return {
        content: [{
          text: JSON.stringify(results, null, 2)
        }]
      }
    } catch (error) {
      logger.error('Failed to search file contents', { error })
      return {
        error: `Failed to search file contents: ${error}`,
        content: []
      }
    }
  }
}