/**
 * Bot Gateway WebSocket client for hanzo.app.
 *
 * Connects to the Hanzo Bot gateway (ZAP protocol) and exposes methods for
 * listing agents, sending messages, and receiving streaming responses.
 *
 * The gateway runs at BOT_GATEWAY_URL (default ws://localhost:18789).
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface BotAgent {
  id: string;
  name: string;
  emoji?: string;
  avatar?: string;
  description?: string;
  did?: { uri?: string; method?: string; chainId?: number };
  wallet?: { address?: string; chain?: string; chainId?: number };
}

export interface GatewayMessage {
  type: "req" | "res" | "event";
  id?: string;
  method?: string;
  params?: Record<string, unknown>;
  event?: string;
  payload?: unknown;
  ok?: boolean;
  error?: { code: number; message: string };
}

export type StreamCallback = (chunk: string, done: boolean) => void;

// ---------------------------------------------------------------------------
// Team presets (static fallback when gateway is unavailable)
// ---------------------------------------------------------------------------

export const TEAM_PRESETS: BotAgent[] = [
  { id: "vi", name: "Vi", emoji: "\u{1F9E0}", description: "Chief of Staff & coordinator" },
  { id: "dev", name: "Dev", emoji: "\u{1F4BB}", description: "Full-stack engineer" },
  { id: "des", name: "Des", emoji: "\u{1F3A8}", description: "Designer & UX strategist" },
  { id: "opera", name: "Opera", emoji: "\u{2699}\uFE0F", description: "DevOps & infrastructure" },
  { id: "su", name: "Su", emoji: "\u{1F6E1}\uFE0F", description: "Security engineer" },
  { id: "mark", name: "Mark", emoji: "\u{1F4E3}", description: "Marketing strategist" },
  { id: "fin", name: "Fin", emoji: "\u{1F4B0}", description: "Financial analyst" },
  { id: "art", name: "Art", emoji: "\u{2728}", description: "Creative director" },
  { id: "three", name: "Three", emoji: "\u{1F310}", description: "Web3 specialist" },
  { id: "fil", name: "Fil", emoji: "\u{1F4C1}", description: "Knowledge manager" },
];

// ---------------------------------------------------------------------------
// Gateway client
// ---------------------------------------------------------------------------

const BOT_GATEWAY_URL =
  typeof window !== "undefined"
    ? (process.env.NEXT_PUBLIC_BOT_GATEWAY_URL ?? "ws://localhost:18789")
    : "";

let _reqId = 0;
function nextReqId(): string {
  return `app-${++_reqId}-${Date.now()}`;
}

export class BotGatewayClient {
  private ws: WebSocket | null = null;
  private token: string;
  private url: string;
  private pending = new Map<string, { resolve: (v: unknown) => void; reject: (e: Error) => void }>();
  private eventListeners = new Map<string, Set<(payload: unknown) => void>>();
  private connected = false;
  private connectPromise: Promise<void> | null = null;

  constructor(token?: string, url?: string) {
    this.token = token ?? "";
    this.url = url ?? BOT_GATEWAY_URL;
  }

  // -- Connection -----------------------------------------------------------

  async connect(): Promise<void> {
    if (this.connected && this.ws?.readyState === WebSocket.OPEN) return;
    if (this.connectPromise) return this.connectPromise;

    this.connectPromise = new Promise<void>((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.url);
      } catch (err) {
        this.connectPromise = null;
        reject(err);
        return;
      }

      const timeout = setTimeout(() => {
        this.connectPromise = null;
        reject(new Error("Gateway connection timeout"));
      }, 10_000);

      this.ws.onopen = () => {
        // Send connect handshake
        this.ws!.send(
          JSON.stringify({
            type: "req",
            id: nextReqId(),
            method: "connect",
            params: {
              minProtocol: 1,
              maxProtocol: 1,
              token: this.token,
            },
          }),
        );
      };

      this.ws.onmessage = (event) => {
        let msg: GatewayMessage;
        try {
          msg = JSON.parse(event.data as string);
        } catch {
          return;
        }

        // Handle connect challenge
        if (msg.type === "event" && msg.event === "connect.challenge") {
          // Already sent connect in onopen; wait for connect response
          return;
        }

        // Handle connect response (first "res")
        if (msg.type === "res" && !this.connected) {
          clearTimeout(timeout);
          this.connected = true;
          this.connectPromise = null;
          if (msg.ok === false) {
            reject(new Error(msg.error?.message ?? "Connect rejected"));
          } else {
            resolve();
          }
          return;
        }

        // Handle regular responses
        if (msg.type === "res" && msg.id) {
          const p = this.pending.get(msg.id);
          if (p) {
            this.pending.delete(msg.id);
            if (msg.ok === false) {
              p.reject(new Error(msg.error?.message ?? "Request failed"));
            } else {
              p.resolve(msg.payload);
            }
          }
          return;
        }

        // Handle events
        if (msg.type === "event" && msg.event) {
          const listeners = this.eventListeners.get(msg.event);
          if (listeners) {
            for (const cb of listeners) cb(msg.payload);
          }
        }
      };

      this.ws.onerror = () => {
        clearTimeout(timeout);
        this.connectPromise = null;
        reject(new Error("Gateway WebSocket error"));
      };

      this.ws.onclose = () => {
        this.connected = false;
        this.connectPromise = null;
        // Reject all pending
        for (const [, p] of this.pending) {
          p.reject(new Error("Connection closed"));
        }
        this.pending.clear();
      };
    });

    return this.connectPromise;
  }

  disconnect(): void {
    this.ws?.close();
    this.ws = null;
    this.connected = false;
  }

  // -- RPC ------------------------------------------------------------------

  private async call<T = unknown>(method: string, params: Record<string, unknown> = {}): Promise<T> {
    await this.connect();
    const id = nextReqId();
    return new Promise<T>((resolve, reject) => {
      this.pending.set(id, {
        resolve: resolve as (v: unknown) => void,
        reject,
      });
      this.ws!.send(JSON.stringify({ type: "req", id, method, params }));

      // Timeout
      setTimeout(() => {
        if (this.pending.has(id)) {
          this.pending.delete(id);
          reject(new Error(`Request ${method} timed out`));
        }
      }, 30_000);
    });
  }

  // -- Events ---------------------------------------------------------------

  on(event: string, cb: (payload: unknown) => void): () => void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(cb);
    return () => {
      this.eventListeners.get(event)?.delete(cb);
    };
  }

  // -- Public API -----------------------------------------------------------

  /** List configured agents */
  async listAgents(): Promise<BotAgent[]> {
    try {
      const result = await this.call<{ agents: BotAgent[] }>("agents.list", {});
      return result?.agents ?? [];
    } catch {
      // Fallback to static presets
      return TEAM_PRESETS;
    }
  }

  /** Send a message to an agent and get streaming response via events */
  async sendMessage(params: {
    message: string;
    agentId?: string;
    sessionKey?: string;
  }): Promise<{ runId: string }> {
    const result = await this.call<{ runId: string; status: string }>("agent", {
      message: params.message,
      agentId: params.agentId,
      sessionKey: params.sessionKey,
    });
    return { runId: result.runId };
  }

  /** Send a chat message (WebSocket-native, streamed) */
  async chatSend(params: {
    message: string;
    agentId?: string;
    sessionId?: string;
  }): Promise<void> {
    await this.call("chat.send", {
      text: params.message,
      agentId: params.agentId,
      sessionId: params.sessionId,
    });
  }

  /** Get agent identity (DID + wallet) */
  async getAgentIdentity(agentId: string): Promise<BotAgent | null> {
    try {
      return await this.call<BotAgent>("agent.identity.full", { agentId });
    } catch {
      return null;
    }
  }

  /** Health check */
  async health(): Promise<boolean> {
    try {
      await this.call("health", {});
      return true;
    } catch {
      return false;
    }
  }
}

// ---------------------------------------------------------------------------
// Singleton
// ---------------------------------------------------------------------------

let _client: BotGatewayClient | null = null;

export function getBotGateway(token?: string): BotGatewayClient {
  if (!_client) {
    _client = new BotGatewayClient(token);
  }
  return _client;
}
