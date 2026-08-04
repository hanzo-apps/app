/**
 * Branding guidelines: folding readings together, and taking them apart again.
 *
 * The editing half is the point. A model looking at twenty photos will name a
 * concept that is not the project, so every derived thing has to be removable —
 * and removing the IMAGE has to take the concepts only that image vouched for,
 * or the guidelines keep asserting something whose evidence is gone.
 */
import assert from "node:assert/strict";

import { drop, empty, fold, forget, hex, isField, read } from "@/lib/source/brand";

test("brand — the same colour from many images is ONE colour with many vouchers", () => {
  let b = empty();
  b = fold(b, "a1", { colors: [{ hex: "#FFAA00", name: "amber" }] });
  b = fold(b, "a2", { colors: [{ hex: "ffaa00" }] }); // same colour, sloppier spelling
  assert.equal(b.colors.length, 1);
  assert.equal(b.colors[0].hex, "#ffaa00");
  // Count of vouchers is what makes it a brand colour rather than one photo's accident.
  assert.deepEqual(b.colors[0].from, ["a1", "a2"]);
  assert.equal(b.colors[0].name, "amber"); // the one that named it wins
});

test("brand — themes and concepts merge by phrase, case and spacing folded", () => {
  let b = empty();
  b = fold(b, "a1", { themes: ["Warm  Minimal"], concepts: ["linen texture"] });
  b = fold(b, "a2", { themes: ["warm minimal"], concepts: ["Arched Windows"] });
  assert.deepEqual(b.themes.map((t) => t.text), ["warm minimal"]);
  assert.deepEqual(b.themes[0].from, ["a1", "a2"]);
  assert.deepEqual(b.concepts.map((c) => c.text), ["linen texture", "arched windows"]);
});

test("brand — an asset never vouches for the same entry twice", () => {
  let b = empty();
  b = fold(b, "a1", { themes: ["coastal"] });
  b = fold(b, "a1", { themes: ["coastal"] }); // re-read the same image
  assert.deepEqual(b.themes[0].from, ["a1"]);
});

test("brand — drop removes what a person disagreed with, by value", () => {
  let b = empty();
  b = fold(b, "a1", { colors: [{ hex: "#112233" }], themes: ["brutalist"], concepts: ["concrete"] });
  b = drop(b, "themes", "Brutalist"); // the wrong read, deleted as displayed
  assert.deepEqual(b.themes, []);
  assert.equal(b.concepts.length, 1); // neighbours untouched
  b = drop(b, "colors", "112233");
  assert.deepEqual(b.colors, []);
});

test("brand — removing an image forgets what only that image supported", () => {
  let b = empty();
  b = fold(b, "a1", { themes: ["coastal"], concepts: ["driftwood"] });
  b = fold(b, "a2", { themes: ["coastal"] });

  b = forget(b, "a1");
  // coastal survives — a2 still vouches for it.
  assert.deepEqual(b.themes.map((t) => t.text), ["coastal"]);
  assert.deepEqual(b.themes[0].from, ["a2"]);
  // driftwood goes — its only evidence was deleted, and an unsupported claim
  // would be unfindable by the person who removed the image.
  assert.deepEqual(b.concepts, []);
});

test("brand — hex normalizes, and refuses what is not a colour", () => {
  assert.equal(hex(" #FfF000 "), "#fff000");
  assert.equal(hex("abcdef"), "#abcdef");
  for (const junk of ["", "#fff", "red", "#12345g", "#1234567"]) {
    assert.equal(hex(junk), null, junk);
  }
});

test("brand — a colour that is not a colour is dropped, not stored as junk", () => {
  const b = fold(empty(), "a1", { colors: [{ hex: "chartreuse" }, { hex: "#00ff00" }] });
  assert.deepEqual(b.colors.map((c) => c.hex), ["#00ff00"]);
});

test("brand — read tolerates fences and prose around the JSON", () => {
  const r = read('Here you go:\n```json\n{"colors":[{"hex":"#010203"}],"themes":["calm"],"concepts":[]}\n```');
  assert.deepEqual(r.colors, [{ hex: "#010203" }]);
  assert.deepEqual(r.themes, ["calm"]);
});

test("brand — read never throws on a model that ignored the format", () => {
  for (const junk of ["", "I cannot help with that", "{not json", "null"]) {
    const r = read(junk);
    assert.deepEqual(r.colors, []);
    assert.deepEqual(r.themes, []);
    assert.deepEqual(r.concepts, []);
  }
});

test("brand — only the three named lists are editable", () => {
  for (const f of ["colors", "themes", "concepts"]) assert.equal(isField(f), true);
  for (const f of ["updated", "from", "", "COLORS", null]) assert.equal(isField(f), false);
});
