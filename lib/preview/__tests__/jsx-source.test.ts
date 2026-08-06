/**
 * Visual select is only as precise as the source locations the preview bundle
 * carries. Three things have to hold, and each has silently regressed before:
 *
 *   1. `jsxDev` is on — esbuild drops the location entirely without it.
 *   2. The JSX runtime is the shim, not the CDN package directly — otherwise
 *      the location reaches `jsxDEV()` and dies there, because React 19
 *      removed `_debugSource` from the fiber.
 *   3. `absWorkingDir` is '/' — or `fileName` comes out relativized against
 *      whatever cwd the bundler happened to run in.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const source = readFileSync(join(__dirname, '..', 'esbuild-bundler.ts'), 'utf8');

describe('preview JSX source annotation', () => {
  it('turns on esbuild jsxDev so locations survive the transform', () => {
    expect(source).toMatch(/jsxOptions\.jsxDev\s*=\s*true/);
  });

  it('routes JSX through the shim rather than straight at the CDN runtime', () => {
    // The bug this catches: `jsxImportSource = ${cdnBase}/${importSource}`,
    // which bypasses the shim and loses the stamp on React 19.
    expect(source).toMatch(/jsxOptions\.jsxImportSource\s*=\s*JSX_SHIM/);
    expect(source).toMatch(/plugins\.unshift\(createJsxSourcePlugin\(/);
  });

  it('anchors the build at the VFS root so fileName is not cwd-relative', () => {
    expect(source).toMatch(/absWorkingDir:\s*'\/'/);
  });

  it("stamps the same data-at attribute the gui compiler emits", () => {
    // One contract for click-to-edit across gui, React and Preact previews —
    // not one attribute per framework.
    expect(source).toContain("'data-at'");
    expect(source).toMatch(/typeof type === 'string'/);
  });
});
