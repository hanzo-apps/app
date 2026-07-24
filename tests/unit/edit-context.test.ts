import { parseContext, pickPath, renderContext } from '@/lib/edit/context';

describe('lib/edit/context — auto-resolved edit trace', () => {
  describe('parseContext', () => {
    it('sanitizes candidate files: drops traversal, clamps score, caps at 6', () => {
      const ctx = parseContext({
        candidateFiles: [
          { path: 'app/dev/page.tsx', score: 0.9, why: 'route → page' },
          { path: '../../etc/passwd', score: 1 }, // traversal → dropped
          { path: '/abs/leading', score: 5 }, // leading slash stripped, score clamped
          { path: 'a.tsx', score: 2 },
          { path: 'b.tsx' },
          { path: 'c.tsx' },
          { path: 'd.tsx' },
          { path: 'e.tsx' }, // 8 valid-ish; cap keeps first 6 of the sliced input
        ],
      });
      expect(ctx.candidateFiles.length).toBeLessThanOrEqual(6);
      expect(ctx.candidateFiles.some((c) => c.path.includes('..'))).toBe(false);
      expect(ctx.candidateFiles[0]).toEqual({ path: 'app/dev/page.tsx', score: 0.9, why: 'route → page' });
      const abs = ctx.candidateFiles.find((c) => c.path === 'abs/leading');
      expect(abs?.score).toBe(1); // clamped 5 → 1
    });

    it('reconstructs the replay deep-link from the session id and ignores any client-supplied URL', () => {
      const ctx = parseContext({
        sessionId: 'abc-123',
        replayRef: { sessionId: 'abc-123', deepLink: 'https://evil.example/inject' },
      });
      expect(ctx.sessionId).toBe('abc-123');
      expect(ctx.replayRef).toEqual({
        sessionId: 'abc-123',
        deepLink: 'https://insights.hanzo.ai/replay/abc-123',
      });
    });

    it('rejects a malformed session id and omits the replay ref', () => {
      const ctx = parseContext({ sessionId: 'not a valid id!' });
      expect(ctx.sessionId).toBeUndefined();
      expect(ctx.replayRef).toBeUndefined();
    });

    it('keeps only route-bearing usage events (cap 8) and truncates long fields', () => {
      const ctx = parseContext({
        route: 'r'.repeat(999),
        domBreadcrumb: 'b'.repeat(999),
        usageTrace: [{ kind: 'load' }, { route: '/', kind: 'load' }, { route: '/dev', kind: 'nav' }],
      });
      expect(ctx.route!.length).toBe(512);
      expect(ctx.domBreadcrumb!.length).toBe(500);
      expect(ctx.usageTrace).toEqual([
        { route: '/', kind: 'load' },
        { route: '/dev', kind: 'nav' },
      ]);
    });

    it('is total on garbage input', () => {
      const ctx = parseContext({ candidateFiles: 'nope', usageTrace: 42, replayRef: null });
      expect(ctx.candidateFiles).toEqual([]);
      expect(ctx.usageTrace).toBeUndefined();
      expect(ctx.replayRef).toBeUndefined();
    });
  });

  describe('pickPath', () => {
    const cands = [{ path: 'app/dev/page.tsx' }, { path: 'app/layout.tsx' }];
    it('prefers a valid explicit path', () => {
      expect(pickPath('docs/x.mdx', cands)).toBe('docs/x.mdx');
    });
    it('falls back to the top valid candidate when path is absent', () => {
      expect(pickPath(undefined, cands)).toBe('app/dev/page.tsx');
    });
    it('falls back when the explicit path is unsafe', () => {
      expect(pickPath('../../secret', cands)).toBe('app/dev/page.tsx');
    });
    it('returns null when nothing is resolvable', () => {
      expect(pickPath('', [])).toBeNull();
    });
  });

  describe('renderContext', () => {
    it('renders a review block with route, ranked files, session and the replay caveat', () => {
      const md = renderContext(
        parseContext({
          route: '/dev',
          appVersion: '1.42.121',
          domBreadcrumb: 'main > section[hero]',
          candidateFiles: [{ path: 'app/dev/page.tsx', score: 0.9, why: 'route → page' }],
          sessionId: 'sess1',
          usageTrace: [{ route: '/', kind: 'load' }, { route: '/dev', kind: 'nav' }],
        }),
      );
      expect(md).toContain('Route: `/dev`');
      expect(md).toContain('App version: `1.42.121`');
      expect(md).toContain('On screen: `main > section[hero]`');
      expect(md).toContain('`app/dev/page.tsx` — route → page');
      expect(md).toContain('https://insights.hanzo.ai/replay/sess1');
      expect(md).toContain('lights up once session-replay ingest is live');
      expect(md).toContain('/ → /dev');
    });

    it('is empty when there is nothing to say', () => {
      expect(renderContext(parseContext({}))).toBe('');
    });
  });
});
