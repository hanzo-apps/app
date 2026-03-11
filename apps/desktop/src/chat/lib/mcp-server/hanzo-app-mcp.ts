#!/usr/bin/env node

/**
 * Hanzo App MCP Server
 * 
 * Exposes all Hanzo app functionality (Tauri plugins, native features) as MCP tools
 * Can be used:
 * 1. As a standalone MCP server (like hanzo-mcp)
 * 2. Integrated into @hanzo/mcp package
 * 3. Internally by the Hanzo app
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'

// Import all our tool collections
import { applicationTools, applicationHandlers } from '../mcp-tools/applications'
import { fileSearchTools, fileSearchHandlers } from '../mcp-tools/files'
import { windowTools, windowHandlers } from '../mcp-tools/windows'
import { systemTools, systemHandlers } from '../mcp-tools/system'
import { tauriPluginTools, tauriPluginHandlers } from '../mcp-tools/tauri-plugins'

// Combine all tools
const allTools = {
  ...applicationTools,
  ...fileSearchTools,
  ...windowTools,
  ...systemTools,
  ...tauriPluginTools,
}

const allHandlers = {
  ...applicationHandlers,
  ...fileSearchHandlers,
  ...windowHandlers,
  ...systemHandlers,
  ...tauriPluginHandlers,
}

/**
 * Create and configure the MCP server
 */
async function createServer() {
  const server = new Server(
    {
      name: 'hanzo-app',
      version: '1.0.0',
    },
    {
      capabilities: {
        tools: {},
        resources: {},
      },
    }
  )

  // Register tool listing
  server.setRequestHandler('tools/list', async () => {
    return {
      tools: Object.values(allTools).map(tool => ({
        name: tool.name,
        description: tool.description,
        inputSchema: tool.inputSchema,
      })),
    }
  })

  // Register tool execution
  server.setRequestHandler('tools/call', async (request: any) => {
    const { name, arguments: args } = request.params
    
    const handler = allHandlers[name]
    if (!handler) {
      throw new Error(`Unknown tool: ${name}`)
    }

    try {
      const result = await handler(args)
      
      // Convert to MCP format
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
      return {
        content: [{ type: 'text', text: `Error: ${error}` }],
        isError: true,
      }
    }
  })

  return server
}

/**
 * Main entry point
 */
async function main() {
  try {
    const server = await createServer()
    const transport = new StdioServerTransport()
    
    await server.connect(transport)
    
    console.error('Hanzo App MCP Server started')
    console.error(`Available tools: ${Object.keys(allTools).length}`)
    console.error('Tools:', Object.keys(allTools).join(', '))
    
  } catch (error) {
    console.error('Failed to start server:', error)
    process.exit(1)
  }
}

// Run if called directly
if (require.main === module) {
  main()
}

// Export for use in @hanzo/mcp
export { createServer, allTools, allHandlers }