/**
 * `useProjectImport` — the one client action behind "drag & drop your project".
 *
 * Reads a drop / file pick into staged text files, persists them for the /dev
 * seam, and routes to the builder with `?action=import`. Honest throughout: an
 * oversized/empty/unreadable drop raises a clear toast and goes nowhere; a
 * partial import (files skipped) says so. Logic lives here so the page only owns
 * the drop surface (DRY).
 */
'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { readDrop, readFileList, type DropReadResult } from './read-drop';
import { stageProject } from './staging';

export function useProjectImport() {
  const router = useRouter();
  const [importing, setImporting] = useState(false);

  const run = useCallback(
    async (result: DropReadResult) => {
      if (result.error) {
        toast.error(result.error);
        return;
      }
      setImporting(true);
      try {
        await stageProject(result.name, result.files);
        toast.success(
          result.skipped > 0
            ? `Imported ${result.files.length} files · ${result.skipped} skipped`
            : `Imported ${result.files.length} files`,
        );
        const url = new URL('/dev', window.location.origin);
        url.searchParams.set('action', 'import');
        router.push(url.toString());
      } catch {
        setImporting(false);
        toast.error('Import failed — please try again.');
      }
    },
    [router],
  );

  const importDrop = useCallback(
    (dt: DataTransfer) => readDrop(dt).then(run),
    [run],
  );
  const importFiles = useCallback(
    (list: FileList | File[]) => readFileList(list).then(run),
    [run],
  );

  return { importing, importDrop, importFiles };
}
