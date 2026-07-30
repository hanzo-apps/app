"use client";

// One reusable scroll-reveal. Fade + small rise on first view, ~500ms ease-out
// to match the Hanzo motion bar (120–200ms for hovers, a touch longer for
// entrances). Honors prefers-reduced-motion (no transform, instant). Stagger
// children by passing an incrementing `delay`. DRY: every landing section uses
// THIS — no per-file animation code.
//
// The motion itself lives in assets/globals.css under [data-reveal]; this
// component only observes intersection and flips the attribute. Layout is the
// caller's concern: Reveal renders a gui YStack and forwards every stack prop,
// so callers position it with the same vocabulary as everything else.

import { useEffect, useRef, useState, type ComponentProps } from "react";
import { YStack } from "@hanzo/gui";

interface RevealProps extends ComponentProps<typeof YStack> {
  /** Stagger offset in ms. */
  delay?: number;
}

export default function Reveal({ children, delay = 0, ...stack }: RevealProps) {
  const ref = useRef<HTMLElement | null>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Fail open: if the browser can't observe intersections, or the user asked
    // for reduced motion, show immediately. Content must NEVER stay hidden.
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce || typeof IntersectionObserver === "undefined") {
      setShown(true);
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setShown(true);
          io.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <YStack
      ref={ref as never}
      data-reveal={shown ? "shown" : ""}
      style={{ transitionDelay: shown ? `${delay}ms` : "0ms" }}
      {...stack}
    >
      {children}
    </YStack>
  );
}
