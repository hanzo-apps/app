/**
 * The REAL terminal in the dock — the same cloud shell console.hanzo.ai and
 * tabs.hanzo.ai frame, in this builder's pod.
 *
 * Cloud serves the whole terminal (emulator, socket, resize, reconnect) as one
 * self-contained page at /v1/sandboxes/:id/terminal, so this component builds
 * none of that: it asks /v1/shell/terminal for a framed URL and mounts it. The
 * URL's only credential is a single-use, thirty-second ticket — the bearer
 * stays server-side, because an iframe src is the one place a bearer must
 * never travel.
 *
 * The lifecycle is console.hanzo.ai's Terminal, spelled here: `attempt` is the
 * ONE way a session restarts — the effect owns the whole lifetime (lease,
 * ticket, frame) and reruns as a unit, so there is no half-torn-down session.
 * A ticket is spent once; a reconnect is a new ticket, never the old frame
 * reloaded.
 *
 * The pod is the SAME one the line-prompt and the agent hold (`currentSandbox`
 * in, `holdSandbox` out), so `ls` here and `ls` there answer with one tree.
 */
"use client";

import { Button, SizableText, XStack, YStack } from "@hanzo/ui";
import { useCallback, useEffect, useRef, useState } from "react";

import { currentSandbox, holdSandbox } from "./log";

type Phase = "starting" | "live" | "gone";

/** How long a framed terminal gets to say hello before we call it gone. */
const READY_BY = 20_000;

export function Terminal({ project }: { project: string }) {
  const [phase, setPhase] = useState<Phase>("starting");
  const [why, setWhy] = useState("");
  const [src, setSrc] = useState("");
  const [attempt, setAttempt] = useState(0);
  const frame = useRef<HTMLIFrameElement>(null);

  const retry = useCallback(() => {
    setPhase("starting");
    setWhy("");
    setSrc("");
    setAttempt((n) => n + 1);
  }, []);

  useEffect(() => {
    // `alive` is the barrier for everything this effect started: React mounts
    // an effect twice in development, and a ticket fetched by the first pass
    // would otherwise land in a frame the second pass has replaced.
    let alive = true;
    let waiting: ReturnType<typeof setTimeout> | null = null;

    const end = (message: string) => {
      if (!alive) return;
      setWhy(message);
      setPhase("gone");
    };

    // The readiness handshake. Only the frame we opened may speak for it, and
    // only from the host that serves the terminal.
    const heard = (e: MessageEvent) => {
      if (!alive || e.source !== frame.current?.contentWindow) return;
      const at = frame.current?.src;
      if (!at || new URL(at).origin !== e.origin) return;
      const d = e.data as { source?: string } | null;
      if (d && d.source === "hanzo-term") {
        if (waiting) clearTimeout(waiting);
        setPhase("live");
      }
    };
    window.addEventListener("message", heard);

    void (async () => {
      try {
        const res = await fetch("/v1/shell/terminal", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ project, sandbox: currentSandbox() || undefined }),
        });
        const body = (await res.json().catch(() => null)) as
          | { sandbox?: string; src?: string; error?: string }
          | null;
        if (!alive) return;
        if (!res.ok || !body?.src) {
          end(body?.error || `The terminal could not open (${res.status}).`);
          return;
        }
        if (body.sandbox) holdSandbox(body.sandbox);
        setSrc(body.src);
        waiting = setTimeout(() => end("The terminal did not come up."), READY_BY);
      } catch {
        end("The terminal service did not answer.");
      }
    })();

    return () => {
      alive = false;
      if (waiting) clearTimeout(waiting);
      window.removeEventListener("message", heard);
    };
  }, [project, attempt]);

  if (phase === "gone") {
    return (
      <YStack flex={1} alignItems="center" justifyContent="center" gap="$2" padding="$3">
        <SizableText fontSize="$2" color="$color11" textAlign="center">
          {why || "The terminal closed."}
        </SizableText>
        <Button type="button" variant="ghost" onClick={retry} height="$4.5" paddingHorizontal="$2.5" borderRadius="$2" hoverStyle={{ backgroundColor: "$color3" }}>
          <SizableText fontSize="$1" color="$color">Reconnect</SizableText>
        </Button>
      </YStack>
    );
  }

  return (
    <YStack flex={1} minHeight={0} position="relative">
      {phase === "starting" && (
        <XStack position="absolute" top={0} right={0} bottom={0} left={0} alignItems="center" justifyContent="center">
          <SizableText className="thread-shimmer-text" fontSize="$1" color="$color11">
            Opening a cloud shell…
          </SizableText>
        </XStack>
      )}
      {src && (
        <iframe
          ref={frame}
          src={src}
          title="Cloud shell — a real terminal in your sandbox"
          style={{
            border: 0,
            width: "100%",
            height: "100%",
            display: "block",
            opacity: phase === "live" ? 1 : 0,
            background: "transparent",
          }}
        />
      )}
    </YStack>
  );
}
