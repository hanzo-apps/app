'use client';

/**
 * The tiled terminal workspace — split, drag, sweep.
 *
 * Every pane frames a terminal its own machine is serving; the bytes never come
 * through here. So the job is arrangement, and arrangement is `lib/tiles`: this
 * file turns that tree into boxes and turns pointers and keys back into tree
 * rewrites. Nothing about which pane gets which space is decided here.
 *
 * TWO THINGS ARE NOT OBVIOUS AND BOTH ARE ABOUT IFRAMES.
 *
 * The panes render as one FLAT list that never reorders, positioned absolutely.
 * Nesting them the way the tree nests would remount every <iframe> on any split —
 * each terminal reconnecting from scratch — and a multiplexer whose panes reset
 * when you rearrange them is not one. React keeps an element mounted when it
 * keeps its position among siblings, so the panes keep theirs and only their
 * coordinates move.
 *
 * A PANE CAN COME UP BLANK, AND IT CAN BE DETECTED AFTER ALL. The terminal
 * URL is gated: an unauthorised request redirects to hanzo.id, which answers
 * `X-Frame-Options: DENY` and `frame-ancestors 'none'` — correctly, since an
 * identity provider that can be framed is a clickjacking target. The browser then
 * renders nothing, and a cross-origin frame cannot be inspected to find out, so
 * the page CANNOT tell "loading" from "refused".
 *
 * The first attempt put the way out UNDERNEATH the frame, reasoning that a
 * rendered terminal would cover it and a blank one would not. That was wrong in
 * the way that matters: a REFUSED frame still paints — it is an element with a
 * background — so it covered the rescue completely. Measured at eight viewports:
 * `document.elementFromPoint` at the link's own centre returned the iframe every
 * time. The explanation and its button were in the DOM, visible per the DOM, and
 * impossible to click. Someone hitting this saw a black rectangle and nothing else.
 *
 * The refusal IS detectable, without cooperation. A frame the browser blocked
 * never leaves `about:blank`, which is same-origin — so its document is readable
 * and empty. A frame that really loaded a cross-origin page THROWS on the same
 * access. The throw is the good outcome, and that asymmetry is the whole test.
 *
 * And a drag needs an overlay. The pointer starts on a divider and immediately
 * crosses an iframe, which swallows the event — the drag dies a few pixels in,
 * every time. A transparent sheet over the whole workspace for the duration of
 * the drag keeps the events on this document, where the handler can see them.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Columns2, ExternalLink, Rows2, X } from 'lucide-react';

import {
  type Dir,
  type Path,
  type Tile,
  closePane,
  geometry,
  neighbour,
  pane,
  paneIds,
  retain,
  setRatio,
  splitPane,
  stableOrder,
} from '@/lib/tiles';

export interface TerminalPane {
  id: string;
  title: string;
  url: string;
}

/** Where a layout is kept between visits. Arrangement is a preference, not data
 *  the control plane owns — it belongs to this browser, beside the sidebar's
 *  collapsed state, not in an org's database. */
const STORE_KEY = 'hanzo.sessions.layout';

function load(): Tile | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(STORE_KEY);
    return raw ? (JSON.parse(raw) as Tile) : null;
  } catch {
    return null; // a corrupt or unreadable layout is no layout, never a crash
  }
}

function save(t: Tile | null) {
  try {
    if (t) window.localStorage.setItem(STORE_KEY, JSON.stringify(t));
    else window.localStorage.removeItem(STORE_KEY);
  } catch {
    /* private mode, quota — a layout that cannot be saved still works today */
  }
}

