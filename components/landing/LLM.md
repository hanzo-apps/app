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
  green Live dot. Then it builds the NEXT example. A replay control re-runs the
  current one; touching nothing still leaves a settled, finished frame.

  **A storyline is DATA, and there is ONE renderer.** `STORIES` holds five
  small apps — a shift board, a front desk, a handbook, a client portal, a
  Monday digest — each three turns (build, then two edits) over the same body:
  a name, a heading, three measured rows, a note. A sixth example is an entry
  in that array and nothing else. It replaced a single hand-authored `VibeApp`,
  which is the shape that makes a demo show one thing forever; `App` renders any
  storyline, and `tests/unit/hero-fold.test.ts` fails if a second renderer or a
  literal name comes back.

  Each one lands on a REAL leaf of the commerce catalog
  (`api.hanzo.ai/v1/commerce/catalog`, snapshot in `hanzo.ai/lib/data/catalog.json`)
  — Base and Vector under Data, Agents under AI, IAM under Security, Functions
  under Compute — and **Base is in every `wire` string**, because every
  hanzo.app project gets the data plane. That is the through-line, and the test
  asserts it. No invented product, no number presented as ours: the figures are
  the demo app's own content.

  **The cycle only runs while it is watched.** The IntersectionObserver keeps
  observing rather than disconnecting after one play, and `pending` is the
  storyline waiting for the frame to be on screen — starting at 0, so the FIRST
  play and every resume-after-a-scroll-away are one mechanism instead of two.
  Reduced motion never observes at all: settled frame, no animation, no cycling.

  **The link under the frame is the composer's own fill.** It hands the current
  example's opening prompt to `BuildComposer` through its one handle
  (`Composer.ask`, the same function a starter chip calls), so the draft appears
  focused, editable, and sent by the send button or Enter like any typed idea.
  `app/page.tsx` holds the ref. Do not grow a second way to seed a prompt —
  `tests/unit/hero-recreate.test.tsx` renders both components wired as the page
  wires them and clicks the link.

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
  (`story.name`), never `<app>.hanzo.app`: a visitor reading it is already on
  hanzo.app, so a domain there tells them where they are and puts a URL in front
  of the product it exists to show. `tests/unit/hero-fold.test.ts` pins that,
  comment-stripped so the rule written above the data cannot satisfy its own
  check.

  **The admission rides the strip, beside the name.** A caption under the frame
  used to carry it — "Demo · watch the builder build…" — where it said what the
  picture already showed and edited nothing; a label outside a picture is also
  the first thing a reader's eye drops. The mono `Demo` tag is IN the address
  strip now, so it is on screen whenever the app's name is. Deleting the caption
  without moving the label would have been deleting the honesty.

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

  **The composer rides the bottom of the viewport** (`.hz-dock`, sticky, the
  whole rule in `globals.css`) and comes to rest in its flow slot at the foot of
  the page, and there is exactly one on the page. It spent a release in the
  hero's left column instead; the dock is what it is and what it went back to,
  so the offer to type is on screen wherever a visitor has scrolled to — which
  is also what makes the hero's "build this example" link work from the fold.
  Two placement rules the sticky depends on, both silent to undo: it must be the
  LAST child of the stack it rides, and it must sit OUTSIDE the `Reveal` above
  it, because a transformed ancestor becomes the containing block for everything
  positioned inside it — the composer's own popovers included.

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
