/**
 * Reading a site the user names, so the model can redesign it.
 *
 * The reader is a language model, not a document pipeline, so the target is
 * legible structure — headings, links, list items, the words in order — and
 * not faithful markdown. That is why there is no converter dependency here:
 * everything below is what the model actually needs, and nothing else.
 *
 * `address` is the security half. The server fetches a URL the browser chose,
 * which is a request forgery primitive unless the destination is constrained,
 * so it admits only http(s) on a public host and refuses every private,
 * loopback, link-local and unique-local address by inspection of the resolved
 * IP — a name that resolves inward is the whole attack.
 */
import { lookup } from 'dns/promises';

export class Unreachable extends Error {}

/** Private, loopback, link-local and unique-local space — never a fetch target. */
function inward(ip: string): boolean {
  if (ip.includes(':')) {
    const v6 = ip.toLowerCase();
    if (v6 === '::1' || v6 === '::') return true;
    if (/^f[cd]/.test(v6)) return true; // fc00::/7 unique-local
    if (v6.startsWith('fe80')) return true; // link-local
    if (v6.startsWith('::ffff:')) return inward(v6.slice(7)); // v4-mapped
    return false;
  }
  const [a, b] = ip.split('.').map(Number);
  return (
    a === 0 || a === 10 || a === 127 ||
    (a === 169 && b === 254) || // link-local / cloud metadata
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 100 && b >= 64 && b <= 127) || // carrier NAT
    a >= 224 // multicast and reserved
  );
}

/** The URL to fetch, or a refusal that names the reason. */
export async function address(raw: string): Promise<URL> {
  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    throw new Unreachable('That is not a URL.');
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new Unreachable('Only http and https addresses can be read.');
  }
  const { address: ip } = await lookup(url.hostname).catch(() => {
    throw new Unreachable(`No such host: ${url.hostname}`);
  });
  if (inward(ip)) throw new Unreachable('That address is on a private network.');
  return url;
}

const DROP = /<(script|style|noscript|template|svg|iframe)\b[^>]*>[\s\S]*?<\/\1>/gi;
const text = (s: string) =>
  s
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();

/** The page as the model should see it: its title, then its structure in order. */
export function readable(html: string): string {
  const body = html.replace(DROP, ' ');
  const out: string[] = [];
  const title = body.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  if (title) out.push(`# ${text(title[1])}`);

  for (const m of body.matchAll(
    /<(h[1-6]|p|li|a|button|blockquote)\b([^>]*)>([\s\S]*?)<\/\1>/gi,
  )) {
    const tag = m[1].toLowerCase();
    const inner = text(m[3]);
    if (!inner) continue;
    if (/^h[1-6]$/.test(tag)) out.push(`${'#'.repeat(Number(tag[1]))} ${inner}`);
    else if (tag === 'li') out.push(`- ${inner}`);
    else if (tag === 'a') {
      const href = m[2].match(/href\s*=\s*["']([^"']+)["']/i)?.[1];
      out.push(href ? `[${inner}](${href})` : inner);
    } else if (tag === 'button') out.push(`- ${inner} (button)`);
    else if (tag === 'blockquote') out.push(`> ${inner}`);
    else out.push(inner);
  }

  // A page repeats its nav on every section; the model gains nothing from the
  // repeats and the prompt pays for them.
  const seen = new Set<string>();
  return out
    .filter((line) => line.length > 1 && !seen.has(line) && seen.add(line))
    .join('\n\n')
    .slice(0, 24_000);
}
