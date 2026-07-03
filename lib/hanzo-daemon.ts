// Hanzo Daemon Connection Configuration
// Default port: 3690 for local private AI

export const HANZO_DAEMON_PORT = process.env.HANZO_DAEMON_PORT || '3690';
export const HANZO_DAEMON_HOST = process.env.HANZO_DAEMON_HOST || 'localhost';
export const HANZO_DAEMON_URL = `http://${HANZO_DAEMON_HOST}:${HANZO_DAEMON_PORT}`;

// Check if local Hanzo daemon is available
export async function checkHanzoDaemon(): Promise<boolean> {
  try {
    const response = await fetch(`${HANZO_DAEMON_URL}/health`, {
      method: 'GET',
      // Short timeout for local connection
      signal: AbortSignal.timeout(1000),
    });
    return response.ok;
  } catch (error) {
    console.log('Hanzo daemon not available on port', HANZO_DAEMON_PORT);
    return false;
  }
}

// Get daemon status and capabilities
export async function getHanzoDaemonStatus() {
  try {
    const response = await fetch(`${HANZO_DAEMON_URL}/status`, {
      method: 'GET',
      signal: AbortSignal.timeout(2000),
    });

    if (!response.ok) {
      return null;
    }

    return await response.json();
  } catch (error) {
    return null;
  }
}

// Connect to local Hanzo daemon for AI inference
export async function callHanzoDaemon(endpoint: string, payload: any) {
  try {
    const response = await fetch(`${HANZO_DAEMON_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // No auth needed for localhost
        'X-Local-Request': 'true',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Hanzo daemon error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to call Hanzo daemon:', error);
    throw error;
  }
}

// Configuration for connecting to desktop AI node
export interface NodeConfig {
  host: string;
  port: number;
  apiKey?: string;
  secure?: boolean;
}

export function getNodeUrl(config: NodeConfig): string {
  const protocol = config.secure ? 'https' : 'http';
  return `${protocol}://${config.host}:${config.port}`;
}

// Default node configurations
export const DEFAULT_NODES = {
  local: {
    host: 'localhost',
    port: 3690,
    secure: false,
  },
  desktop: {
    host: 'localhost',
    port: 3691, // Different port for desktop app
    secure: false,
  },
};