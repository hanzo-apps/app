/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * /v1/generate — the ONE builder inference BFF.
 *
 * Both hanzo.app (this website builder) and hanzo.chat are "two sides of the
 * same coin": they POST to the single Hanzo AI gateway
 * (`${HANZO_AI_BASE_URL}/chat/completions`, OpenAI-compatible). The only
 * app-specific concerns are (a) the builder SYSTEM PROMPT and (b) rendering.
 *
 * There is no separate inference backend for the app — provider sourcing
 * (Zen/DO internal, BYOK, linked HuggingFace/other clouds, custom providers)
 * is owned by the gateway's provider registry, NOT re-implemented here.
 *
 * Auth is per-user (BYOK-style): we forward the signed-in user's IAM token
 * (the `hanzo_token` cookie mirrored from the @hanzo/iam SDK) as `Authorization:
 * Bearer <token>`. No signed-in user → honest 401 "Sign in to build". We do
 * NOT fall back to a shared server key — billing is per-user by design.
 */
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import {
  DIVIDER,
  FOLLOW_UP_SYSTEM_PROMPT,
  INITIAL_SYSTEM_PROMPT,
  NEW_PAGE_END,
  NEW_PAGE_START,
  REPLACE_END,
  SEARCH_START,
  UPDATE_PAGE_START,
  UPDATE_PAGE_END,
} from "@/lib/prompts";
import { DEFAULT_MODEL } from "@/lib/providers";
import MY_TOKEN_KEY from "@/lib/get-cookie-name";
import { requireSameOrigin } from "@/lib/org/csrf";
import { Page } from "@/types";

const HANZO_AI_BASE_URL =
  process.env.HANZO_AI_BASE_URL || "https://api.hanzo.ai/v1";

const MAX_TOKENS = 131_000;

// A fresh response per call — a NextResponse body is a one-shot stream, so a
// shared instance would send an empty body on the second use.
const unauthorized = () =>
  NextResponse.json(
    { ok: false, openLogin: true, message: "Sign in to build" },
    { status: 401 }
  );

type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

