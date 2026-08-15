"use client";

import { SizableText, YStack, XStack, H1, Paragraph, H2, H3 } from '@hanzo/ui';
import { useState, useEffect, useMemo, useRef } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Github } from "lucide-react";
import { fetchPublishedSlugs } from "@/lib/api/templates";
import Header from "@/components/layout/header";
import Reveal from "@/components/landing/reveal";
import HeroPreview from "@/components/landing/hero-preview";
import LazySection from "@/components/landing/lazy-section";
import { TemplateThumb } from "@/components/template-thumb";
import { TEMPLATE_SHOTS } from "@/lib/template-shots";
import { bySpectrum } from "@/lib/template-hues";
import { BuildComposer, type Composer, type ComposerMode } from "@/components/build-composer";
import { ProjectThumb } from "@/components/project-thumb";

// Below-the-fold sections: code-split out of the initial bundle and mounted on
// scroll via <LazySection>. The hero — Header, copy, product frame and the
// composer — stays eager
// so it paints instantly; these chunks load as the viewport approaches each one.
const LogoWall = dynamic(() => import("@/components/landing/logo-wall"), { ssr: false });
const CloudIntegration = dynamic(() => import("@/components/landing/cloud-integration"), { ssr: false });
const ModelsStrip = dynamic(() => import("@/components/landing/models-strip"), { ssr: false });
const HanzoModels = dynamic(() => import("@/components/landing/hanzo-models"), { ssr: false });
const HowItWorks = dynamic(() => import("@/components/landing/how-it-works"), { ssr: false });
const Comparison = dynamic(() => import("@/components/landing/comparison"), { ssr: false });
const SiteFooter = dynamic(() => import("@/components/landing/site-footer"), { ssr: false });
const PreFooterCTA = dynamic(() => import("@/components/landing/site-footer").then((m) => m.PreFooterCTA), { ssr: false });
import { builderLink } from "@/lib/api/projects";
import { useUser } from "@/hooks/useUser";
import {
  type GalleryTemplate,
  snapshotCatalog,
  popularTemplates,
} from "@/lib/gallery-catalog";

// The strip shows only templates with a hand-QC'd real screenshot, exactly one
// per slug — a generated placeholder tile on the landing page reads as broken.
// Ordered by the colour of the shot rather than by rating, so scrolling the
// strip runs the spectrum instead of shuffling unrelated pictures.
/**
 * The starter strip: real templates, each with a real shot, that really open.
 *
 * `openable` is the set the platform publishes source for, and it is a
 * SEPARATE question from having a screenshot. Measured 2026-08-08: of the 49
 * templates that cleared the shot list here, 27 — more than half — answered 404
 * on /v1/templates/<slug>/pages, so the front page's showcase was mostly
 * pictures of designs a visitor could pick and then not receive. 22 survive,
 * which is more than a strip shows.
 *
 * An EMPTY `openable` means the warehouse has not answered yet (or at all), and
 * then this filters on nothing — the strip is exactly what it was before rather
 * than blank. A front page that renders no templates because a background fetch
 * failed would be a worse bug than the one being fixed.
 */
function qcTemplates(templates: GalleryTemplate[], openable: Set<string>): GalleryTemplate[] {
  const seen = new Set<string>();
  const qc = popularTemplates(templates, 100).filter((t) => {
    if (!TEMPLATE_SHOTS.has(t.slug) || seen.has(t.slug)) return false;
    if (openable.size > 0 && !openable.has(t.slug)) return false;
    seen.add(t.slug);
    return true;
  });
  return bySpectrum(qc, (t) => t.slug);
}

interface LandingProject {
  slug: string;
  org?: string;
  name: string;
  status: string;
  liveUrl: string | null;
  updatedAtIso: string | null;
}

