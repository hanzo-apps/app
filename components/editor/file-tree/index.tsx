"use client";

/**
 * FileTree — the Code pane's file browser.
 *
 * A real TREE over the project's files, not a flat list of paths: `pages` keys
 * on `about/team.html`, so the folders are already in the data and rendering
 * one row per page threw them away. Folders collapse, the open file's folders
 * are revealed, and each file wears a glyph for its type.
 *
 * Honest scope: it lists the files the editor holds. A single-file app shows one
 * file, because that is genuinely all it has.
 */

import { Button, Input } from '@hanzo/ui';
import { YStack, XStack, SizableText, Paragraph } from '@hanzo/ui';
import { useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronRight, Folder, FolderOpen, Plus, Trash2, Check, Pencil, Search } from "lucide-react";

import { Page } from "@/types";
import { glyphFor } from "./glyph";
import { ancestors, buildTree, type Node } from "./tree";

export function FileTree({
  pages,
  currentPage,
  onSelectPage,
  onNewPage,
  onDeletePage,
}: {
  pages: Page[];
  currentPage: string;
  onSelectPage: (path: string, newPath?: string) => void;
  onNewPage: () => void;
  onDeletePage: (path: string) => void;
}) {
  const [renaming, setRenaming] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [query, setQuery] = useState("");
  const [collapsed, setCollapsed] = useState<string[]>([]);

  const startRename = (path: string) => {
    setRenaming(path);
    setDraft(path);
  };
  const commitRename = (path: string) => {
    const next = draft.trim();
    if (next && next !== path) onSelectPage(path, next);
    setRenaming(null);
  };

  // Opening a file from anywhere else — the page browser, a search result — used
  // to leave its folder shut, so the "active" row was inside something nobody
  // had opened and the selection was invisible. Reveal it.
  useEffect(() => {
    const reveal = ancestors(currentPage);
    if (reveal.length === 0) return;
    setCollapsed((c) => c.filter((path) => !reveal.includes(path)));
  }, [currentPage]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return pages;
    return pages.filter((p) => p.path.toLowerCase().includes(q));
  }, [pages, query]);

  // A search narrows the tree, and a narrowed tree must be OPEN — leaving folders
  // collapsed would hide the matches the search just found.
  const tree = useMemo(() => buildTree(visible), [visible]);
  const searching = query.trim().length > 0;

  return (
    <YStack height="100%" width={260} flexShrink={0} borderRightWidth={1} borderColor="$borderColor" backgroundColor="$background">
      <XStack alignItems="center" gap="$2" paddingHorizontal="$2.5" paddingVertical="$2.5">
        <XStack flex={1} minWidth={0} alignItems="center" gap="$2" borderRadius="$4" backgroundColor="$color2" paddingHorizontal="$2.5" data-field-box>
          <SizableText color="$color11"><Search size={13} /></SizableText>
          <Input
            flex={1}
            minWidth={0}
            value={query}
            onChangeText={setQuery}
            placeholder="Search code"
            aria-label="Search code"
            borderWidth={0}
            backgroundColor="transparent"
            paddingHorizontal="$0"
            fontSize="$1"
  />
        </XStack>
        <Button
          type="button"
          onClick={onNewPage}
          title="New file"
          aria-label="New file"
          variant="ghost"
          size="icon-sm"
          borderRadius="$4"
        >
          <Plus size={14} />
        </Button>
      </XStack>

      <YStack minHeight={0} flex={1} paddingHorizontal="$1.5" paddingBottom="$2" overflow="scroll">
        {tree.map((node) => (
          <Row
            key={node.path}
            node={node}
            depth={0}
            currentPage={currentPage}
            collapsed={searching ? [] : collapsed}
            onToggle={(path) =>
              setCollapsed((c) => (c.includes(path) ? c.filter((x) => x !== path) : [...c, path]))
            }
            onSelectPage={onSelectPage}
            onDeletePage={onDeletePage}
            canDelete={pages.length > 1}
            renaming={renaming}
            draft={draft}
            setDraft={setDraft}
            startRename={startRename}
            commitRename={commitRename}
            cancelRename={() => setRenaming(null)}
  />
        ))}
        {tree.length === 0 && (
          <YStack alignItems="center" gap="$2" paddingHorizontal="$3" paddingVertical="$6">
            <Paragraph fontSize="$1" color="$color11" textAlign="center">
              {searching ? `Nothing matches “${query.trim()}”.` : "No files yet."}
            </Paragraph>
          </YStack>
        )}
      </YStack>
    </YStack>
  );
}

