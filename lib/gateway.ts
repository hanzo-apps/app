/**
 * Hanzo LLM Gateway client (OpenAI-compatible).
 *
 * All AI inference for hanzo.app routes through OUR gateway at api.hanzo.ai —
 * never HuggingFace or any upstream provider directly. The gateway resolves
 * Zen model ids (e.g. `zen5-coder`) to the underlying weights, meters usage,
 * and bills the caller's org.
 *
 * Auth (one way, resolved per request):
 *   1. The signed-in user's Hanzo IAM access token (forwarded from the
 *      `hanzo_token` cookie) — billed to the user's own org. This is the
 *      canonical path: the token's `aud` is the app client id and cloud
 *      validates it against hanzo.id.
 *   2. Fallback: a service key in `HANZO_GATEWAY_API_KEY`, sourced from KMS
 *      (never plaintext — synced into `hanzo-app-secrets` via a KMSSecret).
 *      Used for anonymous / no-cookie requests.
 */

export const GATEWAY_URL = (
  process.env.HANZO_GATEWAY_URL || "https://api.hanzo.ai/v1"
).replace(/\/+$/, "");

/** Default code-generation model. The gateway resolves this — never send raw
 *  upstream ids (`Qwen/...`, `deepseek-ai/...`). */
export const DEFAULT_MODEL = process.env.HANZO_DEFAULT_MODEL || "zen5-coder";

export interface GatewayMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

/**
 * Resolve the bearer credential for a gateway call: the user's token when
 * present, else the KMS-sourced service key. Returns undefined when neither is
 * available (caller should treat as "login required").
 */
export function resolveGatewayAuth(userToken?: string | null): string | undefined {
  if (userToken && userToken.trim().length > 0) return userToken.trim();
  const svc = process.env.HANZO_GATEWAY_API_KEY;
  if (svc && svc.trim().length > 0) return svc.trim();
  return undefined;
}

function endpoint(path: string): string {
  return `${GATEWAY_URL}/${path.replace(/^\/+/, "")}`;
}

/** POST /chat/completions. `stream` toggles SSE vs a single JSON body. */
export function gatewayChat(opts: {
  auth: string;
  model: string;
  messages: GatewayMessage[];
  maxTokens?: number;
  stream?: boolean;
  signal?: AbortSignal;
}): Promise<Response> {
  return fetch(endpoint("chat/completions"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${opts.auth}`,
    },
    body: JSON.stringify({
      model: opts.model,
      messages: opts.messages,
      ...(opts.maxTokens ? { max_tokens: opts.maxTokens } : {}),
      stream: !!opts.stream,
    }),
    signal: opts.signal,
  });
}

/**
 * Parse an OpenAI-style SSE completion stream into content deltas. Yields only
 * the assistant text as it arrives; stops on `[DONE]` or stream end.
 */
export async function* streamGatewayDeltas(
  res: Response
): AsyncGenerator<string, void, unknown> {
  if (!res.body) return;
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let nl: number;
    // SSE frames are newline-delimited; a data line may be split across chunks.
    while ((nl = buffer.indexOf("\n")) >= 0) {
      const line = buffer.slice(0, nl).trim();
      buffer = buffer.slice(nl + 1);
      if (!line || !line.startsWith("data:")) continue;
      const data = line.slice(5).trim();
      if (data === "[DONE]") return;
      try {
        const json = JSON.parse(data);
        const delta = json?.choices?.[0]?.delta?.content;
        if (typeof delta === "string" && delta.length > 0) yield delta;
      } catch {
        // Partial/keepalive frame — ignore.
      }
    }
  }
}

/** Extract the assistant content from a non-streamed completion body. */
export function contentFromCompletion(json: unknown): string {
  const j = json as {
    choices?: { message?: { content?: string } }[];
    content?: string;
  };
  return j?.choices?.[0]?.message?.content ?? j?.content ?? "";
}

/** Map a gateway error body to a client-facing message + billing hint. */
export function gatewayError(status: number, body: string): {
  message: string;
  openProModal?: boolean;
  openLogin?: boolean;
} {
  let parsed: { error?: { message?: string; code?: string }; message?: string; msg?: string } = {};
  try {
    parsed = JSON.parse(body);
  } catch {
    /* non-JSON */
  }
  const msg = parsed?.error?.message || parsed?.message || parsed?.msg || body || "Inference failed.";
  const code = parsed?.error?.code || "";
  if (status === 401) return { message: "Please sign in to continue.", openLogin: true };
  if (status === 402 || code === "insufficient_balance") {
    return { message: msg || "Insufficient balance. Add credits at console.hanzo.ai.", openProModal: true };
  }
  return { message: msg };
}
