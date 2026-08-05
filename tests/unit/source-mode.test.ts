/**
 * The two modes, and the link parser.
 *
 * The modes are the whole point of the feature: `gallery` publishes third-party
 * pixels into a shipped app, `brand` only reads them and emits words and hex
 * codes. These tests hold that difference so it cannot quietly collapse into one
 * behaviour — which is the failure that ships someone's reference image as their
 * product's content.
 */
import assert from "node:assert/strict";

import { MODES, embeddable, isMode, policy, requireMode } from "@/lib/source/mode";
import { LinkError, parse, ready } from "@/lib/source/link";

test("mode/link — gallery keeps the bytes AND may embed them; brand may not", () => {
    assert.equal(policy("gallery").embeds, true);
    assert.equal(policy("brand").embeds, false);
    // Both store: gallery because a rotted link takes the app's gallery with it,
    // brand because guidelines whose evidence is gone cannot be revised.
    assert.equal(policy("gallery").stores, true);
    assert.equal(policy("brand").stores, true);
  });

test("mode/link — only brand analyzes — gallery images are content, not reference", () => {
    assert.equal(policy("brand").analyzes, true);
    assert.equal(policy("gallery").analyzes, false);
  });

test("mode/link — embeddable is the ONE gate, and it refuses anything that is not a mode", () => {
    assert.equal(embeddable("gallery"), true);
    assert.equal(embeddable("brand"), false);
    for (const junk of [undefined, null, "", "GALLERY", "both", 1, {}]) {
      assert.equal(embeddable(junk), false, `embeddable(${JSON.stringify(junk)})`);
    }
  });

test("mode/link — refuses a missing mode instead of defaulting", () => {
    // A default would pick between publishing someone's pixels and merely
    // looking at them — the one decision this must not make for the caller.
    for (const junk of [undefined, null, "", "inspiration", "gallery ", 0]) {
      assert.throws(() => requireMode(junk), /mode must be one of/);
    }
    assert.equal(requireMode("brand"), "brand");
  });

test("mode/link — there are exactly two modes, and every one has a policy and a summary", () => {
    assert.deepEqual([...MODES], ["gallery", "brand"]);
    for (const m of MODES) {
      assert.ok(policy(m).summary.length > 0, `${m} needs a line a person reads`);
      assert.equal(isMode(m), true);
    }
  });

test("mode/link — reads a Drive folder link", () => {
    const s = parse("https://drive.google.com/drive/folders/1AbC_de-FGH");
    assert.equal(s.kind, "drive");
    assert.equal(s.kind === "drive" && s.id, "1AbC_de-FGH");
    assert.equal(s.kind === "drive" && s.folder, true);
  });

test("mode/link — reads a Drive file link, and the ?id= form", () => {
    const f = parse("https://drive.google.com/file/d/1XYZ/view?usp=sharing");
    assert.equal(f.kind === "drive" && f.id, "1XYZ");
    assert.equal(f.kind === "drive" && f.folder, false);
    const q = parse("https://drive.google.com/open?id=1QQQ");
    assert.equal(q.kind === "drive" && q.id, "1QQQ");
  });

test("mode/link — reads a Pinterest board", () => {
    const s = parse("https://www.pinterest.com/antje/swimwear-2026/");
    assert.equal(s.kind, "pinterest");
    assert.equal(s.kind === "pinterest" && s.user, "antje");
    assert.equal(s.kind === "pinterest" && s.board, "swimwear-2026");
  });

  // The host decides the kind. A substring match would treat this as Pinterest
  // and hand an attacker's URL to a server-side image fetcher.
test("mode/link — does not mistake a lookalike host for the real one", () => {
    assert.throws(
      () => parse("https://evil.example/?next=https://pinterest.com/antje/x"),
      LinkError
    );
    assert.throws(() => parse("https://pinterest.com.evil.example/antje"), LinkError);
  });

test("mode/link — refuses what it cannot address, with a reason", () => {
    assert.throws(() => parse(""), /Paste a Pinterest or Google Drive link/);
    assert.throws(() => parse("not a url"), /is not a link/);
    assert.throws(() => parse("http://drive.google.com/drive/folders/1"), /https/);
    assert.throws(() => parse("https://drive.google.com/"), /no folder or file id/);
    assert.throws(() => parse("https://example.com/album"), /Only Pinterest and Google Drive/);
  });

test("mode/link — both kinds import today", () => {
    assert.equal(ready("drive").ok, true);
    assert.equal(ready("pinterest").ok, true);
  });

test("mode/link — a pin link is one pin, not a profile named 'pin'", () => {
    const s = parse("https://www.pinterest.com/pin/1234567890/");
    assert.equal(s.kind, "pinterest");
    assert.equal(s.kind === "pinterest" && s.pin, "1234567890");
    assert.equal(s.kind === "pinterest" && s.user, undefined);
  });

test("mode/link — a pin.it code is carried, for the server to expand", () => {
    const s = parse("https://pin.it/abc123");
    assert.equal(s.kind, "pinterest");
    assert.equal(s.kind === "pinterest" && s.short, "abc123");
  });
