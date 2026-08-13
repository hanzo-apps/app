# Landing page (`app/page.tsx` + `components/landing/*`)


Design-maven marketing landing — true-black `#000` monochrome (zero hue by
construction), Basel Grotesk Medium headings, Geist Mono for code/data. The
reference builder's STRUCTURE, Hanzo brand. Keep the working prompt-composer +
logged-in projects logic in `page.tsx`; elevate design only.

- **`reveal.tsx`** — the ONE scroll-reveal primitive (IntersectionObserver
  fade-up, ~500ms ease-out, `delay` for stagger). Fails open on reduced-motion
  OR no-IntersectionObserver so content is never stuck hidden. Every section
  uses this — no per-file animation code.
- **`hero-video.tsx`** — the film, and **it opens the page**: 12s, generated
  with HyperFrames from this product's own chrome, copy and typefaces. Prompt
  typed → agent streams → app renders → published to `your-app.hanzo.app`. The
  hero reads film → pill → headline → subline, with the composer docked under
  it, so the first thing on screen is the product doing the thing. The master
  (`public/hero.mp4`, 1600x1200, 953 KB) keeps everything that matters inside
  its centred **1200px square**, so a phone crops to `1/1` and loses nothing
  while ≥768 sees the whole 4:3 — that is the entire responsive story:
  `object-fit: cover` plus an `aspect-ratio` the frame declares at both widths,
  so the box is right before a byte arrives. **Frame 0 IS the poster**
  (`public/hero.jpg`), so the still and the first played frame are one picture
  and the swap is invisible — which is why **the still is what the server
  sends** and the film is a client upgrade on mount: SSR cannot read a media
  query, the picture is the honest answer for both, and the box never shifts.
  Reduced motion keeps that still and gets **no `<video>` at all** — a paused
  player would still fetch the megabyte. Deliberately bare of
  `LazySection`/`Reveal`: both decide when it may be seen, and its one job is to
  already be running. It carries no caption: labelling the film from below put
  a mono line between the picture and the pill, saying what the subline says in
  full. **Width is not its decision** — `.hz-fold` (globals.css) caps it from
  the room the fold has spare, and that arithmetic is stated there.
  `tests/unit/hero-video.test.tsx` pins muted + playsInline, because autoplay is
  not one flag and losing either leaves a poster frame forever, with no error;
  `tests/unit/hero-fold.test.ts` pins the still-first render and the caps.
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
