/**
 * The preview bridge — everything the editor needs from a previewed document,
 * expressed as messages instead of as reaching into its DOM.
 *
 * The point is that the frame can then be sandboxed WITHOUT `allow-same-origin`.
 * Today it has that flag, so generated, imported and forked HTML runs on this
 * origin and can read the IAM refresh token out of `localStorage`. Dropping the
 * flag nulls `contentDocument`, which is how the editor currently does hover,
 * click-to-select, theming and live style/text edits — so those have to travel
 * some other way first. This file is that way.
 *
 * Two halves, one protocol:
 *
 *   host  -> frame   FrameCommand   editable, style, text, theme, highlight
 *   frame -> host    FrameEvent     ready, hover, select, navigate
 *
 * The identity of an element crosses as a CSS SELECTOR, never as a node.
 * `SelectedElementInfo` already carried `selector` and `xpath`; what could not
 * cross was `element: HTMLElement` and `styles: CSSStyleDeclaration`, both live
 * references into the other document. `styles` becomes a plain snapshot of the
 * properties the panel actually shows.
 */

/** A serialisable stand-in for the node the editor used to hold. */
export interface ElementInfo {
  selector: string;
  xpath: string;
  tagName: string;
  id?: string;
  className?: string;
  text?: string;
  /** A snapshot, not the live CSSStyleDeclaration — that cannot cross a frame. */
  styles: Record<string, string>;
  /** The element's own markup, which is what the composer hands the model when
   *  you ask it to change "this". Capped: a selected <body> would otherwise put
   *  the entire document into a postMessage and then into a prompt. */
  html: string;
}

export type FrameEvent =
  | { type: 'preview:ready' }
  | {
      type: 'preview:hover';
      selector: string | null;
      /** Viewport-relative inside the FRAME. The host draws its hover overlay
       *  from this — it used to call getBoundingClientRect() on the node itself,
       *  which is the one thing that cannot cross an origin. */
      rect?: { top: number; left: number; width: number; height: number };
      tagName?: string;
    }
  | { type: 'preview:select'; info: ElementInfo }
  | { type: 'preview:navigate'; path: string };

export type FrameCommand =
  | { type: 'preview:editable'; active: boolean }
  | { type: 'preview:style'; selector: string; property: string; value: string }
  | { type: 'preview:text'; selector: string; text: string }
  | { type: 'preview:theme'; mode: 'light' | 'dark' | 'auto' }
  | { type: 'preview:highlight'; selector: string | null }
  | { type: 'preview:scroll'; align: 'start' | 'end'; smooth: boolean };

/** The style properties the editor panel reads. Snapshotting all ~340 computed
 *  properties per hover would put a kilobyte on every mouse move. */
export const TRACKED_STYLES = [
  'color',
  'backgroundColor',
  'fontSize',
  'fontWeight',
  'fontFamily',
  'textAlign',
  'padding',
  'margin',
  'borderRadius',
  'display',
  'width',
  'height',
] as const;

/**
 * The script that runs INSIDE the previewed document.
 *
 * Returned as source text because it is injected into `srcDoc` — it cannot be
 * imported, since after the sandbox change the frame shares no realm with this
 * module. It is written as a single self-contained IIFE with no build-time
 * dependencies for the same reason.
 *
 * It is also the reason this is a string rather than a function passed through
 * `toString()`: a bundler is free to rename identifiers inside a function body,
 * and a renamed `window.parent` reference would fail silently in the frame where
 * nothing can report it.
 */
