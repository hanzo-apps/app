'use client';

/**
 * useFolders — reactive view of the app-side project folders (lib/folders).
 *
 * Re-reads whenever any surface mutates folders (via the `hanzo:folders-changed`
 * event) and on cross-tab `storage` events, so the sidebar and dashboard stay in
 * sync. See lib/folders for the flagged backend gap (folders are local until the
 * projects service record carries a folderId).
 */

import { useCallback, useEffect, useState } from 'react';
import {
  listFolders,
  createFolder as createFolderStore,
  deleteFolder as deleteFolderStore,
  assignProjectToFolder,
  FOLDERS_CHANGED_EVENT,
  type Folder,
} from '@/lib/folders';

export interface UseFoldersResult {
  folders: Folder[];
  createFolder: (name: string) => Folder;
  deleteFolder: (id: string) => void;
  assign: (slug: string, folderId: string | null) => void;
}

export function useFolders(): UseFoldersResult {
  const [folders, setFolders] = useState<Folder[]>([]);

  const refresh = useCallback(() => setFolders(listFolders()), []);

  useEffect(() => {
    refresh();
    window.addEventListener(FOLDERS_CHANGED_EVENT, refresh);
    window.addEventListener('storage', refresh);
    return () => {
      window.removeEventListener(FOLDERS_CHANGED_EVENT, refresh);
      window.removeEventListener('storage', refresh);
    };
  }, [refresh]);

  return {
    folders,
    createFolder: createFolderStore,
    deleteFolder: deleteFolderStore,
    assign: assignProjectToFolder,
  };
}
