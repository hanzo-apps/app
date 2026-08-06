# Landing page (`app/page.tsx` + `components/landing/*`)


Design-maven marketing landing — true-black `#000` monochrome (zero hue by
construction), Basel Grotesk Medium headings, Geist Mono for code/data. The
reference builder's STRUCTURE, Hanzo brand. Keep the working prompt-composer +
logged-in projects logic in `page.tsx`; elevate design only.

- **`reveal.tsx`** — the ONE scroll-reveal primitive (IntersectionObserver
  fade-up, ~500ms ease-out, `delay` for stagger). Fails open on reduced-motion
  OR no-IntersectionObserver so content is never stuck hidden. Every section
  uses this — no per-file animation code.
- **`hero-preview.tsx`** — hero focal visual: an honest, schematic browser frame
  (`your-app.hanzo.app` URL, semantic green Live dot, wireframe UI, "Wired in:
  Database · Auth · AI · Storage"). Deliberately a wireframe — communicates
  "a real running app" without fabricating a customer or metrics.
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
