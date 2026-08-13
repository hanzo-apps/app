"use client";

import { SizableText, YStack, XStack, H1, Paragraph, H2, H3 } from '@hanzo/ui';
import { useState, useEffect, useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Github } from "lucide-react";
import { fetchPublishedSlugs } from "@/lib/api/templates";
import Header from "@/components/layout/header";
import Reveal from "@/components/landing/reveal";
import HeroVideo from "@/components/landing/hero-video";
import LazySection from "@/components/landing/lazy-section";
import { TemplateThumb } from "@/components/template-thumb";
import { TEMPLATE_SHOTS } from "@/lib/template-shots";
import { bySpectrum } from "@/lib/template-hues";
import { BuildComposer, type ComposerMode } from "@/components/build-composer";
import { ProjectThumb } from "@/components/project-thumb";

// Below-the-fold sections: code-split out of the initial bundle and mounted on
// scroll via <LazySection>. The hero — Header, film and composer — stays eager
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
  const { openLoginWindow, user } = useUser();
  const router = useRouter();
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
      localStorage.setItem("redirectAfterLogin", "/dev");
      openLoginWindow();
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
    // would make this box the scrollport for everything inside it and the
    // composer's `position: sticky` would do nothing at all.
    <YStack position="relative" minHeight="100%" backgroundColor="$background" className="landing-root">
      {/* Monochrome hero glow — single soft white radial, zero hue. */}
      <YStack pointerEvents="none" position="fixed" top={0} right={0} bottom={0} left={0} zIndex={0} overflow="hidden">
        <YStack position="absolute" left="50%" top="-12%" height={560} width={900} marginLeft={-450} borderRadius="$10" backgroundColor="$color0075" filter="blur(130px)" />
      </YStack>

      <Header />

      {/* Everything the composer rides over, and its own flow slot at the end.
          A sticky box is held inside its containing block, so this stack is
          exactly the run of the page the composer stays on screen for: the hero
          through the closing CTA, where it comes to rest. */}
      <YStack position="relative" zIndex={10}>
        {/* ── Hero — the first screen: the sentence, the film, the composer ──
            `100svh` so the hero OWNS the fold: the copy and the film centre in
            the space above the composer's slot (the padding below), and the
            composer sits at the bottom of this screen with nothing scrolling
            under it. It is the small viewport unit because a phone's URL bar
            moves the large one, which would push the composer under the fold on
            first paint. */}
        <YStack minHeight="100svh" justifyContent="center" paddingHorizontal="$4" paddingBottom={200} paddingTop="$8" $md={{ paddingHorizontal: "$6" }}>
          {/* The film comes FIRST — it is what the screen opens with, and the
              sentence reads under it. A phone therefore stacks film, pill,
              headline, subline, with the composer already at the bottom.

              From $lg the two stand side by side instead, because stacked they
              cannot both be big: a 1280x800 fold holds the copy, the composer's
              123px dock and its 200px reserve, which leaves the film 248px of
              height — a 331px thumbnail. Beside the copy it is 576x432. The row
              is `row-reverse` so the film keeps its place as the FIRST thing in
              the document and still lands on the right, where a product shot
              belongs next to a left-aligned headline.

              1200 is two 576px columns and the $8 (48px) gap between them, and
              576 is measured: it is the width the headline needs for the two
              deliberate lines its <br> writes. At 1152 the columns came out 552
              and "Hanzo builds and ships it." broke across two more. */}
          <YStack alignSelf="center" width="100%" maxWidth={768} gap="$6" $lg={{ flexDirection: "row-reverse", alignItems: "center", maxWidth: 1200, gap: "$8" }}>
            {/* The film — the hero visual, playing before anyone scrolls, and
                the first thing in the fold rather than something under it.
                Deliberately bare of LazySection and Reveal: both decide when it
                may be seen, and its one job is to already be running. `.hz-fold`
                (assets/globals.css) is what keeps it inside the fold. */}
            <YStack className="hz-fold" alignSelf="center" width="100%" $lg={{ flex: 1, minWidth: 0 }}>
              <HeroVideo />
            </YStack>

            <YStack alignSelf="center" maxWidth={768} $lg={{ flex: 1, width: "100%", maxWidth: 576 }}>
              <Reveal>
                <XStack alignSelf="center" marginBottom="$4.5" alignItems="center" gap="$2" borderRadius="$10" borderWidth={1} borderColor="$borderColor" backgroundColor="$color0025" paddingHorizontal="$3" paddingVertical="$1.5" $lg={{ alignSelf: "flex-start" }}>
                  <SizableText fontFamily="$mono" fontSize="$1" color="$color11">
                    Apps, wired to real data &amp; AI
                  </SizableText>
                </XStack>
              </Reveal>

              <Reveal delay={60}>
                {/* 17px is the largest size that keeps the WHOLE sentence on one
                    line at 390: measured, 358px of room and 17.5px renders 354 —
                    so this is the fit with the slack a webfont's metrics need.
                    At 30.4px it wrapped to three lines with "it." alone on the
                    last. $sm and up are untouched, where the <br> below splits it
                    into two deliberate lines. */}
                <H1 fontSize={17} fontWeight="600" textAlign="center" lineHeight="1.05" letterSpacing={-0.4} $sm={{ fontSize: "$12" }} $md={{ fontSize: 48 }} $lg={{ textAlign: "left" }}>
                  {/* The space is explicit: JSX drops the whitespace around the <br>,
                      and the <br> is hidden below sm — without it the mobile heading
                      reads "Describe your app.Hanzo builds and ships it." */}
                  Describe your app.{' '}
                  <br className="break-sm" />
                  Hanzo builds and ships it.
                </H1>
              </Reveal>

              <Reveal delay={120}>
                {/* 12 on a phone, and the media queries are MIN-width, so that is the
                    BASE and $md is the desktop branch. Written the other way round it
                    reads as "small on phones" and does the exact opposite. $4 measured
                    15px here, which wrapped the sentence to three lines at 390. */}
                <Paragraph alignSelf="center" marginTop="$4.5" maxWidth={576} fontSize={12} textAlign="center" color="$color11" $md={{ fontSize: "$6" }} $lg={{ alignSelf: "flex-start", textAlign: "left" }} lineHeight="1.5">
                  One prompt becomes a live app on Hanzo Cloud — UI, database,
                  auth, and 400+ AI models, wired in and deployed.
                </Paragraph>
              </Reveal>
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
                            cursor="pointer" width={280} flexShrink={0} group className="zoom-scope hz-strip-card" overflow="hidden" borderRadius="$6" borderWidth={1} borderColor="$borderColor" backgroundColor="$color002" hoverStyle={{ borderColor: "$color02", backgroundColor: "$color005" }}
                          >
                            <YStack position="relative" overflow="hidden" height={175} backgroundColor="$color002">
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
                    Every app ships on Hanzo Cloud with database, auth, and AI
                    built in.
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
                    Jump back into your recent projects.
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

        {/* ── Ship your first app today — where the composer comes to rest ── */}
        <YStack borderTopWidth={1} borderColor="$borderColor" paddingHorizontal="$4" paddingVertical="$11" $md={{ paddingHorizontal: "$6", paddingVertical: "$10" }}>
          <Reveal alignSelf="center" width="100%" maxWidth={672}>
            <H2 fontSize="$10" fontWeight="500" textAlign="center" letterSpacing={-0.4} $md={{ fontSize: "$12" }} lineHeight="1.1">
              Ship your first app today.
            </H2>
            <Paragraph alignSelf="center" marginTop="$4" maxWidth={448} fontSize="$4" textAlign="center" color="$color11" $md={{ fontSize: "$6" }} lineHeight="1.5">
              Start with a sentence. Deploy to Hanzo Cloud in one click.
            </Paragraph>
          </Reveal>
        </YStack>

        {/* THE composer — one on the page, and this is its flow slot.
            It must be the LAST child of the stack it rides (a sticky box is
            held inside its containing block, and it pins only while its own
            flow position is below the viewport), and OUTSIDE the Reveal above
            it, whose fade-up transform would make it scroll like anything else.
            .hz-dock (assets/globals.css) is the whole pinning rule. */}
        <YStack
          className="hz-dock"
          paddingHorizontal="$4"
          $md={{ paddingHorizontal: "$6" }}
        >
          <YStack id="build" alignSelf="center" width="100%" maxWidth={672}>
            <BuildComposer
              showPill={false}
              subline={false}
              typewriter={TYPED}
              onSubmit={startBuild}
            />
          </YStack>
        </YStack>
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
            <SizableText fontSize="$3" fontWeight="500" color="$color">Explore the community</SizableText>
          </XStack></Link>
        </YStack>
      </YStack>

      <LazySection minHeight={200}><PreFooterCTA /></LazySection>
      <LazySection minHeight={240}><SiteFooter /></LazySection>
    </YStack>
  );
}
