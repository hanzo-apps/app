import type { Page } from '@/types';

/**
 * A project's flat file list, as the tree it actually is.
 *
 * `pages` is `{ path, html }[]` and a path is `about/team.html` — the folders
 * are already there, encoded in the string. The browser used to render one row
 * per page, so a project with `src/components/Header.html` showed a single row
 * whose name was the whole path, and every file sat at the same depth whatever
 * its real depth was. That is not a list of files; it is a list of strings that
 * happen to contain slashes.
 *
 * Pure and separate from the component so the grouping can be tested without a
 * browser — the shape of a tree is exactly the kind of thing that is easy to get
 * subtly wrong (a folder with one child, a file at the root beside a folder, two
 * files whose paths differ only after the third segment) and impossible to see
 * in a screenshot.
 */
export interface FileNode {
  kind: 'file';
  /** The segment shown in the row. */
  name: string;
  /** The full path — the id `pages` is keyed by. */
  path: string;
}

export interface DirNode {
  kind: 'dir';
  name: string;
  /** The folder's own path, used as its collapse key. */
  path: string;
  children: Node[];
}

export type Node = FileNode | DirNode;

/**
 * Build the tree. Folders first, then files, each group sorted by name — the
 * order every file browser uses, because folders are structure and files are
 * content, and mixing them makes both harder to scan.
 */
export function buildTree(pages: Page[]): Node[] {
  const root: DirNode = { kind: 'dir', name: '', path: '', children: [] };

  for (const page of pages) {
    const segments = page.path.split('/').filter(Boolean);
    if (segments.length === 0) continue;
    const fileName = segments.pop()!;

    let dir = root;
    for (const segment of segments) {
      const childPath = dir.path ? `${dir.path}/${segment}` : segment;
      let next = dir.children.find(
        (c): c is DirNode => c.kind === 'dir' && c.name === segment,
      );
      if (!next) {
        next = { kind: 'dir', name: segment, path: childPath, children: [] };
        dir.children.push(next);
      }
      dir = next;
    }
    dir.children.push({ kind: 'file', name: fileName, path: page.path });
  }

  return sort(root.children);
}

function sort(nodes: Node[]): Node[] {
  for (const n of nodes) {
    if (n.kind === 'dir') n.children = sort(n.children);
  }
  return nodes.sort((a, b) => {
    if (a.kind !== b.kind) return a.kind === 'dir' ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
}

/**
 * Every folder on the way to a path, so opening a file can reveal it.
 *
 * `src/components/Header.html` → `['src', 'src/components']`. Without this,
 * selecting a file from anywhere else (the page browser, a search result) left
 * the tree collapsed and the selection invisible — the row was "active" inside
 * a folder nobody had opened.
 */
export function ancestors(path: string): string[] {
  const segments = path.split('/').filter(Boolean);
  segments.pop();
  const out: string[] = [];
  let acc = '';
  for (const s of segments) {
    acc = acc ? `${acc}/${s}` : s;
    out.push(acc);
  }
  return out;
}
