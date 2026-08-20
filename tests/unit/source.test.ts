import { stripComments, stripCss, tagEnd } from '../source';

// The readers 16 suites now share. Untested, this file is a single point of
// silent failure: strip too little and a rule is evadable by writing the
// comment differently; strip too much and the rule goes quiet against code it
// can no longer see. Both have already happened here, which is why this exists.
//
// The over-strip is the dangerous one, because it fails GREEN. The JSX-brace
// rule was written `[\s\S]*?` and the brace was free to be an interface's —
// the match ran to whatever later comment sat before a `}` and swallowed the
// body, so `credits-reason` stopped reading the declaration it guards.

describe('stripComments — TS/TSX/JS', () => {
  it('removes a line comment to end of line, not just a whole-line one', () => {
    expect(stripComments('const a = 1; // trailing\nconst b = 2;')).toContain('const a = 1;');
    expect(stripComments('const a = 1; // trailing\nconst b = 2;')).not.toContain('trailing');
  });

  it('spares a URL — `//` after a colon is not a comment', () => {
    expect(stripComments('fetch("https://hanzo.ai/v1")')).toContain('https://hanzo.ai/v1');
  });

  it('strips line comments BEFORE blocks, so a path in a comment cannot open one', () => {
    // A `//` comment containing the characters that open a block: stripping
    // blocks first opens one here and runs to the next close, taking real code.
    const src = ['// see components/landing/* for the rest', 'const kept = 1;', '/* gone */'].join('\n');
    const out = stripComments(src);
    expect(out).toContain('const kept = 1;');
    expect(out).not.toContain('gone');
  });

  it('removes the JSX spelling as a unit, braces and all', () => {
    expect(stripComments('<X>{/* note */}</X>')).toBe('<X></X>');
  });

  it('does NOT let a JSX-brace match cross a comment close', () => {
    // The regression: `{` opens an interface, and a doc comment inside it must
    // not let the match run to the closing brace.
    const src = 'interface A {\n  /** doc */\n  raise: (reason?: string) => void;\n}';
    expect(stripComments(src)).toMatch(/raise:\s*\(reason\?: string\)/);
  });

  it('leaves a block comment inside a string alone enough to keep the code', () => {
    expect(stripComments('const s = "a"; /* x */ const t = "b";')).toContain('const t = "b";');
  });
});

describe('stripCss — stylesheets', () => {
  it('removes block comments', () => {
    expect(stripCss('a { color: red } /* note */ b { color: blue }')).not.toContain('note');
  });

  it('keeps a protocol-relative or absolute url — `//` is not a CSS comment', () => {
    // The whole reason this is a second function: the TS stripper would delete
    // from the `//` to end of line, and that line is a declaration.
    const css = '@font-face { src: url(https://f.hanzo.ai/geist.woff2); }';
    expect(stripCss(css)).toContain('https://f.hanzo.ai/geist.woff2');
    expect(stripCss('a { background: url(//cdn/x.png) }')).toContain('//cdn/x.png');
  });
});

describe('tagEnd', () => {
  it('passes a `>` that lives inside a brace expression', () => {
    const s = '<Button onClick={() => run()} variant="ghost">';
    expect(s.slice(0, tagEnd(s, 0) + 1)).toBe(s);
  });

  it('passes an apostrophe written in a block comment between props', () => {
    // A walker that reads that apostrophe as a quote inverts every quote after
    // it, so the tag either runs past its end or stops short of it.
    const s = '<X /* the row\'s own note */ a="b">';
    expect(s.slice(0, tagEnd(s, 0) + 1)).toBe(s);
  });

  it('returns -1 when the tag never closes', () => {
    expect(tagEnd('<X a="b"', 0)).toBe(-1);
  });
});
