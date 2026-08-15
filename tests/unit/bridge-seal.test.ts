/**
 * A streamed document leaves something open, and the bridge must still be a tag.
 *
 * The preview shows HTML while the model is still writing it, and `withBridge`
 * appends `<style>` + `<script>` to whatever has arrived. HTML has four elements
 * whose content is RAWTEXT — inside one, `<` starts nothing and only that
 * element's end tag gets you out — so a stream that stopped inside the model's
 * own `<script>` turned our opening tag into text, let our `</script>` close
 * THEIR script, and painted every remaining line of the bridge into the body.
 * That is what a user saw: `xpathFor`, `infoFor` and the console forwarder
 * printed over the app being built.
 *
 * Each case below is a real streaming cut. The assertion is not "it looks
 * right" — it is that the bridge's own code cannot end up in the document as
 * TEXT, which is checked by parsing the result and reading what a visitor would
 * see.
 */
import { withBridge } from '@/components/editor/preview/bridge';

/** What a reader would see — the document's text, with scripts and styles out. */
const visible = (doc: string) => {
  const d = new DOMParser().parseFromString(doc, 'text/html');
  d.querySelectorAll('script,style').forEach((n) => n.remove());
  return (d.body?.textContent ?? '').replace(/\s+/g, ' ').trim();
};

const CUTS: [string, string][] = [
  ['inside a script', '<h1>Hi</h1><script>const a = 1; function boot() {'],
  ['inside a style', '<h1>Hi</h1><style>body { color: red;'],
  ['inside a title', '<title>Half a ti'],
  ['inside a textarea', '<h1>Hi</h1><textarea>draft te'],
  ['inside a comment', '<h1>Hi</h1><!-- still thinking'],
  ['mid-tag', '<h1>Hi</h1><div class="ca'],
];

describe('withBridge seals what the stream left open', () => {
  for (const [name, html] of CUTS) {
    it(`does not leak its own source when the stream stops ${name}`, () => {
      const seen = visible(withBridge(html));
      expect(seen).not.toContain('xpathFor');
      expect(seen).not.toContain('infoFor');
      expect(seen).not.toContain('preview:console');
      expect(seen).not.toContain('addEventListener');
    });
  }

  it('still runs the bridge — the script is a real element, not text', () => {
    const doc = new DOMParser().parseFromString(
      withBridge('<h1>Hi</h1><script>const a = 1;'),
      'text/html',
    );
    const ours = [...doc.querySelectorAll('script')].filter((s) => s.textContent?.includes('xpathFor'));
    expect(ours).toHaveLength(1);
  });

  it('leaves a finished document alone', () => {
    const done = '<html><head><title>T</title></head><body><h1>Hi</h1></body></html>';
    expect(visible(withBridge(done))).toBe('Hi');
  });
});
