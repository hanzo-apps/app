import { useState, useRef } from "react";
import { toast } from "sonner";
import { Page } from "@/types";
import { parsePages, parseSinglePage } from "@/lib/format-pages";
import { setLastGenerationRequestId } from "@/lib/reward-signal";

// The ONE honest message for an upstream 5xx / network failure. The caller's
// handleError surfaces it once so the user knows to retry — never an infinite
// "Building…" with a stuck isAiWorking flag.
const AI_UNAVAILABLE =
  "AI backend is temporarily unavailable — try again in a minute.";

// Guarded JSON parse: the stream-done handler only treats the response as a
// JSON error envelope when it actually parses, so a malformed `{…}` never
// throws (it falls through to page parsing instead).
const safeJsonParse = (text: string): any | null => {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
};

// The /v1/generate stream appends a side channel after the page content,
// delimited by an ASCII Record Separator (U+001E) — a control char that can
// never occur in HTML page output, so it is safe. Trailer shape:
// <RS><servedModel><RS><responseId>. Split it off before parsing so the routed
// model surfaces in the UI (smart routing sends `model: "auto"`; the gateway
// echoes what actually served) and the gateway response id (the routing
// ledger's join key) reaches the reward-signal store — without ever corrupting
// the page parser.
const ROUTED_MODEL_SEP = "\u001e";
const splitSideChannel = (
  text: string
): { content: string; model: string | null; id: string | null } => {
  const i = text.indexOf(ROUTED_MODEL_SEP);
  if (i === -1) return { content: text, model: null, id: null };
  const content = text.slice(0, i);
  const rest = text.slice(i + 1);
  const j = rest.indexOf(ROUTED_MODEL_SEP);
  // Older single-field trailers (response id absent) still parse cleanly.
  if (j === -1) return { content, model: rest.trim() || null, id: null };
  return {
    content,
    model: rest.slice(0, j).trim() || null,
    id: rest.slice(j + 1).trim() || null,
  };
};

interface UseCallAiProps {
  onNewPrompt: (prompt: string) => void;
  onSuccess: (page: Page[], p: string, n?: number[][]) => void;
  onScrollToBottom: () => void;
  setPages: React.Dispatch<React.SetStateAction<Page[]>>;
  setCurrentPage: React.Dispatch<React.SetStateAction<string>>;
  currentPage: Page;
  pages: Page[];
  isAiWorking: boolean;
  setisAiWorking: React.Dispatch<React.SetStateAction<boolean>>;
}

