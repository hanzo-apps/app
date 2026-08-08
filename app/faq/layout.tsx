import type { Metadata } from "next";
export { default } from "@/lib/seo";

export const metadata: Metadata = {
  title: "FAQ — Hanzo",
  description:
    "Questions, answered: how hanzo.app works, what powers it, and how billing runs.",
  alternates: { canonical: "/faq" },
};
