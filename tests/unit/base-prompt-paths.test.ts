/**
 * The backend the builder tells a generated app to call must be the one the
 * proxy actually serves.
 *
 * `app/v1/base/[...path]/route.ts` takes the FIRST path segment as the
 * collection: `/v1/base/quests` → `collections/quests/records`. The prompt was
 * still teaching the older spelling, `/v1/base/collections/quests/records`,
 * which that mapping reads as a collection literally NAMED "collections" —
 * so every list, create and delete in every generated app with a backend went
 * to a URL that could not work. Nothing surfaced it: the page renders, the
 * buttons are there, and only the data never arrives.
 *
 * These pin the contract in the one place a prompt can be checked mechanically.
 */
import { BASE_SYSTEM_PROMPT, INITIAL_SYSTEM_PROMPT } from '@/lib/prompts';

describe('BASE_SYSTEM_PROMPT teaches the real Base API', () => {
  it('never instructs the retired /collections/.../records shape', () => {
    // The prohibition may NAME it once to warn against it; it may not appear in
    // any of the worked fetch() examples.
    const examples = BASE_SYSTEM_PROMPT.split('\n').filter((l) => l.includes('fetch('));
    expect(examples.length).toBeGreaterThan(0);
    for (const line of examples) {
      expect(line).not.toContain('/v1/base/collections/');
      expect(line).not.toContain('/records');
    }
  });

  it('documents the collection as the first path segment', () => {
    expect(BASE_SYSTEM_PROMPT).toContain('/v1/base/<collection>');
    expect(BASE_SYSTEM_PROMPT).toMatch(/FIRST path segment/i);
  });

  it('covers the full CRUD the proxy serves', () => {
    for (const verb of ['POST', 'PATCH', 'DELETE']) {
      expect(BASE_SYSTEM_PROMPT).toContain(verb);
    }
  });

  it('points auth at the real identity probe, not a hand-rolled login', () => {
    expect(BASE_SYSTEM_PROMPT).toContain('/v1/me');
    expect(BASE_SYSTEM_PROMPT).toMatch(/DO NOT build a fake\s+login form/i);
  });
});

describe('INITIAL_SYSTEM_PROMPT forbids controls that go nowhere', () => {
  it('states the rule and names the anti-pattern', () => {
    expect(INITIAL_SYSTEM_PROMPT).toMatch(/EVERY CONTROL MUST DO SOMETHING/i);
    expect(INITIAL_SYSTEM_PROMPT).toContain('href="#"');
  });

  it('says to omit a control rather than ship a dead one', () => {
    expect(INITIAL_SYSTEM_PROMPT).toMatch(/LEAVE THE CONTROL OUT/i);
  });
});
