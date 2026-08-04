// A "forkable" marker must be a way in.
//
// /community browses 162 entries and 143 of them come back from /v1/catalog with
// forkable: true. The card printed that fact next to a fork icon and stopped
// there: no fork action anywhere on the lane, on any card, in any state. The
// builder's clone wire (/dev?repo=…&action=edit) already existed and already
// worked — the community lane simply never opened it.
//
// So the assertion is about the DOOR, not the word: a forkable entry with a repo
// links into the builder, and an entry with nothing to clone makes no claim.

import { render, screen } from '@testing-library/react';
import { CatalogBrowser } from '@/components/catalog-browser';
import type { CatalogEntry } from '@/lib/catalog';

import { WithGui } from '../gui-wrapper';

// CatalogBrowser renders @hanzo/gui primitives, which read a createGui config at
// render and throw "Missing hanzogui config" without one. The app mounts it once
// in app/providers.tsx — see tests/gui-wrapper.
const renderBrowser = (ui: React.ReactElement) => render(ui, { wrapper: WithGui });

jest.mock('@/lib/catalog', () => {
  const actual = jest.requireActual('@/lib/catalog');
  return { ...actual, searchCatalog: jest.fn() };
});

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { searchCatalog } = require('@/lib/catalog') as {
  searchCatalog: jest.Mock;
};

function entry(over: Partial<CatalogEntry>): CatalogEntry {
  return {
    id: 'hanzo/thing',
    org: 'hanzo',
    name: 'thing',
    kind: 'repo',
    origin: 'community',
    scope: 'public',
    ...over,
  } as CatalogEntry;
}

function respond(data: CatalogEntry[]) {
  searchCatalog.mockResolvedValue({ data, total: data.length, facets: {} });
}

describe('the community lane can be forked from', () => {
  beforeEach(() => searchCatalog.mockReset());

  it('turns a forkable entry into a builder link', async () => {
    respond([
      entry({
        id: 'hanzo/folio',
        name: 'folio',
        title: 'Folio',
        forkable: true,
        repo: 'https://github.com/hanzoai/folio',
      }),
    ]);
    renderBrowser(<CatalogBrowser origin="community" title="Community" />);

    const fork = await screen.findByRole('link', { name: /fork/i });
    expect(fork.getAttribute('href')).toBe(
      `/dev?repo=${encodeURIComponent('https://github.com/hanzoai/folio')}&action=edit`,
    );
  });

  it('claims nothing when there is nothing to clone', async () => {
    respond([
      entry({ id: 'hanzo/demo', name: 'demo', title: 'Demo', forkable: true, url: 'https://demo.example' }),
    ]);
    renderBrowser(<CatalogBrowser origin="community" title="Community" />);

    await screen.findByText('Demo');
    expect(screen.queryByRole('link', { name: /fork/i })).toBeNull();
  });
});