// Generate AI thinking display HTML
const generateAIThinkingHTML = (prompt: string) => {
  return `<!DOCTYPE html>
<html>
<head>
  <title>AI Planning</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta charset="utf-8">
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }
    @keyframes typing {
      from { width: 0; }
      to { width: 100%; }
    }
    .pulse { animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
    .typing {
      overflow: hidden;
      white-space: nowrap;
      border-right: 2px solid rgb(168 85 247);
      animation: typing 3s steps(40, end) forwards;
    }
    @keyframes blink {
      0%, 100% { border-color: rgb(168 85 247); }
      50% { border-color: transparent; }
    }
    .blink { animation: blink 1s step-end infinite; }
    @keyframes slideIn {
      from {
        opacity: 0;
        transform: translateY(10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    .slide-in { animation: slideIn 0.5s ease-out forwards; }
  </style>
</head>
<body class="bg-gray-900 text-white font-mono p-8">
  <div class="max-w-4xl mx-auto">
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-6">
        <div class="w-3 h-3 bg-purple-500 rounded-full pulse"></div>
        <h1 class="text-2xl font-bold text-purple-400">AI Planning Session</h1>
      </div>

      <div class="bg-gray-800/50 rounded-lg p-6 border border-purple-500/30">
        <p class="text-gray-400 mb-2 text-sm">Your request:</p>
        <p class="text-white text-lg mb-6">${prompt.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>

        <div class="space-y-4">
          <div class="flex items-start gap-3">
            <span class="text-purple-400">▸</span>
            <p class="text-gray-300 typing">Analyzing requirements...</p>
          </div>

          <div id="planning-steps" class="space-y-3 mt-6">
            <!-- Dynamic steps will appear here -->
          </div>
        </div>
      </div>
    </div>

    <div class="bg-gray-800/30 rounded-lg p-4 border border-gray-700">
      <div class="flex items-center gap-2 mb-3">
        <div class="w-2 h-2 bg-green-500 rounded-full pulse"></div>
        <span class="text-green-400 text-sm font-semibold">AI Thinking Process</span>
      </div>
      <div id="thinking-log" class="space-y-2 text-sm text-gray-400">
        <!-- Real-time thinking will stream here -->
      </div>
    </div>
  </div>

  <script>
    const steps = [
      { icon: '🎯', text: 'Understanding your requirements', delay: 1000 },
      { icon: '🏗️', text: 'Planning application structure', delay: 2000 },
      { icon: '🎨', text: 'Designing user interface', delay: 3000 },
      { icon: '⚡', text: 'Implementing core functionality', delay: 4000 },
      { icon: '✨', text: 'Adding interactive features', delay: 5000 },
      { icon: '🚀', text: 'Finalizing and optimizing', delay: 6000 }
    ];

    const stepsContainer = document.getElementById('planning-steps');
    const thinkingLog = document.getElementById('thinking-log');

    steps.forEach((step, index) => {
      setTimeout(() => {
        const stepEl = document.createElement('div');
        stepEl.className = 'flex items-start gap-3 slide-in';
        stepEl.innerHTML = \`
          <span class="text-2xl">\${step.icon}</span>
          <div class="flex-1">
            <p class="text-white">\${step.text}</p>
            <div class="h-1 bg-gray-700 rounded mt-2">
              <div class="h-full bg-purple-500 rounded transition-all duration-1000"
                   style="width: 0%"
                   id="progress-\${index}"></div>
            </div>
          </div>
        \`;
        stepsContainer.appendChild(stepEl);

        // Animate progress bar
        setTimeout(() => {
          const progress = document.getElementById(\`progress-\${index}\`);
          if (progress) progress.style.width = '100%';
        }, 100);
      }, step.delay);
    });

    // Simulate thinking log
    const thoughts = [
      'Initializing AI model...',
      'Processing natural language input...',
      'Identifying key components needed...',
      'Selecting appropriate frameworks...',
      'Generating semantic HTML structure...',
      'Applying responsive design patterns...',
      'Optimizing for performance...'
    ];

    thoughts.forEach((thought, index) => {
      setTimeout(() => {
        const thoughtEl = document.createElement('div');
        thoughtEl.className = 'slide-in flex items-center gap-2';
        thoughtEl.innerHTML = \`
          <span class="text-purple-400">›</span>
          <span>\${thought}</span>
        \`;
        thinkingLog.appendChild(thoughtEl);
      }, 800 * (index + 1));
    });
  </script>
</body>
</html>`;
};

