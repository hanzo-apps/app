'use client';

// A spinner is an arc IN MOTION — the arc alone is just a stray line.
//
// lucide ships the arc. The rotation is `.spin` (assets/globals.css), and it
// was an opt-in: every call site was trusted to remember `className="spin"`.
// One of 83 did. The other 82 rendered a still three-quarter ring on every
// button, panel and page gate in the app — residue of the Tailwind rip, which
// removed `animate-spin` and left a class nobody reached for in its place. The
// owner saw one of them on /auth/callback and read it, correctly, as breakage.
//
// So the two are bound here. There is no rotation left to forget because there
// is no rotation left to remember — reaching for the glyph gets you the motion.
//
// `aria-hidden`, because a spinner is never the message: the thing that is
// loading says so in text beside it — a button's label, LoadingScreen's line.

import { LoaderCircle } from 'lucide-react';

export function Spinner({ size = 16, color }: { size?: number; color?: string }) {
  return <LoaderCircle size={size} color={color} className="spin" aria-hidden />;
}
