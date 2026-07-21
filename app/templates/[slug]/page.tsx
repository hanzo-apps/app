// /templates/<slug> — the rich, SEO-shaped detail page for one real template.
//
// Statically generated for every catalog slug (generateStaticParams over
// TEMPLATES). Per-template <title>/description/OpenGraph come from the catalog's
// seoTitle/seoDescription, with the real self-hosted shot as the OG image when
// one exists. Unknown slugs → notFound().

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getTemplate,
  relatedTemplates,
  TEMPLATES,
} from "@/lib/templates-catalog";
import { TemplateDetail } from "@/components/templates/template-detail";

const SITE = "https://hanzo.app";

export function generateStaticParams() {
  return TEMPLATES.map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const t = getTemplate(slug);
  if (!t) return { title: "Template not found | Hanzo" };

  const url = `${SITE}/templates/${t.slug}`;
  // Only claim an OG image when a real self-hosted shot exists; otherwise let the
  // crawler fall back to the site default rather than pointing at a missing file.
  const images = t.hasShot
    ? [{ url: `${SITE}/templates/${t.slug}.webp`, alt: t.name }]
    : undefined;

  return {
    title: t.seoTitle,
    description: t.seoDescription,
    alternates: { canonical: url },
    openGraph: {
      title: t.seoTitle,
      description: t.seoDescription,
      url,
      siteName: "Hanzo",
      type: "website",
      images,
    },
    twitter: {
      card: images ? "summary_large_image" : "summary",
      title: t.seoTitle,
      description: t.seoDescription,
      images: images?.map((i) => i.url),
    },
  };
}

export default async function TemplateDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const template = getTemplate(slug);
  if (!template) notFound();

  return (
    <TemplateDetail template={template} related={relatedTemplates(slug, 4)} />
  );
}
