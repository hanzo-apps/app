'use client';

/**
 * `useRepoImport` — the one client action behind "import a repository".
 *
 * Three steps, and the order is the point: the repo is CLONED onto git.hanzo.ai
 * with its history first, its files are read back from the head of that history,
 * and only then does the builder open. So the project the user lands in already
 * has its past — the history panel lists the source's real commits, and the next
 * turn is a commit on top of them rather than the first commit of a new repo.
 *
 * It shares the /new drop path's hand-off (`stageProject` → `/dev?action=import`)
 * because a project's files reaching the editor is one problem, not two. What it
 * adds is the repo the project belongs to, so autosave commits back into the
 * imported repo instead of minting a fresh one beside it.
 *
 * Honest throughout: a refusal says which — not signed in, name taken, or a
 * source the forge could not reach — and goes nowhere.
 */

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from '@hanzo/ui';

import { fetchCommitPages, importGitRepo, MAX_PROJECT_PAGES } from '@/lib/api/git';
import { gitUrlGateMessage, parseGitUrl } from '@/lib/git/url';
import { stageProject } from './staging';

export function useRepoImport(onLogin?: () => void) {
  const router = useRouter();
  const [importing, setImporting] = useState('');

  const importRepo = useCallback(
    async (url: string) => {
      const clean = url.trim();
      const parsed = parseGitUrl(clean);
      if (!parsed) return;
      // SSH and private remotes cannot be fetched, so say so here rather than
      // routing to a dead end.
      const gate = gitUrlGateMessage(clean);
      if (gate) {
        toast.error(gate);
        return;
      }

      setImporting(clean);
      const result = await importGitRepo(clean);
      if (!result.ok || !result.slug) {
        setImporting('');
        if (result.openLogin) onLogin?.();
        else toast.error(result.message || 'Could not import that repository.');
        return;
      }

      // Read the project's files from the commit that was just imported. An
      // unreadable tree still opens the project — the repo and its history are
      // already durable, and an empty editor over a real repo is recoverable
      // where a lost import is not.
      const pages = result.commit
        ? await fetchCommitPages('hanzo', result.slug, result.commit)
        : null;
      // The editor carries what a commit accepts. Handing it more would refuse
      // every autosave on a project whose files are already in its repo, so a
      // large repository opens on its first files and says so — nothing is lost,
      // and the sandbox works against the whole checkout either way.
      const carried = (pages ?? []).slice(0, MAX_PROJECT_PAGES);
      await stageProject(parsed.name, carried.map((p) => ({ path: p.path, text: p.html })), result.slug);

      toast.success(
        (pages?.length ?? 0) > carried.length
          ? `Imported ${parsed.path} with its history — editing the first ${carried.length} files`
          : `Imported ${parsed.path} with its history`,
      );
      router.push('/dev?action=import');
    },
    [router, onLogin],
  );

  return { importing, importRepo };
}
