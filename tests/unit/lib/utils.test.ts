import { COLORS } from '@/lib/utils';

describe('Utils', () => {
  describe('COLORS — monochrome ramp', () => {
    it('contains only zero-chroma grays (r == g == b)', () => {
      for (const color of COLORS) {
        expect(color).toMatch(/^#([0-9a-f]{2})\1{2}$/i);
      }
    });

    it('ascends strictly dark → light', () => {
      const luma = COLORS.map((c) => parseInt(c.slice(1, 3), 16));
      for (let i = 1; i < luma.length; i++) {
        expect(luma[i]).toBeGreaterThan(luma[i - 1]);
      }
    });

    it('spans a usable ramp (near-black start, light end)', () => {
      expect(COLORS.length).toBeGreaterThanOrEqual(8);
      expect(parseInt(COLORS[0].slice(1, 3), 16)).toBeLessThan(0x30);
      expect(parseInt(COLORS[COLORS.length - 1].slice(1, 3), 16)).toBeGreaterThan(0xc0);
    });
  });
});
