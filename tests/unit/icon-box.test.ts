import { iconBox } from "@/lib/chrome";

/**
 * A square icon control is defined by ONE number, and its padding must be zero.
 *
 * The defect this locks out: a Button carries 12px of horizontal padding for a
 * text label. Pin the box to a fixed width without clearing that, and the
 * padding eats the box from both sides — `svg { max-width: 100% }` then shrinks
 * the glyph to fit rather than overflowing, so nothing warns and nothing clips.
 * Measured in the builder toolbar, and the arithmetic was exact: 28 - 24 = a
 * 2px monitor icon, 32 - 24 (less the hairline) = 6px for history/refresh/open,
 * 36 - 24 = 10px. Six icons, six different slivers, one missing zero.
 */
describe("iconBox", () => {
  it("is square: one number drives both axes", () => {
    expect(iconBox(28)).toMatchObject({ width: 28, height: 28 });
    expect(iconBox(32)).toMatchObject({ width: 32, height: 32 });
  });

  it("clears padding on BOTH axes — the box size IS the padding", () => {
    const box = iconBox(32);
    expect(box.paddingHorizontal).toBe(0);
    expect(box.paddingVertical).toBe(0);
  });

  it("leaves the full box for the glyph at every size", () => {
    // The regression, stated as the invariant it violated: content width must
    // equal the declared size, never `size - padding`.
    for (const size of [24, 28, 32, 36, 40]) {
      const box = iconBox(size);
      expect(box.width - box.paddingHorizontal * 2).toBe(size);
    }
  });

  it("centres the glyph", () => {
    expect(iconBox(32)).toMatchObject({ alignItems: "center", justifyContent: "center" });
  });
});
