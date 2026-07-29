'use client';

import { SizableText } from '@hanzo/gui';
// Single source of truth for FAQ copy across the marketing/support surfaces.
// /pricing renders `billingFaq`; /faq renders every group. Honest answers only —
// no invented metrics, no upstream model-vendor names (brand policy: Zen + Enso).

import Link from "next/link";
import type { QA } from "./faq-section";

export const billingFaq: QA[] = [
  {
    q: "What counts as usage?",
    a: (
      <>
        AI generation counts as usage — building and editing apps in the
        builder, messages in Hanzo Chat, and calls to the API at{" "}
        <SizableText fontFamily="$mono" color="$color">api.hanzo.ai</SizableText>. Hosting
        your published apps on Hanzo Cloud is included. Every plan draws from a
        single monthly shared-usage allowance, so you are never billed three
        times for the same AI.
      </>
    ),
  },
  {
    q: "Is my usage really shared across every Hanzo app?",
    a: (
      <>
        Yes. One subscription powers AI everywhere Hanzo runs — the app builder,
        Hanzo Chat, and the API — from the same allowance. Build an app in the
        morning and chat against the same balance in the afternoon; it all comes
        out of one pool.
      </>
    ),
  },
  {
    q: "What is the difference between Pro, Team, and Max?",
    a: (
      <>
        They are the same product with a larger monthly shared-usage allowance
        as you go up: <SizableText color="$color">Pro ($20)</SizableText> for
        individuals, <SizableText color="$color">Team ($100)</SizableText> adds an
        organization with multiple seats and shared billing, and{" "}
        <SizableText color="$color">Max ($200)</SizableText> gives your org the
        largest allowance with priority support.
      </>
    ),
  },
  {
    q: "Do team plans include seats for my whole org?",
    a: (
      <>
        Team and Max are billed per organization, not per person. Invite your
        teammates into one org with shared projects and one bill. Roles keep
        owners and members separated.
      </>
    ),
  },
  {
    q: "Can I cancel anytime?",
    a: (
      <>
        Yes. Plans are month-to-month — cancel or change tier whenever you like
        from your{" "}
        <Link href="/billing"><SizableText color="$color" textDecorationLine="underline" hoverStyle={{ color: "$color" }}>
          billing settings
        </SizableText></Link>
        . There is no long-term contract.
      </>
    ),
  },
];

export const productFaq: QA[] = [
  {
    q: "What is hanzo.app?",
    a: (
      <>
        hanzo.app is Hanzo&apos;s AI app builder. Describe what you want in plain
        language and it generates a real, full-stack app — then publishes it live
        on Hanzo Cloud with database, auth, and AI already wired in. No
        boilerplate, no setup.
      </>
    ),
  },
  {
    q: "Which AI models power it?",
    a: (
      <>
        hanzo.app builds with Hanzo&apos;s own{" "}
        <SizableText color="$color">Zen</SizableText> and{" "}
        <SizableText color="$color">Enso</SizableText> model families, served through
        the Hanzo AI API at{" "}
        <SizableText fontFamily="$mono" color="$color">api.hanzo.ai</SizableText>. The same
        gateway gives every app you publish one OpenAI-compatible endpoint to 400+
        frontier models — swap models with a single string.
      </>
    ),
  },
  {
    q: "How do I publish and share an app?",
    a: (
      <>
        Every project deploys to a live{" "}
        <SizableText fontFamily="$mono" color="$color">*.hanzo.app</SizableText> URL you can
        share immediately. Publishing is one click from the builder — the running
        app is the deliverable, not a zip file.
      </>
    ),
  },
  {
    q: "Can I use my own custom domain?",
    a: (
      <>
        Yes. Published apps get a <SizableText fontFamily="$mono" color="$color">*.hanzo.app</SizableText>{" "}
        address out of the box, and you can connect your own custom domain from
        the app&apos;s settings.
      </>
    ),
  },
  {
    q: "Can I export to GitHub or import an existing repo?",
    a: (
      <>
        Both. Connect GitHub to import a repository into the builder and keep
        building, or push your project out to your own repo at any time. You can
        also fork any open-source template from the{" "}
        <Link href="/community"><SizableText color="$color" textDecorationLine="underline" hoverStyle={{ color: "$color" }}>
          community gallery
        </SizableText></Link>
        .
      </>
    ),
  },
  {
    q: "Who owns my code and data?",
    a: (
      <>
        You do. Your code and data are yours to export to GitHub whenever you
        want, and your published apps run on Hanzo Cloud under your account.
        Leaving is always a <SizableText fontFamily="$mono" color="$color">git push</SizableText>{" "}
        away.
      </>
    ),
  },
];
