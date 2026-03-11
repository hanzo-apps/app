import { debug, error, info, warn } from '@tauri-apps/plugin-log';

// Re-export log functions
export { debug, error, info, warn };

// Create a logger class for structured logging
export class Logger {
  private context: string;

  constructor(context: string) {
    this.context = context;
  }

  debug(message: string, ...args: any[]) {
    debug(`[${this.context}] ${message}`, ...args);
  }

  info(message: string, ...args: any[]) {
    info(`[${this.context}] ${message}`, ...args);
  }

  warn(message: string, ...args: any[]) {
    warn(`[${this.context}] ${message}`, ...args);
  }

  error(message: string, error?: Error, ...args: any[]) {
    if (error) {
      error(`[${this.context}] ${message}: ${error.message}`, ...args);
      console.error(error.stack);
    } else {
      error(`[${this.context}] ${message}`, ...args);
    }
  }
}

// Create logger instances for different modules
export const appLogger = new Logger('App');
export const commandBarLogger = new Logger('CommandBar');
export const chatLogger = new Logger('Chat');
export const mpcLogger = new Logger('MCP');