async function callGateway(
  token: string,
  messages: ChatMessage[],
  model: string,
  stream: boolean
) {
  return fetch(`${HANZO_AI_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      model,
      messages,
      max_tokens: MAX_TOKENS,
      stream,
    }),
  });
}

/**
 * POST — new project or new page. Streams the gateway's SSE back to the
 * client as raw text (the delta content), which the builder's useCallAi
 * parser consumes verbatim.
 */
export async function POST(request: NextRequest) {
  // CSRF: cookie-authenticated + spends AI credit for the org — refuse a
  // cross-origin POST before doing any work.
  const csrf = requireSameOrigin(request);
  if (csrf) return csrf;

  const token = request.cookies.get(MY_TOKEN_KEY())?.value;
  if (!token) return unauthorized();

  const body = await request.json();
  const { prompt, model, redesignMarkdown, previousPrompts, pages } = body;

  if (!prompt && !redesignMarkdown) {
    return NextResponse.json(
      { ok: false, message: "Missing prompt" },
      { status: 400 }
    );
  }

  const selectedModel = model || DEFAULT_MODEL;

  const messages: ChatMessage[] = [
    { role: "system", content: INITIAL_SYSTEM_PROMPT },
    ...(pages?.length > 1
      ? [
          {
            role: "assistant" as const,
            content: `Here are the current pages:\n\n${pages
              .map((p: Page) => `- ${p.path} \n${p.html}`)
              .join(
                "\n"
              )}\n\nNow, please create a new page based on this code. Also here are the previous prompts:\n\n${(
              previousPrompts ?? []
            )
              .map((p: string) => `- ${p}`)
              .join("\n")}`,
          },
        ]
      : []),
    {
      role: "user",
      content: redesignMarkdown
        ? `Here is my current design as a markdown:\n\n${redesignMarkdown}\n\nNow, please create a new design based on this markdown.`
        : prompt,
    },
  ];

  const gateway = await callGateway(token, messages, selectedModel, true);

  if (!gateway.ok || !gateway.body) {
    const detail = await gateway.text().catch(() => "");
    if (gateway.status === 401 || gateway.status === 403) return unauthorized();
    return NextResponse.json(
      {
        ok: false,
        message:
          detail || `Gateway error (${gateway.status}) while generating.`,
      },
      { status: 502 }
    );
  }

  const encoder = new TextEncoder();
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();

  const response = new NextResponse(stream.readable, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });

  (async () => {
    try {
      await pipeGatewaySse(gateway.body!, (delta) =>
        writer.write(encoder.encode(delta))
      );
    } catch (error: any) {
      try {
        await writer.write(
          encoder.encode(
            JSON.stringify({
              ok: false,
              message:
                error?.message ||
                "An error occurred while processing your request.",
            })
          )
        );
      } catch {
        // stream already broken; nothing to do
      }
    } finally {
      try {
        await writer.close();
      } catch {
        // already closed
      }
    }
  })();

  return response;
}

/**
 * PUT — follow-up edit. Applies the model's SEARCH/REPLACE + NEW_PAGE blocks
 * to the current pages server-side and returns the updated pages. This mirrors
 * the old /api/ask-ai PUT contract the follow-up flow depends on.
 */
export async function PUT(request: NextRequest) {
  const token = request.cookies.get(MY_TOKEN_KEY())?.value;
  if (!token) return unauthorized();

  const body = await request.json();
  const {
    prompt,
    previousPrompts,
    selectedElementHtml,
    model,
    pages,
    files,
  } = body;

  if (!prompt || !pages || pages.length === 0) {
    return NextResponse.json(
      { ok: false, message: "Missing required fields" },
      { status: 400 }
    );
  }

  const selectedModel = model || DEFAULT_MODEL;

  const messages: ChatMessage[] = [
    { role: "system", content: FOLLOW_UP_SYSTEM_PROMPT },
    {
      role: "user",
      content: previousPrompts
        ? `Also here are the previous prompts:\n\n${previousPrompts
            .map((p: string) => `- ${p}`)
            .join("\n")}`
        : "You are modifying the HTML file based on the user's request.",
    },
    {
      role: "assistant",
      content: `${
        selectedElementHtml
          ? `\n\nYou have to update ONLY the following element, NOTHING ELSE: \n\n\`\`\`html\n${selectedElementHtml}\n\`\`\``
          : ""
      }. Current pages: ${pages
        ?.map((p: Page) => `- ${p.path} \n${p.html}`)
        .join("\n")}. ${
        files?.length > 0
          ? `Current images: ${files
              ?.map((f: string) => `- ${f}`)
              .join("\n")}.`
          : ""
      }`,
    },
    { role: "user", content: prompt },
  ];

  const gateway = await callGateway(token, messages, selectedModel, false);

  if (!gateway.ok) {
    const detail = await gateway.text().catch(() => "");
    if (gateway.status === 401 || gateway.status === 403) return unauthorized();
    return NextResponse.json(
      {
        ok: false,
        message: detail || `Gateway error (${gateway.status}) while editing.`,
      },
      { status: 502 }
    );
  }

  const data = await gateway.json();
  const chunk: string | undefined = data.choices?.[0]?.message?.content;

  if (!chunk) {
    return NextResponse.json(
      { ok: false, message: "No content returned from the model" },
      { status: 400 }
    );
  }

  const { updatedLines, pages: updatedPages } = applyEdits(chunk, pages);

  return NextResponse.json({ ok: true, updatedLines, pages: updatedPages });
}

/**
 * Parse the gateway's OpenAI-compatible SSE stream and hand each
 * `choices[0].delta.content` fragment to `onDelta`.
 */
async function pipeGatewaySse(
  body: ReadableStream<Uint8Array>,
  onDelta: (delta: string) => Promise<unknown> | unknown
) {
  const reader = body.getReader();
  const decoder = new TextDecoder("utf-8");
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });

    // SSE events are separated by a blank line; each may span multiple
    // `data:` lines. Process complete events, keep the remainder buffered.
    let sepIndex: number;
    while ((sepIndex = buffer.indexOf("\n\n")) !== -1) {
      const rawEvent = buffer.slice(0, sepIndex);
      buffer = buffer.slice(sepIndex + 2);

      for (const line of rawEvent.split("\n")) {
        const trimmed = line.trim();
        if (!trimmed.startsWith("data:")) continue;
        const payload = trimmed.slice(5).trim();
        if (payload === "" || payload === "[DONE]") continue;

        try {
          const json = JSON.parse(payload);
          const delta = json.choices?.[0]?.delta?.content;
          if (delta) await onDelta(delta);
        } catch {
          // Non-JSON keepalive / comment line — ignore.
        }
      }
    }
  }
}

/**
 * Apply the model's UPDATE_PAGE / NEW_PAGE + SEARCH/REPLACE blocks to the
 * current pages. Ported verbatim from the old /api/ask-ai PUT handler so the
 * follow-up edit behaviour is byte-for-byte preserved.
 */
function applyEdits(
  chunk: string,
  pages: Page[]
): { updatedLines: number[][]; pages: Page[] } {
  const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const updatedLines: number[][] = [];
  let newHtml = "";
  const updatedPages: Page[] = [...(pages || [])];

  const updatePageRegex = new RegExp(
    `${esc(UPDATE_PAGE_START)}([^\\s]+)\\s*${esc(
      UPDATE_PAGE_END
    )}([\\s\\S]*?)(?=${esc(UPDATE_PAGE_START)}|${esc(NEW_PAGE_START)}|$)`,
    "g"
  );
  let updatePageMatch: RegExpExecArray | null;

  while ((updatePageMatch = updatePageRegex.exec(chunk)) !== null) {
    const [, pagePath, pageContent] = updatePageMatch;

    const pageIndex = updatedPages.findIndex((p) => p.path === pagePath);
    if (pageIndex !== -1) {
      let pageHtml = updatedPages[pageIndex].html;

      let processedContent = pageContent;
      const htmlMatch = pageContent.match(/```html\s*([\s\S]*?)\s*```/);
      if (htmlMatch) {
        processedContent = htmlMatch[1];
      }
      let position = 0;
      let moreBlocks = true;

      while (moreBlocks) {
        const searchStartIndex = processedContent.indexOf(
          SEARCH_START,
          position
        );
        if (searchStartIndex === -1) {
          moreBlocks = false;
          continue;
        }

        const dividerIndex = processedContent.indexOf(DIVIDER, searchStartIndex);
        if (dividerIndex === -1) {
          moreBlocks = false;
          continue;
        }

        const replaceEndIndex = processedContent.indexOf(
          REPLACE_END,
          dividerIndex
        );
        if (replaceEndIndex === -1) {
          moreBlocks = false;
          continue;
        }

        const searchBlock = processedContent.substring(
          searchStartIndex + SEARCH_START.length,
          dividerIndex
        );
        const replaceBlock = processedContent.substring(
          dividerIndex + DIVIDER.length,
          replaceEndIndex
        );

        if (searchBlock.trim() === "") {
          pageHtml = `${replaceBlock}\n${pageHtml}`;
          updatedLines.push([1, replaceBlock.split("\n").length]);
        } else {
          const blockPosition = pageHtml.indexOf(searchBlock);
          if (blockPosition !== -1) {
            const beforeText = pageHtml.substring(0, blockPosition);
            const startLineNumber = beforeText.split("\n").length;
            const replaceLines = replaceBlock.split("\n").length;
            const endLineNumber = startLineNumber + replaceLines - 1;

            updatedLines.push([startLineNumber, endLineNumber]);
            pageHtml = pageHtml.replace(searchBlock, replaceBlock);
          }
        }

        position = replaceEndIndex + REPLACE_END.length;
      }

      updatedPages[pageIndex].html = pageHtml;

      if (
        pagePath === "/" ||
        pagePath === "/index" ||
        pagePath === "index"
      ) {
        newHtml = pageHtml;
      }
    }
  }

  const newPageRegex = new RegExp(
    `${esc(NEW_PAGE_START)}([^\\s]+)\\s*${esc(NEW_PAGE_END)}([\\s\\S]*?)(?=${esc(
      UPDATE_PAGE_START
    )}|${esc(NEW_PAGE_START)}|$)`,
    "g"
  );
  let newPageMatch: RegExpExecArray | null;

  while ((newPageMatch = newPageRegex.exec(chunk)) !== null) {
    const [, pagePath, pageContent] = newPageMatch;

    let pageHtml = pageContent;
    const htmlMatch = pageContent.match(/```html\s*([\s\S]*?)\s*```/);
    if (htmlMatch) {
      pageHtml = htmlMatch[1];
    }

    const existingPageIndex = updatedPages.findIndex((p) => p.path === pagePath);

    if (existingPageIndex !== -1) {
      updatedPages[existingPageIndex] = {
        path: pagePath,
        html: pageHtml.trim(),
      };
    } else {
      updatedPages.push({
        path: pagePath,
        html: pageHtml.trim(),
      });
    }
  }

  if (
    updatedPages.length === pages?.length &&
    !chunk.includes(UPDATE_PAGE_START)
  ) {
    let position = 0;
    let moreBlocks = true;

    while (moreBlocks) {
      const searchStartIndex = chunk.indexOf(SEARCH_START, position);
      if (searchStartIndex === -1) {
        moreBlocks = false;
        continue;
      }

      const dividerIndex = chunk.indexOf(DIVIDER, searchStartIndex);
      if (dividerIndex === -1) {
        moreBlocks = false;
        continue;
      }

      const replaceEndIndex = chunk.indexOf(REPLACE_END, dividerIndex);
      if (replaceEndIndex === -1) {
        moreBlocks = false;
        continue;
      }

      const searchBlock = chunk.substring(
        searchStartIndex + SEARCH_START.length,
        dividerIndex
      );
      const replaceBlock = chunk.substring(
        dividerIndex + DIVIDER.length,
        replaceEndIndex
      );

      if (searchBlock.trim() === "") {
        newHtml = `${replaceBlock}\n${newHtml}`;
        updatedLines.push([1, replaceBlock.split("\n").length]);
      } else {
        const blockPosition = newHtml.indexOf(searchBlock);
        if (blockPosition !== -1) {
          const beforeText = newHtml.substring(0, blockPosition);
          const startLineNumber = beforeText.split("\n").length;
          const replaceLines = replaceBlock.split("\n").length;
          const endLineNumber = startLineNumber + replaceLines - 1;

          updatedLines.push([startLineNumber, endLineNumber]);
          newHtml = newHtml.replace(searchBlock, replaceBlock);
        }
      }

      position = replaceEndIndex + REPLACE_END.length;
    }

    const mainPageIndex = updatedPages.findIndex(
      (p) => p.path === "/" || p.path === "/index" || p.path === "index"
    );
    if (mainPageIndex !== -1) {
      updatedPages[mainPageIndex].html = newHtml;
    }
  }

  return { updatedLines, pages: updatedPages };
}
