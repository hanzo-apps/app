import { applySecurityHeaders, PREVIEW_HOST } from '@/lib/security/middleware'

/**
 * The preview origin carries its own policy, and only it does.
 *
 * A generated app is untrusted code. It used to paint in an `about:srcdoc`
 * frame, which inherits this document's CSP — so the ceiling on what a
 * generated app could reach was hanzo.app's own policy, and everything on the
 * web outside our hosts and the endorsed CDNs was refused. Serving the document
 * from its own host lifts that ceiling without touching the policy hanzo.app
 * needs for itself.
 *
 * Which makes the host test the whole security property: get it wrong in the
 * loose direction and the real app loses its CSP.
 */
type Fake = { headers: Map<string, string> }

const headersFor = (host?: string | null): Map<string, string> => {
  const res: Fake = { headers: new Map() }
  applySecurityHeaders(res as never, host)
  return res.headers
}

const csp = (host?: string | null) => headersFor(host).get('Content-Security-Policy') ?? ''

describe('the preview origin', () => {
  it('lets a previewed app reach the open web', () => {
    const p = csp(PREVIEW_HOST)
    // The four directives measured as refusing a real generated app.
    expect(p).toMatch(/connect-src \*/)
    expect(p).toMatch(/media-src \*/)
    expect(p).toMatch(/frame-src \*/)
    expect(p).toMatch(/default-src \*/)
  })

  it('is framed by the builder and by nobody else', () => {
    expect(csp(PREVIEW_HOST)).toMatch(/frame-ancestors https:\/\/hanzo\.app/)
  })

  it('drops X-Frame-Options there, which cannot express one allowed origin', () => {
    expect(headersFor(PREVIEW_HOST).has('X-Frame-Options')).toBe(false)
    expect(headersFor('hanzo.app').get('X-Frame-Options')).toBeDefined()
  })

  it('leaves the app itself on the strict policy', () => {
    const p = csp('hanzo.app')
    expect(p).toMatch(/default-src 'self'/)
    expect(p).not.toMatch(/connect-src \*/)
  })

  it('gives nothing away to a lookalike host', () => {
    // Anyone can register these. A prefix or suffix test hands them the
    // permissive policy, which is the one way this change could be worse than
    // no change at all.
    for (const host of [
      `${PREVIEW_HOST}.example.com`,
      `evil-${PREVIEW_HOST}`,
      `x.${PREVIEW_HOST}`,
      'preview.hanzo.app.attacker.test',
    ]) {
      expect(csp(host)).toMatch(/default-src 'self'/)
      expect(csp(host)).not.toMatch(/connect-src \*/)
    }
  })

  it('matches the host when a dev server attaches a port', () => {
    expect(csp(`${PREVIEW_HOST}:3000`)).toMatch(/connect-src \*/)
  })

  it('leaves an absent host on the strict policy', () => {
    expect(csp(undefined)).toMatch(/default-src 'self'/)
    expect(csp(null)).toMatch(/default-src 'self'/)
  })
})