export const useCallAi = ({
  onNewPrompt,
  onSuccess,
  onScrollToBottom,
  setPages,
  setCurrentPage,
  pages,
  isAiWorking,
  setisAiWorking,
}: UseCallAiProps) => {
  const audio = useRef<HTMLAudioElement | null>(null);
  const [controller, setController] = useState<AbortController | null>(null);

  const callAiNewProject = async (prompt: string, model: string | undefined, provider: string | undefined, redesignMarkdown?: string, handleThink?: (think: string) => void, onFinishThink?: () => void, onRoutedModel?: (servedModel: string) => void) => {
    if (isAiWorking) return;
    if (!redesignMarkdown && !prompt.trim()) return;
    
    setisAiWorking(true);
    
    const abortController = new AbortController();
    setController(abortController);
    
    try {
      onNewPrompt(prompt);

      const request = await fetch("/v1/generate", {
        method: "POST",
        body: JSON.stringify({
          prompt,
          provider,
          model,
          redesignMarkdown,
        }),
        headers: {
          "Content-Type": "application/json",
          "x-forwarded-for": window.location.hostname,
        },
        signal: abortController.signal,
      });

      // Upstream infra failure (gateway 502/503/500): stop now with an honest
      // message instead of streaming an empty body into a stuck "Building…".
      if (!request.ok && request.status >= 500) {
        setisAiWorking(false);
        return { error: "api_error", message: AI_UNAVAILABLE };
      }
      if (!request.body) {
        setisAiWorking(false);
        return { error: "network_error", message: AI_UNAVAILABLE };
      }

      {
        const reader = request.body.getReader();
        const decoder = new TextDecoder("utf-8");
        let contentResponse = "";

        const read = async () => {
          const { done, value } = await reader.read();
          if (done) {
            const { model: served, id } = splitSideChannel(contentResponse);
            // Capture the gateway response id BEFORE onSuccess so the reward
            // signals (accept/deploy) read the right generation's join key.
            setLastGenerationRequestId(id);
            if (served) onRoutedModel?.(served);
            const trimmed = contentResponse.trim();
            const isJson =
              trimmed.startsWith("{") && trimmed.endsWith("}");
            const jsonResponse = isJson ? safeJsonParse(trimmed) : null;

            if (jsonResponse && !jsonResponse.ok) {
              setisAiWorking(false);
              if (jsonResponse.openLogin) {
                // Handle login required
                return { error: "login_required" };
              } else if (jsonResponse.openSelectProvider) {
                // Handle provider selection required
                return { error: "provider_required", message: jsonResponse.message };
              } else if (jsonResponse.openProModal) {
                // Handle pro modal required
                return { error: "pro_required" };
              } else {
                toast.error(jsonResponse.message);
                return { error: "api_error", message: jsonResponse.message };
              }
            }

            const newPages = formatPages(contentResponse);

            // No renderable page came back (empty/garbled model output). Fail
            // honestly (handleError surfaces the toast) instead of silently
            // leaving a dead editor.
            if (newPages.length === 0) {
              setisAiWorking(false);
              return {
                error: "empty_response",
                message:
                  "The model didn't return a usable page. Please try again.",
              };
            }

            toast.success("AI responded successfully");
            setisAiWorking(false);

            if (audio.current) audio.current.play();

            onSuccess(newPages, prompt);

            return { success: true, pages: newPages };
          }

          const chunk = decoder.decode(value, { stream: true });
          contentResponse += chunk;

          // The stream itself signals a reasoning model: route any open <think>
          // block to the thinking panel. No static model flag needed.
          const thinkMatch = contentResponse.match(/<think>[\s\S]*/)?.[0];
          if (thinkMatch && !contentResponse?.includes("</think>")) {
            handleThink?.(thinkMatch.replace("<think>", "").trim());
            return read();
          }

          if (contentResponse.includes("</think>")) {
            onFinishThink?.();
          }

          formatPages(contentResponse);
          return read();
        };

        return await read();
      }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      setisAiWorking(false);
      // User pressed Stop — an abort is not an error worth a toast.
      if (error?.name === "AbortError") {
        return { error: "aborted" };
      }
      if (error?.openLogin) {
        return { error: "login_required" };
      }
      return { error: "network_error", message: AI_UNAVAILABLE };
    }
  };

  const callAiNewPage = async (prompt: string, model: string | undefined, provider: string | undefined, currentPagePath: string, previousPrompts?: string[], onRoutedModel?: (servedModel: string) => void) => {
    if (isAiWorking) return;
    if (!prompt.trim()) return;
    
    setisAiWorking(true);
    
    const abortController = new AbortController();
    setController(abortController);
    
    try {
      onNewPrompt(prompt);

      const request = await fetch("/v1/generate", {
        method: "POST",
        body: JSON.stringify({
          prompt,
          provider,
          model,
          pages,
          previousPrompts,
        }),
        headers: {
          "Content-Type": "application/json",
          "x-forwarded-for": window.location.hostname,
        },
        signal: abortController.signal,
      });

      if (!request.ok && request.status >= 500) {
        setisAiWorking(false);
        return { error: "api_error", message: AI_UNAVAILABLE };
      }
      if (!request.body) {
        setisAiWorking(false);
        return { error: "network_error", message: AI_UNAVAILABLE };
      }

      {
        const reader = request.body.getReader();
        const decoder = new TextDecoder("utf-8");
        let contentResponse = "";

        const read = async () => {
          const { done, value } = await reader.read();
          if (done) {
            const { model: served, id } = splitSideChannel(contentResponse);
            setLastGenerationRequestId(id);
            if (served) onRoutedModel?.(served);
            const trimmed = contentResponse.trim();
            const isJson =
              trimmed.startsWith("{") && trimmed.endsWith("}");
            const jsonResponse = isJson ? safeJsonParse(trimmed) : null;

            if (jsonResponse && !jsonResponse.ok) {
              setisAiWorking(false);
              if (jsonResponse.openLogin) {
                // Handle login required
                return { error: "login_required" };
              } else if (jsonResponse.openSelectProvider) {
                // Handle provider selection required
                return { error: "provider_required", message: jsonResponse.message };
              } else if (jsonResponse.openProModal) {
                // Handle pro modal required
                return { error: "pro_required" };
              } else {
                toast.error(jsonResponse.message);
                return { error: "api_error", message: jsonResponse.message };
              }
            }

            const newPage = formatPage(contentResponse, currentPagePath);
            if (!newPage) {
              setisAiWorking(false);
              return {
                error: "empty_response",
                message:
                  "The model didn't return a usable page. Please try again.",
              };
            }

            toast.success("AI responded successfully");
            setisAiWorking(false);

            if (audio.current) audio.current.play();

            onSuccess([...pages, newPage], prompt);

            return { success: true, pages: [...pages, newPage] };
          }

          const chunk = decoder.decode(value, { stream: true });
          contentResponse += chunk;

          // Skip rendering a page while an unterminated <think> block streams.
          const thinkMatch = contentResponse.match(/<think>[\s\S]*/)?.[0];
          if (thinkMatch && !contentResponse?.includes("</think>")) {
            return read();
          }

          formatPage(contentResponse, currentPagePath);
          return read();
        };

        return await read();
      }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      setisAiWorking(false);
      if (error?.name === "AbortError") {
        return { error: "aborted" };
      }
      if (error?.openLogin) {
        return { error: "login_required" };
      }
      return { error: "network_error", message: AI_UNAVAILABLE };
    }
  };

  const callAiFollowUp = async (prompt: string, model: string | undefined, provider: string | undefined, previousPrompts: string[], selectedElementHtml?: string, files?: string[]) => {
    if (isAiWorking) return;
    if (!prompt.trim()) return;
    
    setisAiWorking(true);
    
    const abortController = new AbortController();
    setController(abortController);
    
    try {
      onNewPrompt(prompt);

      const request = await fetch("/v1/generate", {
        method: "PUT",
        body: JSON.stringify({
          prompt,
          provider,
          previousPrompts,
          model,
          pages,
          selectedElementHtml,
          files,
        }),
        headers: {
          "Content-Type": "application/json",
          "x-forwarded-for": window.location.hostname,
        },
        signal: abortController.signal,
      });

      // Upstream infra failure — stop honestly rather than JSON-parsing an HTML
      // 502 page (which would throw into the generic catch as a stuck spinner).
      if (!request.ok && request.status >= 500) {
        setisAiWorking(false);
        return { error: "api_error", message: AI_UNAVAILABLE };
      }

      {
        const res = await request.json().catch(() => ({}));

        if (!request.ok) {
          setisAiWorking(false);
          if (res.openLogin) {
            return { error: "login_required" };
          } else if (res.openSelectProvider) {
            return { error: "provider_required", message: res.message };
          } else if (res.openProModal) {
            return { error: "pro_required" };
          }
          return { error: "api_error", message: res.message || AI_UNAVAILABLE };
        }

        // A 200 with no usable pages (garbled/empty) — fail honestly instead of
        // pushing `undefined` into the editor.
        if (!Array.isArray(res.pages)) {
          setisAiWorking(false);
          return {
            error: "empty_response",
            message:
              "The model didn't return a usable page. Please try again.",
          };
        }

        toast.success("AI responded successfully");
        setisAiWorking(false);

        // Capture the gateway response id before onSuccess (accept reads it).
        setLastGenerationRequestId(res.id);
        setPages(res.pages);
        onSuccess(res.pages, prompt, res.updatedLines);

        if (audio.current) audio.current.play();

        return { success: true, html: res.html, updatedLines: res.updatedLines, model: res.model };
      }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      setisAiWorking(false);
      if (error?.name === "AbortError") {
        return { error: "aborted" };
      }
      if (error?.openLogin) {
        return { error: "login_required" };
      }
      return { error: "network_error", message: AI_UNAVAILABLE };
    }
  };

  // Stop the current AI generation
  const stopController = () => {
    if (controller) {
      controller.abort();
      setController(null);
      setisAiWorking(false);
    }
  };

  // Parse the raw stream into pages (pure logic lives in lib/format-pages) and
  // push them into the editor. Returns the parsed pages so the caller can tell
  // a good generation from an empty/failed one. Handles the multi-file
  // START_TITLE format, a bare single-file HTML document, a leading <think>
  // block, and a JSON error envelope — always an array, never a throw.
  const formatPages = (content: string): Page[] => {
    const parsed = parsePages(splitSideChannel(content).content);
    if (parsed.length > 0) {
      setPages(parsed);
      const last = parsed[parsed.length - 1];
      setCurrentPage(last?.path || "index.html");
      if (last && last.html.length > 200) {
        onScrollToBottom();
      }
    }
    return parsed;
  };

  const formatPage = (content: string, currentPagePath: string): Page | null => {
    const page = parseSinglePage(splitSideChannel(content).content, currentPagePath);
    if (!page) return null;

    setPages((prevPages) => {
      const existingPageIndex = prevPages.findIndex(
        (p) => p.path === currentPagePath || p.path === page.path
      );
      if (existingPageIndex !== -1) {
        const updatedPages = [...prevPages];
        updatedPages[existingPageIndex] = page;
        return updatedPages;
      }
      return [...prevPages, page];
    });

    setCurrentPage(page.path);
    if (page.html.length > 200) {
      onScrollToBottom();
    }

    return page;
  };

  return {
    callAiNewProject,
    callAiFollowUp,
    callAiNewPage,
    stopController,
    controller,
    audio,
  };
};
