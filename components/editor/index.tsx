"use client";
import { SizableText, YStack, XStack, type GuiElement } from '@hanzo/gui';
import { useEffect, useMemo, useRef, useState } from "react";
import { toast, Button } from '@hanzo/ui';
import type { CodeEditorHandle } from "@/components/code-editor";
import dynamic from "next/dynamic";
import { CopyIcon, Share2 } from "lucide-react";

// CodeMirror bundles locally (no CDN, no web workers) so it is CSP-clean.
// Still code-split out of the /dev first-load chunk and rendered client-only
// (it touches the DOM on mount); show a calm placeholder while it streams in.
const CodeEditor = dynamic(
  () => import("@/components/code-editor").then((m) => m.CodeEditor),
  {
    ssr: false,
    loading: () => (
      <XStack height="100%" width="100%" backgroundColor="$background" alignItems="center" justifyContent="center" position="absolute" left="$0" top="$0">
        <SizableText color="$color11" fontSize="$1">Loading editor…</SizableText>
      </XStack>
    ),
  }
);
import {
  useCopyToClipboard,
  useEvent,
  useLocalStorage,
  useMount,
  useUnmount,
  useUpdateEffect,
} from "react-use";
import { useRouter, useSearchParams } from "next/navigation";

import { Header } from "@/components/editor/header";
import { defaultHTML } from "@/lib/consts";
import { Preview } from "@/components/editor/preview";
import { useEditor } from "@/hooks/useEditor";
import { AskAI } from "@/components/editor/ask-ai";
import { DeployButton } from "./deploy-button";
import { GitSyncButton } from "./git-sync-button";
import { Page, Project } from "@/types";
import { sendRewardSignal, getLastGenerationRequestId } from "@/lib/reward-signal";
import { SaveButton } from "./save-button";
import { LoadProject } from "../my-projects/load-project";
import { isTheSameHtml } from "@/lib/compare-html-diff";
import { useAutosave } from "@/hooks/useAutosave";
import { commitTurn } from "@/lib/git/commit-turn";
import { loadWorkspace, projectRepoName, saveWorkspace } from "@/lib/dev/workspace";
import { saveLabel } from "@/lib/pages/save-label";
import { FileTree } from "./file-tree";
import { HistoryPanel } from "./history";
import { RevisionDetails, type DetailsRev } from "./history/details";
import { ShareModal } from "./share-modal";
import { Console } from "./console";
import { VisualEditor } from "./visual-editor";
import { OrgProvider } from "@/lib/org/client";

