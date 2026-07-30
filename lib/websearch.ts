/**
 * Client contract for hanzo.app's native web search (`/v1/websearch`, which
 * proxies cloud's SearXNG-shaped `GET /v1/websearch/search`). ONE fetch, one
 * normalized source shape, and the one place a cited answer is composed from
 * sources — so the chat renderer stays a pure view.
 */

export interface WebSource {
  url: string;
  title: string;
  snippet: string;
}

/** Registrable-ish host label for a source pill ("en.wikipedia.org" → "wikipedia.org"). */
export function sourceHost(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

/** Search the web through the app's own /v1/websearch. Throws on refusal. */
export async function webSearch(query: string): Promise<WebSource[]> {
  const res = await fetch(`/v1/websearch?q=${encodeURIComponent(query)}`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`web search failed (${res.status})`);
  const data = (await res.json()) as { ok?: boolean; results?: WebSource[] };
  if (!data.ok) throw new Error("web search failed");
  return data.results ?? [];
}

/**
 * The cited answer: what the sources actually say, each claim carrying its
 * [n] marker into the pills rendered above it. Deterministic — the text IS
 * the search results, never a fabricated synthesis.
 */
export function citedAnswer(query: string, sources: WebSource[]): string {
  if (sources.length === 0) {
    return `No web results found for "${query}".`;
  }
  const cited = sources
    .slice(0, 4)
    .map((s, i) => `${s.snippet || s.title} [${i + 1}]`);
  return `Here's what the web says about "${query}":\n\n${cited.join("\n\n")}`;
}
