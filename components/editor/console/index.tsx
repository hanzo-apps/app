"use client";

import { Button, Input } from '@hanzo/ui';
import { sends } from '@hanzo/ui/chat';
import { SizableText, YStack, XStack, Paragraph } from '@hanzo/ui';
import { useEffect, useRef, useState } from "react";
import { Check, GitBranch, Square, SquareTerminal } from "lucide-react";


import { currentProject } from "@/lib/dev/workspace";
import { HOME, TIMEOUT } from "@/lib/shell";

import { BAR, DEFAULT_OPEN, MIN_OPEN, STEP, maxOpen, useDock } from "./dock";
import { currentSandbox, holdSandbox, push, useConsoleLog, useRun } from "./log";
import { Terminal } from "./terminal";

/**
 * The prompt — the half of this dock you can type into.
 *
 * The agent has always been able to run commands on the project's pod; this is
 * the same door for the person, and it lands in the SAME sandbox: when a run is
 * live the shell borrows its id, so what you `ls` is the checkout the agent is
 * editing, not a second copy of it.
 *
 * The directory is held HERE rather than on the pod because each command is its
 * own process (see lib/shell) — carrying it is what makes `cd` mean anything.
 * Nothing else survives between commands, and the placeholder does not claim
 * otherwise.
 */
function Prompt() {
  const run = useRun();
  const [command, setCommand] = useState("");
  const [cwd, setCwd] = useState(HOME);
  const [busy, setBusy] = useState(false);
  // What was typed, newest last. ArrowUp walks back through it; `at` is where
  // the walk has got to, and length means "not walking" — the draft is at the
  // end of the list, which is exactly where a fresh line belongs.
  const past = useRef<string[]>([]);
  const at = useRef(0);

  const send = async () => {
    const typed = command.trim();
    if (!typed || busy) return;
    past.current.push(typed);
    at.current = past.current.length;
    setCommand("");
    setBusy(true);
    // Echo before the round trip: at 60s a command can outlive your memory of
    // asking for it, and a prompt that swallows the line looks broken.
    push("you", "info", typed);
    try {
      const res = await fetch("/v1/shell", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          command: typed,
          cwd,
          project: currentProject(),
          // The live run's pod wins: one sandbox, one checkout.
          sandbox: currentSandbox() || undefined,
        }),
      });
      const body = (await res.json().catch(() => null)) as {
        error?: string; stdout?: string; stderr?: string;
        exitCode?: number; timedOut?: boolean; sandbox?: string; cwd?: string;
      } | null;

      if (!res.ok || !body || body.error) {
        push("sandbox", "error", body?.error || `The shell could not run that (${res.status}).`);
        return;
      }
      holdSandbox(body.sandbox ?? "");
      setCwd(body.cwd || cwd);
      if (body.stdout?.trim()) push("sandbox", "log", body.stdout.replace(/\n+$/, ""));
      if (body.stderr?.trim()) push("sandbox", "error", body.stderr.replace(/\n+$/, ""));
      // A non-zero status is the whole answer for a command that printed
      // nothing, and silence would read as success.
      if (body.timedOut) push("sandbox", "warn", `timed out after ${TIMEOUT}s`);
      else if (body.exitCode) push("sandbox", "warn", `exit ${body.exitCode}`);
    } catch {
      push("sandbox", "error", "Could not reach the shell.");
    } finally {
      setBusy(false);
    }
  };

  /** Walk the history. Returns false when there is nothing that way. */
  const walk = (by: number) => {
    const next = at.current + by;
    if (next < 0 || next > past.current.length) return false;
    at.current = next;
    setCommand(past.current[next] ?? "");
    return true;
  };

  return (
    <XStack alignItems="center" gap="$1.5" paddingTop="$1.5" data-field-box>
      {/* The path IS the prompt, and it is the only place the shell says where
          you are — so it never collapses to nothing. */}
      <SizableText
        fontFamily="$mono" fontSize="$1" lineHeight="1.625"
        color="$color11" flexShrink={0} maxWidth={180} numberOfLines={1}
      >
        {cwd === HOME ? "$" : `${cwd.split("/").slice(-2).join("/")} $`}
      </SizableText>
      <Input
        flex={1}
        value={command}
        onChangeText={setCommand}
        disabled={busy}
        placeholder="Run a command — cd is remembered, exports are not"
        aria-label="Run a command in this project's sandbox"
        fontFamily="$mono"
        fontSize="$1"
        borderWidth={0}
        backgroundColor="transparent"
        onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
          if (sends(e.key, e.nativeEvent)) {
            e.preventDefault();
            void send();
            return;
          }
          // Only steal the arrows while walking is possible, so a caret moving
          // through a long command still moves.
          if (e.key === "ArrowUp" && walk(-1)) e.preventDefault();
          else if (e.key === "ArrowDown" && walk(1)) e.preventDefault();
        }}
      />
    </XStack>
  );
}

