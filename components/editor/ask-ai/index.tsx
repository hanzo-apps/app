"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useMemo, useRef, useEffect } from "react";
import classNames from "classnames";
import { toast } from "@hanzo/ui";
import { useLocalStorage } from "react-use";
import { ArrowUp, ImagePlus, MoreHorizontal, X } from "lucide-react";
import { FaStopCircle } from "react-icons/fa";

import ProModal from "@/components/pro-modal";
import { useUsageLimit } from "@/components/usage/usage-limit";
import { Button } from "@hanzo/ui";
import { useModels } from "@/lib/hooks/use-models";
import { useRoutingDefaults } from "@/lib/hooks/use-routing-defaults";
import { AUTO_MODEL, isDeadModelId, isSmartRouting, resolveSmartRouting } from "@/lib/providers";
import { HtmlHistory, Page, Project } from "@/types";
// import { InviteFriends } from "@/components/invite-friends";
import { Settings } from "@/components/editor/ask-ai/settings";
import { LoginModal } from "@/components/login-modal";
import { ReImagine } from "@/components/editor/ask-ai/re-imagine";
import { imageFilesFrom, uploadProjectImages } from "@/lib/upload-project-images";
import {
  addReferenceImages,
  mergeReferenceImages,
  referenceImagesKey,
} from "@/lib/reference-images";
import Loading from "@/components/loading";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/overlay";
import { SelectedHtmlElement } from "./selected-html-element";
import { isTheSameHtml } from "@/lib/compare-html-diff";
import { useCallAi } from "@/hooks/useCallAi";
import { sendRewardSignal, getLastGenerationRequestId } from "@/lib/reward-signal";
import { SelectedFiles } from "./selected-files";
import { Uploader } from "./uploader";
import { offer } from "./mic";
import { sentence } from "./sentence";
import { ChatThread, type ThreadMessage } from "./chat-thread";
import { isConversational } from "./intent";
import { useVoice, speech } from "@hanzo/voice";

// The builder's ear and voice, lent the caller's IAM session by the app's own
// `/v1/audio/*` proxy — so the browser never carries a gateway token.
//
// Measured 2026-07-26: the gateway resolves /v1/audio/* through IAM and does not
// yet accept a hanzo.id bearer with `aud: hanzo-app` (401 — the same 401 that
// makes /v1/models fall back to its offline ladder; it is not audio-specific).
// That costs the platform VOICE, not the conversation: the browser's own
// recogniser still gives a live transcript and its own voice reads the reply,
// and this upgrades itself the day the gateway accepts that audience.
const HANZO_SPEECH = speech({ baseUrl: "" });

// Fix mode composes this short, human intent preamble in front of the user's
// text (empty text is fine when references are attached). The reference images
// ride the UNCHANGED follow-up `files` path — Fix adds no new API surface.
const FIX_PREAMBLE =
  "Fix the current design to match the attached reference. Change only what differs from the reference; keep what already matches.";


