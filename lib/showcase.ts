// lib/showcase.ts — the Community showcase data layer.
//
// The showcase answers ONE question for a visitor: "what do people actually
// build on Hanzo?" Two honest sources, zero fabrication:
//
//   1. LIVE apps    — real, reachable deployments we curate (DEPLOYED_APPS).
//   2. STARTERS     — the public repos in the `hanzo-apps` GitHub org, fetched
//                     at request time (ISR, 1h) with a baked FALLBACK so the
//                     page always renders even if GitHub rate-limits us.
//
// Every starter opens in the builder through the ONE canonical import wire
// (`repoImportLink` → /dev?repo=…&action=edit) — fork-to-remix in one click.
// The page is org-agnostic: point `HANZO_APPS_ORG` at a future community org
// and everything downstream follows.

import { repoImportLink } from "@/lib/api/git";

export const HANZO_APPS_ORG = "hanzo-apps";
export const HANZO_APPS_URL = `https://github.com/${HANZO_APPS_ORG}`;

/** A forkable starter / project (a `hanzo-apps` repo). */
export interface ShowcaseRepo {
  /** Human title (e.g. "Kanban Lane"). */
  name: string;
  /** `hanzo-apps/kanban-lane` — the real repo path. */
  fullName: string;
  /** One scannable line (repo description, boilerplate trimmed). */
  tagline: string;
  /** GitHub repo URL. */
  repoUrl: string;
  /** Builder deep-link that clones + opens this repo (/dev?repo=…). */
  forkUrl: string;
  /** Live homepage, if the repo sets one. */
  liveUrl?: string;
  language?: string;
  stars: number;
}

/** A real, reachable Hanzo deployment (curated). */
export interface DeployedApp {
  /** Display name = the domain it lives at. */
  name: string;
  tagline: string;
  liveUrl: string;
  repoUrl: string;
}

// ── LIVE apps (curated, real, reachable) ─────────────────────────────────────
// Every entry is a live CNAME-backed site with a public source repo in the
// hanzo-apps / hanzoai orgs. No invented products, no dead links.
export const DEPLOYED_APPS: DeployedApp[] = [
  {
    name: "hanzo.ai",
    tagline: "The Hanzo AI platform — models, cloud, and the whole stack.",
    liveUrl: "https://hanzo.ai",
    repoUrl: "https://github.com/hanzo-apps/hanzo.ai",
  },
  {
    name: "hanzo.agency",
    tagline: "Humans + AI. A studio that designs and ships.",
    liveUrl: "https://hanzo.agency",
    repoUrl: "https://github.com/hanzo-apps/agency",
  },
  {
    name: "hanzo.industries",
    tagline: "Open AI research and infrastructure.",
    liveUrl: "https://hanzo.industries",
    repoUrl: "https://github.com/hanzo-apps/hanzo.industries",
  },
  {
    name: "hanzo.network",
    tagline: "A decentralized AI compute marketplace.",
    liveUrl: "https://hanzo.network",
    repoUrl: "https://github.com/hanzo-apps/hanzo.network",
  },
  {
    name: "hanzo.computer",
    tagline: "Hanzo Computer — an agentic desktop for real work.",
    liveUrl: "https://hanzo.computer",
    repoUrl: "https://github.com/hanzo-apps/computer",
  },
  {
    name: "hanzo.id",
    tagline: "Unified identity — one login for the whole stack.",
    liveUrl: "https://hanzo.id",
    repoUrl: "https://github.com/hanzoai/hanzo.id",
  },
  {
    name: "hanzo.sh",
    tagline: "One line to install the Hanzo CLI.",
    liveUrl: "https://hanzo.sh",
    repoUrl: "https://github.com/hanzo-apps/hanzo.sh",
  },
  {
    name: "hips.hanzo.ai",
    tagline: "Hanzo Improvement Proposals — the open spec index.",
    liveUrl: "https://hips.hanzo.ai",
    repoUrl: "https://github.com/hanzo-apps/HIPs",
  },
];

// Deployed-site repos are shown in the LIVE grid, so keep them out of the
// STARTERS grid; meta/governance repos aren't "fork-a-starter" material either.
const EXCLUDE = new Set([
  "hanzo.ai",
  "agency",
  "hanzo.industries",
  "hanzo.network",
  "hanzo.sh",
  "computer",
  "HIPs",
  "sensei.group",
  "hanzo.one",
  "press",
  "vote",
  "datatable",
]);

// ── STARTERS (live from GitHub, with a baked fallback) ───────────────────────

interface GithubRepo {
  name: string;
  full_name: string;
  html_url: string;
  description: string | null;
  homepage: string | null;
  language: string | null;
  stargazers_count: number;
  pushed_at: string;
  archived: boolean;
  fork: boolean;
  private: boolean;
}

