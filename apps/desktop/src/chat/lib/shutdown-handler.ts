/**
 * Graceful shutdown handler for Hanzo App services
 */

import { llmRouter } from './llm-router'
import { getMCPServer } from './mcp-server'

let shutdownInProgress = false

/**
 * Register shutdown handlers
 */
export function registerShutdownHandlers() {
  // Handle window closing
  if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', async (event) => {
      if (!shutdownInProgress) {
        shutdownInProgress = true
        await gracefulShutdown()
      }
    })
  }

  // Handle process signals
  if (typeof process !== 'undefined') {
    process.on('SIGINT', handleShutdown)
    process.on('SIGTERM', handleShutdown)
    process.on('exit', handleShutdown)
  }
}

async function handleShutdown() {
  if (!shutdownInProgress) {
    shutdownInProgress = true
    console.log('Shutting down Hanzo App services...')
    await gracefulShutdown()
    process.exit(0)
  }
}

/**
 * Gracefully shut down all services
 */
async function gracefulShutdown() {
  console.log('Performing graceful shutdown...')
  
  try {
    // Stop LLM router
    console.log('Stopping LLM router...')
    await llmRouter.stop()
    
    // Stop MCP server
    console.log('Stopping MCP server...')
    const mcpServer = getMCPServer()
    if (mcpServer && typeof mcpServer.stop === 'function') {
      await mcpServer.stop()
    }
    
    console.log('All services stopped successfully')
  } catch (error) {
    console.error('Error during shutdown:', error)
  }
}