// Contextual next-step suggestions shown as dismissible chips above the composer
// (Lovable parity). Honest, app-agnostic starters — clicking one sends it as a
// message in the current mode (Plan discusses it, Build executes it). Dynamic,
// app-state-derived suggestions are a future refinement on top of this set.
const SUGGESTIONS = [
  "Review security",
  "Review SEO",
  "Improve accessibility",
  "Make it responsive",
  "Add a contact form",
];

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
  const { models, defaultModel, loading: modelsLoading } = useModels();
  const routingDefaults = useRoutingDefaults();

  const [open, setOpen] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [provider, setProvider] = useLocalStorage("provider", "auto");
  // The persisted `model` is the user OVERRIDE: `AUTO_MODEL` = smart routing on,
  // a concrete id = routing off, unset = follow the org default. A NEW session
  // (unset) opens on the org's server-driven default (`/v1/routing-defaults`) —
  // Auto when the org defaults routing on, else the concrete default model.
  // With no org policy known that is DEFAULT_MODEL — a new session opens on
  // Enso, the rung that picks best, not on the separate `auto` router.
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
  // The ONE "Need more usage?" modal — raised on an out-of-credit (402) signal
  // from a metered generation instead of failing silently.
  const { raise: raiseUsageLimit } = useUsageLimit();
  // Diff-patch (follow-up) updates are now simply the default — the toggle chip
  // + explainer popover were removed (no one toggled it). Always on.
  const [isFollowUp] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [files, setFiles] = useState<string[]>(images ?? []);
  // Fix mode: ONE flag. While on, the generate call is prefixed with a
  // fix-intent preamble and the send guard accepts a references-only submit.
  const [isFixMode, setIsFixMode] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Composer mode (Lovable parity): "build" generates/patches the app (default);
  // "plan" is a conversational back-and-forth that DOESN'T touch the app — the
  // model discusses/plans, then the user flips to Build to execute. Persisted.
  const [mode, setMode] = useLocalStorage<"build" | "plan">("composer-mode", "build");
  const isPlan = mode === "plan";

  // Honor the Build/Plan choice handed off from the landing / dashboard composer
  // (localStorage.initialMode). Applied ONCE on mount then cleared, so it seeds the
  // builder without overriding later manual toggles — mirrors the initialPrompt
  // handoff. Before this, choosing "Plan" on the landing was silently dropped.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const handoff = localStorage.getItem("initialMode");
    if (handoff === "build" || handoff === "plan") {
      setMode(handoff);
      localStorage.removeItem("initialMode");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Suggestion chips: dismissible per project (persisted). Clicking a chip sends
  // it straight as a message (respecting the mode), without touching the box.
  const [suggestionsDismissed, setSuggestionsDismissed] = useLocalStorage<boolean>(
    `suggestions-dismissed:${project?.space_id ?? "new"}`,
    false
  );

  // Post-remix drop-in: pending integrations the remix handoff (localStorage
  // `remixSetup`) asked us to surface as connect/skip chips above the composer.
  const [remixPending, setRemixPending] = useState<
    Array<{ name: string; connectUrl?: string; skippable?: boolean }>
  >([]);

  // Resizable composer (item 17): the input area's height is user-draggable from
  // a grip on its top edge and auto-grows with content until the user overrides.
  // Persisted per project; clamped to [1 line, 40% of the pane].
  const COMPOSER_MIN_H = 44;
  const [savedComposerH, setSavedComposerH] = useLocalStorage<number>(
    `composer-height:${project?.space_id ?? "new"}`,
    0
  );
  const [composerH, setComposerH] = useState(COMPOSER_MIN_H);
  const composerHRef = useRef(COMPOSER_MIN_H);
  const manualResizeRef = useRef(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);

  const maxComposerH = () =>
    Math.max(
      COMPOSER_MIN_H,
      Math.round(
        (rootRef.current?.clientHeight ??
          (typeof window !== "undefined" ? window.innerHeight : 800)) * 0.4
      )
    );
  const setComposerHeight = (h: number, persist: boolean) => {
    const clamped = Math.min(maxComposerH(), Math.max(COMPOSER_MIN_H, Math.round(h)));
    composerHRef.current = clamped;
    setComposerH(clamped);
    if (persist) setSavedComposerH(clamped);
  };

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

  // Chat thread — the single source of truth for what's shown ABOVE the
  // composer: the user's submitted bubbles and the assistant's live plan/build
  // turn. Every send appends a user message + an assistant placeholder that the
  // ONE /v1/generate stream mutates through planning → building → done/error.
  const [messages, setMessages] = useState<ThreadMessage[]>([]);
  const activeAssistantId = useRef<string | null>(null);
  const activeStartedAt = useRef<number>(0);
  // "stream" = a full generation whose pages stream in live (drives the build
  // activity from the `pages` prop); "edit" = a diff-patch follow-up (JSON, no
  // live pages). null between turns.
  const activeTurnKind = useRef<"stream" | "edit" | null>(null);

  const genId = () =>
    `m-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

  const updateAssistant = (id: string | null, patch: Partial<ThreadMessage>) => {
    if (!id) return;
    setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, ...patch } : m)));
  };

  // Append the user bubble + a fresh assistant placeholder; return the
  // assistant id so the caller can settle it when the generation finishes.
  const beginTurn = (userText: string, streaming: boolean) => {
    const aid = genId();
    activeAssistantId.current = aid;
    activeStartedAt.current = Date.now();
    activeTurnKind.current = streaming ? "stream" : "edit";
    setMessages((prev) => [
      ...prev,
      { id: genId(), role: "user", text: userText },
      {
        id: aid,
        role: "assistant",
        phase: streaming ? "planning" : "building",
        plan: streaming ? "" : undefined,
        activity: streaming ? [] : ["Applying edits"],
      },
    ]);
    return aid;
  };

  const elapsed = () =>
    Math.max(1, Math.round((Date.now() - activeStartedAt.current) / 1000));

  const finishTurn = (id: string, phase: "done" | "error", text: string) => {
    updateAssistant(id, { phase, text });
    if (activeAssistantId.current === id) {
      activeAssistantId.current = null;
      activeTurnKind.current = null;
    }
  };

  // Plan mode: append the user bubble + a streaming assistant CHAT bubble.
  const beginChatTurn = (userText: string) => {
    const aid = genId();
    activeAssistantId.current = aid;
    activeStartedAt.current = Date.now();
    activeTurnKind.current = "edit"; // not a streaming-pages turn
    setMessages((prev) => [
      ...prev,
      { id: genId(), role: "user", text: userText },
      { id: aid, role: "assistant", kind: "chat", phase: "building", text: "" },
    ]);
    return aid;
  };

  // Map the hook's error codes to one honest, terse thread line. Modals
  // (login/pro/provider) still open via handleError; the thread just never
  // dead-ends on a dangling "building" bubble.
  const errorText = (r: { error?: string; message?: string }) => {
    switch (r.error) {
      case "aborted":
        return "Stopped.";
      case "login_required":
        return "Sign in to continue.";
      case "pro_required":
        return "Upgrade to continue.";
      case "need_credits":
        return "You're out of credits.";
      case "provider_required":
        return r.message || "Choose a provider to continue.";
      default:
        return r.message || "Something went wrong — please try again.";
    }
  };

  const {
    callAiNewProject,
    callAiFollowUp,
    callAiNewPage,
    callAiChat,
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

    // Clear the composer IMMEDIATELY on a fresh (non-queued) submit — the send
    // is now reflected by the thread bubble, not by text lingering in the box
    // (which used to sit under the "AI is working…" pill). Fix is one-shot.
    if (!queuedPrompt) {
      setPrompt("");
      setIsFixMode(false);
    }

    // A conversational turn — NO build. Stream a chat reply into the thread and stop.
    // Plan mode is always conversational; Build mode is too when the message is a
    // plain question/greeting (so "what can you do" answers instead of nuking the
    // app). Re-imagine/fix are build actions; they ignore this.
    if ((isPlan || isConversational(promptToUse)) && !redesignMarkdown && !fixSubmit) {
      const chatId = beginChatTurn(promptToUse.trim());
      const result = await callAiChat(
        promptToUse.trim(),
        model,
        provider,
        previousPrompts,
        (textSoFar) => updateAssistant(chatId, { text: textSoFar, phase: "building" })
      );
      if (result?.error) {
        finishTurn(chatId, "error", errorText(result));
        handleError(result.error, result.message);
        return;
      }
      if (result?.success) {
        if (result.model) setRoutedModel(result.model);
        updateAssistant(chatId, { phase: "done" });
        activeAssistantId.current = null;
        activeTurnKind.current = null;
      }
      return;
    }

    // Pick the generation path (same conditions as before), then append the
    // user bubble + assistant placeholder BEFORE awaiting so the thread reflects
    // the send instantly.
    const useFollowUp = isFollowUp && !redesignMarkdown && !isSameHtml;
    const useNewPage =
      !useFollowUp && isFollowUp && pages.length > 1 && isSameHtml;
    const streaming = !useFollowUp; // newProject + newPage stream pages live
    const displayText = redesignMarkdown
      ? "Re-imagine this design"
      : promptToUse.trim() || "Fix the design to match the reference";
    const assistantId = beginTurn(displayText, streaming);

    if (useFollowUp) {
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
        finishTurn(assistantId, "error", errorText(result));
        handleError(result.error, result.message);
        return;
      }

      if (result?.success) {
        if (result.model) setRoutedModel(result.model);
        const n = Array.isArray(result.updatedLines)
          ? result.updatedLines.length
          : 0;
        // Honest count: applyEdits records one entry per SEARCH block that actually
        // matched, so n === 0 means the model's edit didn't match the current page
        // and NOTHING changed. Say so (and prompt a retry) instead of the old phantom
        // "1 edit applied", which lied exactly during the refine step.
        finishTurn(
          assistantId,
          "done",
          n === 0
            ? `No changes applied — the edit didn't match this page. Try rephrasing. · ${elapsed()}s`
            : `${n} edit${n === 1 ? "" : "s"} applied · ${elapsed()}s`
        );
      }
    } else if (useNewPage) {
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
        finishTurn(assistantId, "error", errorText(result));
        handleError(result.error, result.message);
        return;
      }

      if (result?.success) {
        finishTurn(assistantId, "done", `Added a page · ${elapsed()}s`);
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
        () => updateAssistant(assistantId, { phase: "building" }),
        setRoutedModel
      );

      if (result?.error) {
        finishTurn(assistantId, "error", errorText(result));
        handleError(result.error, result.message);
        return;
      }

      if (result?.success) {
        const n = Array.isArray(result.pages) ? result.pages.length : 1;
        finishTurn(
          assistantId,
          "done",
          `Built · ${n} file${n === 1 ? "" : "s"} · ${elapsed()}s`
        );
      }
    }
  };

  // ── the spoken conversation ───────────────────────────────────────────────
  //
  // The composer owns the voice because it owns all three things a conversation
  // needs: the prompt the transcript lands in, the submit path a finished turn
  // goes through, and the reply to read back. The mic itself lives on the
  // console bar and is handed this machine by `mic.ts`.
  //
  // Anything already typed is kept: the transcript is appended to it, and the
  // turn that gets sent is the whole line, exactly as if it had been typed.
  const typed = useRef<string | null>(null);
  const held = useRef(prompt);
  held.current = prompt;
  const join = (heard: string) =>
    typed.current ? `${typed.current} ${heard}` : heard;

  const voice = useVoice({
    speech: HANZO_SPEECH,
    onPartial: (heard) => {
      if (typed.current === null) typed.current = held.current.trim();
      setPrompt(join(heard));
    },
    onUtterance: (said) => {
      const turn = join(said);
      typed.current = null;
      // The EXISTING submit path — voice is a way of typing, not a way of sending.
      callAi(undefined, turn);
    },
  });

  // The console bar draws it.
  useEffect(() => offer(voice), [voice]);

  // Read the settled reply back. `say` is a no-op outside a conversation, so a
  // typed turn stays silent without asking anyone here whether it was spoken.
  const read = useRef<string | null>(null);
  useEffect(() => {
    const last = messages[messages.length - 1];
    if (!last || last.role !== "assistant" || last.phase !== "done") return;
    if (!last.text || read.current === last.id) return;
    read.current = last.id;
    void voice.say(sentence(last.text));
  }, [messages, voice]);

  // Reasoning stream → the active turn's plan card (streamed live, monochrome
  // shimmer while designing). Only callAiNewProject emits <think>.
  const handleThink = (thinkText: string) => {
    updateAssistant(activeAssistantId.current, {
      plan: thinkText,
      phase: "planning",
    });
  };

  // Suggestion chip → send the suggestion as a message in the current mode
  // (never clobbers whatever the user has typed in the composer).
  const runSuggestion = (text: string) => {
    if (isAiWorking) return;
    callAi(undefined, text);
  };

  // Remix integration chips — Connect opens the connector (new tab, so the
  // builder isn't lost); Skip removes the chip and drops an honest system line.
  const connectIntegration = (p: { name: string; connectUrl?: string }) => {
    if (typeof window === "undefined") return;
    window.open(p.connectUrl || "/connectors", "_blank", "noopener,noreferrer");
  };
  const skipIntegration = (name: string) => {
    setRemixPending((prev) => prev.filter((p) => p.name !== name));
    setMessages((prev) => [
      ...prev,
      { id: genId(), role: "system", text: `Skipped connecting ${name}` },
    ]);
  };

  // Composer auto-grow: fit the textarea to its content until the user manually
  // resizes (which pins the height). Clamped to [1 line, 40% of the pane].
  const autoGrowComposer = () => {
    const el = textareaRef.current;
    if (!el || manualResizeRef.current) return;
    el.style.height = "auto";
    setComposerHeight(Math.max(COMPOSER_MIN_H, el.scrollHeight), false);
  };

  // Top-edge drag handle → resize the input area (up = taller). Pointer events
  // cover mouse + touch; the height persists per project on release.
  const onResizePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    manualResizeRef.current = true;
    const startY = e.clientY;
    const startH = composerHRef.current;
    const onMove = (ev: PointerEvent) =>
      setComposerHeight(startH + (startY - ev.clientY), false);
    const onUp = () => {
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerup", onUp);
      setSavedComposerH(composerHRef.current);
    };
    document.addEventListener("pointermove", onMove);
    document.addEventListener("pointerup", onUp);
  };
  const nudgeComposer = (delta: number) => {
    manualResizeRef.current = true;
    setComposerHeight(composerHRef.current + delta, true);
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
      case "need_credits":
        raiseUsageLimit();
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
      case "aborted":
        // User pressed Stop — silent by design (no stuck spinner, no toast).
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

  // Handle initial prompt (dashboard/landing composer, ?prompt=, or a template
  // seed) for new projects. The seed is AUTO-SUBMITTED straight into the thread
  // — it appears as a fully-submitted user bubble and the composer stays EMPTY.
  // No prefill ever: it is passed EXPLICITLY as the queuedPrompt so callAi's
  // `queuedPrompt || prompt` sends the real seed (setPrompt is async, so relying
  // on the composer state would submit nothing — the old stale-closure bug).
  useEffect(() => {
    if (isNew && typeof window !== 'undefined') {
      const initialPrompt = (window as any).__initialPrompt;
      if (initialPrompt) {
        delete (window as any).__initialPrompt;
        const timer = setTimeout(() => {
          if (!isAiWorking) {
            callAi(undefined, initialPrompt);
          }
        }, 300);

        return () => clearTimeout(timer);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isNew]);

  // Template/remix EDIT arrival: a GREETING-only seed. The template's real HTML
  // is already loaded into the preview (pages), so we do NOT generate — we post
  // a friendly ASSISTANT greeting and wait for the user to ask for a change.
  // This is the "load + greet, ready to edit" path, distinct from a build-prompt
  // seed (__initialPrompt above), which auto-generates. dev/page stages this
  // BEFORE the editor mounts (behind its splash), so it's set when we read it.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const greeting = (window as any).__assistantGreeting;
    if (!greeting) return;
    delete (window as any).__assistantGreeting;
    setMessages((prev) => [
      ...prev,
      {
        id: genId(),
        role: "assistant",
        kind: "chat",
        phase: "done",
        text: String(greeting),
      },
    ]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Post-remix drop-in: consume the remix handoff (localStorage `remixSetup`,
  // written by the remix/dashboard flow) ONCE on mount — exactly like the
  // initialPrompt contract. Seeds the thread with a first ASSISTANT opener + a
  // provisioned system line, and surfaces the pending integrations as chips.
  // Absent handoff → nothing happens (normal seed flow).
  useEffect(() => {
    if (typeof window === "undefined") return;
    let raw: string | null = null;
    try {
      raw = localStorage.getItem("remixSetup");
      if (raw) localStorage.removeItem("remixSetup");
    } catch {
      /* storage unavailable */
    }
    if (!raw) return;
    try {
      const setup = JSON.parse(raw) as {
        firstMessage?: string;
        pending?: Array<{ name: string; connectUrl?: string; skippable?: boolean }>;
        provisioned?: string[];
      };
      const opener = (setup.firstMessage || "").trim();
      const seeded: ThreadMessage[] = [];
      if (opener)
        seeded.push({
          id: genId(),
          role: "assistant",
          kind: "chat",
          phase: "done",
          text: opener,
        });
      if (Array.isArray(setup.provisioned) && setup.provisioned.length)
        seeded.push({
          id: genId(),
          role: "system",
          text: `Provisioned: ${setup.provisioned.join(", ")}`,
        });
      if (seeded.length) setMessages((prev) => [...prev, ...seeded]);
      if (Array.isArray(setup.pending))
        setRemixPending(setup.pending.filter((p) => p && p.name));
    } catch {
      /* malformed handoff — ignore, never dead-end */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Restore the persisted composer height once on mount (client-only, so no
  // SSR/client style mismatch). A saved value means the user had resized it.
  useEffect(() => {
    if (savedComposerH && savedComposerH > 0) {
      manualResizeRef.current = true;
      composerHRef.current = savedComposerH;
      setComposerH(savedComposerH);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-grow the composer to fit typed content (until a manual resize pins it).
  useEffect(() => {
    autoGrowComposer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prompt]);

  const isSameHtml = useMemo(() => {
    return isTheSameHtml(currentPage.html);
  }, [currentPage.html]);

  // The working modes currently on. ONE list: it names the overflow control, it
  // fills its tooltip, and its length is what accents the trigger — so a mode
  // that is folded into the menu can never be silently on.
  const modes = useMemo(
    () =>
      [
        isEditableModeEnabled && "Select an element",
        isFixMode && "Match a reference",
      ].filter(Boolean) as string[],
    [isEditableModeEnabled, isFixMode]
  );

  // Drive the active turn's build phase + live activity from the ONE generation
  // stream: for a streaming turn (newProject/newPage), pages stay untouched
  // while reasoning streams (the hook gates page rendering on <think>), then
  // start updating once real HTML arrives — so `!isSameHtml` is the honest
  // "HTML generation has begun" signal. The plan card settles and the activity
  // list ("Writing index.html…") takes over. No second model call.
  useEffect(() => {
    if (activeTurnKind.current !== "stream") return;
    const id = activeAssistantId.current;
    if (!id || !isAiWorking || isSameHtml) return;
    updateAssistant(id, {
      phase: "building",
      activity: pages.map((p) => `Writing ${p.path}`),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSameHtml, pages, isAiWorking]);

  return (
    // The chat pane is a flex column: the thread scrolls at the top and the
    // composer is pinned at the bottom.
    //
    // With an EMPTY thread ChatThread returns null, so the column has one child
    // and `mt-auto` docked it to the bottom of the full pane height — leaving a
    // tall band of nothing above it that reads as broken layout rather than as
    // an empty state. The composer centres instead, which is what every chat
    // surface does on a new thread, and `mt-auto` is dropped in that case
    // because it would fight `justify-center`. Once a first message exists the
    // thread takes flex-1 and the composer docks exactly as before.
    <div
      ref={rootRef}
      className={classNames(
        "mx-auto flex h-full min-h-0 w-full max-w-2xl flex-col",
        messages.length === 0 && "justify-center"
      )}
    >
      <ChatThread messages={messages} className="min-h-0 flex-1" />
      <div
        className={classNames(
          "px-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]",
          messages.length > 0 && "mt-auto"
        )}
      >
      {/* Stacked Message Queue Cards */}
      {messageQueue.length > 0 && (
        <div className="mb-4 space-y-2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-foreground font-medium">
              Queued Messages ({messageQueue.length})
            </span>
            <button
              onClick={() => setMessageQueue([])}
              className="text-xs text-muted-foreground hover:text-foreground underline"
            >
              Clear all
            </button>
          </div>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {messageQueue.map((msg, index) => (
              <div
                key={msg.id}
                className="relative bg-muted/50 border border-border rounded-lg p-3 animate-slideIn"
                style={{
                  animationDelay: `${index * 0.05}s`,
                }}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm text-muted-foreground flex-1">{msg.message}</p>
                  <button
                    onClick={() => setMessageQueue(prev => prev.filter(m => m.id !== msg.id))}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs text-muted-foreground">
                    {msg.timestamp.toLocaleTimeString()}
                  </span>
                  {index === 0 && (
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <div className="w-1.5 h-1.5 bg-foreground rounded-full animate-pulse" />
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

      {/* Post-remix integration chips — one connect/skip row per pending service,
          horizontally scrollable on mobile, with the Plan-mode tip. */}
      {remixPending.length > 0 && (
        <div className="mb-2 space-y-1.5">
          <div className="flex items-center gap-1.5 overflow-x-auto [&::-webkit-scrollbar]:hidden">
            {remixPending.map((p) => (
              <div
                key={p.name}
                className="flex shrink-0 items-center gap-1.5 rounded-full border border-border bg-muted/50 px-2.5 py-1 text-xs"
              >
                <span className="whitespace-nowrap text-foreground">🔥 {p.name}</span>
                {p.skippable !== false && (
                  <>
                    <button
                      type="button"
                      onClick={() => skipIntegration(p.name)}
                      className="text-muted-foreground transition-colors hover:text-foreground"
                    >
                      Skip
                    </button>
                    <span className="text-muted-foreground">·</span>
                  </>
                )}
                <button
                  type="button"
                  onClick={() => connectIntegration(p)}
                  className="font-medium text-foreground hover:underline"
                >
                  Connect
                </button>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-muted-foreground">
            Tip: switch from Build to Plan mode to brainstorm or debug without
            code changes.
          </p>
        </div>
      )}

      {/* Suggestion chips — dismissible, horizontally scrollable (mobile-safe),
          monochrome. Clicking a chip sends it as a message in the current mode.
          Hidden while the AI is working and once dismissed for this project. */}
      {!suggestionsDismissed && !isAiWorking && (
        <div className="mb-2 flex items-center gap-1.5">
          <div className="flex flex-1 items-center gap-1.5 overflow-x-auto scrollbar-none [scrollbar-width:none] [&::-webkit-scrollbar]:hidden [mask-image:linear-gradient(to_right,#000_88%,transparent)]">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => runSuggestion(s)}
                className="shrink-0 whitespace-nowrap rounded-full border border-border bg-muted/50 px-3 py-1 text-xs text-muted-foreground transition-colors hover:border-ring hover:bg-muted hover:text-foreground"
              >
                {s}
              </button>
            ))}
          </div>
          <button
            type="button"
            aria-label="Dismiss suggestions"
            onClick={() => setSuggestionsDismissed(true)}
            className="shrink-0 rounded-full p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <X className="size-3.5" />
          </button>
        </div>
      )}

      {/* ONE widget, ONE edge. This carried a `border` AND a `ring-2` that both
          resolved to a visible colour on focus; a ring is a box-shadow drawn
          OUTSIDE the border box, so the two abutted into a 2px rule that read as
          a chunky frame rather than as focus. The single border changes colour
          instead — the same correction the preview frame got.

          Darker than the panel it sits in (`--background`, not `--card`), so the
          composer reads as a well the page recedes into rather than a card
          stacked on top of another card. */}
      <div
        className="group relative z-10 w-full rounded-xl border border-border bg-background transition-colors focus-within:border-ring/60"
        onDragOver={handleDragOver}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* Resize grip — drag the input's top edge to grow/shrink it; keyboard
            accessible (↑/↑ taller, ↓ shorter). Replaces the native textarea
            resize corner so it matches the rounded chrome. */}
        <button
          type="button"
          role="separator"
          aria-orientation="horizontal"
          aria-label="Resize chat input (Arrow Up to grow, Arrow Down to shrink)"
          onPointerDown={onResizePointerDown}
          onKeyDown={(e) => {
            if (e.key === "ArrowUp") {
              e.preventDefault();
              nudgeComposer(24);
            } else if (e.key === "ArrowDown") {
              e.preventDefault();
              nudgeComposer(-24);
            }
          }}
          className="absolute -top-1.5 left-1/2 z-20 flex h-3 w-10 -translate-x-1/2 cursor-ns-resize items-center justify-center rounded-full opacity-0 transition-opacity duration-150 group-hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-none"
        >
          <span className="h-0.5 w-6 rounded-full bg-muted-foreground" />
        </button>
        {isDragging && (
          <div className="absolute inset-0 z-30 rounded-2xl border-2 border-dashed border-muted-foreground bg-card/80 flex items-center justify-center pointer-events-none">
            <p className="text-sm text-foreground flex items-center gap-2">
              <ImagePlus className="size-4" />
              Drop images to attach as references
            </p>
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
          <div className="px-3 pt-2.5">
            <SelectedHtmlElement
              element={selectedElement}
              isAiWorking={isAiWorking}
              onDelete={() => setSelectedElement(null)}
            />
          </div>
        )}
        <div className="w-full relative flex items-center justify-between">
          {(isAiWorking || isUploading) && (
            <div className="absolute top-0 left-3 right-12 h-8 z-10 flex items-center justify-between pointer-events-none">
              <div className="flex items-center justify-start gap-2 bg-muted px-2 py-1 rounded-md">
                <Loading overlay={false} className="!size-3 opacity-50" />
                <p className="text-muted-foreground text-xs">
                  {isUploading ? (
                    "Uploading images..."
                  ) : isAiWorking && !isSameHtml ? (
                    <>
                      AI is working...
                      {messageQueue.length > 0 && (
                        <span className="ml-1 text-muted-foreground">
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
                          className="bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent animate-pulse"
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
                        <span className="ml-2 text-muted-foreground">
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
            ref={textareaRef}
            disabled={isUploading}
            style={{ height: composerH, maxHeight: "40dvh" }}
            className={classNames(
              "w-full resize-none overflow-y-auto bg-transparent px-3 py-2.5 text-sm text-foreground outline-none placeholder:text-muted-foreground",
              {
                "!pt-2": selectedElement && !isAiWorking,
                "opacity-100": isAiWorking && !isUploading,
              }
            )}
            placeholder={
              isAiWorking
                ? // Empty while working (unless queueing) so no text sits UNDER
                  // the "AI is working…" pill overlaying the top of the box.
                  messageQueue.length > 0
                  ? "Type your message... (will be queued)"
                  : ""
                : isFixMode
                ? "Attach a reference (drop, paste, or pick), then send — or add a note"
                : isPlan
                ? "Chat about your app — Plan mode won't change it"
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
        <div className="flex items-center justify-between gap-1.5 px-2 pb-2">
          <div className="flex min-w-0 flex-1 items-center justify-start gap-1 overflow-x-auto [&::-webkit-scrollbar]:hidden">
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
            {/* The two working modes, behind ONE control.
                They were two icon-only buttons on the bar — a wrench and a
                crosshair — which is two mysteries the bar had to carry at all
                times to say something each is one word long. In the menu they
                get their names, their state gets a checkmark, and the bar keeps
                one trigger. It accents when either mode is on, so nothing is
                hidden that is currently doing something. */}
            {!isSameHtml && (
              <DropdownMenu>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <DropdownMenuTrigger asChild>
                      <Button
                        size="icon"
                        variant="ghost"
                        aria-label={
                          modes.length
                            ? `More — ${modes.join(", ")} on`
                            : "More composer modes"
                        }
                        className={classNames("rounded-full", {
                          "text-[var(--brand-accent)] hover:!text-[var(--brand-accent)]":
                            modes.length > 0,
                          "text-muted-foreground hover:bg-accent hover:!text-foreground":
                            modes.length === 0,
                        })}
                      >
                        <MoreHorizontal className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                  </TooltipTrigger>
                  <TooltipContent align="start">
                    {modes.length ? `${modes.join(", ")} on` : "More"}
                  </TooltipContent>
                </Tooltip>
                <DropdownMenuContent align="start" side="top" className="w-64">
                  <DropdownMenuCheckboxItem
                    checked={isEditableModeEnabled}
                    onCheckedChange={(v) => setIsEditableModeEnabled?.(!!v)}
                  >
                    <span className="flex flex-col">
                      <span>Select an element</span>
                      <span className="text-xs text-muted-foreground">
                        Click something on the page to edit it directly
                      </span>
                    </span>
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={isFixMode}
                    onCheckedChange={(v) => setIsFixMode(!!v)}
                  >
                    <span className="flex flex-col">
                      <span>Match a reference</span>
                      <span className="text-xs text-muted-foreground">
                        Attach an image; Hanzo changes only what differs
                      </span>
                    </span>
                  </DropdownMenuCheckboxItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            {/* <InviteFriends /> */}
          </div>
          <div className="flex shrink-0 items-center justify-end gap-2">
            {/* Build vs Plan mode. Build (default) generates/patches the app;
                Plan is a conversational turn that never modifies it. Persisted. */}
            <div
              role="group"
              aria-label="Composer mode"
              className="flex shrink-0 items-center rounded-full border border-border bg-card/60 p-0.5 text-xs"
            >
              {(["build", "plan"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  aria-pressed={mode === m}
                  title={
                    m === "plan"
                      ? "Plan: chat about your app without changing it"
                      : "Build: generate and modify your app"
                  }
                  onClick={() => setMode(m)}
                  className={classNames(
                    "rounded-full px-2.5 py-1 font-medium capitalize transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    mode === m
                      ? "bg-[var(--brand-accent)] text-[var(--brand-accent-fg)]"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {m}
                </button>
              ))}
            </div>
            {/* Which model smart routing picked is a DETAIL of the model
                choice, so it lives where the choice is made — inside the model
                popover, on the Auto row. It used to be spelled out on the bar as
                a "Routed: …" chip that took a tenth of the composer's width to
                report something that changes per request. */}
            <Settings
              provider={provider as string}
              model={model as string}
              onChange={setProvider}
              onModelChange={setModel}
              open={openProvider}
              error={providerError}
              onClose={setOpenProvider}
              routedModel={routedModel}
            />
            {/* The one control that must never be in doubt. It is the only
                FILLED control on the strip — everything beside it is a ghost —
                which is what makes it read as primary. It does not get to be a
                different SIZE: every control in this app is one height, from
                --control-h (tests/unit/control-scale.test.ts). */}
            {isAiWorking ? (
              <Button
                size="icon"
                variant="destructive"
                onClick={stopController}
                aria-label="Stop"
                className="gap-1 rounded-full"
              >
                <FaStopCircle className="size-4" />
              </Button>
            ) : (
              <Button
                size="icon"
                aria-label="Send"
                className="rounded-full"
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
      </div>
      <audio ref={hookAudio} id="audio" className="hidden">
        <source src="/success.mp3" type="audio/mpeg" />
        Your browser does not support the audio element.
      </audio>
      </div>
    </div>
  );
}
