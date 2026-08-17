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
import { refusal, UNAVAILABLE } from "@/lib/gateway";
import { ATTEMPTS, BEAT_MS, Broke, stream, turn, within } from "@/lib/sse";
import { outputCap } from "@/lib/output-cap";
import { session } from "@/lib/iam";
import { requireSameOrigin } from "@/lib/org/csrf";
import { Page } from "@/types";

const HANZO_AI_BASE_URL =
  process.env.HANZO_AI_BASE_URL || "https://api.hanzo.ai/v1";

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

/**
 * The window each model states, read from the gateway and kept briefly.
 *
 * The catalog is the only thing that knows, and it moves rarely — a few minutes
 * of staleness costs nothing, while asking per generation would put a round trip
 * in front of every build. A read that fails leaves the map alone: the ceiling
 * then stands, which is exactly the behaviour this replaced.
 */
const WINDOW_TTL_MS = 5 * 60_000;

/**
 * How long a catalog read may hold up a build. Its answer only refines a ceiling
 * that already suits the default model, so it must never be the reason a
 * generation is late — a read that misses this leaves the ceiling standing.
 */
const CATALOG_MS = 5_000;

/**
 * How long the gateway may take to ANSWER — to send its response head. Bounded
 * so a request that will never be answered ends with a sentence of ours instead
 * of hanging on a socket. Generous, because a model that thinks for minutes
 * before its first frame is working, not stuck.
 */
const ANSWER_MS = 5 * 60_000;

let windows: { at: number; by: Map<string, number> } | null = null;

async function windowOf(token: string, model: string): Promise<number | undefined> {
  if (!windows || Date.now() - windows.at > WINDOW_TTL_MS) {
    try {
      const r = await fetch(`${HANZO_AI_BASE_URL}/models`, {
        headers: { Authorization: `Bearer ${token}` },
        signal: AbortSignal.timeout(CATALOG_MS),
      });
      if (r.ok) {
        const d = (await r.json()) as { data?: Array<{ id?: string; context_window?: number }> };
        const by = new Map<string, number>();
        for (const m of d?.data ?? []) {
          if (m?.id && m?.context_window) by.set(m.id, m.context_window);
        }
        if (by.size) windows = { at: Date.now(), by };
      }
    } catch {
      // The ceiling stands, and the gateway states the limit if it is wrong.
    }
  }
  return windows?.by.get(model);
}

/**
 * Ask the gateway, bounding the wait for its head.
 *
 * The bell is dropped the moment the head arrives, so it never touches the body:
 * a generation is slow by nature and may take as long as it takes, while a
 * gateway that never answers at all is a hang and is ended here.
 */
