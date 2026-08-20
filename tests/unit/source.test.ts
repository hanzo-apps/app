import { readFileSync } from 'node:fs';


import { read, rel, root, sources, stripComments, stripCss, tagEnd } from '../source';

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

  it('spares a URL, because its slashes are inside a string', () => {
    // The old regex had a special case for a preceding colon. The scanner needs
    // none: it never reaches those slashes, so `a//b` in a string survives too.
    expect(stripComments('fetch("https://hanzo.ai/v1")')).toContain('https://hanzo.ai/v1');
  });

  it('a block opener inside a LINE comment does not open a block', () => {
    // The old regex depended on running the line rule first; get the order
    // backwards and this opens a comment that eats the code below. A scanner
    // has no order to get wrong — it is already inside the line comment.
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

  // THE ONE A REGEX CANNOT DO, and the reason this is a scanner.
  //
  // `accept=".zip,text/*,.html"` is an attribute value in app/new/page.tsx. A
  // regex reads its `/*` as a comment opener and runs to the next close — a
  // thousand characters of real code, the field's own onChange among them. Ten
  // files in this tree carry the shape (`image/*`, a CSP `https://*.hanzo.ai`,
  // a skills file quoting a CSS example).
  it('a comment opener inside a string literal is not a comment', () => {
    const src = '<input accept=".zip,text/*,.html" onChange={hit} />\nconst after = 1;';
    const out = stripComments(src);
    expect(out).toContain('onChange={hit}');
    expect(out).toContain('const after = 1;');
  });

  it('a line-comment opener inside a string literal is not a comment', () => {
    expect(stripComments('const u = "https://hanzo.ai"; const kept = 1;')).toContain('const kept = 1;');
    expect(stripComments("const p = 'a//b'; const kept = 2;")).toContain('const kept = 2;');
  });

  it('an escaped quote does not end the string', () => {
    expect(stripComments('const s = "a\\" /* not a comment */ b"; const kept = 3;'))
      .toContain('const kept = 3;');
  });

  // A failure prints a line number, and it has to be the file's own. Comments
  // are removed; the newlines they spanned are not. Collapsing them shortened a
  // 216-line component to 181 and every number below that point was wrong.
  it('preserves line numbering', () => {
    for (const f of sources(['components', 'app'], /\.tsx$/)) {
      const src = readFileSync(f, 'utf8');
      expect({ f: rel(f), lines: stripComments(src).split('\n').length })
        .toEqual({ f: rel(f), lines: src.split('\n').length });
    }
  });

  // The whole-tree assertion the string-literal bug would have failed: nothing a
  // file EXPORTS may disappear into a comment.
  it('no file loses a declaration to the stripper', () => {
    const decls = /^export (function|const|default|class|interface|type) /gm;
    const lost: string[] = [];
    for (const f of sources(['components', 'app', 'lib', 'hooks'], /\.(tsx?|jsx?)$/)) {
      const src = readFileSync(f, 'utf8');
      const before = (src.match(decls) ?? []).length;
      const after = (stripComments(src).match(decls) ?? []).length;
      if (after < before) lost.push(`${rel(f)} ${before}->${after}`);
    }
    expect(lost).toEqual([]);
  });
});

describe('sources — one walker', () => {
  it('never walks into generated or installed code', () => {
    const found = sources(['.'], /\.(tsx?|jsx?)$/).map(rel);
    // `.next` is the one that matters: it holds code nobody wrote, so a rule
    // scanning it accuses a generated file and a coverage count inflates.
    expect(found.filter((f) => /^(node_modules|\.next|dist|coverage)\//.test(f))).toEqual([]);
  });

  it('reads a repo path, not the shell’s working directory', () => {
    // Three spellings were in use, agreeing only because jest is always
    // launched from the repo root. `root` is derived from this file's own
    // location, so a suite run from anywhere reads the same tree.
    expect(read('package.json')).toContain('"name"');
    expect(root.endsWith('/tests')).toBe(false);
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
