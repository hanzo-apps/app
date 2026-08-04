import { bySpectrum, tint } from "@/lib/template-hues";
import measured from "@/lib/template-hues.json";
import { TEMPLATE_SHOTS } from "@/lib/template-shots";

const HUES: Record<string, { hue: number; sat: number }> = measured;

describe("template spectrum order", () => {
  it("measures every shot that the gallery can show", () => {
    // The json is generated from public/templates, and the gallery renders from
    // TEMPLATE_SHOTS. A slug in the second and not the first sorts as a neutral
    // and quietly falls out of the spectrum — silent, and only visible as a
    // colourful card stranded in the grey tail.
    const missing = [...TEMPLATE_SHOTS].filter((slug) => !(slug in HUES));
    expect(missing).toEqual([]);
  });

  it("opens on purple and closes the colour run on pink", () => {
    const ordered = bySpectrum(Object.keys(HUES), (slug) => slug);
    const coloured = ordered.filter((slug) => tint(slug));

    // Purple leads. Cutting the wheel at violet itself would put these last.
    expect(coloured.slice(0, 3)).toEqual(["artist-epk", "soar", "photo-essay"]);
    // …and pink trails it, which is the same statement about where the cut is.
    expect(coloured.at(-1)).toBe("event-rally");
  });

  it("runs the wheel one way, without doubling back", () => {
    // The real invariant behind the eyeballed order: walking the sorted list,
    // the distance travelled from the cut never decreases. Any comparator that
    // sorted by raw hue instead would break here and nowhere else.
    const ordered = bySpectrum(Object.keys(HUES), (slug) => slug).filter((s) => tint(s));
    const travelled = ordered.map((slug) => (310 - HUES[slug].hue + 360) % 360);
    expect(travelled).toEqual([...travelled].sort((a, b) => a - b));
  });

  it("sorts every colourless shot behind every coloured one", () => {
    const ordered = bySpectrum(Object.keys(HUES), (slug) => slug);
    const lastColoured = ordered.findLastIndex((slug) => tint(slug));
    const firstNeutral = ordered.findIndex((slug) => !tint(slug));
    expect(lastColoured).toBeLessThan(firstNeutral);
    // A grayscale mockup has no dominant hue to place, and there are real ones.
    expect(firstNeutral).toBeGreaterThan(0);
  });

  it("holds catalog order among items it cannot tell apart", () => {
    // Stability is what keeps the neutral tail from reshuffling on every render,
    // and it is the reason games — which carry no slug — stay where the catalog
    // put them. Games are OBJECTS with an absent slug, never absent items: an
    // undefined element is hoisted to the end by sort itself, whatever the
    // comparator says, so a test written that way proves nothing about this one.
    const items = [
      { slug: "mosaic" },
      { slug: undefined },
      { slug: "matrix" },
      { slug: undefined },
      { slug: "pixel" },
    ];
    expect(bySpectrum(items, (it) => it.slug)).toEqual(items);
  });

  it("declines to tint what it cannot name", () => {
    expect(tint("band-setlist")).not.toBeNull();
    expect(tint("mosaic")).toBeNull(); // measured, and colourless
    expect(tint("no-such-template")).toBeNull();
    expect(tint(undefined)).toBeNull();
  });
});
