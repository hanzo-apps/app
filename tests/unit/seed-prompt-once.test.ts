/**
 * The seed prompt is a ONE-SHOT handoff from the composer to /dev.
 *
 * It was read from localStorage and left there, which made it durable state: on
 * every later load of /dev it was read again and auto-submitted, so reloading
 * the builder rebuilt the project from scratch off the original prompt and
 * discarded the work. The import branch already removed it for this exact
 * reason; the general path did not.
 */

/** The read used by app/dev/page.tsx — consume, never merely peek. */
function takeSeed(search: URLSearchParams, store: Storage): string {
  const fromQuery = search.get('prompt');
  let stored: string | null = null;
  try {
    stored = store.getItem('initialPrompt');
    if (stored) store.removeItem('initialPrompt');
  } catch {
    /* storage unavailable */
  }
  return fromQuery || stored || '';
}

const memory = (): Storage => {
  const m = new Map<string, string>();
  return {
    get length() { return m.size; },
    clear: () => m.clear(),
    getItem: (k: string) => (m.has(k) ? (m.get(k) as string) : null),
    key: (i: number) => Array.from(m.keys())[i] ?? null,
    removeItem: (k: string) => { m.delete(k); },
    setItem: (k: string, v: string) => { m.set(k, v); },
  } as Storage;
};

describe('seed prompt', () => {
  it('is delivered once, then gone', () => {
    const store = memory();
    store.setItem('initialPrompt', 'build me LuxQuest');
    const params = new URLSearchParams();

    expect(takeSeed(params, store)).toBe('build me LuxQuest');
    // THE BUG: a second load must find nothing to replay.
    expect(takeSeed(params, store)).toBe('');
    expect(store.getItem('initialPrompt')).toBeNull();
  });

  it('does not resurrect the prompt on repeated reloads', () => {
    const store = memory();
    store.setItem('initialPrompt', 'p');
    takeSeed(new URLSearchParams(), store);
    for (let i = 0; i < 5; i++) {
      expect(takeSeed(new URLSearchParams(), store)).toBe('');
    }
  });

  it('a ?prompt= link seeds once and is never stored', () => {
    const store = memory();
    const params = new URLSearchParams('prompt=from-a-link');
    expect(takeSeed(params, store)).toBe('from-a-link');
    expect(store.getItem('initialPrompt')).toBeNull();
  });

  it('the query wins over a stale stored seed, and clears it', () => {
    const store = memory();
    store.setItem('initialPrompt', 'old');
    expect(takeSeed(new URLSearchParams('prompt=new'), store)).toBe('new');
    expect(store.getItem('initialPrompt')).toBeNull();
  });

  it('survives storage being unavailable', () => {
    const blocked = {
      getItem: () => { throw new Error('blocked'); },
      removeItem: () => { throw new Error('blocked'); },
    } as unknown as Storage;
    expect(takeSeed(new URLSearchParams('prompt=x'), blocked)).toBe('x');
  });
});
