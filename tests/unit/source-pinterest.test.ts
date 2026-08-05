/**
 * The Pinterest reader's pure half: what `extract` keeps from a page.
 *
 * The page is a fixture, not a fetch — extraction is a function over text, and
 * these pin the three behaviors imports depend on: every size of one image
 * collapses to its largest rendition, escaped JSON references count the same
 * as markup ones, and profile chrome (avatars) is not content.
 */
import assert from "node:assert/strict";

import { extract } from "@/lib/source/pinterest";

const PAGE = `
  <img src="https://i.pinimg.com/236x/ab/cd/ef/first0001.jpg">
  {"images":{"orig":{"url":"https:\\u002F\\u002Fi.pinimg.com\\u002Foriginals\\u002Fab\\u002Fcd\\u002Fef\\u002Ffirst0001.jpg"}}}
  <img src="https://i.pinimg.com/564x/11/22/33/second002.png">
  <img src="https://i.pinimg.com/75x75_RS/aa/bb/cc/avatar003.jpg">
  <img src="https://i.pinimg.com/236x/aa/bb/cc/user/avatar004.jpg">
  <img src="https://i.pinimg.com/736x/11/22/33/second002.png">
`;

test("pinterest/extract — one image, its largest rendition", () => {
  const got = extract(PAGE, 60);
  assert.equal(got.length, 2);
  assert.equal(got[0].id, "ab/cd/ef/first0001.jpg");
  assert.equal(got[0].url, "https://i.pinimg.com/originals/ab/cd/ef/first0001.jpg");
  assert.equal(got[1].url, "https://i.pinimg.com/736x/11/22/33/second002.png");
  assert.equal(got[1].name, "second002.png");
});

test("pinterest/extract — the limit bounds what an import takes", () => {
  assert.equal(extract(PAGE, 1).length, 1);
});

test("pinterest/extract — an empty page yields nothing, not an error", () => {
  assert.deepEqual(extract("<html></html>", 60), []);
});
