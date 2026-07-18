"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useMemo, useRef, useEffect } from "react";
import classNames from "classnames";
import { toast } from "sonner";
import { useLocalStorage, useUpdateEffect } from "react-use";
import { ArrowUp, ChevronDown, Crosshair, ImagePlus } from "lucide-react";
import { FaStopCircle } from "react-icons/fa";

import ProModal from "@/components/pro-modal";
import { Button } from "@hanzo/ui";
import { useModels } from "@/lib/hooks/use-models";
import { useRoutingDefaults } from "@/lib/hooks/use-routing-defaults";
import { AUTO_MODEL, isDeadModelId, isSmartRouting, resolveSmartRouting } from "@/lib/providers";
import { HtmlHistory, Page, Project } from "@/types";
// import { InviteFriends } from "@/components/invite-friends";
import { Settings } from "@/components/editor/ask-ai/settings";
import { LoginModal } from "@/components/login-modal";
import { ReImagine } from "@/components/editor/ask-ai/re-imagine";
import { Fix } from "@/components/editor/ask-ai/fix";
import { imageFilesFrom, uploadProjectImages } from "@/lib/upload-project-images";
import {
  addReferenceImages,
  mergeReferenceImages,
  referenceImagesKey,
} from "@/lib/reference-images";
import Loading from "@/components/loading";
import { Checkbox } from "@hanzo/ui";
import { Tooltip, TooltipTrigger, TooltipContent } from "@hanzo/ui";
import { SelectedHtmlElement } from "./selected-html-element";
import { FollowUpTooltip } from "./follow-up-tooltip";
import { isTheSameHtml } from "@/lib/compare-html-diff";
import { useCallAi } from "@/hooks/useCallAi";
import { sendRewardSignal, getLastGenerationRequestId } from "@/lib/reward-signal";
import { SelectedFiles } from "./selected-files";
import { Uploader } from "./uploader";

// Fix mode composes this short, human intent preamble in front of the user's
// text (empty text is fine when references are attached). The reference images
// ride the UNCHANGED follow-up `files` path — Fix adds no new API surface.
const FIX_PREAMBLE =
  "Fix the current design to match the attached reference. Change only what differs from the reference; keep what already matches.";

