import type { Metadata } from "next";
export { default } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Documentation",
  description:
    "Everything you need to build with Hanzo. Start in the builder, then reach for the full docs, the API, and the template gallery when you need them.",
  alternates: { canonical: "/docs" },
};
