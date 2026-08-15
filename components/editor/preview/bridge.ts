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

import { rewrite } from '@/lib/vendor';


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
  | { type: 'preview:navigate'; path: string }
  | {
      type: 'preview:console';
      level: 'log' | 'info' | 'warn' | 'error' | 'debug';
      text: string;
    };

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

  // The preview's console, forwarded. The dock used to reach in and patch
  // \`frame.contentWindow.console\` from the host; across an opaque origin merely
  // READING a property off that window throws, which took the whole builder down
  // with an Application Error. Patching from inside is both safe and simpler.
  var LEVELS = ['log', 'info', 'warn', 'error', 'debug'];
  for (var li = 0; li < LEVELS.length; li++) {
    (function (level) {
      var original = console[level];
      if (typeof original !== 'function') return;
      console[level] = function () {
        var args = Array.prototype.slice.call(arguments);
        try {
          send({ type: 'preview:console', level: level, text: fmt(args) });
        } catch (e) {}
        original.apply(console, args);
      };
    })(LEVELS[li]);
  }

  function fmt(args) {
    var out = [];
    for (var i = 0; i < args.length; i++) {
      var a = args[i];
      if (typeof a === 'string') { out.push(a); continue; }
      if (a instanceof Error) { out.push(a.stack || (a.name + ': ' + a.message)); continue; }
      try { out.push(JSON.stringify(a)); } catch (e) { out.push(String(a)); }
    }
    return out.join(' ');
  }

  window.addEventListener('error', function (e) {
    send({
      type: 'preview:console',
      level: 'error',
      text: e.message ? e.message + ' (' + (e.filename || '') + ':' + (e.lineno || 0) + ')' : 'Script error'
    });
  });

  window.addEventListener('unhandledrejection', function (e) {
    send({ type: 'preview:console', level: 'error', text: 'Unhandled rejection: ' + String(e.reason) });
  });

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
 * Tell the document where its own files live.
 *
 * A `srcDoc` frame has no address of its own, so every root-relative path in the
 * document — `/assets/index-x.js`, a stylesheet, an image — resolves against the
 * BUILDER's origin, where none of the project's files exist. A deployed Vite
 * build is `<div id="root"></div>` and one script tag, so the whole page renders
 * as blank white and the builder reads as broken rather than as empty.
 *
 * One `<base>` restores the address without touching a byte of the document's
 * own text. It goes FIRST inside `<head>`, because the parser resolves each URL
 * as it reaches it and a base declared after a tag does not apply to that tag.
 *
 * A document that already declares a base has said where it lives, and we do not
 * overrule it. Neither do we invent one: with no `<head>` there is nothing to
 * anchor to, and injecting a base ahead of the doctype would drop the frame into
 * quirks mode — a worse bug than the one being fixed.
 */
export function withBase(html: string, url: string | null | undefined): string {
  if (!html || !url || /<base\b/i.test(html)) return html;
  let origin: string;
  try {
    const u = new URL(url);
    if (u.protocol !== "https:" && u.protocol !== "http:") return html;
    origin = `${u.origin}/`;
  } catch {
    return html;
  }
  return html.replace(/<head(\s[^>]*)?>/i, (head) => `${head}<base href="${origin}">`);
}

/**
 * The contexts in which `<script>` is not a tag.
 *
 * HTML has five elements whose content is RAWTEXT or escapable RAWTEXT: inside
 * one of them a `<` starts no element, and the ONLY thing that ends it is that
 * element's own end tag. A document still streaming from the model ends inside
 * one of these constantly — a half-written `<script>` is the common case.
 */
const RAWTEXT = ['script', 'style', 'textarea', 'title'] as const

/**
 * Close whatever the streamed document left open, so an appended tag is a tag.
 *
 * THIS IS THE BUG THE USER SAW. `withBridge` appends `<script>…</script>`, and
 * when the stream ended inside the model's own `<script>`, our opening tag was
 * text, our `</script>` closed THEIR script, and every line of the bridge after
 * it — `xpathFor`, `infoFor`, the `preview:console` forwarder — was parsed as
 * BODY TEXT and painted, in order, over the app being built. It reads as the
 * preview dumping its own source, which is exactly what it was doing.
 *
 * A comment is the same shape and is closed the same way. Neither repair
 * changes a finished document: a balanced one has nothing open to close.
 */
function seal(html: string): string {
  let out = html

  // A HALF-WRITTEN TAG FIRST, because the two repairs below both read tags and
  // a tag that has not been closed is not one yet. A stream that stopped at
  // `<div class="ca` leaves the tokenizer inside an attribute VALUE: it consumes
  // until the next quote, so the bridge's first `"` ends the attribute and the
  // rest of its source becomes attributes and then text. Close the quote if one
  // is open, then close the tag.
  const lt = out.lastIndexOf('<')
  if (lt !== -1 && out.indexOf('>', lt) === -1) {
    const frag = out.slice(lt)
    for (const q of ['"', "'"]) if ((frag.split(q).length - 1) % 2 === 1) out += q
    out += '>'
  }

  // An unterminated comment swallows every tag after it, ours included.
  const open = out.lastIndexOf('<!--')
  if (open !== -1 && out.indexOf('-->', open) === -1) out += '-->'

  for (const tag of RAWTEXT) {
    const starts = (out.match(new RegExp(`<${tag}[\\s>]`, 'gi')) || []).length
    const ends = (out.match(new RegExp(`</${tag}\\s*>`, 'gi')) || []).length
    for (let i = ends; i < starts; i++) out += `</${tag}>`
  }
  return out
}

/**
 * Put the bridge into a document that is about to be shown.
 *
 * Appended rather than prepended: a `srcDoc` is often mid-stream from the model
 * and its `<head>` may not exist yet, while appending is valid against a partial
 * document and the browser still runs the script.
 *
 * `siteUrl` is the project's own public address when it has one. It is optional
 * because most of a build's life is spent before there is anything deployed to
 * point at, and a document that inlines everything needs no base at all.
 */
export function withBridge(html: string, siteUrl?: string | null): string {
  if (!html) return html;
  // Point any library URL at our own copy on the way in. Projects saved before
  // we hosted these name `cdn.tailwindcss.com` and friends literally, and this
  // frame inherits the page's CSP — which no longer allows them — so without
  // this every site built before today would preview as unstyled markup, having
  // rendered correctly the day before. `rewrite` is idempotent, so a document
  // already pointing at us passes through untouched.
  return `${seal(withBase(rewrite(html), siteUrl))}<style>${BRIDGE_STYLES}</style><script>${BRIDGE_SCRIPT}</script>`;
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
