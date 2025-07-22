#!/usr/bin/env node

/**
 * Standalone MCP server entry point
 * Run this to use Hanzo App as an MCP server
 */

import { getMCPServer } from './index'

async function main() {
  console.error('Starting Hanzo App MCP Server...')
  
  try {
    const server = getMCPServer()
    await server.startStdio()
    
    console.error('Hanzo App MCP Server is running')
    console.error('Available tools:')
    const tools = server.getTools()
    for (const tool of tools) {
      console.error(`  - ${tool.name}: ${tool.description}`)
    }
    
    // Keep process alive
    process.stdin.resume()
  } catch (error) {
    console.error('Failed to start MCP server:', error)
    process.exit(1)
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.error('Shutting down...')
  process.exit(0)
})

process.on('SIGTERM', () => {
  console.error('Shutting down...')
  process.exit(0)
})

main()