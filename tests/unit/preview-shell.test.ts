import { GET } from '@/app/preview/frame/route'
import { PREVIEW_HOST } from '@/lib/security/middleware'

/**
 * The shell answers on the preview origin and refuses everywhere else.
 *
 * Serving it from hanzo.app would put the document back inside the policy it
 * exists to escape — a second way to do the job, and the broken one.
 */
const get = (host: string) =>
  GET(new Request('https://x/preview/frame', { headers: { host } }))

describe('the preview shell', () => {
  it('is served from the preview origin', async () => {
    const res = await get(PREVIEW_HOST)
    expect(res.status).toBe(200)
    const body = await res.text()
    expect(body).toMatch(/document\.write/)
    expect(body).toMatch(/preview:doc/)
  })

  it('announces itself, because a write that lands first is lost', async () => {
    expect(await (await get(PREVIEW_HOST)).text()).toMatch(/preview:shell/)
  })

  it('is never cached, so it can be fixed', async () => {
    expect((await get(PREVIEW_HOST)).headers.get('Cache-Control')).toBe('no-store')
  })

  it('refuses on the app itself and on a lookalike', async () => {
    for (const host of ['hanzo.app', `${PREVIEW_HOST}.example.com`, 'localhost']) {
      expect((await get(host)).status).toBe(404)
    }
  })

  it('answers when a dev server attaches a port', async () => {
    expect((await get(`${PREVIEW_HOST}:3000`)).status).toBe(200)
  })
})
