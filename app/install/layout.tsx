import type { Metadata } from "next";
export { default } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Install Hanzo — CLI, MCP, Node, Desktop & extensions",
  description:
    "Get Hanzo everywhere: the CLI (curl -fsSL https://hanzo.sh | sh), the MCP and Zap servers, Hanzo Node and Desktop, and the browser and editor extensions.",
  alternates: { canonical: "/install" },
};
