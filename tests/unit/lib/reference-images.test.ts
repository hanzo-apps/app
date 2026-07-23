import assert from "node:assert/strict";

import {
  REFERENCE_IMAGES_CAP,
  referenceImagesKey,
  addReferenceImages,
  mergeReferenceImages,
  removeReferenceImage,
} from "../../../lib/reference-images.ts";

/**
 * reference-images — the ONE dedupe / order / cap rule behind the ask-ai bar's
 * "past images" picker. Pure: exercised here with no DOM / localStorage.
 */

test("referenceImagesKey namespaces per project and falls back when unsaved", () => {
  assert.equal(referenceImagesKey("acme/site"), "hanzo:reference-images:acme/site");
  assert.equal(referenceImagesKey(undefined), "hanzo:reference-images:unsaved");
  assert.equal(referenceImagesKey(null), "hanzo:reference-images:unsaved");
});

test("addReferenceImages puts newest first and de-duplicates", () => {
  assert.deepEqual(addReferenceImages([], ["a"]), ["a"]);
  assert.deepEqual(addReferenceImages(["a"], ["b"]), ["b", "a"]);
  assert.deepEqual(addReferenceImages(["a", "b"], ["c", "d"]), [
    "c",
    "d",
    "a",
    "b",
  ]);
});

test("addReferenceImages moves a re-added URL to the front (recency)", () => {
  assert.deepEqual(addReferenceImages(["a", "b", "c"], ["b"]), [
    "b",
    "a",
    "c",
  ]);
});

test("addReferenceImages ignores empty / non-string entries", () => {
  assert.deepEqual(addReferenceImages(["a"], ["", "b"]), ["b", "a"]);
  assert.deepEqual(
    // a malformed persisted list is cleaned on next write
    addReferenceImages(["", "a"] as string[], ["b"]),
    ["b", "a"]
  );
});

test("addReferenceImages caps the history to the most recent entries", () => {
  const many = Array.from({ length: REFERENCE_IMAGES_CAP + 5 }, (_, i) => `u${i}`);
  const out = addReferenceImages([], many);
  assert.equal(out.length, REFERENCE_IMAGES_CAP);
  assert.equal(out[0], "u0");
  assert.equal(out[REFERENCE_IMAGES_CAP - 1], `u${REFERENCE_IMAGES_CAP - 1}`);

  // A fresh add always survives the cap; the oldest tail is dropped.
  const rolled = addReferenceImages(out, ["fresh"]);
  assert.equal(rolled.length, REFERENCE_IMAGES_CAP);
  assert.equal(rolled[0], "fresh");
});

test("mergeReferenceImages is an order-preserving, uncapped union", () => {
  assert.deepEqual(mergeReferenceImages(["a", "b"], ["b", "c"]), [
    "a",
    "b",
    "c",
  ]);
  // union may exceed the history cap (a project can hold more images)
  const a = Array.from({ length: REFERENCE_IMAGES_CAP + 3 }, (_, i) => `s${i}`);
  assert.equal(mergeReferenceImages(a, ["x"]).length, REFERENCE_IMAGES_CAP + 4);
});

test("removeReferenceImage drops exactly the given URL", () => {
  assert.deepEqual(removeReferenceImage(["a", "b", "c"], "b"), ["a", "c"]);
  assert.deepEqual(removeReferenceImage(["a"], "missing"), ["a"]);
});
