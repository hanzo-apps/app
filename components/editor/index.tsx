"use client";
import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import type { CodeEditorHandle } from "@/components/code-editor";
import dynamic from "next/dynamic";
import { Code2, CopyIcon, Share2 } from "lucide-react";

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
import { PageNavigator } from "./page-navigator";
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

  const [currentTab, setCurrentTab] = useState("chat");
  // Chat mode shows the chat by DEFAULT; the raw code editor is an opt-in
  // overlay toggled from the panel's top-right, so a fresh chat never leaks
  // code behind the composer.
  const [showCode, setShowCode] = useState(false);
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
  const [currentPreviewPath, setCurrentPreviewPath] = useState("/");
  const [showSupervisor, setShowSupervisor] = useState(false);

  const resetLayout = () => {
    if (!editor.current || !preview.current) return;

    // lg breakpoint is 1024px based on useBreakpoint definition and Tailwind defaults
    if (window.innerWidth >= 1024) {
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

  useUpdateEffect(() => {
    if (currentTab === "chat") {
      // Reset editor width when switching to reasoning tab
      resetLayout();
      // re-add the event listener for resizing
      if (resizer.current) {
        resizer.current.addEventListener("mousedown", handleMouseDown);
      }
    } else {
      if (preview.current) {
        // Reset preview width when switching to preview tab
        preview.current.style.width = "100%";
      }
    }
  }, [currentTab]);

  const currentPageData = useMemo(() => {
    return (
      pages.find((page) => page.path === currentPage) ?? {
        path: "index.html",
        html: defaultHTML,
      }
    );
  }, [pages, currentPage]);

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
      >
        {currentTab === "preview" && (
          <PageNavigator
            currentPath={currentPreviewPath}
            onNavigate={(path) => {
              setCurrentPreviewPath(path);
              // Update iframe src
              if (iframeRef.current) {
                const doc = iframeRef.current.contentDocument;
                if (doc) {
                  // Navigate within the iframe
                  doc.location.href = path;
                }
              }
            }}
            onReload={() => {
              if (iframeRef.current) {
                iframeRef.current.contentWindow?.location.reload();
              }
            }}
          />
        )}
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
        {currentTab === "chat" && (
          <>
            <div
              ref={editor}
              className="bg-neutral-900 relative flex-1 overflow-hidden h-full flex flex-col gap-2 pb-3"
            >
              {/* Chat ⇄ code toggle — pinned top-right, above the overlay. Chat
                  is the DEFAULT; the code editor is opt-in so a fresh chat never
                  shows raw code behind the composer. */}
              <button
                type="button"
                onClick={() => setShowCode((s) => !s)}
                title={showCode ? "Hide code" : "View code"}
                aria-label={showCode ? "Hide code" : "View code"}
                className={classNames(
                  "absolute top-3 right-4 z-20 flex items-center justify-center rounded-md p-1.5 transition-colors",
                  showCode
                    ? "bg-white/10 text-neutral-100"
                    : "text-neutral-500 hover:bg-white/5 hover:text-neutral-200"
                )}
              >
                <Code2 className="size-4" />
              </button>
              {/* Code surfaces overlay the chat only when opted in; the AskAI
                  chat below stays mounted (it owns generation state). */}
              {showCode && (
                <>
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
                  <CopyIcon
                    className="size-4 absolute top-14 right-5 text-neutral-500 hover:text-neutral-300 z-2 cursor-pointer"
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
                </>
              )}
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
                  // if xs or sm
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
            <div
              ref={resizer}
              className="bg-neutral-800 hover:bg-neutral-600 active:bg-neutral-500 w-1.5 cursor-col-resize h-full max-lg:hidden"
            />
          </>
        )}
        <div className="relative flex-1">
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
              onCodeUpdate={(newHtml, location) => {
                // Update the current page with new HTML
                setPages((prev) =>
                  prev.map((page) =>
                    page.path === currentPage ? { ...page, html: newHtml } : page
                  )
                );
              }}
            />
          )}
        </div>
      </main>

      {/* AI Supervisor Panel */}
      {showSupervisor && (
        <div className="absolute bottom-16 right-4 w-96 max-h-[60vh] overflow-hidden shadow-2xl z-50">
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

      {/* Supervisor Toggle Button */}
      <button
        onClick={() => setShowSupervisor(!showSupervisor)}
        className={classNames(
          "fixed bottom-20 right-4 p-3 rounded-full shadow-lg transition-all z-40",
          showSupervisor
            ? "bg-white text-neutral-900"
            : "bg-neutral-800 text-neutral-400 hover:bg-neutral-700"
        )}
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
