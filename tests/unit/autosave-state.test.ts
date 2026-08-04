/**
 * The status bar said "Auto-saved" as a literal string, printed whenever a build
 * was not running and checked against nothing. Nothing autosaved. These pin the
 * states that replaced it — in particular that "saved" is only reachable when
 * the SERVER agreed, and that a project with nowhere to save says so.
 */
// The label mapping the console renders. Kept beside the hook's states so a new
// state cannot be added without deciding what it SAYS.
import { saveLabel } from '@/lib/pages/save-label';

describe('saveLabel', () => {
  it('never claims saved for a project with nowhere to save', () => {
    // A brand-new build has no project record. This is the state the old label
    // was most wrong about: work one closed tab from gone, reported as saved.
    expect(saveLabel('unsaved', null)).toMatch(/not saved/i);
    expect(saveLabel('unsaved', null)).not.toMatch(/saved at|auto-saved/i);
  });

  it('reports a write in flight as in flight', () => {
    expect(saveLabel('saving', null)).toMatch(/saving/i);
  });

  it('reports a failure as a failure, never as saved', () => {
    expect(saveLabel('error', new Date())).toMatch(/not saved|failed/i);
  });

  it('only says saved with a time the server actually accepted', () => {
    const at = new Date('2026-08-03T21:15:00Z');
    const label = saveLabel('saved', at);
    expect(label).toMatch(/saved/i);
    expect(label).not.toMatch(/not saved/i);
    // A "saved" with no timestamp is the old lie in a new shape.
    expect(saveLabel('saved', null)).not.toMatch(/^saved$/i);
  });

  it('idle means nothing to write, which is only honest once something saved', () => {
    expect(saveLabel('idle', null)).not.toMatch(/^saved/i);
    expect(saveLabel('idle', new Date())).toMatch(/saved/i);
  });
});
