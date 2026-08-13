import type { NextResponse } from 'next/server';

/**
 * Where a generated site's libraries come from: OUR origin, and only ours.
 *
 * This was four hosts we do not own — `cdn.jsdelivr.net`,
 * `cdn.tailwindcss.com`, `cdnjs.cloudflare.com`, `unpkg.com` — because the
 * generation prompts told every site to fetch Tailwind, icons, animation and
 * maps from them. That put three parties in front of every visitor to every
 * site anyone builds here, each able to see the traffic and to change what
 * executes on the page, and it needed this policy widened to permit them.
 *
 * The libraries are now pinned in `package.json`, copied out of node_modules by
 * `scripts/vendor.mjs`, and served from `/vendor/` — so the same capability
 * costs one origin instead of four, and the bytes are ours.
 *
 * `lib/vendor.ts` is where a URL is decided; this names the origin so the
 * policy says out loud where a generated page may load code from, rather than
 * leaving it to whatever `'self'` happens to be.
 *
 * The /dev preview is an `about:srcdoc` iframe and INHERITS this policy, so a
 * source missing here renders every generated page unstyled in the preview.
 * That is also why documents saved before this change are rewritten on the way
 * to the browser (`vendor.rewrite`) rather than left naming hosts this policy
 * no longer allows.
 */
const CDN = ['https://hanzo.app'];

/**
 * Our own surfaces. `*.hanzo.app` is where a published project lives, and the
 * preview pulls that project's HTML into the srcdoc frame — so the frame asks
 * for the project's OWN scripts and fonts by absolute URL. Allowing them in
 * `frame-src` alone is not enough, and that gap is what made a template preview
 * arrive as bare unstyled markup: measured on `/dev?template=hanzo-apps/
 * prism-react`, four scripts and six fonts from `prism-react.hanzo.app` refused.
 *
 * A srcdoc CSP cannot be loosened from inside — policies compose by
 * intersection, so a `<meta>` in the previewed document can only add
 * restrictions. The parent's policy is the ceiling, which is why the widening
 * has to happen here. What keeps it safe is the SANDBOX, not the CSP: the frame
 * is `sandbox="allow-scripts allow-forms"` with no `allow-same-origin`, so it
 * runs in an opaque origin and can reach neither this document nor its storage.
 */
const OURS = ['https://*.hanzo.ai', 'https://*.hanzo.app'];

/** IdP login domains — NOT under *.hanzo.ai, and each needs naming. */
const IDP = ['https://hanzo.id', 'https://lux.id', 'https://zoo.id', 'https://pars.id'];

/**
 * Cloudflare Web Analytics, which the ZONE injects — not this repo.
 *
 * Web Analytics is on with `auto_install` across the estate (every hanzo zone),
 * so the edge appends `beacon.min.js` to each HTML response on the way out.
 * Nothing in this repo asks for it and nothing here can stop asking: the tag is
 * added after the app has finished responding. This policy then refused it, so
 * the beacon executed nowhere and the analytics measured nothing, at the cost of
 * a blocked request and a console error on every page view.
 *
 * Measured live on hanzo.app at 375x667: `script-src-elem` blocked
 * `static.cloudflareinsights.com/beacon.min.js/v4513…`.
 *
 * Two hosts, because they are two different jobs: the script is served from
 * `static.`, and the beacon reports to the apex `cloudflareinsights.com`
 * (`/cdn-cgi/rum`). Allowing only the first loads a script that can send nothing.
 */
const RUM_SCRIPT = 'https://static.cloudflareinsights.com';
const RUM_REPORT = 'https://cloudflareinsights.com';

/**
 * ONE policy, stated once.
 *
 * Development used to RESTATE the whole thing instead of deriving it, and the
 * two drifted exactly as this file's own closing note warns about rate limits:
 * "two spellings of one budget is how a client ends up trusting whichever it
 * happened to parse". Dev carried none of the CDNs above, so every generated
 * preview rendered unstyled on a developer's machine — the precise failure the
 * production list exists to prevent, reintroduced for the only people in a
 * position to notice it. The note beside `frame-src` had already drawn the
 * conclusion ("a preview you cannot see locally is a preview nobody checks")
 * without anyone applying it to script, style and font.
 *
 * So dev no longer gets its own list. It gets this one, plus localhost.
 */
