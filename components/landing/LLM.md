# Landing page (`app/page.tsx` + `components/landing/*`)


Design-maven marketing landing — true-black `#000` monochrome (zero hue by
construction), Basel Grotesk Medium headings, Geist Mono for code/data. The
reference builder's STRUCTURE, Hanzo brand. Keep the working prompt-composer +
logged-in projects logic in `page.tsx`; elevate design only.

- **`reveal.tsx`** — the ONE scroll-reveal primitive (IntersectionObserver
  fade-up, ~500ms ease-out, `delay` for stagger). Fails open on reduced-motion
  OR no-IntersectionObserver so content is never stuck hidden. Every section
  uses this — no per-file animation code.
- **`hero-preview.tsx`** — the hero's focal visual, and the RIGHT column of a
  two-column fold: the sentence on the left, the product on the right. A
  faithful miniature of the real `/dev` builder — chat rail, composer, the
  generated app in a rounded frame on desktop AND a phone — that BUILDS
  something the first time it is seen: the composer types a prompt, build lines
  stream, the app appears, two follow-up edits apply, and it publishes to a
  green Live dot. A replay control re-runs it; touching nothing still leaves a
  settled, finished frame.

  **Drawn in HTML, deliberately — not a film.** A 12s master was tried as a
  full-bleed hero and taken back out: a video crops (one master cannot be both a
  phone's 0.46 and a laptop's 1.6), it goes soft when scaled, it costs ~1MB per
  aspect, and the copy had to float over it in a scrim, which is the collision
  the split layout exists to avoid. The frame is sharp at every width, is the
  builder's own components rather than a picture of them, and cannot drift from
  the product — `tests/unit/hero-preview-tabs.test.ts` pins that its view tabs
  READ `lib/panes` instead of a hand-copied list, which is exactly how they went
  stale once before.

  **It never shows an address.** The frame's strip carries the app's NAME
  (`const APP`), never `<app>.hanzo.app`: a visitor reading it is already on
  hanzo.app, so a domain there tells them where they are and puts a URL in front
  of the product it exists to show. `tests/unit/hero-fold.test.ts` pins that,
  comment-stripped so the rule written above the constant cannot satisfy its own
  check.

  Honest by construction: the app is a clearly-labelled demo, hand-authored
  here, with no real customer and no metric presented as ours. Everything is
  simulated client-side — the landing is pre-auth and calls no API. Reduced
  motion gets the settled final frame and no animation.

  **It floats.** The frame is a device mockup on the page's own black — no card
  behind it — and its depth is TWO things, because a plain drop shadow cannot
  work here: black on `#000` is invisible. So `.idm .window` pairs a wide soft
  pool (which darkens the floor glow behind the frame) with a 1px light rim that
  catches an edge the ground cannot draw. Measured: `0 32px 64px -16px rgba(0,0,0,.9)`,
  `0 8px 24px -8px rgba(0,0,0,.7)`, `0 0 0 1px rgba(255,255,255,.06)`. The
  `elevation={6}` it replaced compiled to `0 3px 5px rgba(0,0,0,.33)` — present
  in the computed style and invisible to the eye.

  **The composer lives in the left column**, under the subline, and there is
  exactly one on the page. It used to ride a sticky `.hz-dock` across the foot
  of the page, which pinned it to the viewport and left the fold reading as
  copy, a picture, and an unrelated bar at the bottom; on a phone it sat under
  everything else rather than after the headline. In the column the fold reads
  as one thought — here is what this does, here is where you say it — and the
  phone stack falls out for free: headline, composer, product. The dock rule is
  deleted from `globals.css`; left there it reads as live pinning.

  The hero's own arithmetic lives in `app/page.tsx`: `100svh` so the fold is
  OWNED (small viewport unit — a phone's URL bar moves the large one), and the
  row only from `$lg`, so a phone stacks. The left column stops at **576**,
  measured: at 520 the headline's second line broke again and left "it." alone
  on a third.
- **`logo-wall.tsx`** — REAL partners only (Techstars '17 + NVIDIA/AWS/Microsoft/
  Google/DigitalOcean/Nebius/Lux/Zoo), mono-tinted white via
  `[filter:brightness(0)_invert(1)]`. Labeled "Backed by Techstars · Built on
  world-class infrastructure" — never "trusted by <fake customers>".
- **`cloud-integration.tsx`** — the differentiator: 6 capabilities each mapping
  to a LIVE Hanzo product (Cloud/Base/IAM/AI/KMS·S3/Functions), linked
  to `hanzo.ai/<product>`. No invented features/metrics.
- **`models-strip.tsx`** — real `api.hanzo.ai/v1` endpoint + real provider logos.
- **`how-it-works.tsx`** / **`site-footer.tsx`** — 3-step + multi-column footer.

Honesty rule: REAL logos + REAL integration claims only. If a claim can't be
truthful, omit it.
