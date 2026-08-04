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
 * (the verified IAM session — see lib/iam.ts) as `Authorization:
 * Bearer <token>`. No signed-in user → honest 401 "Sign in to build". We do
 * NOT fall back to a shared server key — billing is per-user by design.
 */
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import {
  BASE_SYSTEM_PROMPT,
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
import { applyEdit } from "@/lib/edit/apply";
import { resolveModelId } from "@/lib/providers";
import { refusal } from "@/lib/gateway";
import { session } from "@/lib/iam";
import { requireSameOrigin } from "@/lib/org/csrf";
import { Page } from "@/types";

const HANZO_AI_BASE_URL =
  process.env.HANZO_AI_BASE_URL || "https://api.hanzo.ai/v1";

// Output-token ceiling for a generation. Must not exceed the SMALLEST output cap
// among the models the gateway may route to: claude-opus-4-8 (Enso's upstream)
// caps at 128000, so 131000 made every Enso build 502 with
// `max_tokens: 131000 > 128000`. 128000 is ample for a full multi-page app and
// safe across the Zen ladder + Enso.
const MAX_TOKENS = 128_000;

// Builder model resolution: kill retired/dead ids (resolveModelId), then honor
// what remains. `auto` routes via the gateway; everything else is sent verbatim.
// The default is DEFAULT_MODEL (lib/providers.ts) and is stated ONLY there — this
// comment used to name zen5-coder, a model the gateway carries no id of, which is
// exactly the drift that makes a stale default look like a misbehaving model.
const builderModel = (model: string | undefined | null): string =>
  resolveModelId(model);

// ASCII Record Separator (U+001E). Appended once after the page content to
// carry the served model AND the gateway response id back to the client without
// corrupting the HTML page parser (this control char can never appear in page
// output). Trailer shape: <RS><servedModel><RS><responseId>. The response id is
// the routing ledger's join key and is discovered mid-stream (so it can't ride
// a response header). The client (hooks/useCallAi.ts) splits on the delimiter.
const ROUTED_MODEL_SEP = "\u001e";

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

  const token = (await session(request))?.token;
  if (!token) return unauthorized();

  const body = await request.json();
  const { prompt, model, redesignMarkdown, previousPrompts, pages, base, continueFrom } = body;

  if (!prompt && !redesignMarkdown) {
    return NextResponse.json(
      { ok: false, message: "Missing prompt" },
      { status: 400 }
    );
  }

  const selectedModel = builderModel(model);

  const messages: ChatMessage[] = [
    {
      role: "system",
      content: base ? INITIAL_SYSTEM_PROMPT + BASE_SYSTEM_PROMPT : INITIAL_SYSTEM_PROMPT,
    },
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
    // CONTINUATION. A build that stops mid-element is the single thing users
    // report most, and until now the only recovery was for the person to notice
    // and retype. Handing the model back what it produced and asking for the
    // REMAINDER is the only shape that cannot lose the first half — a re-run
    // would start over and may truncate at a different place.
    //
    // The instruction is mostly a list of things not to do, because every one of
    // them has a way of silently corrupting the join: a repeated fragment, a
    // reopened fence, or a restated title marker all parse as new content and
    // the page ends up with two of something.
    ...(typeof continueFrom === "string" && continueFrom.trim()
      ? [
          { role: "assistant" as const, content: continueFrom },
          {
            role: "user" as const,
            content:
              "Your previous message was cut off mid-output. Continue from the EXACT character where it stopped and emit only what is still missing.\n" +
              "- Do NOT repeat any text you already sent, not even the last line.\n" +
              "- Do NOT restate the title marker and do NOT reopen the ```html fence.\n" +
              "- Do NOT apologise, explain, or summarise — output resumes the file directly.\n" +
              "- Finish every element you left open and close the document with </html>, then the closing fence.",
          },
        ]
      : []),
  ];

  const gateway = await callGateway(token, messages, selectedModel, true);

  if (!gateway.ok || !gateway.body) {
    const detail = await gateway.text().catch(() => "");
    const { body, status } = refusal(gateway.status, detail);
    return NextResponse.json(body, { status });
  }

  const encoder = new TextEncoder();
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();

  const response = new NextResponse(stream.readable, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      // `no-transform` and `X-Accel-Buffering: no` are what keep this a STREAM
      // across the proxies in front of it. Without them an intermediary is free
      // to buffer the whole body before forwarding any of it — the builder then
      // shows nothing for the length of the generation, and a proxy that gives
      // up mid-buffer truncates the page instead of delivering it. The sibling
      // stream (app/v1/chat/completions) has always sent both; this one did not.
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });

  (async () => {
    try {
      const { model: servedModel, id: responseId } = await pipeGatewaySse(
        gateway.body!,
        (delta) => writer.write(encoder.encode(delta))
      );
      // Echo the served model AND the gateway response id to the client,
      // delimited so the page parser never sees them. The response id is the
      // routing ledger's join key; the client threads it to the reward-signal
      // store. Under smart routing (`model: "auto"`) this is also how the client
      // learns which model the gateway routed to.
      if (servedModel || responseId) {
        await writer.write(
          encoder.encode(
            `${ROUTED_MODEL_SEP}${servedModel ?? ""}${ROUTED_MODEL_SEP}${
              responseId ?? ""
            }`
          )
        );
      }
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

// Plan mode: a CONVERSATIONAL planning turn. Same gateway, same per-user auth —
// but the model discusses/plans the app and NEVER emits code or SEARCH/REPLACE
// blocks. The reply streams back as plain chat text; nothing is applied to the
// project. This is the "chat, then flip to Build to execute" half of the flow.
const PLAN_SYSTEM_PROMPT = `You are Hanzo, a senior product engineer helping a user plan a web app inside a builder. You are in PLAN mode: converse naturally, ask clarifying questions when useful, and propose a clear, concrete plan (structure, pages, components, data, states, edge cases). Be concise and specific.

Hard rules for PLAN mode:
- Do NOT write full HTML documents, code files, or SEARCH/REPLACE blocks.
- Do NOT try to build or modify the app — the user will switch to Build mode to execute.
- Short, focused Markdown is fine (bullet lists, a few inline snippets at most).
- When the plan is ready, end by inviting the user to switch to Build to generate it.`;

/**
 * PATCH — Plan mode. Streams a conversational planning reply (plain text) from
 * the gateway. No HTML, no page apply — the thread renders it as an assistant
 * chat bubble. Mirrors POST's streaming envelope (incl. the routed-model +
 * response-id trailer) so the client reuses the same read loop.
 */
export async function PATCH(request: NextRequest) {
  const csrf = requireSameOrigin(request);
  if (csrf) return csrf;

  const token = (await session(request))?.token;
  if (!token) return unauthorized();

  const body = await request.json();
  const { prompt, model, previousPrompts, pages } = body;

  if (!prompt) {
    return NextResponse.json(
      { ok: false, message: "Missing prompt" },
      { status: 400 }
    );
  }

  const selectedModel = builderModel(model);

  const messages: ChatMessage[] = [
    { role: "system", content: PLAN_SYSTEM_PROMPT },
    ...(Array.isArray(pages) && pages.length
      ? [
          {
            role: "assistant" as const,
            content: `The app currently has these pages: ${pages
              .map((p: Page) => p.path)
              .join(", ")}.`,
          },
        ]
      : []),
    ...((previousPrompts ?? []) as string[]).map((p) => ({
      role: "user" as const,
      content: p,
    })),
    { role: "user", content: prompt },
  ];

  const gateway = await callGateway(token, messages, selectedModel, true);

  if (!gateway.ok || !gateway.body) {
    const detail = await gateway.text().catch(() => "");
    const { body, status } = refusal(gateway.status, detail);
    return NextResponse.json(body, { status });
  }

  const encoder = new TextEncoder();
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();

  const response = new NextResponse(stream.readable, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      // `no-transform` and `X-Accel-Buffering: no` are what keep this a STREAM
      // across the proxies in front of it. Without them an intermediary is free
      // to buffer the whole body before forwarding any of it — the builder then
      // shows nothing for the length of the generation, and a proxy that gives
      // up mid-buffer truncates the page instead of delivering it. The sibling
      // stream (app/v1/chat/completions) has always sent both; this one did not.
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });

  (async () => {
    try {
      const { model: servedModel, id: responseId } = await pipeGatewaySse(
        gateway.body!,
        (delta) => writer.write(encoder.encode(delta))
      );
      if (servedModel || responseId) {
        await writer.write(
          encoder.encode(
            `${ROUTED_MODEL_SEP}${servedModel ?? ""}${ROUTED_MODEL_SEP}${
              responseId ?? ""
            }`
          )
        );
      }
    } catch (error: any) {
      try {
        await writer.write(
          encoder.encode(
            JSON.stringify({
              ok: false,
              message:
                error?.message || "An error occurred while planning.",
            })
          )
        );
      } catch {
        // stream already broken
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
  const token = (await session(request))?.token;
  if (!token) return unauthorized();

  const body = await request.json();
  const {
    prompt,
    previousPrompts,
    selectedElementHtml,
    model,
    pages,
    files,
    base,
  } = body;

  if (!prompt || !pages || pages.length === 0) {
    return NextResponse.json(
      { ok: false, message: "Missing required fields" },
      { status: 400 }
    );
  }

  const selectedModel = builderModel(model);

  const messages: ChatMessage[] = [
    {
      role: "system",
      content: base ? FOLLOW_UP_SYSTEM_PROMPT + BASE_SYSTEM_PROMPT : FOLLOW_UP_SYSTEM_PROMPT,
    },
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
    const { body, status } = refusal(gateway.status, detail);
    return NextResponse.json(body, { status });
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

  return NextResponse.json({
    ok: true,
    updatedLines,
    pages: updatedPages,
    model: data.model || selectedModel,
    // The gateway response id — the routing ledger's join key the client
    // attaches to reward signals (non-streaming path: available before we reply).
    id: data.id,
  });
}

/**
 * Parse the gateway's OpenAI-compatible SSE stream and hand each
 * `choices[0].delta.content` fragment to `onDelta`. Returns the model the
 * gateway reports having served (echoed on every chunk — under smart routing the
 * request `model` is `"auto"`, so this is how the actually-served model surfaces)
 * and the gateway response id (`json.id`, first non-empty wins) — the routing
 * ledger's join key the client attaches to reward signals.
 */
async function pipeGatewaySse(
  body: ReadableStream<Uint8Array>,
  onDelta: (delta: string) => Promise<unknown> | unknown
): Promise<{ model: string | null; id: string | null }> {
  const reader = body.getReader();
  const decoder = new TextDecoder("utf-8");
  let buffer = "";
  let servedModel: string | null = null;
  let responseId: string | null = null;

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
          if (typeof json.model === "string") servedModel = json.model;
          if (!responseId && typeof json.id === "string" && json.id)
            responseId = json.id;
          const delta = json.choices?.[0]?.delta?.content;
          if (delta) await onDelta(delta);
        } catch {
          // Non-JSON keepalive / comment line — ignore.
        }
      }
    }
  }

  return { model: servedModel, id: responseId };
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
          // Matching used to be `indexOf(searchBlock)` — an exact byte compare
          // including the delimiters' own newlines — and a miss did NOTHING,
          // silently. A model that re-indents its quote by a space produced a
          // page identical to the one it was asked to change, and the only
          // account of it was "the edit didn't match this page". applyEdit
          // degrades exact → trimmed → whitespace-insensitive, and refuses a
          // relaxed match that names more than one place rather than editing
          // the wrong part of someone's page.
          const applied = applyEdit(pageHtml, searchBlock, replaceBlock);
          if (applied.ok) {
            const beforeText = pageHtml.substring(0, applied.index);
            const startLineNumber = beforeText.split("\n").length;
            const replaceLines = replaceBlock.split("\n").length;
            const endLineNumber = startLineNumber + replaceLines - 1;

            updatedLines.push([startLineNumber, endLineNumber]);
            pageHtml = applied.html;
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

  // BARE SEARCH/REPLACE — no UPDATE_PAGE marker. This is the ordinary shape of a
  // single-page follow-up, so it has to work; it did not.
  //
  // Two faults, and the second was latent data loss. It resolved the target as
  // `path === "/" || "/index" || "index"` — generated pages are `index.html`, so
  // it matched NOTHING and every edit was silently dropped ("No changes applied"
  // on a project with one page). And `newHtml` started as the empty string, so on
  // the day that lookup DID match, the page would have been overwritten with
  // almost nothing.
  //
  // It now starts from the real page's html and resolves the entry page the way
  // the rest of the builder does, matching `index.html` first and falling back to
  // the only page when a project has one.
  if (
    updatedPages.length === pages?.length &&
    !chunk.includes(UPDATE_PAGE_START)
  ) {
    const entryIndex = (() => {
      const byName = updatedPages.findIndex((p) =>
        /^\/?(index(\.html?)?)$/i.test(p.path),
      );
      if (byName !== -1) return byName;
      return updatedPages.length === 1 ? 0 : -1;
    })();
    if (entryIndex !== -1) newHtml = updatedPages[entryIndex].html;

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
        // The same tolerant matcher the marked path uses — exact, then ignoring
        // the delimiters' whitespace, then whitespace-insensitive when it names
        // exactly one place. Two matchers would mean an edit that lands with a
        // marker and vanishes without one.
        const applied = applyEdit(newHtml, searchBlock, replaceBlock);
        if (applied.ok) {
          const beforeText = newHtml.substring(0, applied.index);
          const startLineNumber = beforeText.split("\n").length;
          const replaceLines = replaceBlock.split("\n").length;
          const endLineNumber = startLineNumber + replaceLines - 1;

          updatedLines.push([startLineNumber, endLineNumber]);
          newHtml = applied.html;
        }
      }

      position = replaceEndIndex + REPLACE_END.length;
    }

    // Write back only if we actually resolved a page AND produced content —
    // never assign an empty string over someone's site.
    if (entryIndex !== -1 && newHtml.trim()) {
      updatedPages[entryIndex].html = newHtml;
    }
  }

  return { updatedLines, pages: updatedPages };
}