const policy = (dev: boolean) => {
  // The dev server is reached over http, and its hot-reload channel over ws.
  // They are different kinds of source and belong to different directives —
  // `ws://` in `font-src` is not stricter or looser, it is meaningless, and a
  // security header that states untrue things is one nobody reads closely.
  const http = dev ? ['http://localhost:*'] : [];
  const socket = dev ? ['ws://localhost:*', 'wss://localhost:*'] : [];
  const src = (...parts: string[]) => parts.join(' ');
  return [
    "default-src 'self'",
    src("script-src 'self' 'unsafe-inline' 'unsafe-eval'", ...CDN, ...OURS, RUM_SCRIPT, ...http),
    // Google Fonts is gone from both of these. It was here because the skill
    // prompts offered it as the font choice, which put a request to Google on
    // every view of every site built here — a third party learning who reads
    // our customers' pages, for a typeface. Those prompts now specify the
    // system stack, which costs no request at all.
    src("style-src 'self' 'unsafe-inline'", ...CDN, ...OURS, ...http),
    src("font-src 'self' data:", ...CDN, ...OURS, ...http),
    // `http:`/`https:` already cover localhost — naming it again would be noise.
    src("img-src 'self' data: blob: https: http:"),
    src("media-src 'self' blob: data:", ...OURS, ...http),
    // The OIDC discovery + PKCE token exchange (POST hanzo.id/v1/iam/oauth/token)
    // is cross-origin and MUST be allowed, or the SSO callback silently fails
    // and the session never persists. This is the one directive a socket
    // belongs to.
    // `blob:` is here for the same reason it is already in `img-src` and
    // `media-src`, and leaving it out of this one directive is what made a
    // previewed project half-render: a Blob URL could be SHOWN and not FETCHED.
    // Measured on /dev/hanzo/megashop — the site's 3D texture went through
    // THREE.GLTFLoader, which fetches, and the console read "Connecting to
    // 'blob:null/…' violates … connect-src". The hero stayed black while the
    // nav and footer painted, which reads as a broken generated app rather
    // than a policy.
    //
    // It grants no reach. A blob: URL is a handle to bytes this document
    // already holds — only its own origin can mint one — so allowing it to be
    // fetched permits reading what is already in memory, never a request to
    // anybody. Canvas exports, workers, object URLs and every 3D loader are
    // ordinary things for a generated app to do; refusing them silently is
    // what was not ordinary.
    src(
      "connect-src 'self' blob: wss://*.hanzo.ai https://api.openai.com https://api.anthropic.com",
      ...OURS,
      ...IDP,
      RUM_REPORT,
      ...http,
      ...socket,
    ),
    src("frame-src 'self'", ...OURS, ...IDP, ...http),
    src(
      "frame-ancestors 'self' https://hanzo.ai https://hanzo.app https://hanzo.bot https://*.hanzo.bot https://hanzo.team https://*.hanzo.team https://hanzo.chat https://*.hanzo.chat https://s3.hanzo.ai",
      ...OURS,
      ...http,
    ),
    // A previewed project sets `<base href="https://<slug>.hanzo.app/">` so its
    // own relative URLs resolve against where it is published. Blocked, every
    // relative reference resolves against the BUILDER instead — so the fonts
    // were fetched from localhost and then refused by CORS, since the sandboxed
    // frame has an opaque origin. Two confusing failures downstream of one.
    //
    // This is not the loosening it looks like: `script-src` already carries
    // 'unsafe-inline', so injecting a `<base>` into this document was never the
    // cheapest attack available to anyone who could inject into it at all.
    src("base-uri 'self'", ...OURS),
    "form-action 'self'",
    // Never in dev: it would rewrite http://localhost to https and nothing loads.
    ...(dev ? [] : ['upgrade-insecure-requests']),
  ].join('; ');
};

// Security headers configuration
const securityHeaders = {
  'Content-Security-Policy': policy(false),

  // Strict Transport Security
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',

  // X-Frame-Options (legacy support)
  'X-Frame-Options': 'SAMEORIGIN',

  // X-Content-Type-Options
  'X-Content-Type-Options': 'nosniff',

  // Referrer Policy
  'Referrer-Policy': 'strict-origin-when-cross-origin',

  // X-XSS-Protection (legacy support)
  'X-XSS-Protection': '1; mode=block',

  // Permissions Policy
  'Permissions-Policy': [
    'camera=()',
    // First-party mic MUST stay open: the composer's Web-Speech button runs
    // in this origin. `()` disallows mic for ALL origins (incl. self) and the
    // Web Speech API then silently no-ops. `(self)` = same-origin only.
    'microphone=(self)',
    'geolocation=()',
    'interest-cohort=()',
    'payment=(self)',
    'usb=()',
    'magnetometer=()',
    'gyroscope=()',
    'accelerometer=()',
  ].join(', '),

  // X-DNS-Prefetch-Control
  'X-DNS-Prefetch-Control': 'on',

  // X-Permitted-Cross-Domain-Policies
  'X-Permitted-Cross-Domain-Policies': 'none',
};

// Development = the same policy, plus localhost. Not a second list.
const devSecurityHeaders = {
  ...securityHeaders,
  'Content-Security-Policy': policy(true),
};

// Apply security headers based on environment
export function applySecurityHeaders(response: NextResponse): NextResponse {
  const headers = process.env.NODE_ENV === 'production' ? securityHeaders : devSecurityHeaders;

  Object.entries(headers).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  return response;
}

// Rate limiting lives in ONE place: ./rate-limiter, which the root middleware
// calls directly. A second copy used to sit here — same job, different answers:
// it reported `X-RateLimit-Reset` as an ISO string where the other emitted
// epoch milliseconds, and it reached through `limiter['config']` to read a max
// the other took from the verdict. Two spellings of one budget is how a client
// ends up trusting whichever it happened to parse.

// CORS lives in ONE place: lib/edit/cors.ts, which the cross-origin widget
// routes (/v1/me, /v1/suggest, /v1/edit, /v1/register) call directly. A second
// allowlist used to sit here, unreferenced, and it was wrong in three ways that
// a reader would have trusted: it fell back to `Access-Control-Allow-Origin: *`
// alongside `Allow-Credentials: true` (a combination browsers reject outright),
// it suffix-matched `.hanzo.app` — handing every user-published tenant site a
// credentialed channel — and it allowlisted hanzo.io, a parked domain we do not
// serve. Deleted rather than reconciled: two allowlists drift, and the drift is
// exactly what broke hanzo.chat.

// `sanitizeRequest`, `validateUserAgent`, `securityMiddleware` and a `security`
// barrel used to live here with ZERO callers between them. Unreachable code
// that reads as a control is worse than no control: the user-agent blocklist
// (sqlmap, nikto, nmap…) looked like scanner defence while matching on a
// header the scanner chooses, and `sanitizeRequest` deleted `__proto__` from a
// URL it then threw away, returning the untouched request. Deleted rather than
// wired — neither was protecting anything, and pretending otherwise is how a
// real gap goes unnoticed.