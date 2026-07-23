/**
 * Wired-by-default injection: the analytics beacon + Base submissions config a
 * published static site ships out of the box, driven by the cloud project's
 * `analytics` flag and `space`.
 */
import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';

import {
  buildWiredHead,
  buildAnalyticsBeacon,
  buildBaseConfig,
  ANALYTICS_ENDPOINT,
  BASE_SUBMISSIONS_ENDPOINT,
} from '@/lib/publishing/wired-injection';
import { wiredConfigFromCloudProject } from '@/lib/publishing/wired-config';

/** Execute every <script> body found in an injected head snippet, in order. */
function runScripts(html: string): void {
  const re = /<script>([\s\S]*?)<\/script>/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    // eslint-disable-next-line no-eval
    (0, eval)(m[1]);
  }
}

describe('wiredConfigFromCloudProject', () => {
  it('is analytics-ON by default (wired)', () => {
    expect(wiredConfigFromCloudProject({ analytics: true, space: 'acme/site' })).toEqual({
      analyticsEnabled: true,
      space: 'acme/site',
    });
  });

  it('honors the explicit opt-out (analytics:false)', () => {
    expect(wiredConfigFromCloudProject({ analytics: false, space: 'acme/site' }).analyticsEnabled).toBe(false);
  });

  it('defaults ON when the project is unresolved', () => {
    expect(wiredConfigFromCloudProject(null)).toEqual({ analyticsEnabled: true });
    expect(wiredConfigFromCloudProject({}).analyticsEnabled).toBe(true);
  });

  it('drops an empty space', () => {
    expect(wiredConfigFromCloudProject({ analytics: true, space: '   ' }).space).toBeUndefined();
  });
});

describe('buildWiredHead', () => {
  it('emits BOTH the analytics beacon and the Base config when analytics-on with a space', () => {
    const head = buildWiredHead({ analytics: true, space: 'acme/site' });
    expect(head).toContain(ANALYTICS_ENDPOINT);
    expect(head).toContain('$pageview');
    expect(head).toContain('window.__HANZO_BASE__');
    expect(head).toContain(BASE_SUBMISSIONS_ENDPOINT);
    expect(head).toContain('"collection":"submissions"');
    expect(head).toContain('"space":"acme/site"');
  });

  it('omits the beacon when analytics is opted out, keeping the Base config', () => {
    const head = buildWiredHead({ analytics: false, space: 'acme/site' });
    expect(head).not.toContain('$pageview');
    expect(head).not.toContain(ANALYTICS_ENDPOINT);
    expect(head).toContain('window.__HANZO_BASE__');
  });

  it('omits the Base config when there is no space, keeping the beacon', () => {
    const head = buildWiredHead({ analytics: true });
    expect(head).toContain('$pageview');
    expect(head).not.toContain('window.__HANZO_BASE__');
  });

  it('is empty when analytics is off and there is no space', () => {
    expect(buildWiredHead({ analytics: false })).toBe('');
  });
});

describe('analytics beacon (runtime)', () => {
  const realFetch = global.fetch;
  beforeEach(() => {
    // jsdom lacks sendBeacon → the beacon falls through to fetch.
    global.fetch = jest.fn(() => Promise.resolve({ ok: true, status: 200 })) as unknown as typeof fetch;
    window.localStorage.clear();
    window.sessionStorage.clear();
  });
  afterEach(() => {
    global.fetch = realFetch;
  });

  it('POSTs a canonical $pageview batch to /v1/event tagged with the space', async () => {
    runScripts(buildAnalyticsBeacon('acme/site'));
    const calls = (global.fetch as jest.Mock).mock.calls;
    expect(calls.length).toBe(1);
    const [url, init] = calls[0] as [string, RequestInit];
    expect(url).toBe(ANALYTICS_ENDPOINT);
    expect(init.method).toBe('POST');
    const payload = JSON.parse(init.body as string);
    expect(payload.batch[0].type).toBe('pageview');
    expect(payload.batch[0].event).toBe('$pageview');
    expect(payload.batch[0].properties.space).toBe('acme/site');
    expect(payload.batch[0].library).toBe('@hanzo/capture');
  });
});

describe('Base form auto-wire (runtime)', () => {
  const realFetch = global.fetch;
  beforeEach(() => {
    global.fetch = jest.fn(() => Promise.resolve({ ok: true, status: 200 })) as unknown as typeof fetch;
    document.body.innerHTML = '';
    delete (window as unknown as Record<string, unknown>).__HANZO_BASE__;
  });
  afterEach(() => {
    global.fetch = realFetch;
    document.body.innerHTML = '';
  });

  it('sets window.__HANZO_BASE__ and POSTs {form,data} for a <form data-hanzo>', () => {
    runScripts(buildBaseConfig('acme/site'));
    expect((window as unknown as { __HANZO_BASE__: { collection: string } }).__HANZO_BASE__.collection).toBe(
      'submissions',
    );

    document.body.innerHTML =
      '<form data-hanzo="contact"><input name="email" value="a@b.co"><button type="submit">go</button></form>';
    const form = document.querySelector('form') as HTMLFormElement;
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

    const calls = (global.fetch as jest.Mock).mock.calls;
    expect(calls.length).toBe(1);
    const [url, init] = calls[0] as [string, RequestInit];
    expect(url).toBe(BASE_SUBMISSIONS_ENDPOINT);
    const body = JSON.parse(init.body as string);
    expect(body.form).toBe('contact');
    expect(body.data.email).toBe('a@b.co');
  });

  it('ignores a plain <form> without data-hanzo', () => {
    runScripts(buildBaseConfig('acme/site'));
    document.body.innerHTML = '<form><input name="x" value="1"></form>';
    const form = document.querySelector('form') as HTMLFormElement;
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    expect((global.fetch as jest.Mock).mock.calls.length).toBe(0);
  });
});
