import { stripPreviewScripts } from '../strip-preview-scripts';

describe('stripPreviewScripts', () => {
  // Mirrors the shape VirtualServer.processHTML injects: a <script> that opens
  // with the "// VFS Asset Interceptor" marker comment.
  const interceptor = `<script>
// VFS Asset Interceptor - Auto-injected by Hanzo App
(function() {
  const vfsBlobUrls = {"/logo.png":"blob:x/1"};
  function resolveVfsUrl(url) { return vfsBlobUrls[url] || url; }
})();
</script>`;

  it('removes the injected VFS Asset Interceptor from exported HTML', () => {
    const html = `<!DOCTYPE html><html><head>${interceptor}\n</head><body><h1>Hi</h1></body></html>`;
    const out = stripPreviewScripts(html);
    expect(out).not.toContain('VFS Asset Interceptor');
    expect(out).not.toContain('resolveVfsUrl');
    expect(out).toContain('<h1>Hi</h1>');
  });

  it('preserves author scripts that are not preview instrumentation', () => {
    const authorScript = '<script>console.log("app code");</script>';
    const html = `<html><head>${interceptor}</head><body>${authorScript}</body></html>`;
    const out = stripPreviewScripts(html);
    expect(out).toContain(authorScript);
    expect(out).not.toContain('VFS Asset Interceptor');
  });

  it('leaves HTML without instrumentation unchanged', () => {
    const html = '<html><head></head><body><p>plain</p></body></html>';
    expect(stripPreviewScripts(html)).toBe(html);
  });
});
