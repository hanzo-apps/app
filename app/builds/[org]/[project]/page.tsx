// /builds/<org>/<project> — the session that built one product, start to finish.
//
// Dynamic, not statically generated: which builds exist is the authors' running
// decision, so a new one must appear without a redeploy of this site.

import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { BuildTranscript } from "@/components/builds/build-transcript";
import { getBuild } from "@/lib/builds";

const SITE = "https://hanzo.app";

type Params = { params: Promise<{ org: string; project: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { org, project } = await params;
  const build = await getBuild(org, project);
  if (!build) return { title: "Build not found" };

  const title = build.title || `How ${build.project} was built`;
  const description =
    `The agent session that built ${org}/${project}: ${build.turns.length} turns, ` +
    `each bound to the commit it produced. Forkable from any point.`;
  const url = `${SITE}/builds/${org}/${project}`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, siteName: "Hanzo", type: "article" },
    twitter: { card: "summary", title, description },
  };
}

export default async function BuildPage({ params }: Params) {
  const { org, project } = await params;
  const build = await getBuild(org, project);
  if (!build) notFound();
  return <BuildTranscript build={build} />;
}