export function AskAI({
  isNew,
  project,
  images,
  currentPage,
  previousPrompts,
  onScrollToBottom,
  isAiWorking,
  setisAiWorking,
  isEditableModeEnabled = false,
  pages,
  htmlHistory,
  selectedElement,
  setSelectedElement,
  selectedFiles,
  setSelectedFiles,
  setIsEditableModeEnabled,
  onNewPrompt,
  onSuccess,
  setPages,
  setCurrentPage,
}: {
  project?: Project | null;
  currentPage: Page;
  images?: string[];
  pages: Page[];
  onScrollToBottom: () => void;
  previousPrompts: string[];
  isAiWorking: boolean;
  onNewPrompt: (prompt: string) => void;
  htmlHistory?: HtmlHistory[];
  setisAiWorking: React.Dispatch<React.SetStateAction<boolean>>;
  isNew?: boolean;
  onSuccess: (page: Page[], p: string, n?: number[][]) => void;
  isEditableModeEnabled: boolean;
  setIsEditableModeEnabled: React.Dispatch<React.SetStateAction<boolean>>;
  selectedElement?: HTMLElement | null;
  setSelectedElement: React.Dispatch<React.SetStateAction<HTMLElement | null>>;
  selectedFiles: string[];
  setSelectedFiles: React.Dispatch<React.SetStateAction<string[]>>;
  setPages: React.Dispatch<React.SetStateAction<Page[]>>;
  setCurrentPage: React.Dispatch<React.SetStateAction<string>>;
}) {
  const refThink = useRef<HTMLDivElement | null>(null);

  const { models, defaultModel, loading: modelsLoading } = useModels();
  const routingDefaults = useRoutingDefaults();

  const [open, setOpen] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [provider, setProvider] = useLocalStorage("provider", "auto");
  // The persisted `model` is the user OVERRIDE: `AUTO_MODEL` = smart routing on,
  // a concrete id = routing off, unset = follow the org default. A NEW session
  // (unset) opens on the org's server-driven default (`/v1/routing-defaults`) —
  // Auto when the org defaults routing on, else the concrete default model.
  // Fail-soft: with no org policy known this stays on Auto, exactly as before.
  const [storedModel, setModel] = useLocalStorage<string>("model");
  // A dead id persisted by an older build (e.g. a retired `gpt-*-codex`) is
  // treated as UNSET so we open on smart-routing/default instead of sending an
  // unavailable model — the cause of "The model didn't return a usable page".
  const safeStoredModel =
    storedModel && !isDeadModelId(storedModel) ? storedModel : undefined;
  const smartOn = resolveSmartRouting(
    safeStoredModel == null ? null : isSmartRouting(safeStoredModel),
    routingDefaults
  ).enabled;
  const model = safeStoredModel ?? (smartOn ? AUTO_MODEL : defaultModel);
  const [routedModel, setRoutedModel] = useState<string | null>(null);
  const [openProvider, setOpenProvider] = useState(false);
  const [providerError, setProviderError] = useState("");
  const [openProModal, setOpenProModal] = useState(false);
  const [openThink, setOpenThink] = useState(false);
  const [isThinking, setIsThinking] = useState(true);
  const [think, setThink] = useState("");
  const [isFollowUp, setIsFollowUp] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [files, setFiles] = useState<string[]>(images ?? []);
  // Fix mode: ONE flag. While on, the generate call is prefixed with a
  // fix-intent preamble and the send guard accepts a references-only submit.
  const [isFixMode, setIsFixMode] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Per-project reference-image history, persisted like the ask-ai settings
  // (namespaced localStorage). Backs the uploader's "past images" picker so a
  // drop / paste / upload survives a reload before the server list refetches.
  const [history, setHistory] = useLocalStorage<string[]>(
    referenceImagesKey(project?.space_id),
    []
  );

  // ONE way to grow the library: union into the in-session list + persist to the
  // per-project history. Attaching (drop / paste / pick) also selects them.
  const addToLibrary = (urls: string[]) => {
    if (urls.length === 0) return;
    setFiles((prev) => mergeReferenceImages(prev, urls));
    setHistory((prev) => addReferenceImages(prev ?? [], urls));
  };
  const attachRefs = (urls: string[]) => {
    if (urls.length === 0) return;
    addToLibrary(urls);
    setSelectedFiles((prev) => mergeReferenceImages(prev, urls));
  };

  // Drop / paste ingest: reuse the ONE upload path + the "Uploading images..."
  // affordance, then attach the references to the current prompt.
  const ingestFiles = async (imgs: File[]) => {
    if (imgs.length === 0) return;
    if (!project?.space_id) {
      toast.error("Publish your project first to attach reference images.");
      return;
    }
    setIsUploading(true);
    const urls = await uploadProjectImages(project.space_id, imgs);
    if (urls.length) attachRefs(urls);
    else toast.error("Couldn't upload image(s). Please try again.");
    setIsUploading(false);
  };

  const isFileDrag = (e: React.DragEvent) =>
    Array.from(e.dataTransfer?.types ?? []).includes("Files");
  const handleDragOver = (e: React.DragEvent) => {
    if (isFileDrag(e)) e.preventDefault();
  };
  const handleDragEnter = (e: React.DragEvent) => {
    if (!isFileDrag(e)) return;
    e.preventDefault();
    setIsDragging(true);
  };
  const handleDragLeave = (e: React.DragEvent) => {
    // Ignore leave events fired while crossing into a child of the card.
    if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
      setIsDragging(false);
    }
  };
  const handleDrop = (e: React.DragEvent) => {
    if (!isFileDrag(e)) return;
    e.preventDefault();
    setIsDragging(false);
    void ingestFiles(imageFilesFrom(e.dataTransfer.files));
  };
  const handlePaste = (e: React.ClipboardEvent) => {
    const imgs = imageFilesFrom(e.clipboardData?.files ?? null);
    if (imgs.length === 0) return; // let a normal text paste through
    e.preventDefault();
    void ingestFiles(imgs);
  };

  // Message queue state
  const [messageQueue, setMessageQueue] = useState<Array<{id: string; message: string; timestamp: Date}>>([]);
  const [isProcessingQueue, setIsProcessingQueue] = useState(false);

  const {
    callAiNewProject,
    callAiFollowUp,
    callAiNewPage,
    stopController,
    audio: hookAudio,
  } = useCallAi({
    onNewPrompt,
    onSuccess,
    onScrollToBottom,
    setPages,
    setCurrentPage,
    currentPage,
    pages,
    isAiWorking,
    setisAiWorking,
  });

  // Hydrate the in-session library with the persisted per-project history once
  // on mount (client-only, so no SSR/client mismatch on the server `images`).
  useEffect(() => {
    if (history && history.length) {
      setFiles((prev) => mergeReferenceImages(prev, history));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep the persisted selection valid against the live gateway list: if the
  // stored model is no longer served (or a fresh session has none), fall back to
  // the gateway's default. This is the ONE place the selection is reconciled.
  useEffect(() => {
    if (
      !modelsLoading &&
      models.length > 0 &&
      model !== AUTO_MODEL &&
      (!model || !models.some((m) => m.value === model))
    ) {
      setModel(defaultModel);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modelsLoading, models, model, defaultModel]);

  const callAi = async (redesignMarkdown?: string, queuedPrompt?: string) => {
    // If AI is working, add to queue instead of blocking
    if (isAiWorking && prompt.trim() && !queuedPrompt) {
      const newMessage = {
        id: `msg-${Date.now()}-${Math.random()}`,
        message: prompt,
        timestamp: new Date()
      };
      setMessageQueue(prev => [...prev, newMessage]);
      setPrompt("");
      return;
    }

    // Use queued prompt if provided, otherwise use current prompt
    const promptToUse = queuedPrompt || prompt;

    // Fix mode: a references-only submit is valid, otherwise a non-empty prompt
    // is still required. The mode composes the fix preamble in front of the text.
    const fixSubmit = isFixMode && !redesignMarkdown;
    if (
      !redesignMarkdown &&
      !promptToUse.trim() &&
      !(fixSubmit && selectedFiles.length > 0)
    )
      return;
    const effectivePrompt = fixSubmit
      ? promptToUse.trim()
        ? `${FIX_PREAMBLE}\n\n${promptToUse.trim()}`
        : FIX_PREAMBLE
      : promptToUse;

    // Clear the composer after a non-queued submit (queued prompts keep the box
    // untouched). Fix is one-shot: it resets so the next prompt is ordinary.
    const clearComposer = () => {
      if (!queuedPrompt) {
        setPrompt("");
        setIsFixMode(false);
      }
    };

    if (isFollowUp && !redesignMarkdown && !isSameHtml) {
      // Use follow-up function for existing projects
      const selectedElementHtml = selectedElement
        ? selectedElement.outerHTML
        : "";

      const result = await callAiFollowUp(
        effectivePrompt,
        model,
        provider,
        previousPrompts,
        selectedElementHtml,
        selectedFiles
      );

      if (result?.error) {
        handleError(result.error, result.message);
        return;
      }

      if (result?.success) {
        if (result.model) setRoutedModel(result.model);
        clearComposer();
      }
    } else if (isFollowUp && pages.length > 1 && isSameHtml) {
      const result = await callAiNewPage(
        effectivePrompt,
        model,
        provider,
        currentPage.path,
        [
          ...(previousPrompts ?? []),
          ...(htmlHistory?.map((h) => h.prompt) ?? []),
        ],
        setRoutedModel
      );
      if (result?.error) {
        handleError(result.error, result.message);
        return;
      }

      if (result?.success) {
        clearComposer();
      }
    } else {
      // Regenerating a full page: when a prior generation exists, this new full
      // generation replaces it — emit a content-free "regenerate" signal keyed
      // on the OUTGOING generation's id before it is overwritten. First-time
      // generation has no prior id, so this no-ops (never fabricates one).
      sendRewardSignal(getLastGenerationRequestId(), "regenerate");

      const result = await callAiNewProject(
        effectivePrompt,
        model,
        provider,
        redesignMarkdown,
        handleThink,
        () => {
          setIsThinking(false);
        },
        setRoutedModel
      );

      if (result?.error) {
        handleError(result.error, result.message);
        return;
      }

      if (result?.success) {
        clearComposer();
      }
    }
  };

  const handleThink = (think: string) => {
    setThink(think);
    setIsThinking(true);
    setOpenThink(true);
  };

  const handleError = (error: string, message?: string) => {
    switch (error) {
      case "login_required":
        setOpen(true);
        break;
      case "provider_required":
        setOpenProvider(true);
        setProviderError(message || "");
        break;
      case "pro_required":
        setOpenProModal(true);
        break;
      case "api_error":
        toast.error(message || "An error occurred");
        break;
      case "empty_response":
        toast.error(
          message || "The model didn't return a usable page. Please try again."
        );
        break;
      case "network_error":
        toast.error(message || "Network error occurred");
        break;
      default:
        toast.error("An unexpected error occurred");
    }
  };

  // Process message queue when AI stops working
  useEffect(() => {
    if (!isAiWorking && messageQueue.length > 0 && !isProcessingQueue) {
      setIsProcessingQueue(true);
      const nextMessage = messageQueue[0];
      setMessageQueue(prev => prev.slice(1));

      // Small delay to ensure state updates properly
      setTimeout(() => {
        callAi(undefined, nextMessage.message).finally(() => {
          setIsProcessingQueue(false);
        });
      }, 500);
    }
  }, [isAiWorking, messageQueue, isProcessingQueue]);

  // Handle initial prompt for new projects
  useEffect(() => {
    if (isNew && typeof window !== 'undefined') {
      // Check for initial prompt stored by AppEditor
      const initialPrompt = (window as any).__initialPrompt;
      if (initialPrompt) {
        // Clean up the global variable
        delete (window as any).__initialPrompt;

        // Set the prompt
        setPrompt(initialPrompt);

        // Trigger generation after a short delay to ensure everything is mounted
        const timer = setTimeout(() => {
          // Call the AI directly here instead of relying on another effect
          if (!isAiWorking) {
            callAi();
          }
        }, 500);

        return () => clearTimeout(timer);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isNew]);

  useUpdateEffect(() => {
    if (refThink.current) {
      refThink.current.scrollTop = refThink.current.scrollHeight;
    }
  }, [think]);

  useUpdateEffect(() => {
    if (!isThinking) {
      setOpenThink(false);
    }
  }, [isThinking]);

  const isSameHtml = useMemo(() => {
    return isTheSameHtml(currentPage.html);
  }, [currentPage.html]);

  return (
    <div className="px-3">
      {/* Stacked Message Queue Cards */}
      {messageQueue.length > 0 && (
        <div className="mb-4 space-y-2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-white font-medium">
              Queued Messages ({messageQueue.length})
            </span>
            <button
              onClick={() => setMessageQueue([])}
              className="text-xs text-neutral-400 hover:text-white underline"
            >
              Clear all
            </button>
          </div>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {messageQueue.map((msg, index) => (
              <div
                key={msg.id}
                className="relative bg-neutral-800/50 border border-neutral-700 rounded-lg p-3 animate-slideIn"
                style={{
                  animationDelay: `${index * 0.05}s`,
                }}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm text-neutral-300 flex-1">{msg.message}</p>
                  <button
                    onClick={() => setMessageQueue(prev => prev.filter(m => m.id !== msg.id))}
                    className="text-neutral-500 hover:text-neutral-300"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs text-neutral-500">
                    {msg.timestamp.toLocaleTimeString()}
                  </span>
                  {index === 0 && (
                    <span className="text-xs text-neutral-300 flex items-center gap-1">
                      <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                      Next in queue
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slideIn {
          animation: slideIn 0.3s ease-out forwards;
        }
      `}</style>

      <div
        className="relative bg-neutral-800 border border-neutral-700 rounded-2xl ring-[4px] focus-within:ring-neutral-500/30 focus-within:border-neutral-600 ring-transparent z-10 w-full group"
        onDragOver={handleDragOver}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {isDragging && (
          <div className="absolute inset-0 z-30 rounded-2xl border-2 border-dashed border-neutral-500 bg-neutral-900/80 flex items-center justify-center pointer-events-none">
            <p className="text-sm text-neutral-200 flex items-center gap-2">
              <ImagePlus className="size-4" />
              Drop images to attach as references
            </p>
          </div>
        )}
        {think && (
          <div className="w-full border-b border-neutral-700 relative overflow-hidden">
            <header
              className="flex items-center justify-between px-5 py-2.5 group hover:bg-neutral-600/20 transition-colors duration-200 cursor-pointer"
              onClick={() => {
                setOpenThink(!openThink);
              }}
            >
              <p className="text-sm font-medium text-neutral-300 group-hover:text-neutral-200 transition-colors duration-200">
                {isThinking ? "Hanzo is thinking..." : "Hanzo's plan"}
              </p>
              <ChevronDown
                className={classNames(
                  "size-4 text-neutral-400 group-hover:text-neutral-300 transition-all duration-200",
                  {
                    "rotate-180": openThink,
                  }
                )}
              />
            </header>
            <main
              ref={refThink}
              className={classNames(
                "overflow-y-auto transition-all duration-200 ease-in-out",
                {
                  "max-h-[0px]": !openThink,
                  "min-h-[250px] max-h-[250px] border-t border-neutral-700":
                    openThink,
                }
              )}
            >
              <p className="text-[13px] text-neutral-400 whitespace-pre-line px-5 pb-4 pt-3">
                {think}
              </p>
            </main>
          </div>
        )}
        <SelectedFiles
          files={selectedFiles}
          isAiWorking={isAiWorking}
          onDelete={(file) =>
            setSelectedFiles((prev) => prev.filter((f) => f !== file))
          }
        />
        {selectedElement && (
          <div className="px-4 pt-3">
            <SelectedHtmlElement
              element={selectedElement}
              isAiWorking={isAiWorking}
              onDelete={() => setSelectedElement(null)}
            />
          </div>
        )}
        <div className="w-full relative flex items-center justify-between">
          {(isAiWorking || isUploading) && (
            <div className="absolute top-0 left-4 right-12 h-8 z-10 flex items-center justify-between pointer-events-none">
              <div className="flex items-center justify-start gap-2 bg-neutral-800 px-2 py-1 rounded-md">
                <Loading overlay={false} className="!size-3 opacity-50" />
                <p className="text-neutral-400 text-xs">
                  {isUploading ? (
                    "Uploading images..."
                  ) : isAiWorking && !isSameHtml ? (
                    <>
                      AI is working...
                      {messageQueue.length > 0 && (
                        <span className="ml-1 text-neutral-400">
                          ({messageQueue.length} queued)
                        </span>
                      )}
                    </>
                  ) : (
                    <span className="inline-flex">
                      {[
                        "H",
                        "a",
                        "n",
                        "z",
                        "o",
                        " ",
                        "i",
                        "s",
                        " ",
                        "T",
                        "h",
                        "i",
                        "n",
                        "k",
                        "i",
                        "n",
                        "g",
                        ".",
                        ".",
                        ".",
                        " ",
                        "W",
                        "a",
                        "i",
                        "t",
                        " ",
                        "a",
                        " ",
                        "m",
                        "o",
                        "m",
                        "e",
                        "n",
                        "t",
                        ".",
                        ".",
                        ".",
                      ].map((char, index) => (
                        <span
                          key={index}
                          className="bg-gradient-to-r from-neutral-100 to-neutral-300 bg-clip-text text-transparent animate-pulse"
                          style={{
                            animationDelay: `${index * 0.1}s`,
                            animationDuration: "1.3s",
                            animationIterationCount: "infinite",
                          }}
                        >
                          {char === " " ? "\u00A0" : char}
                        </span>
                      ))}
                      {messageQueue.length > 0 && (
                        <span className="ml-2 text-neutral-400">
                          ({messageQueue.length} queued)
                        </span>
                      )}
                    </span>
                  )}
                </p>
              </div>
            </div>
          )}
          <textarea
            disabled={isUploading}
            className={classNames(
              "w-full bg-transparent text-sm outline-none text-white placeholder:text-neutral-400 p-4 resize-none",
              {
                "!pt-2.5": selectedElement && !isAiWorking,
                "opacity-100": isAiWorking && !isUploading,
              }
            )}
            placeholder={
              isFixMode
                ? "Attach a reference (drop, paste, or pick), then send — or add a note"
                : isAiWorking && messageQueue.length > 0
                ? "Type your message... (will be queued)"
                : selectedElement
                ? `Ask Hanzo about ${selectedElement.tagName.toLowerCase()}...`
                : isFollowUp && (!isSameHtml || pages?.length > 1)
                ? "Ask Hanzo for edits"
                : "Ask Hanzo anything..."
            }
            value={prompt}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setPrompt(e.target.value)}
            onPaste={handlePaste}
            onKeyDown={(e: React.KeyboardEvent) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                callAi();
              }
            }}
          />
        </div>
        <div className="flex items-center justify-between gap-2 px-4 pb-3 mt-2">
          <div className="flex-1 flex items-center justify-start gap-1.5">
            <Uploader
              pages={pages}
              onLoading={setIsUploading}
              isLoading={isUploading}
              onFiles={addToLibrary}
              onSelectFile={(file) => {
                if (selectedFiles.includes(file)) {
                  setSelectedFiles((prev) => prev.filter((f) => f !== file));
                } else {
                  setSelectedFiles((prev) => [...prev, file]);
                }
              }}
              files={files}
              selectedFiles={selectedFiles}
              project={project}
            />
            {isNew && <ReImagine onRedesign={(md) => callAi(md)} />}
            {!isSameHtml && (
              <Fix
                active={isFixMode}
                onToggle={() => setIsFixMode((v) => !v)}
              />
            )}
            {!isSameHtml && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="xs"
                    variant={isEditableModeEnabled ? "default" : "outline"}
                    onClick={() => {
                      setIsEditableModeEnabled?.(!isEditableModeEnabled);
                    }}
                    className={classNames("h-[28px]", {
                      "!text-neutral-400 hover:!text-neutral-200 !border-neutral-600 !hover:!border-neutral-500":
                        !isEditableModeEnabled,
                    })}
                  >
                    <Crosshair className="size-4" />
                    Edit
                  </Button>
                </TooltipTrigger>
                <TooltipContent
                  align="start"
                  className="bg-neutral-950 text-xs text-neutral-200 py-1 px-2 rounded-md -translate-y-0.5"
                >
                  Select an element on the page to ask Hanzo edit it
                  directly.
                </TooltipContent>
              </Tooltip>
            )}
            {/* <InviteFriends /> */}
          </div>
          <div className="flex items-center justify-end gap-2">
            {isSmartRouting(model) && routedModel && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="text-xs text-neutral-400 px-2 py-1 rounded-md bg-neutral-800 truncate max-w-[10rem]">
                    Routed: {routedModel}
                  </span>
                </TooltipTrigger>
                <TooltipContent
                  align="end"
                  className="bg-neutral-950 text-xs text-neutral-200 py-1 px-2 rounded-md -translate-y-0.5"
                >
                  Smart routing sent this request to {routedModel}. You&apos;re
                  billed as what served you.
                </TooltipContent>
              </Tooltip>
            )}
            <Settings
              provider={provider as string}
              model={model as string}
              onChange={setProvider}
              onModelChange={setModel}
              open={openProvider}
              error={providerError}
              onClose={setOpenProvider}
            />
            {isAiWorking ? (
              <Button
                size="iconXs"
                variant="destructive"
                onClick={stopController}
                className="gap-1"
              >
                <FaStopCircle className="size-4" />
              </Button>
            ) : (
              <Button
                size="iconXs"
                disabled={
                  isUploading ||
                  (!prompt.trim() &&
                    !(isFixMode && selectedFiles.length > 0))
                }
                onClick={() => callAi()}
              >
                <ArrowUp className="size-4" />
              </Button>
            )}
          </div>
        </div>
        <LoginModal open={open} onClose={() => setOpen(false)} pages={pages} />
        <ProModal
          pages={pages}
          open={openProModal}
          onClose={() => setOpenProModal(false)}
        />
        {!isSameHtml && (
          <div className="absolute top-0 right-0 -translate-y-[calc(100%+8px)] select-none text-xs text-neutral-400 flex items-center justify-center gap-2 bg-neutral-800 border border-neutral-700 rounded-md p-1 pr-2.5">
            <label
              htmlFor="diff-patch-checkbox"
              className="flex items-center gap-1.5 cursor-pointer"
            >
              <Checkbox
                id="diff-patch-checkbox"
                checked={isFollowUp}
                onCheckedChange={(e: boolean | "indeterminate") => {
                  setIsFollowUp(e === true);
                }}
              />
              Diff-Patch Update
            </label>
            <FollowUpTooltip />
          </div>
        )}
      </div>
      <audio ref={hookAudio} id="audio" className="hidden">
        <source src="/success.mp3" type="audio/mpeg" />
        Your browser does not support the audio element.
      </audio>
    </div>
  );
}
