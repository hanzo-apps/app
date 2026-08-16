/**
 * The injected widget carries help and preferences, and copies neither.
 *
 * Two invariants, and the second is the load-bearing one. `@hanzo/design`'s own
 * docblock records what a second copy of the type ramp cost — a restated `lg`
 * of 16px against the tokens' 15px, so a preference of 1 ("leave it alone")
 * silently resized the published design. `edit.js` has no bundler and runs on
 * pages this app does not own, which makes inlining the tables the obvious move
 * and the wrong one.
 */
import fs from 'node:fs';
import path from 'node:path';

const script = fs.readFileSync(path.join(process.cwd(), 'public/edit.js'), 'utf8');

/**
 * Comments stripped before scanning for a COPY, because the comment explaining
 * why the transform is not copied necessarily names the values it owns — and a
 * check that reads its own rationale as the violation fails on the fix. Same
 * shape as tests/unit/template-preview.test.ts, which strips for the same
 * reason. Code-shaped assertions read the whole file; only the "no copy" test
 * needs the stripped one.
 */
const code = script.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/[^\n]*/g, '$1');

describe('the widget imports the preference transform', () => {
  it('fetches it rather than restating it', () => {
    expect(script).toContain("import(BASE + '/vendor/appearance/preference.js')");
  });

  it('holds no copy of the tables that transform owns', () => {
    // The two that drift: what a density word multiplies by, and what a face
    // resolves to. Either appearing here means someone inlined the map.
    expect(code).not.toMatch(/compact\s*:\s*0?\.85/);
    expect(code).not.toContain('var(--font-serif)');
    expect(code).not.toContain('ui-sans-serif, system-ui');
    // The measure's container sizes belong to the same module.
    expect(code).not.toMatch(/container-prose\s*['"]?\s*[,:]\s*['"]\d/);
  });

  it('degrades honestly when the transform cannot be reached', () => {
    // A control that cannot apply its own value must not be drawn.
    expect(script).toMatch(/if\s*\(!VARS\)\s*return\s*''/);
  });

  it('removes an unset axis rather than writing a neutral', () => {
    // An inline custom property outranks every stylesheet, so writing a neutral
    // 1 silently overrides a brand that published its own scale.
    expect(script).toContain('st.removeProperty(k)');
  });

  it('writes the knobs to the HOST page, not into its own shadow root', () => {
    // The reader is adjusting the page they are reading, and :root is where
    // every ramp reads them from.
    expect(script).toContain('document.documentElement.style');
  });
});

describe('a suggestion carries a name', () => {
  it('offers a sign-in rather than a form the door will refuse', () => {
    expect(script).toContain("label: 'Sign in to suggest', action: 'login'");
  });

  it('opens the sign-in and returns the reader to the page they were on', () => {
    expect(script).toMatch(/action === 'login'[\s\S]{0,220}encodeURIComponent\(location\.href\)/);
  });

  it('fails CLOSED when identity cannot be probed', () => {
    // ME.authenticated stays false, so the CTA asks for a sign-in. The old
    // comment promised "anonymous suggest still works", which the door no
    // longer allows.
    expect(script).not.toContain('anonymous suggest still works');
  });
});

describe('help is part of the same panel', () => {
  it('renders one section, not a second bubble', () => {
    expect(script).toContain('<h3>Help</h3>');
    expect(script).toContain('<h3>Preferences</h3>');
    // One launcher: the sections are appended to the panel the mark opens.
    expect(script).toMatch(/helpHtml\(\)\s*\+\s*\n?\s*prefsHtml\(\)/);
  });

  it('marks an outward link as leaving the page', () => {
    expect(script).toContain('OUTLINK');
    expect(script).toContain('rel="noopener"');
  });
});
