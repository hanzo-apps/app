/**
 * The org's MCP registry, read for display.
 *
 * `/v1/mcp/servers` lists the org's registered external MCP servers and
 * `/v1/mcp` the tools they contribute (both org-scoped BFF forwards; a
 * server's credential lives in KMS cloud-side and never appears here).
 *
 * THE CONTRACT IS THREE-VALUED, and that is the point of this module. `null`
 * means "the registry did not answer in a shape this build understands" —
 * which a reader must render as could-not-read, never as none-registered. A
 * shape drift collapsing into an empty list is how a settings pane starts
 * lying: the org HAS servers, the pane says it has none, and the person
 * re-registers a duplicate. Only a well-formed answer may claim emptiness.
 */

export interface McpServer {
  id: string;
  name: string;
  url?: string;
}

/** Accept the envelope spellings the cloud lineages use, verbatim rows only. */
function rows(body: unknown): Record<string, unknown>[] | null {
  if (Array.isArray(body)) return body as Record<string, unknown>[];
  if (body && typeof body === "object") {
    const b = body as Record<string, unknown>;
    for (const key of ["data", "servers", "tools"]) {
      if (Array.isArray(b[key])) return b[key] as Record<string, unknown>[];
    }
  }
  return null;
}

const str = (v: unknown): string => (typeof v === "string" ? v : "");

/** The registered servers, [] only when the registry SAID none, null otherwise. */
export async function fetchMcpServers(): Promise<McpServer[] | null> {
  try {
    const res = await fetch("/v1/mcp/servers", {
      credentials: "include",
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return null;
    const found = rows(await res.json());
    if (!found) return null;
    return found
      .map((r) => ({
        id: str(r.id) || str(r.name),
        name: str(r.name) || str(r.id),
        url: str(r.url) || undefined,
      }))
      .filter((s) => s.id);
  } catch {
    return null;
  }
}

/** How many tools the registry contributes, or null when it did not answer. */
export async function fetchMcpToolCount(): Promise<number | null> {
  try {
    const res = await fetch("/v1/mcp", {
      credentials: "include",
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return null;
    const found = rows(await res.json());
    return found ? found.length : null;
  } catch {
    return null;
  }
}
