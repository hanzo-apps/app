import BuildsIndexPageView from './view';
import { listBuilds } from '@/lib/builds';

// /builds — every published build. The index a gallery links from.
//
// Empty is a HONEST state here, not a failure: builds appear only when an author
// publishes one, so an empty list says exactly that and explains how to add one.

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Builds",
  description:
    "The agent sessions behind Hanzo products — every turn bound to the commit it produced, forkable from any point.",
  alternates: { canonical: "https://hanzo.app/builds" },
};

export default async function BuildsIndexPage() {
  return <BuildsIndexPageView builds={await listBuilds()} />;
}
