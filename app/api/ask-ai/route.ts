/* eslint-disable @typescript-eslint/no-explicit-any */
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { MODELS, DEFAULT_MODEL } from "@/lib/providers";
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
import MY_TOKEN_KEY from "@/lib/get-cookie-name";
import { Page } from "@/types";
import { checkHanzoDaemon, callHanzoDaemon } from "@/lib/hanzo-daemon";
import {
  gatewayChat,
  streamGatewayDeltas,
  contentFromCompletion,
  gatewayError,
  resolveGatewayAuth,
  type GatewayMessage,
} from "@/lib/gateway";

// Generous cap for full-page generation; the gateway/model still governs the
// hard limit per tier.
const MAX_TOKENS = 32_000;

/** Resolve the requested model to a known Zen id, defaulting to zen5-coder. */
function resolveModel(model?: string): string {
  if (!model) return DEFAULT_MODEL;
  const found = MODELS.find((m) => m.value === model || m.label === model);
  return found?.value ?? DEFAULT_MODEL;
}

export async function POST(request: NextRequest) {
  const userToken = request.cookies.get(MY_TOKEN_KEY())?.value;

  const body = await request.json();
  const { prompt, redesignMarkdown, previousPrompts, pages, model } = body;

  if (!prompt && !redesignMarkdown) {
    return NextResponse.json(
      { ok: false, error: "Missing required fields" },
      { status: 400 }
    );
  }

  const selectedModel = resolveModel(model);

  // Local Hanzo daemon takes precedence when running (dev / on-device).
  const isLocalDaemonAvailable = await checkHanzoDaemon();
  if (isLocalDaemonAvailable) {
    try {
      const response = await callHanzoDaemon("/v1/chat/completions", {
        model: selectedModel,
        messages: [
          {
            role: "system",
            content: previousPrompts ? FOLLOW_UP_SYSTEM_PROMPT : INITIAL_SYSTEM_PROMPT,
          },
          { role: "user", content: prompt || redesignMarkdown },
        ],
        temperature: 0.7,
        max_tokens: 8192,
      });
      return NextResponse.json({
        ok: true,
        content: response.choices?.[0]?.message?.content || response.content,
        provider: "local",
      });
    } catch (error) {
      console.error("Local daemon error, falling back to Hanzo Cloud:", error);
    }
  }

  const auth = resolveGatewayAuth(userToken);
  if (!auth) {
    return NextResponse.json(
      { ok: false, openLogin: true, message: "Log in to continue building with Hanzo AI." },
      { status: 401 }
    );
  }

  const messages: GatewayMessage[] = [
    { role: "system", content: INITIAL_SYSTEM_PROMPT },
    ...(pages?.length > 1
      ? [
          {
            role: "assistant" as const,
            content: `Here are the current pages:\n\n${pages
              .map((p: Page) => `- ${p.path} \n${p.html}`)
              .join("\n")}\n\nNow, please create a new page based on this code. Also here are the previous prompts:\n\n${(
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

  let upstream: Response;
  try {
    upstream = await gatewayChat({
      auth,
      model: selectedModel,
      messages,
      maxTokens: MAX_TOKENS,
      stream: true,
    });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, message: error?.message || "Failed to reach Hanzo AI." },
      { status: 502 }
    );
  }

  if (!upstream.ok || !upstream.body) {
    const errBody = await upstream.text().catch(() => "");
    const mapped = gatewayError(upstream.status, errBody);
    return NextResponse.json(
      { ok: false, ...mapped },
      { status: upstream.status || 500 }
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
      for await (const chunk of streamGatewayDeltas(upstream)) {
        await writer.write(encoder.encode(chunk));
      }
    } catch (error: any) {
      try {
        await writer.write(
          encoder.encode(
            JSON.stringify({
              ok: false,
              message: error?.message || "An error occurred while generating.",
            })
          )
        );
      } catch {
        /* stream already closed */
      }
    } finally {
      try {
        await writer.close();
      } catch {
        /* already closed */
      }
    }
  })();

  return response;
}

export async function PUT(request: NextRequest) {
  const userToken = request.cookies.get(MY_TOKEN_KEY())?.value;

  const body = await request.json();
  const { prompt, previousPrompts, selectedElementHtml, model, pages, files } = body;

  if (!prompt || !pages || pages.length === 0) {
    return NextResponse.json(
      { ok: false, error: "Missing required fields" },
      { status: 400 }
    );
  }

  const selectedModel = resolveModel(model);

  const auth = resolveGatewayAuth(userToken);
  if (!auth) {
    return NextResponse.json(
      { ok: false, openLogin: true, message: "Log in to continue building with Hanzo AI." },
      { status: 401 }
    );
  }

  const messages: GatewayMessage[] = [
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
          ? `Current images: ${files?.map((f: string) => `- ${f}`).join("\n")}.`
          : ""
      }`,
    },
    { role: "user", content: prompt },
  ];

  let chunk = "";
  try {
    const upstream = await gatewayChat({
      auth,
      model: selectedModel,
      messages,
      maxTokens: MAX_TOKENS,
      stream: false,
    });
    if (!upstream.ok) {
      const errBody = await upstream.text().catch(() => "");
      const mapped = gatewayError(upstream.status, errBody);
      return NextResponse.json(
        { ok: false, ...mapped },
        { status: upstream.status || 500 }
      );
    }
    const json = await upstream.json();
    chunk = contentFromCompletion(json);
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, message: error?.message || "An error occurred while processing your request." },
      { status: 502 }
    );
  }

  if (!chunk) {
    return NextResponse.json(
      { ok: false, message: "No content returned from the model" },
      { status: 400 }
    );
  }

  const updatedLines: number[][] = [];
  let newHtml = "";
  const updatedPages = [...(pages || [])];

  const updatePageRegex = new RegExp(
    `${UPDATE_PAGE_START.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}([^\\s]+)\\s*${UPDATE_PAGE_END.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}([\\s\\S]*?)(?=${UPDATE_PAGE_START.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}|${NEW_PAGE_START.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}|$)`,
    "g"
  );
  let updatePageMatch;

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
        const searchStartIndex = processedContent.indexOf(SEARCH_START, position);
        if (searchStartIndex === -1) {
          moreBlocks = false;
          continue;
        }

        const dividerIndex = processedContent.indexOf(DIVIDER, searchStartIndex);
        if (dividerIndex === -1) {
          moreBlocks = false;
          continue;
        }

        const replaceEndIndex = processedContent.indexOf(REPLACE_END, dividerIndex);
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

      if (pagePath === "/" || pagePath === "/index" || pagePath === "index") {
        newHtml = pageHtml;
      }
    }
  }

  const newPageRegex = new RegExp(
    `${NEW_PAGE_START.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}([^\\s]+)\\s*${NEW_PAGE_END.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}([\\s\\S]*?)(?=${UPDATE_PAGE_START.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}|${NEW_PAGE_START.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}|$)`,
    "g"
  );
  let newPageMatch;

  while ((newPageMatch = newPageRegex.exec(chunk)) !== null) {
    const [, pagePath, pageContent] = newPageMatch;

    let pageHtml = pageContent;
    const htmlMatch = pageContent.match(/```html\s*([\s\S]*?)\s*```/);
    if (htmlMatch) {
      pageHtml = htmlMatch[1];
    }

    const existingPageIndex = updatedPages.findIndex((p) => p.path === pagePath);

    if (existingPageIndex !== -1) {
      updatedPages[existingPageIndex] = { path: pagePath, html: pageHtml.trim() };
    } else {
      updatedPages.push({ path: pagePath, html: pageHtml.trim() });
    }
  }

  if (updatedPages.length === pages?.length && !chunk.includes(UPDATE_PAGE_START)) {
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
      const replaceBlock = chunk.substring(dividerIndex + DIVIDER.length, replaceEndIndex);

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

  return NextResponse.json({ ok: true, updatedLines, pages: updatedPages });
}
