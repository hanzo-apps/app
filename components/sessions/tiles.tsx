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
 * A PANE CAN COME UP BLANK, AND THAT IS NOT A BUG WE CAN CATCH. The terminal
 * URL is gated: an unauthorised request redirects to hanzo.id, which answers
 * `X-Frame-Options: DENY` and `frame-ancestors 'none'` — correctly, since an
 * identity provider that can be framed is a clickjacking target. The browser then
 * renders nothing, and a cross-origin frame cannot be inspected to find out, so
 * the page CANNOT tell "loading" from "refused".
 *
 * What it can do is stop leaving people staring at black. Every pane carries the
 * way out — open this terminal in a tab, sign in there once, and the frame works
 * from then on — rather than an explanation that only appears once someone
 * complains.
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
      {/* The controls, where they can be found. The per-pane icons are for the
          pane you are pointing at; this acts on the focused one and, more
          importantly, SAYS what the workspace can currently do — with one live
          terminal there is nothing to split into, and a disabled icon with no
          words reads as broken rather than as finished. */}
      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <span className="tabular-nums">
          {ids.length} of {panes.length} terminal{panes.length === 1 ? '' : 's'} on screen
        </span>
        <span className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => focus && doSplit(focus, 'row')}
            disabled={!canSplit || !focus}
            className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-foreground hover:bg-muted disabled:opacity-40"
          >
            <Columns2 className="h-3.5 w-3.5" /> Split right
          </button>
          <button
            type="button"
            onClick={() => focus && doSplit(focus, 'col')}
            disabled={!canSplit || !focus}
            className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-foreground hover:bg-muted disabled:opacity-40"
          >
            <Rows2 className="h-3.5 w-3.5" /> Split down
          </button>
        </span>
        <span>
          {canSplit
            ? 'Drag a divider to resize · ⌥← ⌥→ to move between panes'
            : 'Every live terminal is already on screen — link another machine to tile more'}
        </span>
      </div>

    <div ref={boxRef} className="relative min-h-0 w-full flex-1 overflow-hidden rounded-lg border bg-black">
      {/* One element per terminal, in a fixed order. Only `style` changes when the
          layout does, so the frame — and the shell inside it — survives. */}
      {panes.map((p) => {
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
              <span className="ml-auto flex items-center gap-0.5">
                <a
                  href={p.url}
                  target="_blank"
                  rel="noreferrer noopener"
                  title="Open in a tab — and sign in there if this pane is blank"
                  aria-label={`Open ${p.title} in a tab`}
                  className="rounded p-0.5 hover:bg-muted-foreground/20"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
                <button
                  type="button"
                  onClick={() => doSplit(p.id, 'row')}
                  disabled={!canSplit}
                  title={canSplit ? 'Split right' : 'Nothing to split into — every live terminal is already on screen'}
                  aria-label={`Split ${p.title} right`}
                  className="rounded p-0.5 hover:bg-muted-foreground/20 disabled:opacity-30"
                >
                  <Columns2 className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => doSplit(p.id, 'col')}
                  disabled={!canSplit}
                  title={canSplit ? 'Split down' : 'Nothing to split into — every live terminal is already on screen'}
                  aria-label={`Split ${p.title} down`}
                  className="rounded p-0.5 hover:bg-muted-foreground/20 disabled:opacity-30"
                >
                  <Rows2 className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => doClose(p.id)}
                  title="Close pane"
                  aria-label={`Close ${p.title}`}
                  className="rounded p-0.5 hover:bg-muted-foreground/20"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </span>
            </div>
            {/* The frame and the way out, stacked. The hint sits UNDER the frame,
                so a terminal that renders covers it and a blank one leaves it
                showing — which is the closest this page can get to detecting a
                refusal it is not allowed to see. */}
            <div className="relative min-h-0 flex-1">
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 rounded-b-md border-x border-b border-border bg-black px-4 text-center">
                <p className="text-xs text-muted-foreground">
                  Nothing here? This terminal needs a one-time sign-in on its own
                  domain — the gate cannot be shown inside a frame.
                </p>
                <a
                  href={p.url}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="rounded-md border border-border px-2.5 py-1 text-xs text-foreground hover:bg-muted"
                >
                  Sign in to this terminal ↗
                </a>
              </div>
            <iframe
              src={p.url}
              title={p.title}
              className={`absolute inset-0 h-full w-full rounded-b-md border-x border-b bg-black ${
                on ? 'border-foreground/40' : 'border-border'
              }`}
              // Scripts (a terminal is one) but never same-origin: the frame runs
              // a shell on someone's machine and must not reach this page's session.
              sandbox="allow-scripts allow-same-origin allow-forms"
            />
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
