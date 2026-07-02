/* eslint-disable @typescript-eslint/no-explicit-any */
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { createAiClient, APIError } from "@hanzo/ai";

import { MODELS } from "@/lib/providers";
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
import { resolveCloudBearer } from "@/lib/cloud-bearer";
import { Page } from "@/types";
import { checkHanzoDaemon, callHanzoDaemon } from "@/lib/hanzo-daemon";

// One inference path for the Hanzo cloud: the OpenAI-compatible api.hanzo.ai
// gateway via the shared @hanzo/ai client. No bespoke multi-provider proxy, no
// per-provider API keys — the gateway owns provider routing, and the signed-in
// user's IAM token (resolveCloudBearer) bills their org. A local hanzod daemon,
// when present, is preferred for zero-cost on-device inference.
const MAX_TOKENS = 8192;

/** api.hanzo.ai is OpenAI-compatible; the client defaults to it. */
function aiClient(bearer: string) {
  return createAiClient({ token: bearer });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { prompt, redesignMarkdown, previousPrompts, pages } = body;
  const model = body.model as string | undefined;

  if (!model || (!prompt && !redesignMarkdown)) {
    return NextResponse.json(
      { ok: false, error: "Missing required fields" },
      { status: 400 }
    );
  }

  const selectedModel = MODELS.find(
    (m) => m.value === model || m.label === model
  );

  if (!selectedModel) {
    return NextResponse.json(
      { ok: false, error: "Invalid model selected" },
      { status: 400 }
    );
  }

  // Prefer the local Hanzo daemon (on-device, no cost) when available.
  const isLocalDaemonAvailable = await checkHanzoDaemon();

  if (isLocalDaemonAvailable) {
    try {
      const messages = [
        {
          role: "system",
          content: previousPrompts
            ? FOLLOW_UP_SYSTEM_PROMPT
            : INITIAL_SYSTEM_PROMPT,
        },
        {
          role: "user",
          content: prompt || redesignMarkdown,
        },
      ];

      const response = await callHanzoDaemon('/v1/chat/completions', {
        model: model || 'local-model',
        messages,
        temperature: 0.7,
        max_tokens: MAX_TOKENS,
      });

      return NextResponse.json({
        ok: true,
        content: response.choices?.[0]?.message?.content || response.content,
        provider: 'local',
      });
    } catch (error) {
      console.error("Local daemon error, falling back to cloud:", error);
      // Fall through to the cloud path if local fails.
    }
  }

  const bearer = resolveCloudBearer(request);
  if (!bearer) {
    return NextResponse.json(
      {
        ok: false,
        openLogin: true,
        message: "Log In to continue using the service",
      },
      { status: 401 }
    );
  }

  try {
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
        const ai = aiClient(bearer);
        const completion = await ai.chat.completions.create({
          model: selectedModel.value,
          max_tokens: MAX_TOKENS,
          stream: true,
          messages: [
            {
              role: "system",
              content: INITIAL_SYSTEM_PROMPT,
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
          ],
        });

        for await (const chunk of completion) {
          const delta = chunk.choices?.[0]?.delta?.content;
          if (delta) {
            await writer.write(encoder.encode(delta));
          }
        }
      } catch (error: any) {
        try {
          if (error instanceof APIError && error.status === 402) {
            await writer.write(
              encoder.encode(
                JSON.stringify({
                  ok: false,
                  openProModal: true,
                  message: error.message,
                })
              )
            );
          } else {
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
          }
        } catch (writeError) {
          console.error("Error writing to stream:", writeError);
        }
      } finally {
        try {
          await writer?.close();
        } catch {
          // Stream already closed, ignore
        }
      }
    })();

    return response;
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        message:
          error?.message || "An error occurred while processing your request.",
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  const body = await request.json();
  const { prompt, previousPrompts, selectedElementHtml, model, pages, files } =
    body;

  if (!prompt || pages.length === 0) {
    return NextResponse.json(
      { ok: false, error: "Missing required fields" },
      { status: 400 }
    );
  }

  const selectedModel = MODELS.find(
    (m) => m.value === model || m.label === model
  );
  if (!selectedModel) {
    return NextResponse.json(
      { ok: false, error: "Invalid model selected" },
      { status: 400 }
    );
  }

  const bearer = resolveCloudBearer(request);
  if (!bearer) {
    return NextResponse.json(
      {
        ok: false,
        openLogin: true,
        message: "Log In to continue using the service",
      },
      { status: 401 }
    );
  }

  try {
    const ai = aiClient(bearer);
    const response = await ai.chat.completions.create({
      model: selectedModel.value,
      max_tokens: MAX_TOKENS,
      messages: [
        {
          role: "system",
          content: FOLLOW_UP_SYSTEM_PROMPT,
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
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    // OpenAI-compatible content is `string | ContentPart[]`; the gateway
    // returns text here — narrow to a string for the SEARCH/REPLACE parsing.
    const rawContent = response.choices[0]?.message?.content;
    const chunk = typeof rawContent === "string" ? rawContent : "";
    if (!chunk) {
      return NextResponse.json(
        { ok: false, message: "No content returned from the model" },
        { status: 400 }
      );
    }

    const updatedLines: number[][] = [];
    let newHtml = "";
    const updatedPages = [...(pages || [])];

    const updatePageRegex = new RegExp(`${UPDATE_PAGE_START.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([^\\s]+)\\s*${UPDATE_PAGE_END.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([\\s\\S]*?)(?=${UPDATE_PAGE_START.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}|${NEW_PAGE_START.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}|$)`, 'g');
    let updatePageMatch;

    while ((updatePageMatch = updatePageRegex.exec(chunk)) !== null) {
      const [, pagePath, pageContent] = updatePageMatch;

      const pageIndex = updatedPages.findIndex(p => p.path === pagePath);
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

        if (pagePath === '/' || pagePath === '/index' || pagePath === 'index') {
          newHtml = pageHtml;
        }
      }
    }

    const newPageRegex = new RegExp(`${NEW_PAGE_START.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([^\\s]+)\\s*${NEW_PAGE_END.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([\\s\\S]*?)(?=${UPDATE_PAGE_START.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}|${NEW_PAGE_START.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}|$)`, 'g');
    let newPageMatch;

    while ((newPageMatch = newPageRegex.exec(chunk)) !== null) {
      const [, pagePath, pageContent] = newPageMatch;

      let pageHtml = pageContent;
      const htmlMatch = pageContent.match(/```html\s*([\s\S]*?)\s*```/);
      if (htmlMatch) {
        pageHtml = htmlMatch[1];
      }

      const existingPageIndex = updatedPages.findIndex(p => p.path === pagePath);

      if (existingPageIndex !== -1) {
        updatedPages[existingPageIndex] = {
          path: pagePath,
          html: pageHtml.trim()
        };
      } else {
        updatedPages.push({
          path: pagePath,
          html: pageHtml.trim()
        });
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

      // Update the main HTML if it's the index page
      const mainPageIndex = updatedPages.findIndex(p => p.path === '/' || p.path === '/index' || p.path === 'index');
      if (mainPageIndex !== -1) {
        updatedPages[mainPageIndex].html = newHtml;
      }
    }

    return NextResponse.json({
      ok: true,
      updatedLines,
      pages: updatedPages,
    });
  } catch (error: any) {
    if (error instanceof APIError && error.status === 402) {
      return NextResponse.json(
        {
          ok: false,
          openProModal: true,
          message: error.message,
        },
        { status: 402 }
      );
    }
    return NextResponse.json(
      {
        ok: false,
        message:
          error?.message || "An error occurred while processing your request.",
      },
      { status: 500 }
    );
  }
}
