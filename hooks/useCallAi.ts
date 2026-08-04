import { useState, useRef } from "react";
import { toast } from "@hanzo/ui";
import { Page } from "@/types";
import { parsePages, parseSinglePage, stripThinkBlocks } from "@/lib/format-pages";
import { setLastGenerationRequestId } from "@/lib/reward-signal";
import { baseEnabled } from "@/lib/base/flag";
// UNAVAILABLE is the ONE honest message for a failure THIS side detects: the
// socket died, or the response arrived without a body. The caller's handleError
// surfaces it once so the user knows to retry — never an infinite "Building…"
// with a stuck isAiWorking flag.
//
// It is deliberately NOT the fallback for a refusal the server explained. A 401
// or a 403 arrives with a reason (lib/gateway.ts wrote it) and that reason is
// what the user needs; telling them to wait a minute for a revoked key is how an
// afternoon gets lost. Retry advice belongs only where retrying can work — which
// is why this sentence and the server's are literally the same string.
import { UNAVAILABLE } from "@/lib/gateway";

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

/**
 * A page whose document was never closed — the stream stopped mid-build.
 *
 * The builder had no notion of "incomplete": `formatPages` parses whatever
 * arrived, so a generation cut off partway through still reported "Built · 1
 * file" and a success toast. What the person then sees is the shape of the
 * truncation — the nav renders, an unclosed section swallows everything after
 * it, and the page reads as a bad DESIGN rather than as a page that never
 * finished. Measured on a real build: a full header above one enormous empty
 * gradient, nothing below it, reported as a success.
 *
 * Judged only on documents that ANNOUNCE themselves as documents. A fragment is
 * a legitimate shape for a follow-up edit, so the absence of `</html>` is
 * evidence of truncation ONLY when the model opened `<html>` in the first place.
 */
