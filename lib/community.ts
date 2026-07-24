// lib/community.ts — the Hanzo community feed data layer.
//
// The community feed is everything built ON Hanzo: apps shipped from hanzo.app +
// projects in the `hanzo-apps` GitHub org. It is backed by the `community_projects`
// Base collection (hanzo-app-base, SQLite) — the ONE store, moderated.
//
// SAFETY-FIRST MODERATION (the hard rule): nothing appears on the public feed by
// default. Every ingested project lands as `pending`; ONLY `published` and `pinned`
// render publicly, and an admin can `hidden` anything. So "weird shit people build"
// can never sit on the public feed unreviewed — the public read is a positive
// allow-list, never a blocklist.

import type { BaseClient } from "@hanzo/base";

export const COMMUNITY_COLLECTION = "community_projects";

/** Moderation lifecycle. Public feed = published | pinned ONLY. */
export type CommunityStatus = "pending" | "published" | "pinned" | "hidden";

/** Where a project came from. */
export type CommunitySource = "hanzo-app" | "github";

export interface CommunityProject {
  id?: string;
  /** Stable dedupe key: `${source}:${slugOrRepo}`. */
  key: string;
  source: CommunitySource;
  title: string;
  description?: string;
  /** Live app URL (hanzo.app deploy) or repo homepage. */
  url?: string;
  /** Source repo (github: full name `hanzo-apps/foo`; hanzo-app: project slug). */
  repo?: string;
  /** Card image (screenshot / OG image). */
  thumbnail?: string;
  author?: string;
  tags?: string[];
  stars?: number;
  status: CommunityStatus;
  /** Admin sort weight (pinned cards, high→low). */
  weight?: number;
  updatedAt?: string;
}

/** The two states that render on the PUBLIC feed. Everything else is private. */
export const PUBLIC_STATUSES: CommunityStatus[] = ["published", "pinned"];

/** A Base filter string selecting only publicly-visible projects. */
export function publicFilter(): string {
  return PUBLIC_STATUSES.map((s) => `status="${s}"`).join(" || ");
}

/** Pinned first (by weight desc), then most-recently-updated. Pure — easy to test. */
export function orderForPublic(items: CommunityProject[]): CommunityProject[] {
  return [...items].sort((a, b) => {
    const ap = a.status === "pinned" ? 1 : 0;
    const bp = b.status === "pinned" ? 1 : 0;
    if (ap !== bp) return bp - ap;
    if (ap && bp && (a.weight ?? 0) !== (b.weight ?? 0)) return (b.weight ?? 0) - (a.weight ?? 0);
    return (b.updatedAt ?? "").localeCompare(a.updatedAt ?? "");
  });
}

// ── Base access (records ↔ CommunityProject) ────────────────────────────────

type Rec = Record<string, unknown> & { id: string };

function toProject(r: Rec): CommunityProject {
  return {
    id: r.id,
    key: String(r.key ?? ""),
    source: (r.source as CommunitySource) ?? "github",
    title: String(r.title ?? ""),
    description: r.description ? String(r.description) : undefined,
    url: r.url ? String(r.url) : undefined,
    repo: r.repo ? String(r.repo) : undefined,
    thumbnail: r.thumbnail ? String(r.thumbnail) : undefined,
    author: r.author ? String(r.author) : undefined,
    tags: Array.isArray(r.tags) ? (r.tags as string[]) : typeof r.tags === "string" && r.tags ? String(r.tags).split(",") : [],
    stars: typeof r.stars === "number" ? r.stars : undefined,
    status: (r.status as CommunityStatus) ?? "pending",
    weight: typeof r.weight === "number" ? r.weight : 0,
    updatedAt: r.updated ? String(r.updated) : r.updatedAt ? String(r.updatedAt) : undefined,
  };
}

/** List the PUBLIC feed (published + pinned), pinned first. Never returns pending/hidden. */
export async function listPublic(base: BaseClient, limit = 60): Promise<CommunityProject[]> {
  const res = await base
    .collection(COMMUNITY_COLLECTION)
    .getList(1, limit, { filter: publicFilter(), sort: "-updated" });
  return orderForPublic((res.items as Rec[]).map(toProject));
}

/** List EVERYTHING for the admin moderation queue (all statuses), newest first. */
export async function listAll(base: BaseClient, limit = 200): Promise<CommunityProject[]> {
  const res = await base
    .collection(COMMUNITY_COLLECTION)
    .getList(1, limit, { sort: "-updated" });
  return (res.items as Rec[]).map(toProject);
}

/** Set a project's moderation status (+ optional pin weight). The one moderation mutation. */
export async function setStatus(
  base: BaseClient,
  id: string,
  status: CommunityStatus,
  weight?: number,
): Promise<void> {
  const patch: Record<string, unknown> = { status };
  if (typeof weight === "number") patch.weight = weight;
  await base.collection(COMMUNITY_COLLECTION).update(id, patch);
}

/**
 * Upsert an ingested project by its dedupe `key`, PRESERVING any existing
 * moderation status (a re-sync must never republish something an admin hid, nor
 * silently promote a pending item). New keys always land as `pending`.
 */
export async function upsertPending(base: BaseClient, p: Omit<CommunityProject, "status">): Promise<void> {
  const col = base.collection(COMMUNITY_COLLECTION);
  const existing = await col
    .getList(1, 1, { filter: `key="${p.key.replace(/"/g, '\\"')}"` })
    .then((r) => (r.items[0] as Rec | undefined))
    .catch(() => undefined);
  const fields = {
    key: p.key, source: p.source, title: p.title, description: p.description ?? "",
    url: p.url ?? "", repo: p.repo ?? "", thumbnail: p.thumbnail ?? "",
    author: p.author ?? "", tags: (p.tags ?? []).join(","), stars: p.stars ?? 0,
    weight: p.weight ?? 0,
  };
  if (existing) {
    // Refresh metadata, KEEP existing status (moderation is sticky).
    await col.update(existing.id, fields);
  } else {
    await col.create({ ...fields, status: "pending" as CommunityStatus });
  }
}
