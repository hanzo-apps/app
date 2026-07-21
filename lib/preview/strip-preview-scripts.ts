/**
 * Remove live-preview-only instrumentation from compiled HTML.
 *
 * VirtualServer.processHTML() injects the VFS Asset Interceptor script (and, if
 * present, a Console Capture bridge) into every compiled page so the live
 * preview iframe can serve assets from memory and forward console output to the
 * host. That instrumentation is only meaningful inside the preview — exported
 * or published output must not carry it (it references blob URLs from the
 * exporting machine, wastes bytes, and confuses the model into thinking the
 * project owns that code).
 */
export function stripPreviewScripts(html: string): string {
  const vfsRegex = /<script>\s*\/\/ VFS Asset Interceptor[\s\S]*?<\/script>\s*/;
  html = html.replace(vfsRegex, '');

  const consoleRegex = /<script>\s*\/\/ Console Capture[\s\S]*?<\/script>\s*/;
  html = html.replace(consoleRegex, '');

  return html;
}
