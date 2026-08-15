/**
 * The bug class this repo shipped: a gui prop handed a value gui recognizes but
 * cannot use. It vanishes — no DOM attribute, no console warning, `next build`
 * exit 0 — so the only thing standing between it and production is a check that
 * reads the source. This is that check, plus the tree it guards.
 *
 * Every expectation below is a measured Chromium behaviour, recorded in the
 * header of scripts/lint-gui-props.mjs. The negative cases matter more than the
 * positive ones: the first draft of this rule flagged 128 correct
 * `lineHeight="1.625"` call sites, and a lint that cries wolf gets deleted.
 */
import { checkSource, run } from '../../scripts/lint-gui-props.mjs';

type Finding = { file: string; line: number; col: number; id: string; message: string };

const ids = async (src: string): Promise<string[]> =>
  ((await checkSource(src)) as Finding[]).map((f) => f.id);

describe('gui prop values the lint must flag', () => {
  it('a line-height ratio written as a bare number — renders 1.05 PIXELS', async () => {
    expect(await ids('<H1 lineHeight={1.05}>hi</H1>')).toEqual(['line-height-px']);
  });

  it('tracking too small to see — a bare number is px, not em', async () => {
    expect(await ids('<Text letterSpacing={0.02}>hi</Text>')).toEqual(['letter-spacing-px']);
  });

  it('a length prop given a unitless string — the declaration is dropped', async () => {
    expect(await ids('<YStack top="-3" />')).toEqual(['unitless-string']);
  });

  it('a transform shorthand given a unitless string — voids the WHOLE transform', async () => {
    expect(await ids('<YStack y="-3" />')).toEqual(['unitless-string']);
  });

  it('the same bad value hiding inside a responsive override', async () => {
    expect(await ids('<YStack $sm={{ left: "-6" }} />')).toEqual(['unitless-string']);
  });

  it('a length handed to a color prop — falls back to the theme', async () => {
    expect(await ids('<Text color="1.9rem">hi</Text>')).toEqual(['color-length-swap']);
  });

  it('a color handed to a size prop — dropped, the box stretches', async () => {
    expect(await ids('<YStack width="#fff" />')).toEqual(['color-length-swap']);
  });

  it('a breakpoint this config does not define — inert at every width', async () => {
    expect(await ids('<Text $gtSm={{ fontSize: 20 }}>hi</Text>')).toEqual(['unknown-breakpoint']);
  });

  it('the centering idiom with its minus sign lost', async () => {
    expect(await ids('<YStack position="absolute" left="50%" x="50%" />')).toEqual(['centering-sign']);
    expect(await ids('<YStack position="absolute" top="50%" y="50%" />')).toEqual(['centering-sign']);
  });
});

describe('values that are CORRECT and must never be flagged', () => {
  const clean = async (src: string) => expect(await ids(src)).toEqual([]);

  // Measured: line-height: 1.05 on a 40px font computes to 42px. The quoted
  // form is how you spell a ratio, and 128 call sites already use it.
  it('a line-height ratio quoted as a string', () => clean('<H1 lineHeight="1.625">hi</H1>'));

  // Measured: 10px line-height under a 10px font. A bare number IS pixels, and
  // sometimes pixels is what you mean.
  it('a genuine pixel line-height', () => clean('<Text fontSize={10} lineHeight={10}>hi</Text>'));

  // 82 call sites in this repo set tracking to ±0.3–0.4px on purpose.
  it('real tracking in pixels', () => clean('<H1 letterSpacing={-0.4}>hi</H1>'));

  // Measured: translateX(-50%) of a 200px box = -100px. The unit SURVIVES —
  // this is the working centering idiom, not a defect.
  it('the centering idiom spelled correctly', () =>
    clean('<YStack position="absolute" left="50%" x="-50%" />'));

  it('percentages on length props', () => clean('<YStack width="100%" top="25%" />'));

  // Measured accepted: gui does not append px to these, so a bare numeric
  // string is valid CSS.
  it('bare numeric strings on the props CSS allows them for', () =>
    clean('<YStack fontWeight="500" opacity="0.5" zIndex="7" flexShrink="0" />'));

  it('tokens, calc and var', () =>
    clean('<YStack top="$-3" width="calc(100% - 2px)" color="var(--x)" />'));

  it('the breakpoints and selector families this config really has', () =>
    clean('<Text $sm={{ fontSize: 20 }} $md={{ fontSize: 24 }} $group-hover={{ opacity: 1 }} $theme-dark={{ color: "$color" }}>hi</Text>'));

  // `<rect x="0" y="0">` in an inline SVG is a real SVG attribute. Lowercase
  // tags are not gui components and are left alone.
  it('SVG attributes on intrinsic elements', () =>
    clean('<svg><rect x="0" y="0" width="256" height="256" /></svg>'));
});

describe('the app tree', () => {
  it('has no gui prop values that gui silently misreads', async () => {
    const { findings, fileCount } = (await run()) as { findings: Finding[]; fileCount: number };
    expect(fileCount).toBeGreaterThan(200);
    expect(findings.map((f) => `${f.file}:${f.line}  ${f.id}`)).toEqual([]);
  }, 120_000);
});
