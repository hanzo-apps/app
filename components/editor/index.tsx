"use client";
import { SizableText, YStack, XStack } from '@hanzo/ui';
// `GuiElement` is a TYPE, and @hanzo/ui's dts build drops a two-hop
// type-only re-export, so it is not on the barrel yet. A type is erased at
// build and cannot create a second runtime, so this does not reintroduce
// the two-copies problem the rest of this migration exists to prevent.
import type { GuiElement } from '@hanzo/gui';
import { useEffect, useMemo, useRef, useState } from "react";
import { toast, Button } from '@hanzo/ui';
import type { CodeEditorHandle } from "@/components/code-editor";
import type { ElementInfo } from "./preview/bridge";
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
import { Page, Project } from "@/types";
import { sendRewardSignal, getLastGenerationRequestId } from "@/lib/reward-signal";
import { SaveButton } from "./save-button";
import { isTheSameHtml } from "@/lib/compare-html-diff";
import { useAutosave } from "@/hooks/useAutosave";
import { loadWorkspace, saveWorkspace } from "@/lib/dev/workspace";
import { saveLabel } from "@/lib/pages/save-label";
import { FileTree } from "./file-tree";
import { HistoryPanel } from "./history";
import { RevisionDetails, type DetailsRev } from "./history/details";
import { ShareModal } from "./share-modal";
import { Console } from "./console";
import { VisualEditor } from "./visual-editor";
import { FilesPane } from "./files";
import { MorePane } from "./more";
import { rightPane } from "@/lib/panes";
import { OrgProvider } from "@/lib/org/client";

