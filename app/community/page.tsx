// /community — what people BUILT on Hanzo.
//
// This page used to be a SECOND catalog: a hand-kept list of live apps plus its
// own live GitHub fetch of one org. Two catalogs cannot agree — one of them is
// always the stale one, and a page that curates itself can only ever show what
// somebody remembered to add. It now browses the ONE corpus (/v1/catalog),
// pinned to the community lane, which is the same request /catalog and the
// templates lane make. One API, different views.
//
// The lane is `origin=community`: forks, remixes, and our own seeded example
// apps — the last of which are marked by the platform-gated Official marker, not
// by living somewhere different. That is why they can share a lane honestly.

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import Header from "@/components/layout/header";
import SiteFooter from "@/components/landing/site-footer";
import { CatalogBrowser } from "@/components/catalog-browser";
import { OFFICIAL_LABEL } from "@/lib/template-authors";

export const metadata = {
  title: "Community — Built on Hanzo",
  description:
    "Every app people have built on Hanzo, with the template each one was forked from. Fork any of them and ship yours.",
};

export default function CommunityPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <CatalogBrowser
        origin="community"
        title="Community"
        blurb={
          <>
            What people built on Hanzo — forks, remixes, and our own example apps.
            Every entry names the template it came from and who built it, so you
            can follow a lineage instead of scrolling a pile. Ours carry a{" "}
            {OFFICIAL_LABEL} badge; everything else belongs to whoever built it.{" "}
            <Link
              href="/templates"
              className="underline underline-offset-4 hover:text-foreground"
            >
              Start from a template
            </Link>{" "}
            to add yours.
          </>
        }
      />
      <section className="border-t border-border px-4 py-16 text-center md:px-8 md:py-20">
        <div className="mx-auto max-w-2xl">
          <h2 className="text-2xl font-medium tracking-tight md:text-3xl">
            Build something worth showing off.
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            Fork a starter or start from a blank prompt. Either way you are live
            on Hanzo Cloud — database, auth, AI and storage already wired.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/dev"
              className="inline-flex h-11 items-center gap-1.5 rounded-xl bg-primary px-5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Start building <ArrowUpRight className="h-4 w-4" />
            </Link>
            <Link
              href="/templates"
              className="inline-flex h-11 items-center gap-1.5 rounded-xl border border-border px-5 text-sm font-medium text-foreground transition-colors hover:bg-card"
            >
              Browse templates
            </Link>
          </div>
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}