/** Title-case a repo slug: `kanban-lane` → "Kanban Lane". */
function prettyName(slug: string): string {
  return slug
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

// Repo descriptions all trail into the same "on the Hanzo stack (Vite + React
// 19 + @hanzo/gui + @hanzo/iam + @hanzo/base). Fork it on hanzo.app." — true,
// but repeated on every card is noise. We surface that ONCE as a section
// subtitle and trim it here so each card leads with what the app actually is.
const BOILERPLATE =
  /\s*[—-]?\s*(?:a\s+)?(?:real\s+)?Hanzo[- ](?:stack|app)\b|\s*on the Hanzo stack\b|\s*\bon Hanzo\b|\s*\(?\bVite \+ React\b|\s*\(?React \d|\s*@hanzo\/|\s*\bFork it on hanzo\.app/i;

function cleanTagline(desc?: string | null): string {
  const fallback = "A Hanzo-stack starter — fork it and make it yours.";
  if (!desc) return fallback;
  let t = (desc.split(BOILERPLATE)[0] || desc)
    .replace(/\s+/g, " ")
    .trim()
    .replace(/[\s.,:;—-]+$/, "")
    .replace(/\s+\(?on(\s+the)?$/i, "")
    .replace(/[\s.,:;—-]+$/, "")
    .trim();
  if (!t) t = fallback;
  if (t.length > 130) t = `${t.slice(0, 127).trimEnd()}…`;
  return t;
}

function toShowcaseRepo(r: GithubRepo): ShowcaseRepo {
  return {
    name: prettyName(r.name),
    fullName: r.full_name,
    tagline: cleanTagline(r.description),
    repoUrl: r.html_url,
    forkUrl: repoImportLink(r.html_url),
    liveUrl: r.homepage && /^https?:\/\//.test(r.homepage) ? r.homepage : undefined,
    language: r.language ?? undefined,
    stars: r.stargazers_count ?? 0,
  };
}

function fallbackRepo(slug: string, tagline: string): ShowcaseRepo {
  const repoUrl = `${HANZO_APPS_URL}/${slug}`;
  return {
    name: prettyName(slug),
    fullName: `${HANZO_APPS_ORG}/${slug}`,
    tagline,
    repoUrl,
    forkUrl: repoImportLink(repoUrl),
    stars: 0,
  };
}

// Baked from the live org — real repos, hand-trimmed taglines. Used only when
// the GitHub API is unreachable so the page is never empty.
export const FALLBACK_REPOS: ShowcaseRepo[] = [
  fallbackRepo("hanzo-starter", "The canonical Hanzo app starter — fork it and go."),
  fallbackRepo("kanban-lane", "A focused kanban board — To Do / Doing / Done."),
  fallbackRepo("booking-timeslot", "Cadence — a calm timeslot-booking scheduler."),
  fallbackRepo("waitlist-launchpad", "A dark, motion-rich launch landing with a live signup counter."),
  fallbackRepo("shop-storefront", "MONO — a minimal editorial product storefront."),
  fallbackRepo("digital-dropstore", "Sell digital downloads and drops."),
  fallbackRepo("reading-shelf", "Track your books and reading progress."),
  fallbackRepo("expense-spend", "Log expenses by category and see where the money goes."),
  fallbackRepo("inventory-stockroom", "A dense inventory tracker with low-stock alerts."),
  fallbackRepo("sprint-retro", "Run team retrospectives that actually stick."),
  fallbackRepo("helpdesk-deskline", "Deskline — a simple support-ticket queue."),
  fallbackRepo("daily-standup", "An async standup tracker for small teams."),
  fallbackRepo("meetup-gather", "Warm community meetup pages with RSVPs."),
  fallbackRepo("feature-upvote", "A feature-request voting board."),
  fallbackRepo("product-trailmap", "A public product roadmap — Now / Next / Later."),
  fallbackRepo("link-onepage", "A link-in-bio page you actually own."),
  fallbackRepo("dispatch-newsletter", "A newsletter archive and signup."),
  fallbackRepo("resume-curriculum", "A polished, print-friendly online resume."),
];

/**
 * The forkable starters — freshest first, live from GitHub with a baked
 * fallback. Never throws: any failure returns FALLBACK_REPOS so the page
 * always renders.
 */
export async function fetchShowcaseRepos(limit = 24): Promise<ShowcaseRepo[]> {
  try {
    const res = await fetch(
      `https://api.github.com/orgs/${HANZO_APPS_ORG}/repos?per_page=100&sort=pushed&type=public`,
      {
        headers: {
          Accept: "application/vnd.github+json",
          "User-Agent": "hanzo-app-community",
        },
        next: { revalidate: 3600 },
      },
    );
    if (!res.ok) throw new Error(`github ${res.status}`);
    const raw = (await res.json()) as GithubRepo[];
    const repos = raw
      .filter((r) => !r.archived && !r.fork && !r.private && !EXCLUDE.has(r.name))
      .slice(0, limit)
      .map(toShowcaseRepo);
    return repos.length > 0 ? repos : FALLBACK_REPOS;
  } catch {
    return FALLBACK_REPOS;
  }
}