export const AppEditor = ({
  project,
  pages: initialPages,
  images,
  isNew,
  siteUrl,
}: {
  project?: Project | null;
  pages?: Page[];
  images?: string[];
  isNew?: boolean;
  /** The project's own public address, when it has one — see Preview.siteUrl. */
  siteUrl?: string | null;
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
  /**
   * What the RIGHT pane shows. Per the comment above, `currentTab` carries two
   * meanings, and `chat` belongs to only one of them: the right pane shows
   * preview or code, never chat.
   *
   * Reading `currentTab` directly here made `chat` a third right-pane value
   * that renders NOTHING. On desktop that is the state you start in — `chat` is
   * the initial value and its segment is hidden above `lg` — so the visual
   * editor never mounted and there was no visible control to say why. Clicking
   * an element in the preview sets the tab back to `chat` (it opens the chat to
   * ask about that element), which disarmed editing again on every use.
   */
  const rightView = rightPane(currentTab);
  /**
   * BOOT: a project with nothing in it yet — one page still wearing the
   * scaffold. The window is the CONVERSATION alone: no preview card, no pane
   * pills, no page tooling, because every one of those operates on an app that
   * does not exist, and chrome for a missing thing reads as a broken thing.
   * Ask questions, plan, talk — full width, like the reference.
   *
   * The unfurl is not an event, it is this predicate flipping: the first real
   * bytes stream into `pages` mid-generation, `isTheSameHtml` goes false, and
   * the workspace appears exactly when there is something to show. Plan-mode
   * turns never touch pages, so a purely conversational start stays a
   * conversation.
   */
  const fresh = pages.length <= 1 && isTheSameHtml(pages[0]?.html ?? "");
  // The left pane is ALWAYS the chat composer; a history/rollback ICON in the
  // header toggles the version-history panel as an OVERLAY over it (item 10).
  const [historyOpen, setHistoryOpen] = useState(false);
  // The revision whose Details view (Timeline | Changes) overlays the right pane
  // (item 12); null = the normal preview/code view.
  const [detailsRev, setDetailsRev] = useState<DetailsRev | null>(null);
  // The chat pane can be collapsed on desktop to give preview/code the full
  // width; on mobile the tab switcher already shows one pane at a time.
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  // The chat pane's width in px — the ONE number the pane, the resizer and the
  // header all read, so the chrome above the split can sit exactly over the
  // pane it controls. 0 = no docked chat (mobile, collapsed, boot).
  const [chatW, setChatW] = useState(0);
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
  // An ElementInfo, not a live node. The preview frame is isolated, so what
  // crosses is a description of the element — selector, tag, text, a style
  // snapshot and its markup — never a handle into another document's DOM.
  const [selectedElement, setSelectedElement] = useState<ElementInfo | null>(
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
      const w = Math.round(availableWidth * 0.27);
      el.style.width = `${w}px`;
      setChatW(w);
    } else {
      el.style.width = "";
      setChatW(0);
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
    setChatW(clampedEditorWidth);
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
  const saveRepo = (project?.space_id ?? "").split("/")[1];
  const autosave = useAutosave(saveRepo, pages, prompts, isAiWorking);

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

  // The split is re-stamped when the states that suspend it change: boot
  // ending (the unfurl), the sidebar toggling. resetLayout reads refs, so it is
  // stable to call from here.
  useEffect(() => {
    resetLayout();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fresh, sidebarCollapsed]);

  // ONE history toggle — the header's icon and the composer's [+] menu share
  // it, so the two ways in cannot drift.
  const toggleHistory = () => {
    const next = !historyOpen;
    setHistoryOpen(next);
    // Opening history must reveal the left pane if it was collapsed.
    if (next) setSidebarCollapsed(false);
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
        booted={!fresh}
        leftWidth={!fresh && !sidebarCollapsed ? chatW : 0}
        chatOpen={!sidebarCollapsed}
        onToggleChat={() => setSidebarCollapsed((v) => !v)}
        historyOpen={historyOpen}
        onToggleHistory={toggleHistory}
        project={project}
      >
        {/* Two lean actions, Codex-minimal: Share (a preview link) and Publish
            (the sole solid primary). ONE secondary treatment — a quiet glass
            toolbar button — so the cluster reads as a set. Git push is NOT a
            header verb: autosave already commits every settled change to
            git.hanzo.ai, so a manual Push button was a third size
            competing for the corner while doing, on demand, exactly what happens
            on its own. Load is gone too — you are already inside a project
            editing it, so "load a project" here was a door to nowhere. */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsShareModalOpen(true)}
          // The same pill as Publish beside it — one family, differing only in
          // emphasis. It was an outline rect on a translucent fill next to a
          // raised rounded primary: two shapes for two siblings, which is what
          // read as "weirdly different".
          height={32} gap="$1.5" paddingHorizontal="$3" borderRadius={999} backgroundColor="$color3" hoverStyle={{ backgroundColor: "$color4" }}
        >
          <Share2 size={14} />
          <SizableText display="none" $md={{ display: "inline" }}>Share</SizableText>
        </Button>
        {project?._id ? (
          <SaveButton save={autosave.saveNow} />
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
      {/* ROW on desktop, COLUMN on mobile — and it was exactly inverted. `$lg` is
          min-width:1024, so `$lg={{ flexDirection: "column" }}` stacked the chat,
          the resizer and the preview VERTICALLY on every desktop: measured 360x0,
          36x819, 1368x24 in an 819-tall column. That is why the preview looked
          missing, why the chat text clipped, and why the resizer ran full height
          down the middle of the window.
          Base is the mobile case (column); `$lg` restores the row. */}
      <XStack
        backgroundColor="$background" flex={1} minHeight={0} width="100%" position="relative"
        flexDirection="column"
        $lg={{ flexDirection: "row" }}
      >
        {/* LEFT — the chat pane, ALWAYS chat (never code). The composer is pinned
            to the bottom of this flex-col (AskAI is `mt-auto`), so messages scroll
            above it. Desktop: docked left unless collapsed; mobile: shown only on
            the Chat tab. Kept mounted so generation state persists across views. */}
        <YStack
          ref={editor}
          position="relative" overflow="hidden" height="100%"
          // `$lg` is min-width:1024 — DESKTOP. These three blocks (here, the
          // resizer, the preview) were written as if it meant "at most lg", so
          // every one of them applied its mobile rule to desktop instead: the
          // preview vanished whenever you were on the Chat tab, and the resizer
          // between the two panes existed only on phones. The comments above
          // already say what was meant; the styles now agree with them.
          //
          // Mobile: one pane at a time, chosen by the tab. Desktop: chat docked
          // left unless collapsed, preview beside it.
          display={currentTab === "chat" || fresh ? "flex" : "none"}
          // flexGrow 0 on desktop, and that zero is the whole resizer. The pane
          // carried `flex: 1`, and grow re-expands past any width the drag
          // writes — resetLayout stamped 27%, grow pulled it straight back to
          // half, so the split sat pinned at 50/50 and the drag was a no-op
          // that read as "I can't even resize it". One authoritative width
          // (style.width, owned by resetLayout + the drag), one flex fill (the
          // preview). Boot is the exception: the conversation IS the window.
          $lg={{ flexGrow: fresh ? 1 : 0, flexShrink: 0, display: !fresh && sidebarCollapsed ? "none" : "flex" }}
        >
          {/* Chat — ALWAYS the left pane (composer/thread live here permanently);
              the history panel OVERLAYS it when toggled from the header icon. */}
          <YStack minHeight={0} flex={1} {...(fresh ? { width: "100%", maxWidth: 860, alignSelf: "center" } : null)}>
            <AskAI
              onToggleHistory={toggleHistory}
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

                // Persistence is autosave's job and ONLY autosave's job. A commit
                // fired here as well, two seconds ahead of the debounce, so every
                // turn wrote the same pages to the same repo twice and the history
                // grew a duplicate per turn. The status bar reports the one write
                // that remains, which is also the one the person can see.
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
          position="relative" width="$3" height="100%" flexShrink={0} cursor="col-resize" alignItems="center" justifyContent="center"
          // Only where there are two panes to divide: hidden on mobile, shown on
          // desktop. It was exactly inverted.
          display="none" $lg={{ display: fresh ? "none" : "flex" }} className="group/resizer"
        >
          {/* macOS split view: NO visible divider at rest — the panes simply
              meet. The wide (w-3) hit target still grabs from either edge, and a
              single hairline seam FADES IN only on hover/drag, so the affordance
              appears exactly when you reach for it and the chrome stays quiet
              otherwise. The old always-on grip pill (a fat gray lozenge down the
              middle) is gone: it read as a heavy structural divider, which is the
              opposite of the one-continuous-surface the workspace wants. */}
          <YStack pointerEvents="none" position="absolute" top="$3" bottom="$3" left="50%" width={1} x="-50%" borderRadius="$10" backgroundColor="transparent" $group-resizer-hover={{ backgroundColor: "$color06" }} $group-resizer-press={{ backgroundColor: "$color8" }} />
        </XStack>
        {/* RIGHT — Preview OR Code as a RAISED, rounded card that fills the whole
            remaining width to the viewport's right edge (flex-1, min-w-0). The
            card is the only element that lifts off the flat workspace. Preview
            stays mounted (iframe warm, iframeRef valid); Code overlays it. */}
        <YStack
          position="relative" flex={1} minWidth={0} height="100%" padding={0}
          display={currentTab === "chat" || fresh ? "none" : "flex"}
          $lg={{ padding: 0, display: fresh ? "none" : "flex" }}
        >
          {/* FULL-BLEED, the owner's call: the preview IS the workspace's right
              region, not a card floating in it. The gutter, the hairline and
              the elevation are gone — the resizer's hover seam is the only
              boundary, and the canvas runs to the window edges (the console at
              rest is an invisible pull-up edge, so the bottom is the window's). */}
          <YStack position="relative" height="100%" width="100%" overflow="hidden" backgroundColor="$background" className="preview-stage">
            {/* Faint top highlight — a crisp edge that reads as raised glass. */}
            <YStack pointerEvents="none" position="absolute" left="$0" right="$0" top="$0" zIndex={20} height={1} />
            <Preview
              html={currentPageData?.html}
              isResizing={isResizing}
              isAiWorking={isAiWorking}
              ref={preview}
              device={device}
              siteUrl={siteUrl}
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
            {rightView === "preview" && (
              <VisualEditor
                iframeRef={iframeRef}
                editorRef={editorRef}
                pagePath={currentPageData?.path ?? "index.html"}
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
            {/* FILES view — a browser over the project's real file list, with a
                preview of whatever is selected. Distinct from Code, which is an
                editor: this answers "what is in here", that answers "change it". */}
            {rightView === "files" && (
              <FilesPane
                pages={pages}
                currentPage={currentPage}
                onSelectPage={setCurrentPage}
  />
            )}
            {/* MORE view — everything about the project that is not its source:
                the Hanzo services behind it, analytics, connectors, payments. */}
            {rightView === "more" && <MorePane projectId={project?.space_id ?? null} />}
            {/* CODE view — the CodeMirror editor overlaid inside the card when the
                header switches to Code. The left panel stays chat; code lives here. */}
            {rightView === "code" && (
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
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    aria-label="Copy HTML"
                    position="absolute"
                    top="$2"
                    right="$2"
                    zIndex={20}
                    onClick={() => {
                      copyToClipboard(currentPageData.html);
                      toast.success("HTML copied to clipboard!");
                    }}
                  >
                    <CopyIcon size={16} />
                  </Button>
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
