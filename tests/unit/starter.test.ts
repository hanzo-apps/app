/**
 * THE app a new build starts from.
 *
 * Two halves, and each fails silently on its own. The DOCUMENT is only worth
 * shipping if it is really wired to the platform it claims — a starter that
 * declares no schema, or asks a URL the proxy does not serve, renders perfectly
 * and simply never keeps a record, which is the one defect a screenshot cannot
 * show. And `start()` is only worth calling if it actually reaches the builder:
 * it writes under the ONE name `components/editor` restores from, so a renamed
 * key leaves the builder opening empty with nothing to explain it.
 *
 * The URL half mirrors `base-prompt-paths.test.ts` deliberately. The prompt
 * teaches a model this contract and the starter IS that contract already
 * written, so if one may drift the other may too — and `/v1/base/collections/x/
 * records` is exactly the spelling that shipped every generated app's data calls
 * to a collection literally named "collections".
 */
import { readFileSync } from 'fs';
import { join } from 'path';

import { STARTER, start } from '@/lib/dev/starter';
import { loadWorkspace, UNTITLED } from '@/lib/dev/workspace';
import { baseEnabled } from '@/lib/base/flag';
import { thirdParty, url } from '@/lib/vendor';

import { read } from "../source";

const page = STARTER[0];

describe('the starter document', () => {
  it('is ONE self-contained page the builder can open', () => {
    expect(STARTER).toHaveLength(1);
    expect(page.path).toBe('index.html');
    expect(page.html).toMatch(/^<!DOCTYPE html>/i);
    expect(page.html).toMatch(/<\/html>\s*$/i);
  });

  it('declares its data model where the platform provisions it from', () => {
    // `lib/base/provision.ts` parses CREATE TABLE out of this; no marker, no
    // collection, and every write 404s against a table nobody made.
    expect(page.html).toMatch(/hanzo-base-schema:\s*CREATE TABLE\s+notes\b/);
  });

  it('asks the records API the proxy actually serves', () => {
    const calls = page.html.split('\n').filter((l) => l.includes('fetch('));
    expect(calls.length).toBeGreaterThan(0);
    for (const call of calls) {
      expect(call).not.toContain('/v1/base/collections/');
      expect(call).not.toContain('/records');
    }
    // The collection is the FIRST path segment, and the same one the DDL names.
    expect(page.html).toContain("fetch('/v1/base/notes?sort=-created')");
    expect(page.html).toContain("fetch('/v1/base/notes'");
  });

  it('reads who is signed in instead of inventing a login', () => {
    expect(page.html).toContain("fetch('/v1/me')");
    expect(page.html).toContain('authenticated');
    // A password field here would be a fake login accepting anything — the
    // identity is Hanzo's and is verified server-side.
    expect(page.html).not.toMatch(/type=["']password["']/);
  });

  it('loads its style layer from us, and from nobody else', () => {
    expect(thirdParty(page.html)).toEqual([]);
    expect(page.html).toContain(url('design'));
    // One link, one style block of its own — nothing else is fetched, because
    // the preview frame paints on an opaque origin.
    expect(page.html.match(/<link\b/g) ?? []).toHaveLength(1);
    expect(page.html).not.toMatch(/<script\b[^>]*\bsrc=/);
  });

  it('says which state it is in rather than faking a saved record', () => {
    // Every failure path ends in a sentence, so a page that cannot reach the
    // backend reads as a designed state and not as a working app losing notes.
    expect(page.html).toContain('No notes yet.');
    expect(page.html).toMatch(/Notes load once this app is published/);
    expect(page.html).toMatch(/did not save/);
  });

  it('never asks a signed-in reader to sign in', () => {
    // The preview frame paints on an opaque origin, so every one of these fetches
    // fails TRANSPORT and takes its catch — while the person reading it signed in
    // to reach this screen. A catch may therefore say what WE do not know; only a
    // request that came back may tell the reader to act.
    //
    // Asserted on the catch bodies rather than on the document, because the
    // signed-out sentence is legitimate in the `.then` and must stay there.
    const catches = page.html.match(/\.catch\(function \(\) \{[\s\S]*?\}\)/g) ?? [];
    expect(catches.length).toBeGreaterThan(2);
    for (const body of catches) {
      expect(body).not.toMatch(/Sign in/i);
    }

    // And the answered case keeps it, so this is a split rather than a deletion.
    expect(page.html).toMatch(/Sign in with Hanzo to save notes\./);
  });
});

describe('start() — what a new build begins with', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('lays the starter down where the builder restores it', () => {
    start();
    // The builder reads this exact name for a build with no project record.
    expect(loadWorkspace(UNTITLED)?.pages).toEqual(STARTER);
  });

  it('…and that name is the LITERAL the builder restores from', () => {
    start();
    // Asserting through the constant alone proves nothing: rename it and both
    // sides move together while the builder — which spells it out — quietly
    // finds an empty project. So this reads the key and the other side's source.
    expect(window.localStorage.getItem('hanzo.dev.workspace:untitled-site')).toBeTruthy();
    const editor = read("components/editor/index.tsx");
    expect(editor).toContain(`|| "${UNTITLED}"`);
  });

  it('turns the data plane on even for someone who once turned it off', () => {
    window.localStorage.setItem('initialBase', '0');
    start();
    expect(window.localStorage.getItem('initialBase')).toBe('1');
    expect(baseEnabled()).toBe(true);
  });

  it('forgets the previous unsaved build, so this prompt is its own project', () => {
    window.localStorage.setItem('hanzo.dev.project-id', 'site-abc123');
    (window as { __projectName?: string }).__projectName = 'Metrics';

    start();

    // A kept repo id commits this build into the last one's history; a kept name
    // sends the restore looking under that project's key and finds no starter.
    expect(window.localStorage.getItem('hanzo.dev.project-id')).toBeNull();
    expect((window as { __projectName?: string }).__projectName).toBeUndefined();
    expect(loadWorkspace(UNTITLED)?.pages).toEqual(STARTER);
  });
});
