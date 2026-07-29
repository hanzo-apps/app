import CommunityPageView from './view';

// /community — what people BUILT on Hanzo.
//
// This page used to be a SECOND catalog: a hand-kept list of live apps plus its
// own live GitHub fetch of one org. Two catalogs cannot agree — one of them is
// always the stale one, and a page that curates itself can only ever show what
// somebody remembered to add. It now browses the ONE corpus (/v1/catalog),
// pinned to the community lane, which is the same request /catalog and the
// templates lane make. One API, different views.
//
// The lane is `origin=community`: forks, remixes, and our own seeded example
// apps — the last of which are marked by the platform-gated Official marker, not
// by living somewhere different. That is why they can share a lane honestly.

export const metadata = {
  title: "Community — Built on Hanzo",
  description:
    "Every app people have built on Hanzo, with the template each one was forked from. Fork any of them and ship yours.",
};

export default function CommunityPage() {
  return <CommunityPageView />;
}
