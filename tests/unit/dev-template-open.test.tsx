/**
 * Opening a template in the builder.
 *
 * The regression this pins: `/dev?template=…&action=edit` stopped loading the
 * template and started GENERATING one. Every template edit resolved the catalog's
 * description and seeded "Build the primary landing page for <name> — a <cat>
 * app…", so clicking Savor wrote a fresh imitation of Savor and served it as
 * Savor. Nothing said so; the user's only clue was that the result looked wrong.
 *
 * Two things therefore have to stay true, and neither is visible from the other:
 *   • a template WITH source opens — its pages reach the editor and nothing is
 *     generated (an auto-generation here would overwrite what was just loaded);
 *   • a template WITHOUT source still gets built, but the chat SAYS it is being
 *     recreated from a description instead of passing the result off as the
 *     template.
 */
import { render, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import type { Page } from '@/types';

const push = jest.fn();
const replace = jest.fn();
let params = new URLSearchParams();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push, replace }),
  useSearchParams: () => params,
}));

/** Capture what the editor is actually handed, without mounting the whole builder. */
const editorProps: Array<{ pages?: Page[] }> = [];
jest.mock('@/components/editor', () => ({
  AppEditor: (props: { pages?: Page[] }) => {
    editorProps.push(props);
    return <div data-testid="editor" />;
  },
}));

jest.mock('@/components/app-shell', () => ({
  AppShell: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
jest.mock('@/components/dev-onboarding', () => ({ DevOnboarding: () => <div /> }));
jest.mock('@/components/template-loader', () => ({ TemplateLoader: () => <div /> }));
jest.mock('@/lib/import/staging', () => ({
  readStagedProject: jest.fn(async () => null),
  clearStagedProject: jest.fn(async () => {}),
}));

import DevPage from '@/app/dev/page';
import { WithGui } from '../gui-wrapper';

const REAL_HTML = '<!DOCTYPE html><html><head><title>Metrics</title></head><body>Revenue by channel</body></html>';

/**
 * Answer the two calls the template path makes: the catalog lookup, and the
 * question of whether the template publishes source.
 */
function serve({ pages }: { pages: Page[] | null }) {
  global.fetch = jest.fn(async (input: RequestInfo | URL) => {
    const url = String(input);
    if (url.endsWith('/pages')) {
      return {
        ok: !!pages,
        status: pages ? 200 : 404,
        json: async () => (pages ? { pages } : { error: 'no source for slug' }),
      } as unknown as Response;
    }
    return {
      ok: true,
      status: 200,
      json: async () => ({
        slug: 'metrics',
        title: 'Metrics',
        category: 'Dashboard',
        description: 'Analytics dashboard.',
        features: ['Charts'],
        useCase: 'Product analytics',
      }),
    } as unknown as Response;
  }) as unknown as typeof fetch;
}

const win = () => window as unknown as Record<string, unknown>;

beforeEach(() => {
  editorProps.length = 0;
  params = new URLSearchParams({ template: 'hanzo-apps/metrics', action: 'edit' });
  delete win().__assistantGreeting;
  delete win().__initialPrompt;
  localStorage.clear();
  jest.clearAllMocks();
});

describe('a template that publishes its source', () => {
  it('opens it — the pages reach the editor', async () => {
    serve({ pages: [{ path: 'index.html', html: REAL_HTML }] });

    render(<DevPage />, { wrapper: WithGui });

    await waitFor(() => expect(editorProps.at(-1)?.pages).toBeTruthy());
    expect(editorProps.at(-1)!.pages).toEqual([{ path: 'index.html', html: REAL_HTML }]);
  });

  it('greets, and does NOT queue a generation that would overwrite it', async () => {
    serve({ pages: [{ path: 'index.html', html: REAL_HTML }] });

    render(<DevPage />, { wrapper: WithGui });

    await waitFor(() => expect(win().__assistantGreeting).toBeTruthy());
    expect(win().__assistantGreeting).toBe('Metrics is loaded — tell me what to change.');
    // `__initialPrompt` is what makes AskAI auto-build on mount. The template is
    // already here, so there is nothing to build.
    expect(win().__initialPrompt).toBeUndefined();
    expect(localStorage.getItem('initialPrompt')).toBeNull();
  });
});

describe('a template that publishes no source', () => {
  it('says it is recreating the template rather than opening it', async () => {
    serve({ pages: null });

    render(<DevPage />, { wrapper: WithGui });

    await waitFor(() => expect(win().__assistantGreeting).toBeTruthy());
    const greeting = String(win().__assistantGreeting);
    expect(greeting).toContain('Metrics');
    expect(greeting).toMatch(/recreating it from the template's description/i);
    // The honest version never claims the template was loaded.
    expect(greeting).not.toMatch(/is loaded/i);
  });

  it('still builds, from the template description', async () => {
    serve({ pages: null });

    render(<DevPage />, { wrapper: WithGui });

    await waitFor(() => expect(win().__initialPrompt).toBeTruthy());
    expect(String(win().__initialPrompt)).toContain('Metrics');
    expect(String(win().__initialPrompt)).toContain('Analytics dashboard.');
    expect(editorProps.at(-1)?.pages).toBeUndefined();
  });
});
