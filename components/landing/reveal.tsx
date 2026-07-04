"use client";

// One reusable scroll-reveal. Fade + small rise on first view, ~500ms ease-out
// to match the Hanzo motion bar (120–200ms for hovers, a touch longer for
// entrances). Honors prefers-reduced-motion (no transform, instant). Stagger
// children by passing an incrementing `delay`. DRY: every landing section uses
// THIS — no per-file animation code.

import { useEffect, useRef, useState, type ElementType, type ReactNode } from "react";

interface RevealProps {
  children: ReactNode;
  /** Stagger offset in ms. */
  delay?: number;
  /** Render element (default div). */
  as?: ElementType;
  className?: string;
}

export default function Reveal({
  children,
  delay = 0,
  as: Tag = "div",
  className = "",
}: RevealProps) {
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
    <Tag
      ref={ref}
      style={{ transitionDelay: shown ? `${delay}ms` : "0ms" }}
      className={`transition-all duration-500 ease-out will-change-[opacity,transform] motion-reduce:transition-none ${
        shown ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
      } ${className}`}
    >
      {children}
    </Tag>
  );
}
