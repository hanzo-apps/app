"use client";
import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";
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
      <div className="h-full w-full bg-neutral-900 flex items-center justify-center text-neutral-500 text-xs absolute left-0 top-0">
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
import { ListPages } from "./pages";
import { ShareModal } from "./share-modal";
import { VisualEditor } from "./visual-editor";
import { AISupervisor } from "./ai-supervisor";
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
  const [showSupervisor, setShowSupervisor] = useState(false);

  const resetLayout = () => {
    if (!editor.current || !preview.current) return;

    // lg breakpoint is 1024px based on useBreakpoint definition and Tailwind
    // defaults. A collapsed chat pane means the right pane takes the full width,
    // so clear the inline widths (flex-1 fills the row) in that case.
    if (window.innerWidth >= 1024 && !sidebarCollapsedRef.current) {
      // Set initial 1/3 - 2/3 sizes for large screens, accounting for resizer width
      const resizerWidth = resizer.current?.offsetWidth ?? 8; // w-2 = 0.5rem = 8px
      const availableWidth = window.innerWidth - resizerWidth;
      const initialEditorWidth = availableWidth / 3; // Editor takes 1/3 of space
      const initialPreviewWidth = availableWidth - initialEditorWidth; // Preview takes 2/3
      editor.current.style.width = `${initialEditorWidth}px`;
      preview.current.style.width = `${initialPreviewWidth}px`;
    } else {
      // Remove inline styles for smaller screens, let CSS flex-col handle it
      editor.current.style.width = "";
      preview.current.style.width = "";
    }
  };

  const handleResize = (e: MouseEvent) => {
    if (!editor.current || !preview.current || !resizer.current) return;

    const resizerWidth = resizer.current.offsetWidth;
    const minWidth = 100; // Minimum width for editor/preview
    const maxWidth = window.innerWidth - resizerWidth - minWidth;

    const editorWidth = e.clientX;
    const clampedEditorWidth = Math.max(
      minWidth,
      Math.min(editorWidth, maxWidth)
    );
    const calculatedPreviewWidth =
      window.innerWidth - clampedEditorWidth - resizerWidth;

    editor.current.style.width = `${clampedEditorWidth}px`;
    preview.current.style.width = `${calculatedPreviewWidth}px`;
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
    <section className="h-[100dvh] bg-neutral-950 flex flex-col">
      <Header
        tab={currentTab}
        onNewTab={setCurrentTab}
        device={device}
        setDevice={setDevice}
        htmlHistory={htmlHistory}
        setPages={setPages}
        iframeRef={iframeRef}
        pages={pages}
        currentPage={currentPage}
        onSelectPage={setCurrentPage}
        onOpenExternal={openInNewTab}
        sidebarCollapsed={sidebarCollapsed}
        onToggleSidebar={() => setSidebarCollapsed((v) => !v)}
      >
        {/* Secondary actions (Share / Load / Push) share ONE treatment so the
            action cluster reads as a set; Publish is the sole solid primary. */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsShareModalOpen(true)}
          className="gap-2 !border-white/15 !bg-white/[0.04] !text-white hover:!bg-white/10"
        >
          <Share2 className="w-4 h-4" />
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
      <main className="bg-neutral-950 flex-1 max-lg:flex-col flex w-full max-lg:h-[calc(100%-82px)] relative">
        {/* LEFT — the chat pane, ALWAYS chat (never code). The composer is pinned
            to the bottom of this flex-col (AskAI is `mt-auto`), so messages scroll
            above it. Desktop: docked left unless collapsed; mobile: shown only on
            the Chat tab. Kept mounted so generation state persists across views. */}
        <div
          ref={editor}
          className={classNames(
            "bg-neutral-900 relative flex-1 overflow-hidden h-full flex flex-col gap-2 pb-3",
            currentTab === "chat" ? "flex" : "hidden",
            sidebarCollapsed ? "lg:hidden" : "lg:flex"
          )}
        >
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
        {/* Resizer — desktop only, and only while the chat pane is docked. */}
        <div
          ref={resizer}
          className={classNames(
            "bg-neutral-800 hover:bg-neutral-600 active:bg-neutral-500 w-1.5 cursor-col-resize h-full max-lg:hidden",
            sidebarCollapsed && "lg:hidden"
          )}
        />
        {/* RIGHT — Preview OR Code, driven by the header's view switcher. Preview
            stays mounted (iframe warm, iframeRef valid); Code overlays it when
            selected. On mobile this pane is hidden on the Chat tab. */}
        <div
          className={classNames(
            "relative flex-1 h-full",
            currentTab === "chat" ? "hidden lg:block" : "block"
          )}
        >
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
          {/* CODE view — the CodeMirror editor overlaid on the right pane when the
              header switches to Code. The left pane stays chat; code lives here. */}
          {currentTab === "code" && (
            <div className="absolute inset-0 z-10 flex flex-col bg-neutral-900">
              <ListPages
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
              <div className="relative flex-1 overflow-hidden">
                <CopyIcon
                  className="size-4 absolute top-3 right-5 text-neutral-500 hover:text-neutral-300 z-20 cursor-pointer"
                  onClick={() => {
                    copyToClipboard(currentPageData.html);
                    toast.success("HTML copied to clipboard!");
                  }}
                />
                <CodeEditor
                  language="html"
                  className={classNames(
                    "h-full w-full bg-neutral-900 transition-all duration-200 absolute left-0 top-0",
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
        </div>
      </main>

      {/* AI Supervisor Panel — fixed to the viewport bottom-right so it pins
          reliably, with its own close button (the toggle below is hidden while
          open, so it can never cover/trap the panel). */}
      {showSupervisor && (
        <div className="fixed bottom-4 right-4 w-96 max-h-[60vh] overflow-hidden rounded-xl border border-neutral-800 bg-neutral-950 shadow-2xl z-50">
          <button
            type="button"
            onClick={() => setShowSupervisor(false)}
            title="Close AI Supervisor"
            aria-label="Close AI Supervisor"
            className="absolute top-2 right-2 z-10 flex size-7 items-center justify-center rounded-md text-neutral-400 transition-colors hover:bg-neutral-800 hover:text-white"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
          <AISupervisor
            pages={pages}
            iframeRef={iframeRef}
            isAiWorking={isAiWorking}
            onAutoFix={(fixes) => {
              // Apply fixes to the current page
              fixes.forEach(fix => {
                toast.info(`Applying fix: ${fix}`);
              });
              // Trigger re-render with fixes
              const currentHtml = currentPageData.html;
              // In real implementation, apply the actual code fixes here
              setPages((prev) =>
                prev.map((page) =>
                  page.path === currentPage
                    ? { ...page, html: currentHtml }
                    : page
                )
              );
            }}
          />
        </div>
      )}

      {/* Supervisor Toggle Button — hidden while the panel is open (the panel's
          own X closes it), so the button can never be covered/trapped. */}
      {!showSupervisor && (
      <button
        onClick={() => setShowSupervisor(true)}
        className="fixed bottom-4 right-4 p-3 rounded-full shadow-lg transition-all z-40 bg-neutral-800 text-neutral-400 hover:bg-neutral-700"
        title="AI Supervisor"
      >
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"
          />
        </svg>
      </button>
      )}

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