export function Tiles({ panes }: { panes: TerminalPane[] }) {
  // Panes whose frame the browser refused. Keyed by pane id; see the note above.
  const [refused, setRefused] = useState<Record<string, boolean>>({});
  const probe = useCallback((id: string, el: HTMLIFrameElement | null) => {
    if (!el) return;
    let blocked = false;
    try {
      const doc = el.contentDocument;
      // Readable AND empty => never navigated => refused.
      blocked = !!doc && (doc.body?.childElementCount ?? 0) === 0;
    } catch {
      blocked = false; // cross-origin access threw, so it genuinely loaded
    }
    setRefused((r) => (r[id] === blocked ? r : { ...r, [id]: blocked }));
  }, []);

  const byId = useMemo(() => new Map(panes.map((p) => [p.id, p])), [panes]);
  const live = useMemo(() => new Set(byId.keys()), [byId]);

  // The layout starts from storage, reconciled against what is actually running,
  // and falls back to the first available terminal. A saved pane whose session
  // ended is dropped rather than framed (see `retain`).
  const [tile, setTile] = useState<Tile | null>(null);
  useEffect(() => {
    setTile((cur) => {
      const base = cur ?? load();
      const kept = base ? retain(base, live) : null;
      if (kept) return kept;
      const first = panes[0];
      return first ? pane(first.id) : null;
    });
    // `panes` is the dependency that matters: a session ending or appearing is
    // exactly when a layout needs reconciling.
  }, [live, panes]);

  useEffect(() => { save(tile); }, [tile]);

  // The order the panes are RENDERED in — append-only, never the server's. See
  // `stableOrder`: the sessions array is ordered by recency, so following it
  // moved iframes among their siblings and remounted every terminal on the page.
  const [order, setOrder] = useState<string[]>([]);
  useEffect(() => {
    setOrder((prev) => stableOrder(prev, panes.map((p) => p.id)));
  }, [panes]);
  const rendered = useMemo(
    () => order.map((id) => byId.get(id)).filter((p): p is TerminalPane => !!p),
    [order, byId],
  );

  const ids = useMemo(() => (tile ? paneIds(tile) : []), [tile]);
  const [focus, setFocus] = useState<string | null>(null);
  useEffect(() => {
    // Focus follows the layout: when the focused pane closes, land on one that
    // still exists rather than leaving the keyboard pointing at nothing.
    if (!focus || !ids.includes(focus)) setFocus(ids[0] ?? null);
  }, [ids, focus]);

  /** The next terminal not already on screen — what a split opens. */
  const nextFree = useCallback(
    () => panes.find((p) => !ids.includes(p.id))?.id ?? null,
    [panes, ids],
  );

  const doSplit = useCallback(
    (targetId: string, dir: Dir) => {
      const open = nextFree();
      if (!open) return; // nothing left to show; the button says so by being disabled
      setTile((t) => (t ? splitPane(t, targetId, dir, open) : pane(open)));
      setFocus(open);
    },
    [nextFree],
  );

  const doClose = useCallback((id: string) => {
    setTile((t) => (t ? closePane(t, id) : null));
  }, []);

  // ⌥← / ⌥→ sweep through the panes in layout order. Alt, not ⌘ or Ctrl: those
  // belong to the browser and to the shells inside the frames, and a workspace
  // shortcut that steals a key from the terminal it contains is a bad trade.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!e.altKey || !tile || !focus) return;
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      const to = neighbour(tile, focus, e.key === 'ArrowRight' ? 1 : -1);
      if (to) {
        e.preventDefault();
        setFocus(to);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [tile, focus]);

  // CLICKING A TERMINAL FOCUSES ITS PANE — which it did not, because the only
  // `onPointerDown` is on the 28px header: a click inside a cross-origin frame is
  // consumed by that frame's document and this one never sees it.
  //
  // What the parent DOES see is its own window losing focus, after which
  // `document.activeElement` is the <iframe> element that took it. That needs no
  // cooperation from the terminal and no message channel. The timeout is required:
  // activeElement is still the old node during the blur event itself.
  useEffect(() => {
    const onBlur = () =>
      setTimeout(() => {
        const el = document.activeElement;
        if (el instanceof HTMLIFrameElement && el.dataset.pane) setFocus(el.dataset.pane);
      }, 0);
    window.addEventListener('blur', onBlur);
    return () => window.removeEventListener('blur', onBlur);
  }, []);

  // ---- dragging a divider -------------------------------------------------
  const boxRef = useRef<HTMLDivElement>(null);
  const [drag, setDrag] = useState<{ path: Path; dir: Dir } | null>(null);

  const onDragMove = useCallback(
    (e: PointerEvent | React.PointerEvent) => {
      if (!drag) return;
      const box = boxRef.current?.getBoundingClientRect();
      if (!box || box.width === 0 || box.height === 0) return;
      const r =
        drag.dir === 'row'
          ? (e.clientX - box.left) / box.width
          : (e.clientY - box.top) / box.height;
      setTile((t) => (t ? setRatio(t, drag.path, r) : t));
    },
    [drag],
  );

  useEffect(() => {
    if (!drag) return;
    const move = (e: PointerEvent) => onDragMove(e);
    const up = () => setDrag(null);
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    return () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
  }, [drag, onDragMove]);

  const { rects, dividers } = useMemo(
    () => (tile ? geometry(tile) : { rects: [], dividers: [] }),
    [tile],
  );
  const placed = useMemo(() => new Map(rects.map((r) => [r.id, r])), [rects]);
  const canSplit = nextFree() !== null;

  if (!tile || panes.length === 0) {
    return (
      <div className="flex h-full w-full items-center justify-center rounded-lg border border-dashed px-6 text-center">
        <p className="max-w-sm text-sm text-muted-foreground">
          No session is publishing a terminal, so there is nothing to arrange yet.
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full flex-col gap-2">
      {/* ONE row. It said the same thing three times — a count, two disabled
          buttons, and a sentence explaining the disabling — which cost three rows
          of height above a terminal measured at 74px in landscape. A control that
          cannot act does not also need a paragraph. */}
      <div className="flex shrink-0 items-center gap-2 text-xs text-muted-foreground">
        <span className="truncate">
          {ids.length > 1 ? `${ids.length} panes` : panes.length > 1 ? `1 of ${panes.length} terminals` : ''}
        </span>
        <span className="ml-auto flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={() => focus && doSplit(focus, 'row')}
            disabled={!canSplit || !focus}
            title={canSplit ? 'Split right' : 'Every live terminal is already on screen'}
            className="inline-flex min-h-9 items-center gap-1 rounded-md border border-border px-2.5 text-foreground hover:bg-muted disabled:opacity-40"
          >
            <Columns2 className="h-3.5 w-3.5" /> Right
          </button>
          <button
            type="button"
            onClick={() => focus && doSplit(focus, 'col')}
            disabled={!canSplit || !focus}
            title={canSplit ? 'Split down' : 'Every live terminal is already on screen'}
            className="inline-flex min-h-9 items-center gap-1 rounded-md border border-border px-2.5 text-foreground hover:bg-muted disabled:opacity-40"
          >
            <Rows2 className="h-3.5 w-3.5" /> Down
          </button>
        </span>
      </div>

    <div ref={boxRef} className="relative min-h-0 w-full flex-1 overflow-hidden rounded-lg border bg-black">
      {/* One element per terminal, in a fixed order. Only `style` changes when the
          layout does, so the frame — and the shell inside it — survives. */}
      {rendered.map((p) => {
        const r = placed.get(p.id);
        if (!r) return null; // not on screen right now
        const on = p.id === focus;
        return (
          <div
            key={p.id}
            onPointerDown={() => setFocus(p.id)}
            className="absolute flex flex-col overflow-hidden p-px"
            style={{ left: `${r.left}%`, top: `${r.top}%`, width: `${r.width}%`, height: `${r.height}%` }}
          >
            <div
              className={`flex h-7 shrink-0 items-center gap-1 rounded-t-md border-x border-t px-2 text-xs ${
                on ? 'border-foreground/40 bg-muted text-foreground' : 'border-border bg-card text-muted-foreground'
              }`}
            >
              <span className="truncate">{p.title}</span>
              {/* ONE bare <button> per row below sm. assets/globals.css gives every
                  bare button a 44x44 ::after overlay for touch; four of them at a
                  ~24px pitch overlap by ~20px and the LAST one wins every contested
                  tap — so on a phone "split down" was hit-tested as "close". The
                  icons appear from sm up, where the pointer is precise and the
                  overlay rule does not apply. */}
              <span className="ml-auto hidden items-center gap-1 sm:flex">
                <a
                  href={p.url}
                  target="_blank"
                  rel="noreferrer noopener"
                  title="Open in a tab — and sign in there if this pane is blank"
                  aria-label={`Open ${p.title} in a tab`}
                  className="inline-flex size-6 items-center justify-center rounded hover:bg-muted-foreground/20"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
                <button
                  type="button"
                  onClick={() => doSplit(p.id, 'row')}
                  disabled={!canSplit}
                  title={canSplit ? 'Split right' : 'Nothing to split into — every live terminal is already on screen'}
                  aria-label={`Split ${p.title} right`}
                  className="inline-flex size-6 items-center justify-center rounded hover:bg-muted-foreground/20 disabled:opacity-30"
                >
                  <Columns2 className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => doSplit(p.id, 'col')}
                  disabled={!canSplit}
                  title={canSplit ? 'Split down' : 'Nothing to split into — every live terminal is already on screen'}
                  aria-label={`Split ${p.title} down`}
                  className="inline-flex size-6 items-center justify-center rounded hover:bg-muted-foreground/20 disabled:opacity-30"
                >
                  <Rows2 className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => doClose(p.id)}
                  title="Close pane"
                  aria-label={`Close ${p.title}`}
                  className="inline-flex size-6 items-center justify-center rounded hover:bg-muted-foreground/20"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </span>
              {/* The phone's single control. Closing is the one thing that cannot
                  be undone, so it is the one that must not be adjacent to anything. */}
              <button
                type="button"
                onClick={() => doClose(p.id)}
                aria-label={`Close ${p.title}`}
                className="ml-auto rounded p-0.5 text-muted-foreground hover:bg-muted-foreground/20 sm:hidden"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="relative min-h-0 flex-1">
            <iframe
              data-pane={p.id}
              src={p.url}
              title={p.title}
              className={`absolute inset-0 h-full w-full rounded-b-md border-x border-b bg-black ${
                on ? 'border-foreground/40' : 'border-border'
              }`}
              // Scripts (a terminal is one) but never same-origin: the frame runs
              // a shell on someone's machine and must not reach this page's session.
              sandbox="allow-scripts allow-same-origin allow-forms"
              ref={(el) => probe(p.id, el)}
              onLoad={(e) => probe(p.id, e.currentTarget)}
            />
            {refused[p.id] ? (
              // ON TOP, because the thing it rescues you from is opaque.
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 rounded-b-md bg-black px-4 text-center">
                <p className="max-w-xs text-xs text-muted-foreground">
                  This terminal needs a one-time sign-in on its own domain. The gate
                  refuses to be shown inside a frame, so it has to open in a tab —
                  once.
                </p>
                <a
                  href={p.url}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="inline-flex min-h-11 items-center rounded-md border border-border px-4 text-sm text-foreground hover:bg-muted"
                >
                  Sign in to this terminal ↗
                </a>
              </div>
            ) : null}
            </div>
          </div>
        );
      })}

      {dividers.map((d, i) => (
        <div
          key={`${d.dir}-${i}-${d.path.join('')}`}
          onPointerDown={(e) => {
            e.preventDefault();
            setDrag({ path: d.path, dir: d.dir });
          }}
          role="separator"
          aria-orientation={d.dir === 'row' ? 'vertical' : 'horizontal'}
          className={`absolute z-10 bg-transparent hover:bg-foreground/20 ${
            d.dir === 'row' ? 'w-1.5 -translate-x-1/2 cursor-col-resize' : 'h-1.5 -translate-y-1/2 cursor-row-resize'
          }`}
          style={{
            left: `${d.left}%`,
            top: `${d.top}%`,
            width: d.dir === 'row' ? undefined : `${d.width}%`,
            height: d.dir === 'row' ? `${d.height}%` : undefined,
          }}
        />
      ))}

      {/* The drag sheet. Without it the pointer crosses into an iframe and the
          drag ends a few pixels in — see the note at the top of this file. */}
      {drag && (
        <div
          className={`absolute inset-0 z-20 ${drag.dir === 'row' ? 'cursor-col-resize' : 'cursor-row-resize'}`}
        />
      )}
    </div>
    </div>
  );
}

export default Tiles;