function Row({
  node,
  depth,
  currentPage,
  collapsed,
  onToggle,
  onSelectPage,
  onDeletePage,
  canDelete,
  renaming,
  draft,
  setDraft,
  startRename,
  commitRename,
  cancelRename,
}: {
  node: Node;
  depth: number;
  currentPage: string;
  collapsed: string[];
  onToggle: (path: string) => void;
  onSelectPage: (path: string, newPath?: string) => void;
  onDeletePage: (path: string) => void;
  canDelete: boolean;
  renaming: string | null;
  draft: string;
  setDraft: (v: string) => void;
  startRename: (path: string) => void;
  commitRename: (path: string) => void;
  cancelRename: () => void;
}) {
  // Indent per level, from ONE number. Each level used to be whatever the author
  // of that branch chose, which is how a tree stops reading as a tree.
  const indent = 8 + depth * 12;

  if (node.kind === "dir") {
    const open = !collapsed.includes(node.path);
    return (
      <>
        <XStack
          role="button"
          tabIndex={0}
          onPress={() => onToggle(node.path)}
          alignItems="center"
          gap="$1.5"
          borderRadius="$3"
          paddingRight="$2"
          paddingVertical="$1.5"
          cursor="pointer"
          style={{ paddingLeft: indent }}
          hoverStyle={{ backgroundColor: "$color2" }}
        >
          <SizableText color="$color11">
            {open ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
          </SizableText>
          <SizableText color="$color11">
            {open ? <FolderOpen size={14} /> : <Folder size={14} />}
          </SizableText>
          <SizableText flex={1} minWidth={0} numberOfLines={1} fontSize="$1" color="$color11">
            {node.name}
          </SizableText>
        </XStack>
        {open &&
          node.children.map((child) => (
            <Row
              key={child.path}
              node={child}
              depth={depth + 1}
              currentPage={currentPage}
              collapsed={collapsed}
              onToggle={onToggle}
              onSelectPage={onSelectPage}
              onDeletePage={onDeletePage}
              canDelete={canDelete}
              renaming={renaming}
              draft={draft}
              setDraft={setDraft}
              startRename={startRename}
              commitRename={commitRename}
              cancelRename={cancelRename}
  />
          ))}
      </>
    );
  }

  const active = node.path === currentPage;
  const isRenaming = renaming === node.path;
  const Glyph = glyphFor(node.name);

  return (
    <XStack
      group
      alignItems="center"
      gap="$1.5"
      borderRadius="$3"
      paddingRight="$1.5"
      paddingVertical="$1.5"
      style={{ paddingLeft: indent }}
      backgroundColor={active ? "$color3" : undefined}
      hoverStyle={active ? undefined : { backgroundColor: "$color2" }}
    >
      <SizableText color={active ? "$color" : "$color11"}><Glyph size={14} /></SizableText>
      {isRenaming ? (
        <Input
          autoFocus
          value={draft}
          onChangeText={(value) => setDraft(value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") commitRename(node.path);
            if (e.key === "Escape") cancelRename();
          }}
          onBlur={() => commitRename(node.path)}
          minWidth={0} flex={1} borderRadius="$2" backgroundColor="$background" paddingHorizontal="$1" paddingVertical="$0.5" fontFamily="$mono" fontSize="$1" color="$color" outlineWidth={0}
  />
      ) : (
        <Button
          type="button"
          onClick={() => onSelectPage(node.path)}
          minWidth={0} flex={1}
          title={node.path}
        >
          <SizableText flex={1} minWidth={0} numberOfLines={1} textAlign="left" fontFamily="$mono" fontSize="$1" color={active ? "$color" : "$color11"} $group-hover={{ color: "$color" }}>{node.name}</SizableText>
        </Button>
      )}

      {isRenaming ? (
        <Button
          type="button"
          onClick={() => commitRename(node.path)}
          flexShrink={0} {...{ color: "$color11" }}
        >
          <Check size={12} />
        </Button>
      ) : (
        <XStack flexShrink={0} alignItems="center" gap="$0.5" opacity={0} $group-hover={{ opacity: 1 }}>
          <Button
            type="button"
            onClick={() => startRename(node.path)}
            title="Rename"
            {...{ color: "$color11" }}
          >
            <Pencil size={12} />
          </Button>
          {canDelete && (
            <Button
              type="button"
              onClick={() => onDeletePage(node.path)}
              title="Delete"
              {...{ color: "$color11" }}
            >
              <Trash2 size={12} />
            </Button>
          )}
        </XStack>
      )}
    </XStack>
  );
}
