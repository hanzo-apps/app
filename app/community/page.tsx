"use client";

// /community — for now, the community IS the templates: every template in the
// gallery, published under a real Hanzo community user (hanzo-dev / zeekay /
// zooqueen). This renders the ONE `TemplateGallery` (the same surface as
// /gallery and the in-app Templates view — no forked copy) with community
// framing + author attribution. When user-published sites land (git.hanzo.ai →
// S3), they flow into this same surface.

import Header from "@/components/layout/header";
import SiteFooter from "@/components/landing/site-footer";
import { TemplateGallery } from "@/components/template-gallery";

export default function CommunityPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <Header />
      <TemplateGallery
        eyebrow="Community"
        heading="Built by the Hanzo community"
        lead="Production-ready apps our community publishes — fork any into the builder, remix with AI, and ship it live on Hanzo Cloud."
        showAuthor
      />
      <SiteFooter />
    </div>
  );
}
