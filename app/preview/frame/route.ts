import { NextResponse } from 'next/server';
import { PREVIEW_HOST } from '@/lib/security/middleware';

/**
 * The document a generated app paints inside.
 *
 * It is served from `preview.hanzo.app` and nowhere else, because the ORIGIN is
 * the whole point: a frame that loads a URL carries the policy of the response
 * it loaded, while an `about:srcdoc` frame inherits its parent's. Inheriting is
 * what refused every third-party API, CDN, video and embed a generated app
 * asked for, and what could only have been fixed by loosening hanzo.app itself.
 *
 * The shell takes the document over `postMessage` rather than by upload. The
 * builder streams HTML token by token, so a round-trip per update would put the
 * network between a keystroke and the paint; and a draft nobody has published
 * has no address to be fetched from anyway.
 *
 * `document.open()` replaces the DOCUMENT and keeps the WINDOW, so the listener
 * registered here survives every write and is ready for the next one. That is
 * the property that makes one shell serve a whole streaming session.
 */
const SHELL = `<!doctype html>
<meta charset="utf-8">
<title>preview</title>
<style>html,body{margin:0;height:100%;background:#0a0a0a}</style>
<script>
(function () {
  // The builder is the only writer, and this frame is opaque-origin, so it can
  // do nothing with the message but paint it.
  addEventListener('message', function (e) {
    var m = e.data;
    if (!m || m.type !== 'preview:doc' || typeof m.html !== 'string') return;
    document.open();
    document.write(m.html);
    document.close();
    // Closing the document does NOT refire the frame's load event -- measured
    // against this shell from hanzo.app: one load for the shell itself and none
    // for any document written after it. The builder crossfades its two buffers
    // on that event, so the shell has to say when it has painted, or the preview
    // streams and never swaps.
    try { parent.postMessage({ type: 'preview:painted' }, '*'); } catch (_) {}
  });
  // The host cannot know when this document is ready to be written into, and a
  // write that lands first is simply lost — so the shell says so.
  try { parent.postMessage({ type: 'preview:shell' }, '*'); } catch (_) {}
})();
</script>`;

export async function GET(request: Request): Promise<NextResponse> {
  // Served on the preview origin ONLY. On hanzo.app this document would inherit
  // nothing useful and would sit inside the policy it exists to escape, so
  // answering there would be a second, broken way to do the same thing.
  const host = (request.headers.get('host') ?? '').split(':')[0];
  if (host !== PREVIEW_HOST) {
    return new NextResponse('preview shell is served from the preview origin', { status: 404 });
  }
  return new NextResponse(SHELL, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      // A shell that is cached is a shell that cannot be fixed.
      'Cache-Control': 'no-store',
    },
  });
}
