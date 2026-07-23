import { cn, COLORS } from '@/lib/utils';

describe('Utils', () => {
  describe('cn', () => {
    it('merges class names correctly', () => {
      expect(cn('px-4', 'py-2')).toBe('px-4 py-2');
    });

    it('handles conditional classes', () => {
      expect(cn('base', undefined, 'active')).toBe('base active');
      expect(cn('base', false && 'hidden', 'active')).toBe('base active');
    });

    it('merges tailwind classes with conflicts correctly', () => {
      expect(cn('px-4', 'px-8')).toBe('px-8');
      expect(cn('bg-red-500', 'bg-blue-500')).toBe('bg-blue-500');
    });

    it('handles arrays of class names', () => {
      expect(cn(['px-4', 'py-2'], 'mt-4')).toBe('px-4 py-2 mt-4');
    });

    it('handles objects with boolean values', () => {
      expect(cn({ 'px-4': true, 'py-2': false, 'mt-4': true })).toBe('px-4 mt-4');
    });

    it('returns empty string for no arguments', () => {
      expect(cn()).toBe('');
    });

    it('filters out null and undefined values', () => {
      expect(cn('base', null, undefined, 'active')).toBe('base active');
    });
  });

  // COLORS is the true-black monochrome ramp — the design law is ZERO hue by
  // construction (hanzo.ai brand). Pin the invariants, not a snapshot: every
  // entry is a zero-chroma hex gray (rr gg bb all equal) and the ramp ascends
  // dark → light so index order is meaningful for depth.
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
