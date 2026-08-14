import type { Metadata } from "next";
export { default } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Features",
  description:
    "What comes with every app Hanzo builds: the code, an editor, a database, sign-in, AI, file storage, and a URL to publish it on.",
  alternates: { canonical: "/features" },
};
