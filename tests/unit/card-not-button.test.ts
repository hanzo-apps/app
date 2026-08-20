/**
 * A card is not a control.
 *
 * `@hanzo/ui` pins a Button to its size variant's height whatever the caller
 * passes. That is right for a button and fatal for a card: add
 * `overflow="hidden"` and the box crops to the control ladder's band, taking
 * the words with it. It has now happened twice — the templates grid (36px
 * holding 425px, 46 cards deep) and the dashboard project rows (36px holding
 * 62px, which cost every row its "Live · N ago" line).
 *
 * Both read as a deliberate dense layout, which is why neither was caught by
 * looking. The combination is the tell, so the combination is what this
 * refuses: a Button that also hides its overflow is a card wearing a control.
 */
import { readFileSync } from "fs";

import { root, sources, tagEnd } from "../source";


/** The props of every `<Button …>` opening tag in a file. */
function buttonTags(src: string): string[] {
  const tags: string[] = [];
  for (const m of src.matchAll(/<Button\b/g)) {
    const end = tagEnd(src, m.index! + 7);
    if (end >= 0) tags.push(src.slice(m.index!, end));
  }
  return tags;
}

describe('a Button never doubles as a card', () => {
  it('finds no Button that hides its own overflow', () => {
    const offenders: string[] = [];
    for (const file of sources(['app', 'components'], /\.tsx$/)) {
      for (const tag of buttonTags(readFileSync(file, 'utf8'))) {
        if (/overflow=["{]?["']?hidden/.test(tag)) {
          offenders.push(`${file.slice(root.length + 1)}: ${tag.replace(/\s+/g, ' ').slice(0, 90)}`);
        }
      }
    }
    expect(offenders).toEqual([]);
  });

  it('reads Button tags at all, so an empty result means something', () => {
    // Guards the scanner itself: a regex that matched nothing would pass the
    // test above for the wrong reason.
    const tags = buttonTags('<Button variant="ghost" style={{ a: ">" }} onPress={() => {}}>x</Button>');
    expect(tags).toHaveLength(1);
    expect(tags[0]).toContain('variant="ghost"');
    expect(tags[0]).toContain('onPress');
  });
});