export const AppEditor = ({
  project,
  pages: initialPages,
  images,
  isNew,
}: {
  project?: Project | null;
  pages?: Page[];
  images?: string[];
  isNew?: boolean;
}) => {
  const [htmlStorage, , removeHtmlStorage] = useLocalStorage("pages");
  const [, copyToClipboard] = useCopyToClipboard();
  /**
   * A project with no server record had nowhere to come back from on reload:
   * `initialPages` arrives only for a SAVED project, so a brand-new build came
   * back empty — and an empty editor is what the replayed seed prompt then
   * filled by regenerating the whole site. The local working copy closes the gap
   * before a project record or a repo exists, which is exactly the window where
   * someone reloads and loses everything.
   *
   * Read ONCE, on mount: making it reactive would let a stale snapshot fight the
   * live pages mid-build.
   */
  const restored = useRef(
    typeof window === "undefined"
      ? null
      : loadWorkspace(project?.title || (window as { __projectName?: string }).__projectName || "untitled-site"),
  );

  const { htmlHistory, setHtmlHistory, prompts, setPrompts, pages, setPages } =
    useEditor(
      initialPages?.length ? initialPages : restored.current?.pages ?? initialPages,
      project?.prompts ?? restored.current?.prompts ?? [],
      typeof htmlStorage === "string" ? htmlStorage : undefined
    );

  const searchParams = useSearchParams();
  const router = useRouter();
  const deploy = searchParams.get("deploy") === "true";

  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const preview = useRef<HTMLDivElement>(null);
  const editor = useRef<GuiElement>(null);
  const editorRef = useRef<CodeEditorHandle | null>(null);
  const resizer = useRef<GuiElement>(null);

  // The ONE view state ("chat" | "preview" | "code"): the chat pane is always
  // docked on the left; this drives what the RIGHT pane shows — preview or the
  // code editor — and, on mobile, which single pane is visible.
  const [currentTab, setCurrentTab] = useState("chat");
  // The left pane is ALWAYS the chat composer; a history/rollback ICON in the
  // header toggles the version-history panel as an OVERLAY over it (item 10).
  const [historyOpen, setHistoryOpen] = useState(false);
  // The revision whose Details view (Timeline | Changes) overlays the right pane
  // (item 12); null = the normal preview/code view.
  const [detailsRev, setDetailsRev] = useState<DetailsRev | null>(null);
  // The chat pane can be collapsed on desktop to give preview/code the full
  // width; on mobile the tab switcher already shows one pane at a time.
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  // Live mirror so the once-registered window-resize listener always sees the
  // current collapsed state in the split math (no stale closure, no re-register).
  const sidebarCollapsedRef = useRef(false);
  sidebarCollapsedRef.current = sidebarCollapsed;
  // Open on the project's entry page: index.html when present (e.g. a dropped
  // project), else the first seeded page, else the default new-project page.
  const [currentPage, setCurrentPage] = useState(
    () =>
      initialPages?.find((p) => /(^|\/)index\.html?$/i.test(p.path))?.path ??
      initialPages?.[0]?.path ??
      "index.html",
  );
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const [isResizing, setIsResizing] = useState(false);
  const [isAiWorking, setIsAiWorking] = useState(false);
  const [isEditableModeEnabled, setIsEditableModeEnabled] = useState(false);
  const [selectedElement, setSelectedElement] = useState<HTMLElement | null>(
    null
  );
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  const resetLayout = () => {
    const el = editor.current;
    if (!el || !('scrollTo' in el)) return;

    // ONLY the LEFT chat pane carries an explicit width; the RIGHT region is
    // `flex-1` and fills every remaining pixel to the viewport's right edge.
    // (The old code sized BOTH panes from a computed split, which — combined
    // with both being `flex-1` — left a dead gutter on the far right when the
    // two never agreed. One authoritative width, one flex fill: no gutter.)
    // lg breakpoint is 1024px (Tailwind default). Collapsed/mobile → clear the
    // width so the pane is hidden or the flex-col fills naturally.
    if (window.innerWidth >= 1024 && !sidebarCollapsedRef.current) {
      const r = resizer.current;
      const resizerWidth = r && 'scrollTo' in r ? r.offsetWidth : 8; // w-2 = 8px
      const availableWidth = window.innerWidth - resizerWidth;
      // Chat ~27% (v2: 24–28%); the preview gets the room.
      el.style.width = `${Math.round(availableWidth * 0.27)}px`;
    } else {
      el.style.width = "";
    }
  };

  const handleResize = (e: MouseEvent) => {
    const el = editor.current;
    const r = resizer.current;
    if (!el || !('scrollTo' in el) || !r || !('scrollTo' in r)) return;

    const resizerWidth = r.offsetWidth;
    const minWidth = 240; // keep the composer usable
    const maxWidth = window.innerWidth - resizerWidth - 320; // leave room to build

    const clampedEditorWidth = Math.max(
      minWidth,
      Math.min(e.clientX, maxWidth)
    );
    // Set ONLY the chat pane; the preview region (flex-1) absorbs the rest.
    el.style.width = `${clampedEditorWidth}px`;
  };

  const handleMouseDown = () => {
    setIsResizing(true);
    document.addEventListener("mousemove", handleResize);
    document.addEventListener("mouseup", handleMouseUp);
  };

  const handleMouseUp = () => {
    setIsResizing(false);
    document.removeEventListener("mousemove", handleResize);
    document.removeEventListener("mouseup", handleMouseUp);
  };

  useMount(() => {
    if (deploy && project?._id) {
      toast.success("Your project is deployed! 🎉", {
        action: {
          label: "See Project",
          onClick: () => {
            window.open(
              `/projects/${project?.space_id}`,
              "_blank"
            );
          },
        },
      });
      router.replace(`/projects/${project?.space_id}`);
    }
    if (htmlStorage) {
      removeHtmlStorage();
      toast.warning("Previous HTML content restored from local storage.");
    }

    // Load initial prompt from localStorage for new projects
    if (isNew) {
      const initialPrompt = localStorage.getItem("initialPrompt");
      if (initialPrompt) {
        localStorage.removeItem("initialPrompt");
        // Store the prompt for AskAI to use
        (window as any).__initialPrompt = initialPrompt;
      }
    }

    resetLayout();
    const r = resizer.current;
    if (!r || !('scrollTo' in r)) return;
    r.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("resize", resetLayout);
  });
  useUnmount(() => {
    document.removeEventListener("mousemove", handleResize);
    document.removeEventListener("mouseup", handleMouseUp);
    const r = resizer.current;
    if (r && 'scrollTo' in r) {
      r.removeEventListener("mousedown", handleMouseDown);
    }
    window.removeEventListener("resize", resetLayout);
  });

  // Prevent accidental navigation away when AI is working or content has changed
  useEvent("beforeunload", (e) => {
    if (isAiWorking || !isTheSameHtml(currentPageData?.html)) {
      e.preventDefault();
      return "";
    }
  });

  // The chat pane is always docked on desktop, so keep the split sized correctly
  // as the view or the collapsed state changes (the panes stay mounted; widths
  // just re-apply). resetLayout clears the inline widths when collapsed/mobile.
  useUpdateEffect(() => {
    resetLayout();
  }, [currentTab, sidebarCollapsed]);

  /**
   * The page the composer is editing. Resolved by path, then by ANY real page,
   * and only then by the starter document.
   *
   * That order is the whole of it. This used to fall straight from a missed
   * lookup to `defaultHTML`, and `defaultHTML` is what the builder uses to mean
   * "nothing has been built yet": ask-ai compares against it (`isTheSameHtml`)
   * to choose between EDITING the project and GENERATING a new one. So any path
   * that did not match — a page renamed by a follow-up, a multi-page build whose
   * selected path changed, a stale selection after a restore — silently
   * presented a project full of pages as an empty one, and the next turn rebuilt
   * the whole site from scratch instead of editing it. Every turn, forever;
   * "groundhog day" was the report.
   *
   * Falling back to `pages[0]` keeps the answer TRUE — with pages present, the
   * project is not empty, and saying otherwise is the lie that caused the loop.
   * The starter document remains the answer for a genuinely empty project, which
   * is the one case where it is accurate.
   */
  /**
   * Real persistence, replacing a status bar that printed "Auto-saved"
   * unconditionally while nothing saved. Addressed exactly as the Save button
   * addresses it, so there is ONE write path; a project with no record has
   * nowhere to save and the bar says so instead of reassuring.
   */
  const [saveNs, saveRepo] = (project?.space_id ?? "").split("/");
  const autosave = useAutosave(saveNs, saveRepo, pages, prompts, isAiWorking);

  // Keep the working copy current. Debounced so a streaming build does not write
  // on every chunk, and skipped while building because a partial document is not
  // a state worth restoring into.
  useEffect(() => {
    if (isAiWorking || !pages.length) return;
    const name = project?.title || (typeof window !== "undefined" ? (window as { __projectName?: string }).__projectName : "") || "untitled-site";
    const t = setTimeout(() => saveWorkspace(name, pages, prompts), 800);
    return () => clearTimeout(t);
  }, [pages, prompts, isAiWorking, project?.title]);

  const currentPageData = useMemo(() => {
    return (
      pages.find((page) => page.path === currentPage) ??
      pages[0] ?? { path: "index.html", html: defaultHTML }
    );
  }, [pages, currentPage]);

  // Open the current page's generated HTML in a real new browser tab (the
  // header's external-link control). A blob URL needs no publish and no server.
  const openInNewTab = () => {
    if (typeof window === "undefined") return;
    const blob = new Blob([currentPageData?.html ?? defaultHTML], {
      type: "text/html",
    });
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank", "noopener,noreferrer");
    // Revoke later so the new tab has time to load the document first.
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  };

  return (
    <OrgProvider>
    {/* overflow="hidden" as well as the exact height: the height alone only says
        how tall this is, not that nothing may escape it. One child that forgets
        minHeight={0} would otherwise put the whole app back on a scrolling
        document, and that failure is invisible until a thread gets long enough. */}
    <YStack height="100dvh" overflow="hidden" backgroundColor="$background">
      <Header
        tab={currentTab}
        onNewTab={setCurrentTab}
        device={device}
        setDevice={setDevice}
        iframeRef={iframeRef}
        pages={pages}
        currentPage={currentPage}
        onSelectPage={setCurrentPage}
        onOpenExternal={openInNewTab}
        historyOpen={historyOpen}
        onToggleHistory={() => {
          const next = !historyOpen;
          setHistoryOpen(next);
          // Opening history must reveal the left pane if it was collapsed.
          if (next) setSidebarCollapsed(false);
        }}
        project={project}
      >
        {/* Secondary actions (Share / Load / Push) share ONE treatment so the
            action cluster reads as a set; Publish is the sole solid primary. */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsShareModalOpen(true)}
          height={28} gap="$1.5" paddingHorizontal="$2.5" borderColor="$borderColor" backgroundColor="$color3" hoverStyle={{ backgroundColor: "$color3" }}
        >
          <Share2 size={14} />
          <SizableText display="none">Share</SizableText>
        </Button>
        <LoadProject
          onSuccess={(project: Project) => {
            router.push(`/projects/${project.space_id}`);
          }}
  />
        {/* for these buttons pass the whole pages */}
        <GitSyncButton pages={pages} prompts={prompts} disabled={isAiWorking} />
        {project?._id ? (
          <SaveButton pages={pages} prompts={prompts} />
        ) : (
          <DeployButton pages={pages} prompts={prompts} disabled={isAiWorking} />
        )}
      </Header>
      {/* minHeight={0} is what keeps the builder a fixed shell instead of a long
          page. A flex child defaults to `min-height: auto`, which means it will
          NOT shrink below its own content — so a long thread grew this row past
          the 100dvh section, the DOCUMENT scrolled, and the header scrolled off
          the top with it. The toolbar (Preview/Code/Publish) disappearing mid-build
          is that, and it takes the user's bearings with it. Bounded, the row is
          held to the viewport and the panes scroll INSIDE it, which is what the
          chat pane's own `minHeight={0} flex={1}` below already assumed. */}
      <XStack backgroundColor="$background" flex={1} minHeight={0} width="100%" position="relative" $lg={{ flexDirection: "column", height: "calc(100%-82px)" }}>
        {/* LEFT — the chat pane, ALWAYS chat (never code). The composer is pinned
            to the bottom of this flex-col (AskAI is `mt-auto`), so messages scroll
            above it. Desktop: docked left unless collapsed; mobile: shown only on
            the Chat tab. Kept mounted so generation state persists across views. */}
        <YStack
          ref={editor}
          position="relative" overflow="hidden" height="100%" display={currentTab === "chat" ? undefined : "none"} $lg={{ flex: 1, ...(sidebarCollapsed ? { display: "none" } : { flexShrink: 0 }) }}
        >
          {/* Chat — ALWAYS the left pane (composer/thread live here permanently);
              the history panel OVERLAYS it when toggled from the header icon. */}
          <YStack minHeight={0} flex={1}>
            <AskAI
              isNew={isNew}
              project={project}
              images={images}
              currentPage={currentPageData}
              htmlHistory={htmlHistory}
              previousPrompts={prompts}
              onSuccess={(newPages, p: string) => {
                // Content-free reward signal: a generation succeeded and the
                // user is building on it. Attaches the last gateway response id
                // (no-ops if a generation produced none). Fire-and-forget.
                sendRewardSignal(getLastGenerationRequestId(), "accept");

                // VERSION HISTORY. Each finished turn is a commit on
                // git.hanzo.ai, so the history panel has real revisions to show,
                // bookmark and fork from. Fire-and-forget — the build is already
                // on screen and a slow forge must not hold up the next prompt —
                // but never silent: an unwired forge or a failed write says so,
                // because implying a history that is not being written is the
                // same defect as the status bar that read "Auto-saved".
                // A STABLE name. Deriving it from the title meant every
                // first-time project was called "untitled-site" and they
                // overwrote each other's history in one shared repo.
                const repoName = projectRepoName(project?.space_id?.split("/")[1]);
                void (repoName
                  ? commitTurn(repoName, newPages, p)
                  : Promise.resolve({ ok: false as const, reason: "no project id", unconfigured: true })
                ).then((r) => {
                  if (!r.ok && !r.unconfigured) {
                    toast.error(`Version not saved to git: ${r.reason}`);
                  }
                });

                const currentHistory = [...htmlHistory];
                currentHistory.unshift({
                  pages: newPages,
                  createdAt: new Date(),
                  prompt: p,
                });
                setHtmlHistory(currentHistory);
                setSelectedElement(null);
                setSelectedFiles([]);
                // if xs or sm — surface the result on mobile (one pane at a time).
                if (window.innerWidth <= 1024) {
                  setCurrentTab("preview");
                }
              }}
              setPages={setPages}
              pages={pages}
              setCurrentPage={setCurrentPage}
              isAiWorking={isAiWorking}
              setisAiWorking={setIsAiWorking}
              onNewPrompt={(prompt: string) => {
                setPrompts((prev) => [...prev, prompt]);
              }}
              onScrollToBottom={() => {
                editorRef.current?.revealLine(
                  editorRef.current?.getLineCount() ?? 0
                );
              }}
              isEditableModeEnabled={isEditableModeEnabled}
              setIsEditableModeEnabled={setIsEditableModeEnabled}
              selectedElement={selectedElement}
              setSelectedElement={setSelectedElement}
              setSelectedFiles={setSelectedFiles}
              selectedFiles={selectedFiles}
  />
          </YStack>

          {/* History overlay — the git changeset timeline (commits + working
              changes), toggled by the header history icon. Absolute-fills the
              left pane over the chat; a commit's "Details" opens the right-pane
              Details view via onOpenDetails. */}
          {historyOpen && (
            <HistoryPanel
              history={htmlHistory}
              setPages={setPages}
              pages={pages}
              onClose={() => setHistoryOpen(false)}
              onOpenDetails={setDetailsRev}
  />
          )}
        </YStack>
        {/* Resizer — desktop only, and only while the chat pane is docked. A
            transparent hit-target with a hairline that lifts on hover, so there
            is no hard border seam between the panel and the preview card. */}
        <XStack
          ref={resizer}
          role="separator"
          aria-orientation="vertical"
          aria-label="Resize chat and preview panes"
          position="relative" width="$3" height="100%" flexShrink={0} cursor="col-resize" alignItems="center" justifyContent="center" $lg={{ display: "none" }} className="group/resizer"
        >
          {/* A REAL, grabbable handle: an always-present hairline seam (so the
              divider is never invisible — you can see where the panes meet and
              where to grab) that strengthens on hover/drag, a wide-enough hit
              target (w-3) to grab from either panel's edge, and an always-visible
              centered grip pill for the affordance. */}
          <YStack pointerEvents="none" position="absolute" top="$0" bottom="$0" left="50%" width={1} x="50%" backgroundColor="$borderColor" $group-resizer-hover={{ backgroundColor: "$color" }} $group-resizer-press={{ backgroundColor: "$color" }} />
          <YStack pointerEvents="none" position="relative" height="$8" width="$1" borderRadius="$10" backgroundColor="$color8" $group-resizer-hover={{ backgroundColor: "$color" }} $group-resizer-press={{ backgroundColor: "$color" }} />
        </XStack>
        {/* RIGHT — Preview OR Code as a RAISED, rounded card that fills the whole
            remaining width to the viewport's right edge (flex-1, min-w-0). The
            card is the only element that lifts off the flat workspace. Preview
            stays mounted (iframe warm, iframeRef valid); Code overlays it. */}
        <YStack
          position="relative" flex={1} minWidth={0} height="100%" padding="$2" $lg={{ padding: "$3" }} {...{ display: currentTab === "chat" ? "none" : undefined }}
        >
          <YStack position="relative" height="100%" width="100%" overflow="hidden" borderRadius="$6" borderWidth={1} borderColor="$borderColor" backgroundColor="$background" elevation={5} className="preview-stage">
            {/* Faint top highlight — a crisp edge that reads as raised glass. */}
            <YStack pointerEvents="none" position="absolute" left="$0" right="$0" top="$0" zIndex={20} height={1} />
            <Preview
              html={currentPageData?.html}
              isResizing={isResizing}
              isAiWorking={isAiWorking}
              ref={preview}
              device={device}
              pages={pages}
              setCurrentPage={setCurrentPage}
              currentTab={currentTab}
              isEditableModeEnabled={isEditableModeEnabled}
              iframeRef={iframeRef}
              onClickElement={(element) => {
                setIsEditableModeEnabled(false);
                setSelectedElement(element);
                setCurrentTab("chat");
              }}
  />
            {currentTab === "preview" && (
              <VisualEditor
                iframeRef={iframeRef}
                editorRef={editorRef}
                isEnabled={isEditableModeEnabled}
                onToggle={setIsEditableModeEnabled}
                onElementSelect={(_info) => {
                  // Element selection handled by VisualEditor
                }}
                onCodeUpdate={(newHtml, _location) => {
                  // Update the current page with new HTML
                  setPages((prev) =>
                    prev.map((page) =>
                      page.path === currentPage ? { ...page, html: newHtml } : page
                    )
                  );
                }}
  />
            )}
            {/* CODE view — the CodeMirror editor overlaid inside the card when the
                header switches to Code. The left panel stays chat; code lives here. */}
            {currentTab === "code" && (
              <XStack position="absolute" top={0} right={0} bottom={0} left={0} zIndex={10} backgroundColor="$background">
                {/* File browser rail — see + navigate every project file. */}
                <FileTree
                  pages={pages}
                  currentPage={currentPage}
                  onSelectPage={(path, newPath) => {
                    if (newPath) {
                      setPages((prev) =>
                        prev.map((page) =>
                          page.path === path ? { ...page, path: newPath } : page
                        )
                      );
                      setCurrentPage(newPath);
                    } else {
                      setCurrentPage(path);
                    }
                  }}
                  onDeletePage={(path) => {
                    const newPages = pages.filter((page) => page.path !== path);
                    setPages(newPages);
                    if (currentPage === path) {
                      setCurrentPage(newPages[0]?.path ?? "index.html");
                    }
                  }}
                  onNewPage={() => {
                    setPages((prev) => [
                      ...prev,
                      {
                        path: `page-${prev.length + 1}.html`,
                        html: defaultHTML,
                      },
                    ]);
                    setCurrentPage(`page-${pages.length + 1}.html`);
                  }}
  />
                <YStack position="relative" minWidth={0} flex={1} overflow="hidden">
                  <CopyIcon
                    size={16} color="$color11"
                    onClick={() => {
                      copyToClipboard(currentPageData.html);
                      toast.success("HTML copied to clipboard!");
                    }}
  />
                  <YStack
                    position="absolute"
                    top="$0"
                    left="$0"
                    width="100%"
                    height="100%"
                    backgroundColor="$background"
                    pointerEvents={isAiWorking ? 'none' : 'auto'}
                  >
                  <CodeEditor
                    language="html"
                    className="code-surface"
                    value={currentPageData.html}
                    onChange={(value) => {
                      setPages((prev) =>
                        prev.map((page) =>
                          page.path === currentPageData.path
                            ? { ...page, html: value }
                            : page
                        )
                      );
                    }}
                    onReady={(handle) => {
                      editorRef.current = handle;
                    }}
                  />
                  </YStack>
                </YStack>
              </XStack>
            )}
            {/* Revision Details (Timeline | Changes) — overlays the preview card
                when a History revision's "Details" is opened (item 12). */}
            {detailsRev && (
              <RevisionDetails rev={detailsRev} onClose={() => setDetailsRev(null)} />
            )}
          </YStack>
        </YStack>
      </XStack>

      {/* The developer console — the status strip IS the dock's handle: hover
          it to resize, drag it up, click it open. The chat/AI panel toggle and
          the dictation mic ride far right on the same bar. */}
      <Console
        isAiWorking={isAiWorking}
        saveText={saveLabel(autosave.state, autosave.at)}
        branch={project?.repo?.branch}
        pageCount={pages.length}
        sidebarCollapsed={sidebarCollapsed}
        onToggleSidebar={() => setSidebarCollapsed((v) => !v)}
  />

      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        projectId={project?._id}
        projectName={project?.title || "Untitled Project"}
  />
    </YStack>
    </OrgProvider>
  );
};
