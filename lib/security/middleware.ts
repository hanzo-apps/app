import type { NextResponse } from 'next/server';

// Security headers configuration
const securityHeaders = {
  // Content Security Policy
  'Content-Security-Policy': [
    "default-src 'self'",
    // The /dev builder previews GENERATED apps in an `about:srcdoc` iframe,
    // which INHERITS this page CSP. The generation system prompt (lib/prompts.ts)
    // instructs the model to load Tailwind from cdn.tailwindcss.com and commonly
    // emits cdnjs/unpkg/jsdelivr + Google Fonts references — without these
    // allowlisted, EVERY generated page renders unstyled (raw links) in the
    // preview while the published copy works. Keep this list in lockstep with
    // the CDNs the system prompt endorses; everything else stays strict.
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://cdn.tailwindcss.com https://cdnjs.cloudflare.com https://unpkg.com https://*.hanzo.ai",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com https://cdn.jsdelivr.net https://unpkg.com",
    "font-src 'self' https://fonts.gstatic.com https://cdnjs.cloudflare.com https://cdn.jsdelivr.net data:",
    "img-src 'self' data: blob: https: http:",
    "media-src 'self' blob: data:",
    // IdP login domains (hanzo.id et al) are NOT *.hanzo.ai — the OIDC
    // discovery + PKCE token exchange (POST https://hanzo.id/v1/iam/oauth/token)
    // is a cross-origin fetch and MUST be allowed here or the SSO callback
    // silently fails and the session never persists.
    "connect-src 'self' https://*.hanzo.ai https://hanzo.id https://lux.id https://zoo.id https://pars.id https://api.openai.com https://api.anthropic.com wss://*.hanzo.ai",
    // *.hanzo.app = deployed project previews (<slug>.hanzo.app) embedded in the
    // dashboard/project cards. frame-ancestors already trusts them; frame-src must
    // too or every project preview iframe is CSP-blocked (silent broken thumbnails).
    "frame-src 'self' https://*.hanzo.ai https://*.hanzo.app https://hanzo.id https://lux.id https://zoo.id https://pars.id",
    "frame-ancestors 'self' https://hanzo.ai https://*.hanzo.ai https://hanzo.app https://*.hanzo.app https://hanzo.bot https://*.hanzo.bot https://hanzo.team https://*.hanzo.team https://hanzo.chat https://*.hanzo.chat https://s3.hanzo.ai",
    "base-uri 'self'",
    "form-action 'self'",
    "upgrade-insecure-requests",
  ].join('; '),

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

// Development-specific CSP relaxations
const devSecurityHeaders = {
  ...securityHeaders,
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' http://localhost:* ws://localhost:*",
    "style-src 'self' 'unsafe-inline'",
    "font-src 'self' data:",
    "img-src 'self' data: blob: http: https:",
    "media-src 'self' blob: data:",
    "connect-src 'self' http://localhost:* ws://localhost:* wss://localhost:* https://*.hanzo.ai https://hanzo.id https://lux.id https://zoo.id https://pars.id",
    // Same remote frames as production. Dev used to allow localhost only, so
    // every live preview — dashboard project thumbs, the template gallery's demo
    // heroes — rendered a silent blank box locally while working in prod. A
    // preview you cannot see locally is a preview nobody checks.
    "frame-src 'self' http://localhost:* https://*.hanzo.ai https://*.hanzo.app",
    "frame-ancestors 'self' http://localhost:*",
  ].join('; '),
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