/**
 * Stop what the sandbox is running.
 *
 * TWO VERBS EXIST AND THIS IS THE FIRST. `stop` interrupts the command; `end`
 * releases the sandbox. A person hits this because a build is wedged or a test
 * is hanging, and what they want next is to LOOK at it — the checkout, the
 * half-written file, everything the run has said. So the box stays, and the
 * label says so, because a control that might delete your work is one people
 * hesitate over instead of using.
 *
 * Zero stopped is not a failure: a command that finished a moment ago is one
 * there was nothing left to interrupt. Either way the run is no longer running,
 * which is what the person asked for and what the console says.
 */
function Stop({ sandbox }: { sandbox: string }) {
  const [stopping, setStopping] = useState(false);

  const stop = async () => {
    setStopping(true);
    try {
      const res = await fetch("/v1/sandboxes/stop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: sandbox }),
      });
      const body = (await res.json().catch(() => null)) as { message?: string } | null;
      push(
        "sandbox",
        res.ok ? "info" : "error",
        res.ok
          ? "stopped — the sandbox and everything in it are still here"
          : body?.message || `Could not stop the run (${res.status})`
      );
    } catch {
      push("sandbox", "error", "Could not reach the sandbox to stop it.");
    } finally {
      setStopping(false);
    }
  };

  return (
    <Button
      type="button"
      onClick={stop}
      disabled={stopping}
      variant="ghost"
      group
      aria-label="Stop the running command — the sandbox and its files stay"
      title="Stop the running command. The sandbox, the checkout and the log stay."
      height="$4.5" alignItems="center" justifyContent="center" gap="$1"
      paddingHorizontal="$2" borderRadius="$2" hoverStyle={{ backgroundColor: "$color3" }}
    >
      <SizableText color="var(--destructive)">
        <Square size={12} fill="currentColor" />
      </SizableText>
      <SizableText fontSize="$1" color="$color11" $group-hover={{ color: "$color" }}>
        {stopping ? "Stopping…" : "Stop"}
      </SizableText>
    </Button>
  );
}

/**
 * The developer console — the builder's bottom dock.
 *
 * Its BAR is the thin strip of real state the builder always showed (live ·
 * autosave · branch · files · ready), and it is now also the handle: hover it
 * for a row-resize cursor and a grip, drag it up for a taller console, click it
 * to open to the last size you dragged it to, arrow-key it for fine control.
 *
 * The bar carries no verb — no "Open", no "Hide". The cursor, the grip and the
 * click ARE the affordance; screen readers get `aria-expanded` on a named
 * separator instead of a word that goes stale the moment it is toggled.
 *
 * Far right sit the two controls that belong to the workspace rather than the
 * top bar: the chat/AI panel toggle and the dictation mic.
 */
function Sep() {
  return (
    <SizableText aria-hidden fontSize="$1" color="$color11">
      ·
    </SizableText>
  );
}