// Typewriter phrases for the composer — the same honest app types, phrased as
// natural completions of "Ask Hanzo to build …".
const TYPED = [
  "a customer portal with login and a dashboard",
  "an internal admin dashboard for my team",
  "an AI support chatbot trained on my docs",
  "a SaaS app with Stripe billing and auth",
  "a marketplace with listings and checkout",
  "a booking site with payments and reminders",
  "a CRM to track leads and deals",
  "a realtime chat app with presence",
  "an analytics dashboard with live charts",
  "a landing page with an email waitlist",
  "an inventory tracker with low-stock alerts",
  "a docs site with full-text search",
];

export default function LandingPage() {
  const { login, user } = useUser();
  const router = useRouter();
  // The page's one composer, reachable from the hero: its "build this example"
  // link fills the draft here, exactly as a starter chip does.
  const composer = useRef<Composer>(null);
  const [projects, setProjects] = useState<LandingProject[]>([]);
  // A few real gallery templates surfaced beside the prompt: the bundled
  // snapshot seeds them instantly, then the live catalog (gallery.hanzo.ai)
  // refreshes below.
  // The gallery rows and the set that can be opened arrive separately, so both
  // are held and the strip is derived — otherwise whichever landed second would
  // have to remember the first.
  const [galleryRows, setGalleryRows] = useState<GalleryTemplate[]>(
    () => snapshotCatalog().templates,
  );
  const [openable, setOpenable] = useState<Set<string>>(() => new Set());
  const starterTemplates = useMemo(
    () => qcTemplates(galleryRows, openable),
    [galleryRows, openable],
  );

  // Fetch the user's REAL projects from the ONE canonical org store (the same
  // same-origin /v1/projects BFF console + the dashboard use). The builder opens
  // at the canonical nice URL (/dev/<org>/<slug>).
  useEffect(() => {
    if (!user) return;
    fetch("/v1/projects", { credentials: "include", cache: "no-store" })
      .then((res) => (res.ok ? res.json() : []))
      .then(
        (
          rows: Array<{
            slug: string;
            org?: string;
            name?: string;
            status?: string;
            liveUrl?: string;
            updatedAt?: number;
            createdAt?: number;
          }>,
        ) =>
          setProjects(
            (Array.isArray(rows) ? rows : []).map((p) => ({
              slug: p.slug,
              org: p.org,
              name: p.name || p.slug,
              status: p.status || "draft",
              // Servable host: live → bare <slug>.hanzo.app (a legacy two-label
              // liveUrl never resolves and would break the thumbnail iframe);
              // else a bound custom (non-hanzo) domain, else none.
              liveUrl:
                p.status === "live"
                  ? `https://${p.slug}.hanzo.app`
                  : p.liveUrl && !p.liveUrl.includes(".hanzo.app")
                    ? p.liveUrl
                    : null,
              updatedAtIso: p.updatedAt
                ? new Date(p.updatedAt * 1000).toISOString()
                : p.createdAt
                  ? new Date(p.createdAt * 1000).toISOString()
                  : null,
            })),
          ),
      )
      .catch(() => setProjects([]));
  }, [user]);

  // Refresh the starter templates from the live gallery catalog (same-origin
  // proxy → gallery.hanzo.ai). Snapshot already painted, so this only upgrades.
  useEffect(() => {
    let alive = true;
    fetch("/v1/gallery")
      .then((res) => res.json())
      .then((data) => {
        if (alive && Array.isArray(data.templates) && data.templates.length) {
          setGalleryRows(data.templates);
        }
      })
      .catch(() => {});
    // The shop window and the warehouse are different services that disagree by
    // 43 rows, which is why both are asked.
    fetchPublishedSlugs().then((s) => alive && setOpenable(s));
    return () => {
      alive = false;
    };
  }, []);

  // ONE submit for both composers (hero + final CTA): persist the seed, bounce
  // anon visitors through login, land signed-in users straight in the builder.
  const startBuild = (text: string, mode: ComposerMode) => {
    localStorage.setItem("initialPrompt", text);
    localStorage.setItem("initialMode", mode);
    if (!user) {
      // `login(dest)` and not `openLoginWindow()`: the latter writes
      // `redirectAfterLogin` from the CURRENT path, so setting it first was a
      // no-op that this one overwrote. A visitor who typed a prompt on the
      // landing page therefore came back to "/" — which routes on to
      // /dashboard — and the prompt they had just written was never opened.
      login("/dev");
      return;
    }
    router.push("/dev");
  };

  // One-click start from a real template: fork it into the builder via the same
  // wire `/gallery` uses (`/dev` resolves the slug and auto-seeds the first
  // generation). Middleware preserves this deep link through login, so an anon
  // visitor lands back on the exact template after signing in.
  const startFromTemplate = (t: GalleryTemplate) => {
    router.push(`/dev?template=hanzo-apps/${t.slug}&action=edit`);
  };

  return (
    // The clip is CSS (`.landing-root`, assets/globals.css) because gui types
    // `overflow` as visible|hidden|scroll and the value has to be `clip`: hidden
    <YStack position="relative" minHeight="100%" backgroundColor="$background" className="landing-root">
      {/* Monochrome hero glow — single soft white radial, zero hue. */}
      <YStack pointerEvents="none" position="fixed" top={0} right={0} bottom={0} left={0} zIndex={0} overflow="hidden">
        <YStack position="absolute" left="50%" top="-12%" height={560} width={900} marginLeft={-450} borderRadius="$10" backgroundColor="$color0075" filter="blur(130px)" />
      </YStack>

      <Header />

      {/* The page's content, over the fixed glow behind it. */}
      <YStack position="relative" zIndex={10}>
        {/* ── Hero — the sentence on the left, the product on the right ──
            `100svh` so the hero OWNS the fold: the two columns centre in the
            space above the composer's slot (the padding below), and the
            composer sits at the bottom of this screen with nothing scrolling
            under it. It is the SMALL viewport unit because a phone's URL bar
            moves the large one, which would push the composer under the fold
            on first paint.

            A phone stacks it — sentence, then the product frame under it, with
            the composer already docked at the foot of the screen. From $lg the
            two stand side by side, which is the arrangement the copy is
            measured for: 1200 is two columns and the $8 (48px) gap between
            them, and the left column stops at 576 because that is the width
            the headline's two deliberate lines need — measured: at 520 the
            second line broke again and left "it." alone on a third. */}
        <YStack minHeight="100svh" justifyContent="center" paddingHorizontal="$4" paddingBottom="$10" paddingTop="$8" $md={{ paddingHorizontal: "$6" }}>
          <YStack alignSelf="center" width="100%" maxWidth={768} gap="$7" $lg={{ flexDirection: "row", alignItems: "center", maxWidth: 1200, gap: "$8" }}>
            {/* LEFT — what the product does, said once. */}
            <YStack alignSelf="center" width="100%" maxWidth={768} $lg={{ flex: 1, maxWidth: 576, alignSelf: "center" }}>
              <Reveal>
                <XStack alignSelf="center" marginBottom="$4.5" alignItems="center" gap="$2" borderRadius="$10" borderWidth={1} borderColor="$borderColor" backgroundColor="$color0025" paddingHorizontal="$3" paddingVertical="$1.5" $lg={{ alignSelf: "flex-start" }}>
                  <SizableText fontFamily="$mono" fontSize="$1" color="$color11">
                    Apps, wired to real data &amp; AI
                  </SizableText>
                </XStack>
              </Reveal>

              <Reveal delay={60}>
                {/* Two sentences, two lines, at every width — the <br> is the
                    break, so nothing is left to chance and nothing is orphaned.
                    It used to be hidden below sm, which forced the phone to hold
                    the whole sentence on ONE line: 17px, the largest that fits
                    358px, and a hero that read smaller than the 32px H2 three
                    sections down. 30px is the largest that keeps the longer
                    sentence unwrapped once it has a line of its own (measured at
                    390: 365px of glyphs less 26 × 0.4px of tracking = 355 in 358
                    of room). A phone is not ONE width, though: at 30px flat the
                    same sentence wraps on a 360px screen and orphans "it." again,
                    so the size is fluid. The longer sentence is 11.8em wide, the
                    room is 100vw − 32px of padding, so 8.45vw − 2.7px is the
                    exact fit and 7.9vw − 2.5px keeps 6% of slack for the metrics
                    of a fallback face. */}
                <H1 fontSize="clamp(22px, 7.9vw - 2.5px, 34px)" fontWeight="600" textAlign="center" lineHeight="1.05" letterSpacing={-0.4} $sm={{ fontSize: "$12" }} $md={{ fontSize: 48 }} $lg={{ textAlign: "left" }}>
                  {/* The space is explicit: JSX drops the whitespace around the
                      <br>, and it is what separates the sentences for a reader
                      who gets the text without the line break. */}
                  Describe your app.{' '}
                  <br />
                  Hanzo builds and ships it.
                </H1>
              </Reveal>

              <Reveal delay={120}>
                {/* The media queries are MIN-width, so the bare value is the PHONE
                    branch and $md is the desktop one. Written the other way round it
                    reads as "small on phones" and does the exact opposite.

                    `$3` (14px) is the base rung and the legibility floor. This sat at
                    12 to keep the sentence on two lines, which is the wrong thing to
                    buy: the first sentence a visitor reads was the smallest text in
                    the fold. Measured at 390 — 12px is 2 lines ending at y 291 in an
                    844 viewport, so a third line spends 27 of the 553px still free
                    below it. */}
                <Paragraph alignSelf="center" marginTop="$4.5" maxWidth={576} fontSize="$3" textAlign="center" color="$color11" $md={{ fontSize: "$6" }} $lg={{ alignSelf: "flex-start", textAlign: "left" }} lineHeight="1.5">
                  One prompt becomes a live app on Hanzo Cloud — UI, database,
                  auth, and 400+ AI models, wired in and deployed.
                </Paragraph>
              </Reveal>

            </YStack>

            {/* RIGHT — the product, building something, in the real chrome.
                Drawn in HTML rather than played as a film: it stays sharp at
                every width, costs a fraction of a master, and it is the actual
                builder's components rather than a picture of them. Deliberately
                bare of LazySection: the frame runs itself the moment it is seen,
                and its one job is to already be going. */}
            <YStack alignSelf="center" width="100%" minWidth={0} $lg={{ flex: 1, minWidth: 0 }}>
              <HeroPreview ask={(prompt) => composer.current?.ask(prompt)} />
            </YStack>
          </YStack>
        </YStack>

        {/* ── Below the fold — the template lane ── */}
        <YStack paddingHorizontal="$4" paddingTop="$6" paddingBottom="$9" $md={{ paddingHorizontal: "$6", paddingBottom: "$11" }}>
          <YStack alignSelf="center" maxWidth={768}>
            <Reveal delay={180}>
              <YStack alignSelf="center" width="100%" maxWidth={672}>

                {/* Or start from one of our great templates — one click forks it
                    into the builder, seeded from that template. */}
                {starterTemplates.length > 0 && (
                  <YStack marginTop="$5">
                    <XStack marginBottom="$3" alignItems="center" justifyContent="center" gap="$2.5">
                      <SizableText height={1} width="$5" backgroundColor="$borderColor" />
                      <SizableText fontFamily="$mono" fontSize="$1" color="$color10">or start from a template</SizableText>
                      <SizableText height={1} width="$5" backgroundColor="$borderColor" />
                    </XStack>
                    {/* FULL-BLEED lane: breaks out of the hero column to the
                        viewport edge so the strip swoops the whole width. */}
                    <YStack width="100vw" marginLeft="calc(50% - 50vw)" paddingHorizontal="$5">
                      {/* EVERY starter, one horizontal strip: snap-scrolled,
                          edge-faded (.hz-strip in globals.css), lazy thumbs. */}
                      <XStack className="hz-strip" flexWrap="nowrap" gap={10}>
                        {starterTemplates.map((t) => (
                          /* A card, not a control: @hanzo/ui Button pins the
                             size variant's height (30px) over height="auto",
                             and overflow=hidden then crops the thumb to a thin
                             band. A clickable stack sizes from content. */
                          <YStack
                            key={t.slug}
                            role="button"
                            tabIndex={0}
                            onClick={() => startFromTemplate(t)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                startFromTemplate(t);
                              }
                            }}
                            /* 360×225, not 280×175. The lane scrolls, so its
                               card width is free of the layout and answers only
                               to "can you see the design in it" — a 175px shot
                               of a whole website is a thumbnail of a thumbnail.
                               225 keeps the 16:10 the gallery card already uses,
                               so one shot is cropped one way everywhere. */
                            cursor="pointer" width={360} flexShrink={0} group className="zoom-scope hz-strip-card" overflow="hidden" borderRadius="$6" borderWidth={1} borderColor="$borderColor" backgroundColor="$color002" hoverStyle={{ borderColor: "$color02", backgroundColor: "$color005" }}
                          >
                            <YStack position="relative" overflow="hidden" height={225} backgroundColor="$color002">
                              <TemplateThumb
                                name={t.displayName}
                                category={t.category}
                                slug={t.slug}
                                className="zoom-target"
  />
                            </YStack>
                            <YStack paddingHorizontal="$3" paddingVertical="$2.5">
                              <Paragraph numberOfLines={1} fontSize="$2" fontWeight="500" color="$color">
                                {t.displayName}
                              </Paragraph>
                              <Paragraph numberOfLines={1} fontSize="$1" color="$color10">
                                {t.category}
                              </Paragraph>
                            </YStack>
                          </YStack>
                        ))}
                      </XStack>
                    </YStack>
                    <YStack marginTop="$3" alignItems="center">
                      <Link
                        href="/templates"
                        className="hz-tap"
                      ><SizableText fontSize="$1" color="$color11" hoverStyle={{ color: "$color" }}>
                        Browse all templates →
                      </SizableText></Link>
                    </YStack>
                  </YStack>
                )}

                <YStack marginTop="$5" alignItems="center" gap="$2">
                  {/* lineHeight + center: at `$1` the paired token line-height is
                      far too tall, which only shows once the sentence wraps — a
                      gaping gap between the two lines. String form = a multiplier
                      (a number would be pixels). */}
                  <SizableText fontSize="$1" lineHeight="1.4" textAlign="center" color="$color11">
                    Every app gets a database, sign-in and AI, and runs on
                    Hanzo Cloud.
                  </SizableText>
                  <Link
                    href="/new"
                    className="hz-tap"
                  ><XStack alignItems="center" gap="$1.5">
                    <Github size={14} />
                    <SizableText fontSize="$1" color="$color11" hoverStyle={{ color: "$color" }}>or import an existing GitHub repo</SizableText>
                  </XStack></Link>
                </YStack>
              </YStack>
            </Reveal>
          </YStack>
        </YStack>

        <LazySection minHeight={180}><LogoWall /></LazySection>
        <LazySection minHeight={420}><CloudIntegration /></LazySection>
        <LazySection minHeight={320}><ModelsStrip /></LazySection>
        <LazySection minHeight={360}><HanzoModels /></LazySection>
        <LazySection minHeight={320}><HowItWorks /></LazySection>
        <LazySection minHeight={640}><Comparison /></LazySection>

        {/* ── Continue building (logged-in) ── */}
        {user && projects.length > 0 && (
          <YStack borderTopWidth={1} borderColor="$borderColor" paddingHorizontal="$4" paddingVertical="$11" $md={{ paddingHorizontal: "$6", paddingVertical: "$10" }}>
            {/* `width="100%"`, or a centred column is shrink-to-fit and
                `maxWidth` caps a width it never takes. Measured at 555px on a
                1440 row, which is why the grid had one track. */}
            <YStack alignSelf="center" width="100%" maxWidth={1152}>
              {/* A gui YStack, NOT a `<div>`. H2 and Paragraph are @hanzo/ui
                  TEXT primitives and render INLINE, so a block wrapper does not
                  stack them: measured, the subtitle sat at the heading's right
                  edge on the heading's own baseline, and "View all" ran on after
                  it. Only a flex column stacks them. `flexWrap` + `gap` so the
                  link drops below instead of colliding when the row is tight. */}
              <XStack marginBottom="$7" flexWrap="wrap" alignItems="flex-end" justifyContent="space-between" gap="$4">
                <YStack>
                  <H2 fontSize="$8" fontWeight="500" letterSpacing={-0.4} $md={{ fontSize: "$10" }} lineHeight="1.1">
                    Continue building
                  </H2>
                  <Paragraph marginTop="$1.5" fontSize="$3" color="$color11">
                    Open one and pick up where you left off.
                  </Paragraph>
                </YStack>
                <Link
                  href="/projects"
                ><SizableText fontSize="$3" color="$color11" hoverStyle={{ color: "$color" }}>
                  View all →
                </SizableText></Link>
              </XStack>

              {/* The ONE card grid (auto-fit/minmax — THREE across at 1152,
                  fewer as the width shrinks; the comment used to say four, but
                  minmax(280) + an 18px gutter yields three, so a fourth card
                  orphaned onto a row of its own). Three, and `View all` carries
                  anyone who wants the rest. These were full-width Buttons in a
                  column: the size variant's pinned height cropped every preview
                  to a ~30px band (the same landmine the template strip names),
                  so the section read as four broken bars. A clickable stack
                  sizes from content; the thumb box crops a REAL preview —
                  ProjectThumb renders the deployed site scaled into the box, and
                  a draft gets the honest monogram tile, never fake content. */}
              {/* `.project-grid`, NOT `.card-grid`, and the difference is the
                  whole section on a phone. card-grid is auto-fit/minmax(280px),
                  which collapses to ONE column below ~580px — so each card went
                  full-bleed while the framed iframe stayed at its own logical
                  width, leaving the shot on the left and half the row empty
                  black. project-grid fixes the track count (two on a phone,
                  three from md) and its `minmax(0, 1fr)` lets the iframe scale
                  DOWN to the track instead of forcing the track to the iframe.
                  The rule and this comment already existed; the markup simply
                  never pointed at them, so the dashboard got the layout and the
                  home page did not. */}
              <div className="project-grid">
                {projects.slice(0, 3).map((project) => (
                  <YStack
                    key={project.slug}
                    role="button"
                    tabIndex={0}
                    onClick={() => router.push(builderLink(project.slug, project.org))}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        router.push(builderLink(project.slug, project.org));
                      }
                    }}
                    cursor="pointer" overflow="hidden" borderRadius="$6" borderWidth={1} borderColor="$borderColor" backgroundColor="$color2" hoverStyle={{ borderColor: "$color06", backgroundColor: "$color3" }}
                  >
                    {/* No fixed height: ProjectThumb carries `aspectRatio 16/9`
                        and `height: 100%`, so a pinned 175px box made the preview
                        175x16/9 = 311px wide inside a 553px card and left the
                        right third empty. Give it the width and let the ratio
                        set the height. */}
                    <YStack position="relative" overflow="hidden" width="100%" backgroundColor="$color002">
                      <ProjectThumb name={project.name} liveUrl={project.liveUrl} />
                    </YStack>
                    <YStack paddingHorizontal="$3" paddingVertical="$2.5">
                      <H3 numberOfLines={1} fontSize="$3" fontWeight="500" color="$color" lineHeight="1.15">
                        {project.name}
                      </H3>
                      <XStack marginTop="$1" alignItems="center" gap="$2">
                        <Paragraph fontSize="$1" color="$color10">
                          {project.status === "live" ? "Live" : "Draft"}
                        </Paragraph>
                        {project.updatedAtIso && (
                          <SizableText fontFamily="$mono" fontSize="$1" color="$color10">
                            {new Date(project.updatedAtIso).toLocaleDateString()}
                          </SizableText>
                        )}
                      </XStack>
                    </YStack>
                  </YStack>
                ))}
              </div>
            </YStack>
          </YStack>
        )}

        {/* ── Ship your first app ── */}
        <YStack borderTopWidth={1} borderColor="$borderColor" paddingHorizontal="$4" paddingVertical="$11" $md={{ paddingHorizontal: "$6", paddingVertical: "$10" }}>
          <Reveal alignSelf="center" width="100%" maxWidth={672}>
            <H2 fontSize="$10" fontWeight="500" textAlign="center" letterSpacing={-0.4} $md={{ fontSize: "$12" }} lineHeight="1.1">
              Ship your first app.
            </H2>
            <Paragraph alignSelf="center" marginTop="$4" maxWidth={448} fontSize="$4" textAlign="center" color="$color11" $md={{ fontSize: "$6" }} lineHeight="1.5">
              Start with a sentence. Publish it when it looks right.
            </Paragraph>
          </Reveal>
        </YStack>

        {/* ── Community — what people built, linking out to the showcase ── */}
        <YStack borderTopWidth={1} borderColor="$borderColor" paddingHorizontal="$4" paddingVertical="$10" $md={{ paddingHorizontal: "$6" }}>
          <YStack alignSelf="center" width="100%" maxWidth={672} alignItems="center">
            <H2 fontSize="$8" fontWeight="500" letterSpacing={-0.4} textAlign="center" $md={{ fontSize: "$10" }} lineHeight="1.1">
              Built on Hanzo.
            </H2>
            <Paragraph marginTop="$3" fontSize="$3" lineHeight="1.625" color="$color11" textAlign="center" maxWidth={512}>
              Forks, remixes, and example apps from the community — every entry
              names the template it came from and who built it.
            </Paragraph>
            <Link href="/community"><XStack marginTop="$5" height={44} alignItems="center" gap="$1.5" borderRadius="$6" borderWidth={1} borderColor="$borderColor" backgroundColor="$color002" paddingHorizontal="$4.5" hoverStyle={{ borderColor: "$color06", backgroundColor: "$color005" }}>
              <SizableText fontSize="$3" fontWeight="500" color="$color">See what people built</SizableText>
            </XStack></Link>
          </YStack>
        </YStack>

        <LazySection minHeight={200}><PreFooterCTA /></LazySection>
        <LazySection minHeight={240}><SiteFooter /></LazySection>

        {/* THE composer — one on the page, and this is its flow slot.
            It rides the BOTTOM OF THE VIEWPORT the whole way down, and it is
            the LAST thing on the page so that "the whole way down" means the
            footer too. It used to sit above the community band and the footer,
            which is a slot it REACHES: a sticky box comes to rest when its own
            flow position scrolls into view, so the composer settled two
            sections early and the rest of the page scrolled with no way to
            type. Everything that is not the composer now comes before it.

            Two placement rules the sticky depends on, both easy to undo by
            accident. It must be the LAST child of the stack it rides — a sticky
            box is held inside its containing block and pins only while its own
            flow position is below the viewport — and it must sit OUTSIDE any
            Reveal, whose fade-up is a transform, and a transformed ancestor
            becomes the containing block for everything positioned inside it
            (the composer's own popovers included).

            `.hz-dock` in assets/globals.css is the whole pinning rule, and it
            carries the ground the page passes behind. */}
        <YStack
          className="hz-dock"
          paddingHorizontal="$4"
          $md={{ paddingHorizontal: "$6" }}
        >
          <YStack id="build" alignSelf="center" width="100%" maxWidth={672}>
            <BuildComposer
              ref={composer}
              showPill={false}
              subline={false}
              typewriter={TYPED}
              onSubmit={startBuild}
            />
          </YStack>
        </YStack>
      </YStack>
    </YStack>
  );
}
