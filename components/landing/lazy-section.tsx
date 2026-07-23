"use client";

// One reusable "mount on approach" wrapper. Below-the-fold landing sections are
// code-split (next/dynamic) and only MOUNTED once the viewport nears them, so the
// hero ships a tiny bundle and paints instantly; each section's chunk loads as you
// scroll. DRY: every below-fold section uses THIS — no per-section observer code.
//
// A reserved `minHeight` placeholder holds scroll space so mounting causes no
// layout shift. Fails open: no IntersectionObserver (SSR / old browser) → render
// immediately, content is NEVER hidden.

import { useEffect, useRef, useState, type ReactNode } from "react";

interface LazySectionProps {
  children: ReactNode;
  /** Reserved space (px) before mount, to prevent layout shift. */
  minHeight?: number;
  /** How early to mount before entering the viewport. */
  rootMargin?: string;
}

export default function LazySection({
  children,
  minHeight = 400,
  rootMargin = "600px 0px",
}: LazySectionProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setShow(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setShow(true);
          io.disconnect();
        }
      },
      { rootMargin },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [rootMargin]);

  return (
    <div ref={ref} style={show ? undefined : { minHeight }}>
      {show ? children : null}
    </div>
  );
}
