import type { Metadata } from "next";
export { default } from "@/lib/seo";

export const metadata: Metadata = {
  // "Builder pricing", not "Pricing". The root template appends the brand, so a
  // bare "Pricing" here rendered `Pricing — Hanzo AI` — byte-identical to
  // hanzo.ai/pricing's title, on a different page with a different h1. Two of
  // our own pages were competing for one result, and a title is what a search
  // result IS, so the one that says which pricing wins the click it deserves.
  // The canonical below is unchanged and still self: these are two real pages,
  // not one page at two addresses.
  title: "Builder pricing",
  description:
    "Every Hanzo plan and what it includes. One monthly allowance covers AI in the builder, in Hanzo Chat and through the API.",
  alternates: { canonical: "/pricing" },
};
