import { cn, COLORS, getPTag } from '@/lib/utils';

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

  describe('COLORS', () => {
    it('contains expected color values', () => {
      expect(COLORS).toEqual([
        'red',
        'blue',
        'green',
        'yellow',
        'purple',
        'pink',
        'gray',
      ]);
    });

    it('has correct length', () => {
      expect(COLORS).toHaveLength(7);
    });

    it('contains only string values', () => {
      COLORS.forEach(color => {
        expect(typeof color).toBe('string');
      });
    });
  });

  describe('getPTag', () => {
    it('generates correct HTML with repo ID', () => {
      const repoId = 'test-repo-123';
      const result = getPTag(repoId);

      expect(result).toContain('Made with');
      expect(result).toContain('Hanzo');
      expect(result).toContain(`remix=${repoId}`);
      expect(result).toContain('https://hanzo.ai/logo.svg');
    });

    it('returns valid HTML structure', () => {
      const result = getPTag('test');
      expect(result).toMatch(/^<p.*<\/p>$/);
      expect(result).toContain('<img');
      expect(result).toContain('<a');
    });

    it('includes correct styles', () => {
      const result = getPTag('test');
      expect(result).toContain('position: fixed');
      expect(result).toContain('z-index: 10');
      expect(result).toContain('background: rgba(0, 0, 0, 0.8)');
    });

    it('handles empty repo ID', () => {
      const result = getPTag('');
      expect(result).toContain('remix=');
      expect(result).not.toContain('remix=undefined');
    });

    it('escapes special characters in repo ID', () => {
      const repoId = 'test&repo<>123';
      const result = getPTag(repoId);
      expect(result).toContain(`remix=${repoId}`);
    });
  });
});