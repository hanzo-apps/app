import { applySecurityHeaders } from '@/lib/security/middleware'

/**
 * Development and production must not be two different policies.
 *
 * They were. Production's CSP carries a carefully-earned allowlist — the CDNs
 * the generation system prompt endorses, plus our own hosts — because the /dev
 * builder previews generated apps in an `about:srcdoc` iframe that INHERITS the
 * page CSP. A source missing from that list renders the preview as unstyled raw
 * markup while the published copy works.
 *
 * Development restated the policy by hand and carried NONE of it. So the exact
 * failure the production list exists to prevent was reintroduced for the only
 * people positioned to notice it, and it stayed invisible because a CSP refusal
 * is a console line, not an exception — the page renders, just wrong.
 *
 * The fix was to stop having two lists. This is the test that keeps it that way:
 * it does not check the policy's CONTENT (that would just be a second copy of
 * the list, drifting on its own schedule) — it checks that dev is a SUPERSET of
 * prod. Add a source to production and dev gets it for free or this goes red.
 */

type Fake = { headers: Map<string, string> }

const headersFor = (env: string): Map<string, string> => {
  const prev = process.env.NODE_ENV
  // NODE_ENV is read at call time, which is what makes this testable at all.
  ;(process.env as Record<string, string>).NODE_ENV = env
  const res: Fake = { headers: new Map() }
  try {
    applySecurityHeaders(res as never)
  } finally {
    ;(process.env as Record<string, string>).NODE_ENV = prev as string
  }
  return res.headers
}

/** `script-src 'self' https://a https://b` -> ['self', 'https://a', 'https://b'] */
const directives = (csp: string): Map<string, Set<string>> => {
  const out = new Map<string, Set<string>>()
  for (const part of csp.split(';')) {
    const [name, ...sources] = part.trim().split(/\s+/)
    if (name) out.set(name, new Set(sources))
  }
  return out
}

const prod = directives(headersFor('production').get('Content-Security-Policy') || '')
const dev = directives(headersFor('development').get('Content-Security-Policy') || '')

describe('CSP is one policy, not two', () => {
  it('states a policy at all', () => {
    // The floor. Every assertion below is "dev has everything prod has", and an
    // empty prod policy satisfies that vacuously.
    expect(prod.size).toBeGreaterThanOrEqual(10)
    expect(dev.size).toBeGreaterThanOrEqual(10)
  })

  it('names every directive production names', () => {
    // `upgrade-insecure-requests` is deliberately production-only: in dev it
    // would rewrite http://localhost to https and nothing would load.
    const devOnlyExempt = new Set(['upgrade-insecure-requests'])
    const missing = [...prod.keys()].filter((d) => !dev.has(d) && !devOnlyExempt.has(d))
    expect(missing).toEqual([])
  })

  it('carries every source production carries', () => {
    // This is the one that was broken. Dev had `script-src 'self' 'unsafe-inline'
    // 'unsafe-eval' http://localhost:*` against production's four CDNs plus
    // *.hanzo.ai — so every generated preview rendered unstyled locally.
    const lost: string[] = []
    for (const [directive, sources] of prod) {
      if (directive === 'upgrade-insecure-requests') continue
      for (const s of sources) {
        if (!dev.get(directive)?.has(s)) lost.push(`${directive} lost ${s}`)
      }
    }
    expect(lost).toEqual([])
  })

  it('adds localhost in development and never in production', () => {
    const localIn = (m: Map<string, Set<string>>, d: string) =>
      [...(m.get(d) || [])].some((s) => s.includes('localhost'))
    const want = ['script-src', 'connect-src', 'frame-src']

    expect(want.filter((d) => !localIn(dev, d))).toEqual([]) // dev must allow it
    expect(want.filter((d) => localIn(prod, d))).toEqual([]) // production must not
  })

  it('lets the srcdoc preview load a published project\'s own assets', () => {
    // The second defect, present in BOTH environments: `*.hanzo.app` was in
    // frame-src only. The preview pulls a published project's HTML into the
    // srcdoc frame, so the frame then asks for that project's own scripts and
    // fonts by absolute URL — measured on /dev?template=hanzo-apps/prism-react,
    // four scripts and six fonts from prism-react.hanzo.app refused.
    const unreachable: string[] = []
    for (const [env, m] of [['production', prod], ['development', dev]] as const) {
      for (const d of ['script-src', 'style-src', 'font-src', 'frame-src']) {
        if (!m.get(d)?.has('https://*.hanzo.app')) unreachable.push(`${env} ${d}`)
      }
    }
    expect(unreachable).toEqual([])
  })

  it('keeps the identity providers reachable', () => {
    // OIDC discovery + the PKCE token exchange are cross-origin POSTs. Lose
    // these and the SSO callback fails silently and no session ever persists.
    for (const m of [prod, dev]) {
      const connect = m.get('connect-src') || new Set()
      expect([...connect]).toContain('https://hanzo.id')
    }
  })
})