async function callGateway(
  token: string,
  messages: ChatMessage[],
  model: string,
  streaming: boolean
) {
  const bell = new AbortController();
  const unanswered = setTimeout(() => bell.abort(), ANSWER_MS);
  try {
    return await fetch(`${HANZO_AI_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        model,
        messages,
        max_tokens: outputCap(await windowOf(token, model), messages),
        stream: streaming,
      }),
      signal: bell.signal,
    });
  } finally {
    clearTimeout(unanswered);
  }
}

/**
 * THE ask. One way to reach the gateway, and it re-asks a 5xx.
 *
 * An upstream that fails BEFORE it answers is exactly as transient as one that
 * fails during — Enso's does both, from the same intermittent provider fault —
 * and nothing has reached the reader either way, so both deserve the same
 * second try. Only the in-stream half used to get one, which left the builder
 * reporting `502` on a prompt the next attempt builds.
 *
 * A 4xx is returned untouched: a refused request is refused identically every
 * time, and asking again only spends the caller's patience.
 */
async function ask(token: string, messages: ChatMessage[], model: string) {
  for (let attempt = 1; ; attempt++) {
    const gateway = await callGateway(token, messages, model, true);
    if (gateway.ok || gateway.status < 500 || attempt >= ATTEMPTS) return gateway;
    await gateway.text().catch(() => ""); // release the socket before re-asking
  }
}

/**
 * Ask again for a turn that broke after `200`.
 *
 * By the time this runs the response headers are sent, so a refusal on the
 * second ask can only travel in the body — hence `Broke` rather than a status.
 */
const reopen =
  (token: string, messages: ChatMessage[], model: string) =>
  async (): Promise<ReadableStream<Uint8Array>> => {
    const again = await ask(token, messages, model);
    if (!again.ok || !again.body) {
      const detail = await again.text().catch(() => "");
      throw new Broke(refusal(again.status, detail).body.message);
    }
    return again.body;
  };

/**
 * The body of one turn, written as the gateway produces it.
 *
 * `opening` is the ask already in flight. A refusal that lands after the head
 * has gone travels whole rather than as a sentence, so the client still reads
 * the gateway's own words and still raises the credit modal on a 402.
 */
const relay =
  (
    token: string,
    messages: ChatMessage[],
    model: string,
    opening: Promise<Response>
  ) =>
  async (write: (text: string) => Promise<unknown>) => {
    const open = await opening.catch(() => null);
    if (!open) throw new Broke(UNAVAILABLE);

    if (!open.ok || !open.body) {
      const detail = await open.text().catch(() => "");
      return write(JSON.stringify(refusal(open.status, detail).body));
    }

    const { model: servedModel, id: responseId } = await turn(
      open.body,
      reopen(token, messages, model),
      write
    );
    // Echo the served model AND the gateway response id to the client,
    // delimited so the page parser never sees them. The response id is the
    // routing ledger's join key; the client threads it to the reward-signal
    // store. Under smart routing (`model: "auto"`) this is also how the client
    // learns which model the gateway routed to.
    if (servedModel || responseId) {
      await write(
        `${ROUTED_MODEL_SEP}${servedModel ?? ""}${ROUTED_MODEL_SEP}${responseId ?? ""}`
      );
    }
  };

/**
 * Answer a turn: a refusal under its own status while nothing has been sent,
 * otherwise a stream that opens before the model does.
 *
 * Refusals are decided before a byte is generated — a rejected credential, an
 * empty balance, a window too small — so one beat is long enough to catch them
 * and short enough that the head always reaches the edge. Past it the head has
 * to go, and `relay` carries whatever the gateway says down the body.
 */
async function answer(token: string, messages: ChatMessage[], model: string) {
  const opening = ask(token, messages, model);
  const head = await within(BEAT_MS, opening);

  if (head && (!head.ok || !head.body)) {
    const detail = await head.text().catch(() => "");
    const { body, status } = refusal(head.status, detail);
    return NextResponse.json(body, { status });
  }

  return stream(relay(token, messages, model, opening));
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

  return answer(token, messages, selectedModel);
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

  return answer(token, messages, selectedModel);
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
    selectedElementAt,
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
          ? `\n\nYou have to update ONLY the following element, NOTHING ELSE: \n\n\`\`\`html\n${selectedElementHtml}\n\`\`\`${
              // WHERE it is, when a unique anchor resolved one. The markup above
              // is the BROWSER'S serialization — attribute order and quoting are
              // rewritten on the way out of the DOM — so asking a model to find
              // it by matching text is asking it to match something the source
              // may not contain. A file and a line is not a hint, it is the
              // answer, and it is absent rather than approximate when nothing
              // anchored uniquely.
              selectedElementAt
                ? `\nThat element is written at ${selectedElementAt.file} line ${selectedElementAt.line} (matched on its ${selectedElementAt.via}). Edit that line in that file.`
                : ""
            }`
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

  // An edit is applied here and answered whole, so the model has to finish
  // before there is anything to say. The head still goes first and the answer
  // follows it down the body: a turn this route stays silent through is a turn
  // the edge answers for, and it answers with its own page under a status none
  // of these envelopes use.
  const opening = callGateway(token, messages, selectedModel, false);
  const head = await within(BEAT_MS, opening);

  if (head && !head.ok) {
    const detail = await head.text().catch(() => "");
    const { body: refused, status } = refusal(head.status, detail);
    return NextResponse.json(refused, { status });
  }

  return stream(async (write) => {
    const gateway = await opening.catch(() => null);
    if (!gateway) throw new Broke(UNAVAILABLE);

    if (!gateway.ok) {
      const detail = await gateway.text().catch(() => "");
      return write(JSON.stringify(refusal(gateway.status, detail).body));
    }

    const data = await gateway.json();
    const chunk: string | undefined = data.choices?.[0]?.message?.content;

    if (!chunk) {
      return write(
        JSON.stringify({ ok: false, message: "No content returned from the model" })
      );
    }

    const { updatedLines, pages: updatedPages } = applyEdits(chunk, pages);

    return write(
      JSON.stringify({
        ok: true,
        updatedLines,
        pages: updatedPages,
        model: data.model || selectedModel,
        // The gateway response id — the routing ledger's join key the client
        // attaches to reward signals.
        id: data.id,
      })
    );
  });
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
