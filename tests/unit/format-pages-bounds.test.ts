/**
 * A page ends at `</html>`.
 *
 * The extraction regexes ran `<!DOCTYPE html>[\s\S]*` — from the doctype to the
 * END OF THE CHUNK — so anything the model wrote after its closing tag was
 * carried into the page. Browsers hoist stray text into <body>, so the preview
 * grew a tall, near-empty tail as long as whatever had been appended. Reported
 * as "blank but scrolls as far down as the pasted text", which is the shape of a
 * spec echoed back after the build.
 *
 * The unbounded form is still the fallback, because while a document is STILL
 * STREAMING there is no closing tag yet and the partial page must preview.
 */
import { extractHtmlContent, ensureCompleteHtml, parsePages } from '@/lib/format-pages';

const DOC = `<!DOCTYPE html>
<html lang="en"><head><title>T</title></head>
<body><h1>Hi</h1></body>
</html>`;

describe('extractHtmlContent stops at the closing tag', () => {
  it('drops commentary written after </html>', () => {
    const withTail = `${DOC}\n\nI have created a complete quest platform with:\n- a participant flow\n- an organizer console\n${'- more detail\n'.repeat(40)}`;
    const html = extractHtmlContent(withTail);
    expect(html).toContain('<h1>Hi</h1>');
    expect(html).not.toContain('participant flow');
    expect(html.trimEnd().endsWith('</html>')).toBe(true);
  });

  it('drops a prose preamble before the doctype too', () => {
    const html = extractHtmlContent(`Sure! Here is the page you asked for:\n\n${DOC}`);
    expect(html.startsWith('<!DOCTYPE html>')).toBe(true);
    expect(html).not.toContain('Sure!');
  });

  it('still previews a document that has not finished streaming', () => {
    const partial = '<!DOCTYPE html>\n<html><head><title>T</title></head>\n<body><h1>Half';
    const html = extractHtmlContent(partial);
    expect(html).toContain('<h1>Half');
    // ensureCompleteHtml closes it so the iframe can render mid-stream.
    expect(html).toContain('</html>');
  });

  it('handles a page with no doctype', () => {
    const html = extractHtmlContent('<html><body><p>x</p></body></html>\ntrailing notes here');
    expect(html).toContain('<p>x</p>');
    expect(html).not.toContain('trailing notes');
  });

  it('parsePages carries the same bound', () => {
    const pages = parsePages(`${DOC}\n\nLet me know if you want changes!`);
    expect(pages).toHaveLength(1);
    expect(pages[0].html).not.toContain('Let me know');
  });
});

describe('ensureCompleteHtml is why truncation must be judged on the RAW stream', () => {
  it('appends a closing tag, so a parsed page always looks terminated', () => {
    const patched = ensureCompleteHtml('<html><body><h1>cut off');
    expect(patched).toContain('</html>');
    // Which is correct for previewing — and exactly why a truncation check
    // reading a parsed page can never fire.
  });
});