export function Console({
  isAiWorking,
  saveText,
  branch,
  pageCount,
}: {
  isAiWorking: boolean;
  /** Honest persistence state — see lib/pages/save-label. */
  saveText: string;
  /** The linked repo's branch, or undefined when the project has no repo. */
  branch?: string;
  pageCount: number;
}) {
  const { height, open, setHeight, toggle, nudge } = useDock();
  const { entries } = useConsoleLog();
  // The dock's second face: the REAL terminal (cloud's framed emulator) in
  // place of the log + line-prompt. Same pod either way — the frame and the
  // prompt share the held sandbox — so this is a view choice, not a session
  // choice, and flipping back loses nothing.
  const [term, setTerm] = useState(false);
  // The live run, or null. Its sandbox is the handle Stop acts on.
  const run = useRun();
  // The composer's voice, drawn here. Null until a composer is mounted.

  // OLD: `const branch = "main"` — stated unconditionally. Builder projects are
  // single-branch when they have a repo, but MOST HAVE NONE: the only paths that
  // create one are publish and an explicit git sync. So the bar drew a branch
  // icon and a branch name for a project that was never version-controlled,
  // which is chrome asserting a fact nothing checked.
  // Kept for reference; the real value now arrives as a prop.
  // Builder projects are single-branch by construction: git-on-publish commits
  // to `main`. The editor's Project carries no branch field, so state it rather
  // than invent one from a type that cannot hold it.
  // (superseded by the `branch` prop)

  // One gesture, two meanings: a pointer that moved is a resize, a pointer that
  // did not is a click — so drag and click-to-expand act on the same height,
  // with no second "expanded" flag that could disagree with it.
  const drag = useRef<{ y: number; base: number; moved: boolean } | null>(null);

  const tail = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (open) tail.current?.scrollIntoView({ block: "end" });
  }, [entries, open]);

  // The terminal RAISES ITSELF the first time a run puts something in it.
  // Command output that lands in a collapsed dock is output nobody sees, which
  // is the same as not having it — and the dock is the only place in the
  // product where you can watch a command run. Once per session: after that the
  // dock's height is the user's, and a second run must not fight a deliberate
  // collapse.
  const raised = useRef(false);
  const sandboxLines = entries.filter((e) => e.source === "sandbox").length;
  useEffect(() => {
    if (raised.current || sandboxLines === 0) return;
    raised.current = true;
    if (!open) setHeight(DEFAULT_OPEN);
  }, [sandboxLines, open, setHeight]);

  return (
    <YStack
      data-console
      // The dock floats over the preview, so it takes the app's ONE glass:
      // translucent ground + backdrop blur, with the separator's hairline
      // finishing the top edge. Opaque `$background` made it read as a second
      // page stacked under the first.
      className="glass"
      position="relative" zIndex={20} flexShrink={0} overflow="hidden" backgroundColor="$background"
      style={{ height }}
    >
      <YStack position="relative" flexShrink={0} style={{ height: BAR }}>
        <YStack
          role="separator"
          aria-orientation="horizontal"
          aria-label="Console"
          aria-expanded={open}
          aria-valuenow={height}
          aria-valuemin={BAR}
          aria-valuemax={
            typeof window === "undefined" ? MIN_OPEN : maxOpen(window.innerHeight)
          }
          tabIndex={0}
          onPointerDown={(e) => {
            if (e.button !== 0) return;
            try {
              e.currentTarget.setPointerCapture(e.pointerId);
            } catch {
              // Capture is an optimisation (it keeps the drag alive outside the
              // bar); it throws for a pointer the browser no longer tracks, and
              // a dock that cannot capture must still resize.
            }
            // Starting collapsed, the drag begins at the minimum open height so
            // the first pixel upwards opens the dock and then tracks the cursor
            // 1:1 — no dead travel before anything happens.
            drag.current = {
              y: e.clientY,
              base: open ? height : MIN_OPEN,
              moved: false,
            };
          }}
          onPointerMove={(e) => {
            const d = drag.current;
            if (!d) return;
            const delta = d.y - e.clientY; // dragging up makes it taller
            if (Math.abs(delta) > 3) d.moved = true;
            if (d.moved) setHeight(d.base + delta);
          }}
          onPointerUp={(e) => {
            const d = drag.current;
            drag.current = null;
            if (e.currentTarget.hasPointerCapture(e.pointerId)) {
              e.currentTarget.releasePointerCapture(e.pointerId);
            }
            if (d && !d.moved) toggle();
          }}
          onKeyDown={(e) => {
            if (e.key === "ArrowUp") nudge(e.shiftKey ? STEP * 4 : STEP);
            else if (e.key === "ArrowDown") nudge(-(e.shiftKey ? STEP * 4 : STEP));
            else if (e.key === "Enter" || e.key === " ") toggle();
            else return;
            e.preventDefault();
          }}
          position="absolute" top={0} right={0} bottom={0} left={0} cursor="row-resize" userSelect="none" borderTopWidth={open ? 1 : 0} borderColor="$borderColor" group
        >
          {/* The affordance: a hairline that lifts and a grip that fades in on
              hover, focus or drag. Nothing is drawn while the bar is at rest. */}
          <SizableText pointerEvents="none" position="absolute" left="$0" right="$0" top="$0" height={1} backgroundColor="transparent" $group-hover={{ backgroundColor: "$color06" }} $group-focus={{ backgroundColor: "$color06" }} $group-press={{ backgroundColor: "$color" }} />
          <SizableText pointerEvents="none" position="absolute" left="50%" top={3} height="$1" width="$6" x="-50%" borderRadius="$10" backgroundColor="transparent" $group-hover={{ backgroundColor: "$color06" }} $group-focus={{ backgroundColor: "$color06" }} $group-press={{ backgroundColor: "$color" }} />
        </YStack>


        {/* State, inert: it rides on the bar but never eats the drag. Padded to
            clear the panel toggle on the left and the mic + Enso on the right —
            measured clearances, so they stay the measurements they are.
            OPEN ONLY: at rest the dock is an invisible edge, and everything
            this row says lives behind the pull. */}
        {open && (
        <XStack
          pointerEvents="none"
          position="relative"
          height="100%"
          alignItems="center"
          gap="$2.5"
          paddingLeft="2.25rem"
          // The right cluster is floated OVER this row, so the row reserves its
          // width rather than flowing around it — which means the reservation
          // has to grow when the cluster does. Stop appears only while a run is
          // live, and at 4.25rem it painted straight through "Working". The two
          // numbers are the measured widths of what is actually there; the
          // geometry assertion in tests/e2e/live-run.spec.ts is what keeps them
          // honest when either side changes.
          paddingRight={run?.sandbox ? "9.5rem" : "4.25rem"}
        >
          <XStack alignItems="center" gap="$1.5">
            {/* A live indicator: a small dot inside a wider, dimmer halo. All
                three boxes were `$1.5` — 24px, the size of a BUTTON, so this
                read as a white blob beside 11px text, and the halo, being
                exactly the dot's size, sat perfectly hidden behind it. The
                halo has to be bigger than the dot or there is nothing to see. */}
            <XStack position="relative" width={12} height={12} alignItems="center" justifyContent="center">
              <SizableText position="absolute" width={12} height={12} borderRadius="$10" backgroundColor="var(--brand-accent)" opacity={0.25} />
              <SizableText position="relative" width={6} height={6} borderRadius="$10" backgroundColor="var(--brand-accent)" />
            </XStack>
            <SizableText fontSize="$1" color="$color11">Live</SizableText>
          </XStack>
          <Sep />
          {/* The real save state. This said "Auto-saved" unconditionally, checked
              against nothing, while the project lived only in the browser. */}
          <SizableText fontSize="$1" color="$color11">{isAiWorking ? "Building…" : saveText}</SizableText>
          {branch && (
            <>
              <Sep />
              <XStack alignItems="center" gap="$1">
                <GitBranch size={12} />
                <SizableText fontSize="$1" color="$color11">{branch}</SizableText>
              </XStack>
            </>
          )}
          <Sep />
          <SizableText fontSize="$1" color="$color11">
            {pageCount} file{pageCount === 1 ? "" : "s"}
          </SizableText>
          <XStack marginLeft="auto" alignItems="center" gap="$1">
            {isAiWorking ? (
              <SizableText className="thread-shimmer-text" fontSize="$1" color="$color11">Working</SizableText>
            ) : (
              <>
                <Check size={12} />
                <SizableText fontSize="$1" color="$color11">Ready</SizableText>
              </>
            )}
          </XStack>
        </XStack>
        )}

        {/* Far right — the workspace AI controls, floated over the bar so the
            separator underneath stays one clean, uninterrupted drag target.
            Order is mic then Enso: the mic is the conversation, Enso the editor,
            and the user asked for the mark to sit to the RIGHT of the mic. */}
        {/* display, not unmount: #enso-dock inside is the anchor an external
            script (public/edit.js) injects into, and unmounting it on collapse
            would strand Enso. Hidden at rest with everything else — the edge
            shows nothing. */}
        <XStack position="absolute" right="$2" top="$0" height="100%" alignItems="center" gap="$0.5" display={open ? "flex" : "none"}>
          {/* Only while there is a command to interrupt, and only when it runs
              somewhere interruptible: a scratch run edits a map in this process
              and has no sandbox to stop. An always-visible Stop that sometimes
              does nothing is worse than one that appears when it can act. */}
          {/* The cloud shell — the same real terminal console.hanzo.ai frames,
              in this project's pod. A toggle, not a door: the dock's body flips
              between the log and the frame, and the bar stays the bar. */}
          <Button
            type="button"
            onClick={() => setTerm((t) => !t)}
            variant="ghost"
            aria-label="Open a cloud shell — a real terminal in your sandbox"
            aria-pressed={term}
            title="Cloud shell — a real terminal in your sandbox"
            height="$4.5" width="$4.5" minWidth="$4.5" alignItems="center" justifyContent="center"
            paddingHorizontal={0} borderRadius="$2" hoverStyle={{ backgroundColor: "$color3" }}
          >
            <SizableText color={term ? "$color" : "$color11"}>
              <SquareTerminal size={14} />
            </SizableText>
          </Button>
          {run?.sandbox && <Stop sandbox={run.sandbox} />}
          {/* Enso mounts HERE (public/edit.js, `hanzo:anchor` in app/dev/layout),
              to the RIGHT of the mic. It used to float at the viewport corner, on
              top of the customer's preview — so /dev turned it off entirely. In
              the control plane it is out of the canvas and beside the other
              workspace controls, which is where a tool for editing hanzo.app
              belongs. Anchored size is pinned small in public/edit.js. The host
              it injects is a descendant that arrives after render, so THAT one
              rule lives in assets/globals.css — see #enso-dock. */}
          <XStack id="enso-dock" alignItems="center" />
        </XStack>
      </YStack>

      {/* The second face: the framed terminal replaces the log AND the prompt —
          a real shell brings its own prompt. Mount/unmount is the session
          boundary (a fresh ticket each mount); the tmux session named per
          project is what makes that cheap, reattaching to the shell it left. */}
      {open && term && (
        <YStack minHeight={0} flex={1} borderTopWidth={1} borderColor="$borderColor" backgroundColor="$background">
          <Terminal project={currentProject()} />
        </YStack>
      )}
      {open && !term && (
        <YStack minHeight={0} flex={1} borderTopWidth={1} borderColor="$borderColor" backgroundColor="$background" paddingHorizontal="$3" paddingVertical="$2" overflow="scroll">
          {entries.length === 0 ? (
            <Paragraph fontFamily="$mono" fontSize="$1" lineHeight="1.625" color="$color11">
              Nothing logged yet — the preview&apos;s console, the commands the agent
              runs in your sandbox, and anything you type below all appear here.
            </Paragraph>
          ) : (
            entries.map((entry) => (
              <XStack key={entry.id} gap="$1.5" alignItems="flex-start">
                {/* One character says who spoke. `$` is the prompt — a line you
                    typed — `›` is the sandbox answering, and `·` is the page's
                    own console. A source column of words would be wider than
                    most of the lines it labels.

                    Your own lines are the only ones drawn in the foreground.
                    That is how a terminal is read: you scan for what you asked,
                    and the output belongs to it. */}
                <SizableText
                  aria-hidden
                  fontFamily="$mono"
                  fontSize="$1"
                  lineHeight="1.625"
                  color={entry.source === "you" ? "$color" : "$color06"}
                >
                  {entry.source === "you" ? "$" : entry.source === "sandbox" ? "›" : "·"}
                </SizableText>
                <Paragraph
                  className="break-words"
                  flex={1}
                  fontFamily="$mono" fontSize="$1" lineHeight="1.625"
                  whiteSpace="pre-wrap" {...{ color: entry.level === "error" ? "var(--destructive)" : entry.level === "warn" || entry.source === "you"
                        ? "$color"
                        : "$color11" }}
                >
                  {entry.text}
                </Paragraph>
              </XStack>
            ))
          )}
          <div ref={tail} />
        </YStack>
      )}
      {/* The prompt sits OUTSIDE the scroller so it stays put while output runs
          past it — the one row of this dock that is always reachable once open. */}
      {open && !term && (
        <YStack borderTopWidth={1} borderColor="$borderColor" backgroundColor="$background" paddingHorizontal="$3" paddingBottom="$2">
          <Prompt />
        </YStack>
      )}
    </YStack>
  );
}