export const BRIDGE_SCRIPT = `
(function () {
  if (window.__hanzoPreviewBridge) return;
  window.__hanzoPreviewBridge = true;

  var TRACKED = ${JSON.stringify(TRACKED_STYLES)};
  var editable = false;
  var hovered = null;

  function send(msg) {
    // '*' is correct and not lax: after the sandbox change this document has an
    // opaque origin, so it cannot name the host's origin, and the host
    // authenticates by event.source instead.
    try { window.parent.postMessage(msg, '*'); } catch (e) {}
  }

  // A selector stable enough to find the node again from the host. #id when
  // unique, else nth-of-type down from the body, which survives the class
  // churn that live editing causes.
  function selectorFor(el) {
    if (!el || el === document.body || el === document.documentElement) return 'body';
    if (el.id && document.querySelectorAll('#' + CSS.escape(el.id)).length === 1) {
      return '#' + CSS.escape(el.id);
    }
    var parts = [];
    var node = el;
    while (node && node !== document.body && node.nodeType === 1) {
      var tag = node.tagName.toLowerCase();
      var parent = node.parentNode;
      if (!parent) break;
      var same = [];
      for (var i = 0; i < parent.children.length; i++) {
        if (parent.children[i].tagName === node.tagName) same.push(parent.children[i]);
      }
      parts.unshift(same.length > 1 ? tag + ':nth-of-type(' + (same.indexOf(node) + 1) + ')' : tag);
      node = parent;
    }
    return 'body' + (parts.length ? ' > ' + parts.join(' > ') : '');
  }

  function xpathFor(el) {
    var parts = [];
    var node = el;
    while (node && node.nodeType === 1 && node !== document.documentElement) {
      var parent = node.parentNode;
      if (!parent) break;
      var idx = 1;
      for (var i = 0; i < parent.children.length; i++) {
        if (parent.children[i] === node) break;
        if (parent.children[i].tagName === node.tagName) idx++;
      }
      parts.unshift(node.tagName.toLowerCase() + '[' + idx + ']');
      node = parent;
    }
    return '/' + parts.join('/');
  }

  function infoFor(el) {
    var cs = window.getComputedStyle(el);
    var styles = {};
    for (var i = 0; i < TRACKED.length; i++) styles[TRACKED[i]] = cs[TRACKED[i]];
    return {
      selector: selectorFor(el),
      xpath: xpathFor(el),
      tagName: el.tagName.toLowerCase(),
      id: el.id || undefined,
      className: typeof el.className === 'string' ? el.className : undefined,
      text: (el.textContent || '').slice(0, 200),
      styles: styles,
      html: (el.outerHTML || '').slice(0, 8000)
    };
  }

  function find(selector) {
    if (!selector) return null;
    try { return document.querySelector(selector); } catch (e) { return null; }
  }

  document.addEventListener('mouseover', function (e) {
    if (!editable) return;
    var t = e.target;
    if (!t || t === document.body || t === hovered) return;
    if (hovered) hovered.classList.remove('hovered-element');
    hovered = t;
    t.classList.add('hovered-element');
    var r = t.getBoundingClientRect();
    send({
      type: 'preview:hover',
      selector: selectorFor(t),
      rect: { top: r.top, left: r.left, width: r.width, height: r.height },
      tagName: t.tagName.toLowerCase()
    });
  }, true);

  document.addEventListener('mouseout', function () {
    if (!editable) return;
    if (hovered) hovered.classList.remove('hovered-element');
    hovered = null;
    send({ type: 'preview:hover', selector: null });
  }, true);

  document.addEventListener('click', function (e) {
    var anchor = e.target && e.target.closest ? e.target.closest('a[href]') : null;

    // Editing wins over navigation: in editable mode a click on a link is a
    // selection, not a page load that would throw the edit away.
    if (editable) {
      var t = e.target;
      if (!t || t === document.body) return;
      e.preventDefault();
      e.stopPropagation();
      send({ type: 'preview:select', info: infoFor(t) });
      return;
    }

    if (!anchor) return;
    var href = anchor.getAttribute('href') || '';
    if (!href || href.charAt(0) === '#') return;
    if (/^[a-z]+:/i.test(href) || href.indexOf('//') === 0) return; // external: let it be
    e.preventDefault();
    send({ type: 'preview:navigate', path: href });
  }, true);

  window.addEventListener('message', function (e) {
    // Commands come from the embedder and nowhere else. A sandboxed document
    // cannot compare origins usefully, so compare the window.
    if (e.source !== window.parent) return;
    var m = e.data;
    if (!m || typeof m !== 'object') return;

    if (m.type === 'preview:editable') {
      editable = !!m.active;
      if (!editable && hovered) { hovered.classList.remove('hovered-element'); hovered = null; }
      return;
    }
    if (m.type === 'preview:style') {
      var el = find(m.selector);
      if (el) el.style[m.property] = m.value;
      return;
    }
    if (m.type === 'preview:text') {
      var te = find(m.selector);
      if (te) te.textContent = m.text;
      return;
    }
    if (m.type === 'preview:theme') {
      var root = document.documentElement;
      if (m.mode === 'auto') {
        root.style.removeProperty('color-scheme');
        root.removeAttribute('data-theme');
      } else {
        root.style.colorScheme = m.mode;
        root.setAttribute('data-theme', m.mode);
      }
      return;
    }
    if (m.type === 'preview:scroll') {
      if (document.body) {
        document.body.scrollIntoView({
          block: m.align, inline: 'nearest', behavior: m.smooth ? 'smooth' : 'instant'
        });
      }
      return;
    }
    if (m.type === 'preview:highlight') {
      var prev = document.querySelector('.visual-editor-selected');
      if (prev) prev.classList.remove('visual-editor-selected');
      var next = find(m.selector);
      if (next) next.classList.add('visual-editor-selected');
      return;
    }
  });

  send({ type: 'preview:ready' });
})();
`;

/** The editor's own chrome, injected with the bridge — it used to be written
 *  into the frame from the host through `contentDocument`. */
export const BRIDGE_STYLES = `
.hovered-element { outline: 1px dashed rgba(120,120,120,.9) !important; outline-offset: 1px !important; }
.visual-editor-selected { outline: 2px solid #ffffff !important; outline-offset: 2px !important; }
`;

/**
 * Put the bridge into a document that is about to be shown.
 *
 * Appended rather than prepended: a `srcDoc` is often mid-stream from the model
 * and its `<head>` may not exist yet, while appending is valid against a partial
 * document and the browser still runs the script.
 */
export function withBridge(html: string): string {
  if (!html) return html;
  return `${html}<style>${BRIDGE_STYLES}</style><script>${BRIDGE_SCRIPT}</script>`;
}

/** True when a message is from our own frame and speaks this protocol. */
export function isFrameEvent(e: MessageEvent, frame: HTMLIFrameElement | null): e is MessageEvent<FrameEvent> {
  if (!frame || e.source !== frame.contentWindow) return false;
  const d = e.data as { type?: unknown } | null;
  return !!d && typeof d === 'object' && typeof d.type === 'string' && d.type.startsWith('preview:');
}

/** Send a command to a frame, if it is there. */
export function command(frame: HTMLIFrameElement | null, msg: FrameCommand): void {
  frame?.contentWindow?.postMessage(msg, '*');
}
