/**
 * What an edit turn did, and why a count cannot answer it.
 *
 * A model replies to an edit in two shapes. A PATCH carries SEARCH/REPLACE
 * blocks and the route records one line range per block that matched. A REBUILD
 * carries whole pages, which the route applies by replacing the page outright —
 * no blocks, so no ranges, so a count of ranges reads zero on the turn that
 * changed the most. Reported off that count, a finished site is announced as
 * "No changes applied — the edit didn't match this page. Try rephrasing." with
 * the finished site rendering beside the sentence.
 */
import assert from "node:assert/strict";

import { edit } from "@/lib/pages/report";
import type { Page } from "@/types";

import { read, stripComments } from "../source";

const page = (path: string, html: string): Page => ({ path, html });
const before = [page("index.html", "<html><body>Notes</body></html>")];

describe("what an edit turn did", () => {
  it("is a patch when a SEARCH block matched", () => {
    const after = [page("index.html", "<html><body>Bakery</body></html>")];
    assert.equal(edit(before, after, 2), "patched");
  });

  it("is a rebuild when whole pages came back instead of blocks", () => {
    // The measured shape: a first prompt against the starter project answers
    // with a complete document and no ranges at all.
    const after = [page("index.html", "<html><body>Rye &amp; Reason</body></html>")];
    assert.equal(edit(before, after, 0), "rebuilt");
  });

  it("is a rebuild when a page was added", () => {
    const after = [...before, page("menu.html", "<html><body>Menu</body></html>")];
    assert.equal(edit(before, after, 0), "rebuilt");
  });

  it("is untouched only when nothing moved", () => {
    assert.equal(edit(before, [page("index.html", before[0].html)], 0), "untouched");
  });

  it("reads a renamed page as a rebuild, not as nothing", () => {
    assert.equal(edit(before, [page("home.html", before[0].html)], 0), "rebuilt");
  });
});

describe("the thread says which of the three happened", () => {
  // Comment-stripped: the prose explaining a fix must not satisfy the check
  // that guards it.
  const code = stripComments(
    read("components/editor/ask-ai/index.tsx"),
  );

  it("never decides the sentence from the range count alone", () => {
    assert.doesNotMatch(code, /n === 0\s*\n?\s*\?\s*`No changes applied/);
    assert.match(code, /result\.edit === "patched"/);
    assert.match(code, /result\.edit === "rebuilt"/);
  });
});
