'use client';

/**
 * useProjects — the ONE client-side source of the user's real projects.
 *
 * ROOT-CAUSE FIX: the sidebar previously read `vfs.listProjects()` — the LOCAL
 * IndexedDB VFS, which is per-device and ephemeral. Projects the user created or
 * published live in the CLOUD (org-scoped projects service) never appeared there, and
 * a reload restored nothing because the local store is empty on a fresh device.
 *
 * This hook fetches the REAL cloud list CLIENT-SIDE via `fetchProjects()` (the
 * same-origin `/v1/projects` BFF; the session cookie carries auth — the in-pod
 * server action can't reach cloud, a known SERVER_MODE gotcha). Because the data
 * comes from the cloud store scoped to the signed-in org, projects appear
 * immediately AND persist across reloads and devices.
 *
 * A small module-level cache + in-flight dedupe means the sidebar, dashboard, and
 * command palette that all mount together issue ONE network call, not three.
 * The local VFS is kept ONLY as an offline fallback, never the primary — the
 * returned `source` says which won.
 */

import { useCallback, useEffect, useState } from 'react';
import { fetchProjects, type Project } from '@/lib/api/projects';
import { vfs } from '@/lib/vfs';

export interface UseProjectsResult {
  projects: Project[];
  loading: boolean;
  error: string | null;
  /** 'cloud' = the authoritative org store; 'local' = offline VFS fallback. */
  source: 'cloud' | 'local' | null;
  reload: () => void;
}

interface Snapshot {
  projects: Project[];
  source: 'cloud' | 'local' | null;
  error: string | null;
}

const CACHE_TTL_MS = 15_000;
let cache: { at: number; snap: Snapshot } | null = null;
let inflight: Promise<Snapshot> | null = null;

/** Map a local VFS project into the cloud Project shape for the fallback path. */
function vfsToProject(p: { id: string; name: string; updatedAt: Date; createdAt?: Date }): Project {
  const updated = Math.floor((p.updatedAt?.getTime() ?? Date.now()) / 1000);
  const created = Math.floor((p.createdAt?.getTime() ?? p.updatedAt?.getTime() ?? Date.now()) / 1000);
  return {
    id: p.id,
    org: '',
    slug: p.id,
    name: p.name,
    repo: {},
    framework: 'static',
    status: 'draft',
    createdAt: created,
    updatedAt: updated,
  };
}

async function fetchSnapshot(): Promise<Snapshot> {
  try {
    const cloud = await fetchProjects();
    return { projects: Array.isArray(cloud) ? cloud : [], source: 'cloud', error: null };
  } catch (e) {
    const error = e instanceof Error ? e.message : 'failed to load projects';
    try {
      await vfs.init();
      const local = await vfs.listProjects();
      return { projects: local.map(vfsToProject), source: 'local', error };
    } catch {
      return { projects: [], source: null, error };
    }
  }
}

/** Load a snapshot, reusing a fresh cache / in-flight request unless forced. */
async function loadSnapshot(force: boolean): Promise<Snapshot> {
  if (!force && cache && Date.now() - cache.at < CACHE_TTL_MS) return cache.snap;
  if (!force && inflight) return inflight;
  inflight = fetchSnapshot().then((snap) => {
    cache = { at: Date.now(), snap };
    inflight = null;
    return snap;
  });
  return inflight;
}

export function useProjects(): UseProjectsResult {
  const [snap, setSnap] = useState<Snapshot>(
    () => cache?.snap ?? { projects: [], source: null, error: null },
  );
  const [loading, setLoading] = useState(!cache);

  const run = useCallback(async (force: boolean) => {
    setLoading(true);
    const next = await loadSnapshot(force);
    setSnap(next);
    setLoading(false);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const next = await loadSnapshot(false);
      if (!cancelled) {
        setSnap(next);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return {
    projects: snap.projects,
    loading,
    error: snap.error,
    source: snap.source,
    reload: () => run(true),
  };
}
