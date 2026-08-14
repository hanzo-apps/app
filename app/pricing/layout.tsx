import type { Metadata } from "next";
export { default } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Every Hanzo plan and what it includes. One monthly allowance covers AI in the builder, in Hanzo Chat and through the API.",
  alternates: { canonical: "/pricing" },
};