export const unterminatedDocument = (html: string): boolean => {
  const s = (html || "").toLowerCase();
  if (!s.includes("<html")) return false;
  return !s.includes("</html>");
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
          base: baseEnabled(),
        }),
        headers: {
          "Content-Type": "application/json",
          "x-forwarded-for": window.location.hostname,
        },
        signal: abortController.signal,
      });

      // Upstream infra failure (gateway 502/503/500): stop now with an honest
      // message instead of streaming an empty body into a stuck "Building…".
      // Out of credit (402): raise the "Need more usage?" modal via the caller's
      // handleError, never a silent failure.
      if (request.status === 402) {
        setisAiWorking(false);
        return { error: "need_credits", message: "You're out of credits." };
      }
      if (!request.ok && request.status >= 500) {
        setisAiWorking(false);
        return { error: "api_error", message: UNAVAILABLE };
      }
      if (!request.body) {
        setisAiWorking(false);
        return { error: "network_error", message: UNAVAILABLE };
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
                return { error: "api_error", message: jsonResponse.message };
              }
            }

            const newPages = formatPages(contentResponse);

            // No renderable page came back. SAY WHAT IS KNOWN, and never "try
            // again" — the two causes are both things retrying cannot change.
            //
            // The stream carries the model the gateway actually routed to, so
            // name it: a request that returned prose instead of a page is a
            // routing/model fact the person can act on (pick another model),
            // and one that returned nothing at all is ours. "Please try again"
            // was neither, and it is what a request refused for CREDIT looked
            // like too — the account reads zero, the gateway answers 402, and
            // the builder said the model had misbehaved.
            if (newPages.length === 0) {
              setisAiWorking(false);
              const who = served ? `\u2019${served}\u2019 ` : "";
              return {
                error: "empty_response",
                message: contentResponse.trim().length
                  ? `The model ${who}replied without a page — it answered in prose instead of building one. Try a different model, or rephrase as a page to build.`
                  : `No response came back from the model ${who}. Check your credits at pay.hanzo.ai, then try a different model.`,
              };
            }

            // A build that stopped mid-document is not a success, and saying so
            // is the whole point: the person is looking at a page that renders
            // as bad DESIGN, and the actual fact is that it never finished.
            // The pages are still delivered — a partial build is 30 seconds of
            // work and discarding it would be its own bug — but it is named.
            // Unlike the empty-response cases above, retrying CAN change this
            // one, so this is the one place that may honestly suggest it.
            const cut = newPages.filter((p) => unterminatedDocument(p.html));
            setisAiWorking(false);

            if (cut.length) {
              toast.error(
                cut.length === 1
                  ? `${cut[0].path} stopped mid-build — the model was cut off before finishing the page. Send it again, or ask for a smaller change.`
                  : `${cut.length} pages stopped mid-build — the model was cut off. Send it again, or ask for a smaller change.`,
              );
            } else {
              toast.success("AI responded successfully");
              if (audio.current) audio.current.play();
            }

            onSuccess(newPages, prompt);

            return { success: true, pages: newPages, truncated: cut.map((p) => p.path) };
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
      return { error: "network_error", message: UNAVAILABLE };
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
          base: baseEnabled(),
        }),
        headers: {
          "Content-Type": "application/json",
          "x-forwarded-for": window.location.hostname,
        },
        signal: abortController.signal,
      });

      // Out of credit (402): raise the "Need more usage?" modal via the caller's
      // handleError, never a silent failure.
      if (request.status === 402) {
        setisAiWorking(false);
        return { error: "need_credits", message: "You're out of credits." };
      }
      if (!request.ok && request.status >= 500) {
        setisAiWorking(false);
        return { error: "api_error", message: UNAVAILABLE };
      }
      if (!request.body) {
        setisAiWorking(false);
        return { error: "network_error", message: UNAVAILABLE };
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
                return { error: "api_error", message: jsonResponse.message };
              }
            }

            const newPage = formatPage(contentResponse, currentPagePath);
            if (!newPage) {
              setisAiWorking(false);
              return {
                error: "empty_response",
                message:
                  "The model replied without a page. Try a different model, or check your credits at pay.hanzo.ai.",
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
      return { error: "network_error", message: UNAVAILABLE };
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
          base: baseEnabled(),
        }),
        headers: {
          "Content-Type": "application/json",
          "x-forwarded-for": window.location.hostname,
        },
        signal: abortController.signal,
      });

      // Upstream infra failure — stop honestly rather than JSON-parsing an HTML
      // 502 page (which would throw into the generic catch as a stuck spinner).
      // Out of credit (402): raise the "Need more usage?" modal via the caller's
      // handleError, never a silent failure.
      if (request.status === 402) {
        setisAiWorking(false);
        return { error: "need_credits", message: "You're out of credits." };
      }
      if (!request.ok && request.status >= 500) {
        setisAiWorking(false);
        return { error: "api_error", message: UNAVAILABLE };
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
          return { error: "api_error", message: res.message || UNAVAILABLE };
        }

        // A 200 with no usable pages (garbled/empty) — fail honestly instead of
        // pushing `undefined` into the editor.
        if (!Array.isArray(res.pages)) {
          setisAiWorking(false);
          return {
            error: "empty_response",
            message:
              "The model replied without a page. Try a different model, or check your credits at pay.hanzo.ai.",
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
      return { error: "network_error", message: UNAVAILABLE };
    }
  };

  // Plan mode — a conversational turn. Streams a plain-text reply from the
  // gateway (PATCH /v1/generate) and hands the accumulated visible text to
  // `onDelta` for live rendering in the thread. NEVER touches pages/preview:
  // Plan mode discusses/plans; it does not build. One gateway call.
  const callAiChat = async (
    prompt: string,
    model: string | undefined,
    provider: string | undefined,
    previousPrompts: string[],
    onDelta: (text: string) => void
  ) => {
    if (isAiWorking) return;
    if (!prompt.trim()) return;

    setisAiWorking(true);
    const abortController = new AbortController();
    setController(abortController);

    try {
      const request = await fetch("/v1/generate", {
        method: "PATCH",
        body: JSON.stringify({ prompt, provider, model, previousPrompts, pages }),
        headers: {
          "Content-Type": "application/json",
          "x-forwarded-for": window.location.hostname,
        },
        signal: abortController.signal,
      });

      // Out of credit (402): raise the "Need more usage?" modal via the caller's
      // handleError, never a silent failure.
      if (request.status === 402) {
        setisAiWorking(false);
        return { error: "need_credits", message: "You're out of credits." };
      }
      if (!request.ok && request.status >= 500) {
        setisAiWorking(false);
        return { error: "api_error", message: UNAVAILABLE };
      }
      if (!request.body) {
        setisAiWorking(false);
        return { error: "network_error", message: UNAVAILABLE };
      }

      const reader = request.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let contentResponse = "";

      const read = async (): Promise<any> => {
        const { done, value } = await reader.read();
        if (done) {
          const { content, model: served, id } = splitSideChannel(contentResponse);
          setLastGenerationRequestId(id);
          const trimmed = content.trim();
          const isJson = trimmed.startsWith("{") && trimmed.endsWith("}");
          const jsonResponse = isJson ? safeJsonParse(trimmed) : null;

          if (jsonResponse && !jsonResponse.ok) {
            setisAiWorking(false);
            if (jsonResponse.openLogin) return { error: "login_required" };
            if (jsonResponse.openSelectProvider)
              return { error: "provider_required", message: jsonResponse.message };
            if (jsonResponse.openProModal) return { error: "pro_required" };
            return { error: "api_error", message: jsonResponse.message };
          }

          const visible = stripThinkBlocks(content).trim();
          if (!visible) {
            setisAiWorking(false);
            return {
              error: "empty_response",
              message: "The model didn't reply. Please try again.",
            };
          }

          onDelta(visible);
          setisAiWorking(false);
          return { success: true, text: visible, model: served };
        }

        contentResponse += decoder.decode(value, { stream: true });
        onDelta(stripThinkBlocks(splitSideChannel(contentResponse).content));
        return read();
      };

      return await read();
    } catch (error: any) {
      setisAiWorking(false);
      if (error?.name === "AbortError") return { error: "aborted" };
      if (error?.openLogin) return { error: "login_required" };
      return { error: "network_error", message: UNAVAILABLE };
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
    callAiChat,
    stopController,
    controller,
    audio,
  };
};
