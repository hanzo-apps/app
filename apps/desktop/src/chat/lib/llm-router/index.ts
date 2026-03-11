/**
 * LLM Router Integration for Hanzo App
 * 
 * This module manages the LLM proxy server that runs alongside the MCP server.
 * The LLM router provides unified access to 100+ LLM providers through a single API.
 */

import { spawn, ChildProcess } from 'child_process'
import { join } from 'path'
import { existsSync } from 'fs'
import { app } from '@tauri-apps/api'

export class LLMRouter {
  private process: ChildProcess | null = null
  private isRunning = false
  private port = 4000
  private host = '0.0.0.0'

  constructor(private config?: {
    port?: number
    host?: string
    configPath?: string
  }) {
    if (config?.port) this.port = config.port
    if (config?.host) this.host = config.host
  }

  /**
   * Start the LLM router server
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      console.log('LLM router is already running')
      return
    }

    try {
      // Find the LLM project directory
      const appDir = await app.getAppDir()
      const llmPath = join(appDir, '..', '..', '..', 'llm')
      
      if (!existsSync(llmPath)) {
        throw new Error(`LLM project not found at ${llmPath}`)
      }

      // Check if virtual environment exists
      const venvPath = join(llmPath, '.venv')
      const pythonPath = join(venvPath, 'bin', 'python')
      
      if (!existsSync(pythonPath)) {
        console.warn('LLM virtual environment not found. Please run "make setup" in the LLM directory.')
        // Try system Python as fallback
        await this.startWithSystemPython(llmPath)
        return
      }

      // Start the LLM proxy server
      const args = [
        '-m',
        'llm.proxy.proxy_server',
        '--host', this.host,
        '--port', this.port.toString(),
      ]

      // Add config file if specified
      if (this.config?.configPath) {
        args.push('--config', this.config.configPath)
      } else {
        // Use default config in the same directory
        const defaultConfig = join(__dirname, 'config.yaml')
        if (existsSync(defaultConfig)) {
          args.push('--config', defaultConfig)
        }
      }

      console.log(`Starting LLM router: ${pythonPath} ${args.join(' ')}`)
      
      this.process = spawn(pythonPath, args, {
        cwd: llmPath,
        env: {
          ...process.env,
          PYTHONPATH: llmPath,
          LLM_MODE: 'PRODUCTION',
        },
        stdio: ['ignore', 'pipe', 'pipe']
      })

      this.process.stdout?.on('data', (data) => {
        console.log(`LLM Router: ${data.toString()}`)
      })

      this.process.stderr?.on('data', (data) => {
        console.error(`LLM Router Error: ${data.toString()}`)
      })

      this.process.on('close', (code) => {
        console.log(`LLM Router exited with code ${code}`)
        this.isRunning = false
        this.process = null
      })

      this.process.on('error', (error) => {
        console.error('Failed to start LLM Router:', error)
        this.isRunning = false
        this.process = null
      })

      // Wait for the server to start
      await this.waitForServer()
      this.isRunning = true
      console.log(`LLM Router started successfully on http://${this.host}:${this.port}`)
      
    } catch (error) {
      console.error('Failed to start LLM Router:', error)
      throw error
    }
  }

  /**
   * Fallback method to start with system Python
   */
  private async startWithSystemPython(llmPath: string): Promise<void> {
    const args = [
      '-m',
      'llm',
      '--host', this.host,
      '--port', this.port.toString(),
    ]

    console.log(`Starting LLM router with system Python: python3 ${args.join(' ')}`)
    
    this.process = spawn('python3', args, {
      cwd: llmPath,
      env: {
        ...process.env,
        LLM_MODE: 'PRODUCTION',
      },
      stdio: ['ignore', 'pipe', 'pipe']
    })

    // Set up event handlers as before
    this.process.stdout?.on('data', (data) => {
      console.log(`LLM Router: ${data.toString()}`)
    })

    this.process.stderr?.on('data', (data) => {
      console.error(`LLM Router Error: ${data.toString()}`)
    })

    this.process.on('close', (code) => {
      console.log(`LLM Router exited with code ${code}`)
      this.isRunning = false
      this.process = null
    })

    await this.waitForServer()
    this.isRunning = true
  }

  /**
   * Wait for the server to be ready
   */
  private async waitForServer(maxAttempts = 30, delayMs = 1000): Promise<void> {
    for (let i = 0; i < maxAttempts; i++) {
      try {
        const response = await fetch(`http://${this.host}:${this.port}/health`)
        if (response.ok) {
          return
        }
      } catch (error) {
        // Server not ready yet
      }
      await new Promise(resolve => setTimeout(resolve, delayMs))
    }
    throw new Error('LLM Router failed to start within timeout')
  }

  /**
   * Stop the LLM router server
   */
  async stop(): Promise<void> {
    if (!this.isRunning || !this.process) {
      console.log('LLM Router is not running')
      return
    }

    console.log('Stopping LLM Router...')
    this.process.kill('SIGTERM')
    
    // Give it time to shut down gracefully
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // Force kill if still running
    if (this.process && !this.process.killed) {
      this.process.kill('SIGKILL')
    }
    
    this.isRunning = false
    this.process = null
    console.log('LLM Router stopped')
  }

  /**
   * Check if the LLM router is running
   */
  async isHealthy(): Promise<boolean> {
    if (!this.isRunning) return false
    
    try {
      const response = await fetch(`http://${this.host}:${this.port}/health`)
      return response.ok
    } catch (error) {
      return false
    }
  }

  /**
   * Get available models from the LLM router
   */
  async getModels(): Promise<any[]> {
    if (!this.isRunning) {
      throw new Error('LLM Router is not running')
    }

    try {
      const response = await fetch(`http://${this.host}:${this.port}/models`)
      if (!response.ok) {
        throw new Error(`Failed to fetch models: ${response.statusText}`)
      }
      const data = await response.json()
      return data.data || []
    } catch (error) {
      console.error('Failed to fetch models from LLM Router:', error)
      throw error
    }
  }
}

// Export a singleton instance
export const llmRouter = new LLMRouter()