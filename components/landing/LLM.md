# Landing page (`app/page.tsx` + `components/landing/*`)


Design-maven marketing landing — true-black `#000` monochrome (zero hue by
construction), Basel Grotesk Medium headings, Geist Mono for code/data. The
reference builder's STRUCTURE, Hanzo brand. Keep the working prompt-composer +
logged-in projects logic in `page.tsx`; elevate design only.

- **`reveal.tsx`** — the ONE scroll-reveal primitive (IntersectionObserver
  fade-up, ~500ms ease-out, `delay` for stagger). Fails open on reduced-motion
  OR no-IntersectionObserver so content is never stuck hidden. Every section
  uses this — no per-file animation code.
- **`hero-video.tsx`** — the film, and **it IS the hero**. There is no headline,
  pill or subline beside it any more: the film says all three itself, in the
  product's own chrome and typefaces, and the HTML that repeated that message
  was deleted rather than kept as a second voice. It fills the fold — `100svh`,
  `object-fit: cover`, edge to edge — with the composer docked over its foot.
  **Two masters, picked by ORIENTATION**, because one cannot be both shapes:
  covering a 390x844 phone with a 16:9 master shows the middle quarter of it,
  and a 768x1024 tablet handed the wide master loses 555px off each side — so
  `hero-tall.mp4` (1080x1920) and `hero-wide.mp4` (1920x1080), switched on
  `(orientation: portrait)` and re-picked when a phone turns.
  **It does not loop**: the film ends on the finished app and holds there, so
  the last thing on screen is the product, running.
  **The still is what the server sends**, and `<picture>` decides which one with
  media queries — no JavaScript, right per viewer in the first bytes: motion
  gets frame 0 (`*-first.jpg`, the frame the film opens on, so the player's
  arrival is invisible), reduced motion gets the FINAL frame (`*-last.jpg`, the
  finished app) because that viewer never sees the film and the payoff is the
  one image worth having. No `<video>` is created on that path at all — a paused
  player still fetches the megabytes. Nothing declares an aspect ratio and
  nothing needs to: **the box is the fold**, so it is the right size before a
  byte of media arrives.
  Deliberately bare of `LazySection`/`Reveal`: both decide when it may be seen,
  and its one job is to already be running. Its `ALT` is now the page's only
  sentence — what a screen reader reads and a crawler indexes — so it carries
  the film's message, not a description of a video.
  `tests/unit/hero-video.test.tsx` pins muted + playsInline (autoplay is not one
  flag, and losing either leaves a still frame forever with no error), `loop`
  ABSENT, the orientation switch and the four `<picture>` sources;
  `tests/unit/hero-fold.test.ts` pins that the copy stays deleted and that the
  film fills the fold rather than being capped inside it.
- **`hero-preview.tsx`** — GONE. It was the hero's focal visual, a schematic
  browser frame that animated a build on scroll, and the film supersedes it: two
  demos of one story, the second one below the fold. Deleted whole with its test
  rather than left mounted nowhere — `git show ee25103f1:components/landing/hero-preview.tsx`
  if it is ever wanted.
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
