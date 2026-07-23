"use client";
import { useMemo, useRef, useState } from "react";
import { toast } from "@hanzo/ui";
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
      <div className="h-full w-full bg-card flex items-center justify-center text-muted-foreground text-xs absolute left-0 top-0">
        Loading editor…
      </div>
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
import classNames from "classnames";
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
import { FileTree } from "./file-tree";
import { HistoryPanel } from "./history";
import { RevisionDetails, type DetailsRev } from "./history/details";
import { ShareModal } from "./share-modal";
import { VisualEditor } from "./visual-editor";
import { OrgProvider } from "@/lib/org/client";
import { Button, TooltipProvider } from "@hanzo/ui";

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
  const { htmlHistory, setHtmlHistory, prompts, setPrompts, pages, setPages } =
    useEditor(
      initialPages,
      project?.prompts ?? [],
      typeof htmlStorage === "string" ? htmlStorage : undefined
    );

  const searchParams = useSearchParams();
  const router = useRouter();
  const deploy = searchParams.get("deploy") === "true";

  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const preview = useRef<HTMLDivElement>(null);
  const editor = useRef<HTMLDivElement>(null);
  const editorRef = useRef<CodeEditorHandle | null>(null);
  const resizer = useRef<HTMLDivElement>(null);

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
    if (!editor.current) return;

    // ONLY the LEFT chat pane carries an explicit width; the RIGHT region is
    // `flex-1` and fills every remaining pixel to the viewport's right edge.
    // (The old code sized BOTH panes from a computed split, which — combined
    // with both being `flex-1` — left a dead gutter on the far right when the
    // two never agreed. One authoritative width, one flex fill: no gutter.)
    // lg breakpoint is 1024px (Tailwind default). Collapsed/mobile → clear the
    // width so the pane is hidden or the flex-col fills naturally.
    if (window.innerWidth >= 1024 && !sidebarCollapsedRef.current) {
      const resizerWidth = resizer.current?.offsetWidth ?? 6; // w-1.5 = 6px
      const availableWidth = window.innerWidth - resizerWidth;
      editor.current.style.width = `${availableWidth / 3}px`; // chat takes ~1/3
    } else {
      editor.current.style.width = "";
    }
  };

  const handleResize = (e: MouseEvent) => {
    if (!editor.current || !resizer.current) return;

    const resizerWidth = resizer.current.offsetWidth;
    const minWidth = 240; // keep the composer usable
    const maxWidth = window.innerWidth - resizerWidth - 320; // leave room to build

    const clampedEditorWidth = Math.max(
      minWidth,
      Math.min(e.clientX, maxWidth)
    );
    // Set ONLY the chat pane; the preview region (flex-1) absorbs the rest.
    editor.current.style.width = `${clampedEditorWidth}px`;
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
    if (!resizer.current) return;
    resizer.current.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("resize", resetLayout);
  });
  useUnmount(() => {
    document.removeEventListener("mousemove", handleResize);
    document.removeEventListener("mouseup", handleMouseUp);
    if (resizer.current) {
      resizer.current.removeEventListener("mousedown", handleMouseDown);
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

  const currentPageData = useMemo(() => {
    return (
      pages.find((page) => page.path === currentPage) ?? {
        path: "index.html",
        html: defaultHTML,
      }
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
    <TooltipProvider>
    <section className="h-[100dvh] bg-card flex flex-col">
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
        sidebarCollapsed={sidebarCollapsed}
        onToggleSidebar={() => setSidebarCollapsed((v) => !v)}
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
          className="!h-7 gap-1.5 px-2.5 text-xs !border-border !bg-white/[0.04] !text-foreground transition-colors duration-150 hover:!bg-muted"
        >
          <Share2 className="size-3.5" />
          <span className="hidden md:inline">Share</span>
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
      <main className="bg-card flex-1 max-lg:flex-col flex w-full max-lg:h-[calc(100%-82px)] relative">
        {/* LEFT — the chat pane, ALWAYS chat (never code). The composer is pinned
            to the bottom of this flex-col (AskAI is `mt-auto`), so messages scroll
            above it. Desktop: docked left unless collapsed; mobile: shown only on
            the Chat tab. Kept mounted so generation state persists across views. */}
        <div
          ref={editor}
          className={classNames(
            // ONE flat black chrome — the left pane shares the workspace field
            // (no card/border/distinct bg); only the RIGHT preview card lifts off
            // it. Desktop: a fixed, resizable width (shrink-0 so the inline width
            // is authoritative). Mobile: fills the column.
            "relative overflow-hidden h-full flex flex-col max-lg:flex-1 lg:shrink-0",
            currentTab === "chat" ? "flex" : "hidden",
            sidebarCollapsed ? "lg:hidden" : "lg:flex"
          )}
        >
          {/* Chat — ALWAYS the left pane (composer/thread live here permanently);
              the history panel OVERLAYS it when toggled from the header icon. */}
          <div className="min-h-0 flex-1 flex flex-col">
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
          </div>

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
        </div>
        {/* Resizer — desktop only, and only while the chat pane is docked. A
            transparent hit-target with a hairline that lifts on hover, so there
            is no hard border seam between the panel and the preview card. */}
        <div
          ref={resizer}
          className={classNames(
            "group/resizer relative w-1.5 cursor-col-resize h-full max-lg:hidden shrink-0",
            sidebarCollapsed && "lg:hidden"
          )}
        >
          {/* No static seam — the left pane and workspace share one flat field;
              the hairline only appears on hover/drag so the resize target is
              discoverable without drawing a permanent border on the sidebar. */}
          <div className="pointer-events-none absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-transparent transition-colors duration-150 group-hover/resizer:bg-white/20 group-active/resizer:bg-white/30" />
        </div>
        {/* RIGHT — Preview OR Code as a RAISED, rounded card that fills the whole
            remaining width to the viewport's right edge (flex-1, min-w-0). The
            card is the only element that lifts off the flat workspace. Preview
            stays mounted (iframe warm, iframeRef valid); Code overlays it. */}
        <div
          className={classNames(
            "relative flex-1 min-w-0 h-full p-2 lg:p-3",
            currentTab === "chat" ? "hidden lg:block" : "block"
          )}
        >
          <div className="relative h-full w-full overflow-hidden rounded-xl border border-border bg-background shadow-2xl shadow-black/40 ring-1 ring-white/5">
            {/* Faint top highlight — a crisp edge that reads as raised glass. */}
            <div className="pointer-events-none absolute inset-x-0 top-0 z-20 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />
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
              <div className="absolute inset-0 z-10 flex bg-card">
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
                <div className="relative min-w-0 flex-1 overflow-hidden">
                  <CopyIcon
                    className="size-4 absolute top-3 right-5 text-muted-foreground hover:text-muted-foreground z-20 cursor-pointer"
                    onClick={() => {
                      copyToClipboard(currentPageData.html);
                      toast.success("HTML copied to clipboard!");
                    }}
                  />
                  <CodeEditor
                    language="html"
                    className={classNames(
                      "h-full w-full bg-card transition-all duration-200 absolute left-0 top-0",
                      {
                        "pointer-events-none": isAiWorking,
                      }
                    )}
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
                </div>
              </div>
            )}
            {/* Revision Details (Timeline | Changes) — overlays the preview card
                when a History revision's "Details" is opened (item 12). */}
            {detailsRev && (
              <RevisionDetails rev={detailsRev} onClose={() => setDetailsRev(null)} />
            )}
          </div>
        </div>
      </main>

      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        projectId={project?._id}
        projectName={project?.title || "Untitled Project"}
      />
    </section>
    </TooltipProvider>
    </OrgProvider>
  );
};
