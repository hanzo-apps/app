/* eslint-disable @typescript-eslint/no-explicit-any */
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { headers } from "next/headers";
// InferenceClient supports multiple AI providers (not just HuggingFace)
import { InferenceClient } from "@huggingface/inference";

import { MODELS, PROVIDERS } from "@/lib/providers";
import {
  DIVIDER,
  FOLLOW_UP_SYSTEM_PROMPT,
  INITIAL_SYSTEM_PROMPT,
  MAX_REQUESTS_PER_IP,
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

const ipAddresses = new Map();

export async function POST(request: NextRequest) {
  const authHeaders = await headers();
  const userToken = request.cookies.get(MY_TOKEN_KEY())?.value;

  const body = await request.json();
  const { prompt, provider, model, redesignMarkdown, previousPrompts, pages } = body;

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

  if (!selectedModel.providers.includes(provider) && provider !== "auto") {
    return NextResponse.json(
      {
        ok: false,
        error: `The selected model does not support the ${provider} provider.`,
        openSelectProvider: true,
      },
      { status: 400 }
    );
  }

  // Check if local Hanzo daemon is available first
  const isLocalDaemonAvailable = await checkHanzoDaemon();

  if (isLocalDaemonAvailable) {
    try {
      console.log("Using local Hanzo daemon for AI processing");

      // Prepare messages for local daemon
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

      // Call local daemon
      const response = await callHanzoDaemon('/v1/chat/completions', {
        model: model || 'local-model',
        messages,
        temperature: 0.7,
        max_tokens: 8192,
      });

      // Return the response in the expected format
      return NextResponse.json({
        ok: true,
        content: response.choices?.[0]?.message?.content || response.content,
        provider: 'local',
      });
    } catch (error) {
      console.error("Local daemon error, falling back to cloud:", error);
      // Fall through to cloud providers if local fails
    }
  }

  let token = userToken;
  let billTo: string | null = null;

  /**
   * Handle local usage token, this bypass the need for a user token
   * and allows local testing without authentication.
   * This is useful for development and testing purposes.
   */
  // Use server-side inference token if available (supports any provider)
  if (process.env.INFERENCE_API_TOKEN && process.env.INFERENCE_API_TOKEN.length > 0) {
    token = process.env.INFERENCE_API_TOKEN;
  } else if (process.env.HF_TOKEN && process.env.HF_TOKEN.length > 0) {
    token = process.env.HF_TOKEN;
  }

  const ip = authHeaders.get("x-forwarded-for")?.includes(",")
    ? authHeaders.get("x-forwarded-for")?.split(",")[1].trim()
    : authHeaders.get("x-forwarded-for");

  if (!token) {
    ipAddresses.set(ip, (ipAddresses.get(ip) || 0) + 1);
    if (ipAddresses.get(ip) > MAX_REQUESTS_PER_IP) {
      return NextResponse.json(
        {
          ok: false,
          openLogin: true,
          message: "Log In to continue using the service",
        },
        { status: 429 }
      );
    }

    token = (process.env.DEFAULT_INFERENCE_TOKEN || process.env.DEFAULT_HF_TOKEN) as string;
    billTo = "hanzo";
  }

  const DEFAULT_PROVIDER = PROVIDERS.novita;
  const selectedProvider =
    provider === "auto"
      ? PROVIDERS[selectedModel.autoProvider as keyof typeof PROVIDERS]
      : PROVIDERS[provider as keyof typeof PROVIDERS] ?? DEFAULT_PROVIDER;

  // Use provider-specific API keys when available
  const providerApiKeys: Record<string, string | undefined> = {
    "hyperbolic": process.env.HYPERBOLIC_API_KEY,
    "groq": process.env.GROQ_API_KEY,
    "fireworks-ai": process.env.FIREWORKS_API_KEY,
    "sambanova": process.env.SAMBANOVA_API_KEY,
    "novita": process.env.NOVITA_API_KEY,
    "together": process.env.TOGETHER_API_KEY,
    "nebius": process.env.NEBIUS_API_KEY,
  };

  // Override token with provider-specific API key if available
  const providerApiKey = providerApiKeys[selectedProvider.id];
  if (providerApiKey) {
    token = providerApiKey;
  }

  const rewrittenPrompt = prompt;

  // if (prompt?.length < 240) {
    
    //rewrittenPrompt = await callAiRewritePrompt(prompt, { token, billTo });
  // }

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
      // let completeResponse = "";
      try {
        const client = new InferenceClient(token);
        const chatCompletion = client.chatCompletionStream(
          {
            model: selectedModel.value,
            provider: selectedProvider.id as any,
            messages: [
              {
                role: "system",
                content: INITIAL_SYSTEM_PROMPT,
              },
              ...(pages?.length > 1 ? [{
                role: "assistant",
                content: `Here are the current pages:\n\n${pages.map((p: Page) => `- ${p.path} \n${p.html}`).join("\n")}\n\nNow, please create a new page based on this code. Also here are the previous prompts:\n\n${previousPrompts.map((p: string) => `- ${p}`).join("\n")}`
              }] : []),
              {
                role: "user",
                content: redesignMarkdown
                  ? `Here is my current design as a markdown:\n\n${redesignMarkdown}\n\nNow, please create a new design based on this markdown.`
                  : rewrittenPrompt,
              },
            ],
            max_tokens: selectedProvider.max_tokens,
          },
          billTo ? { billTo } : {}
        );

        while (true) {
          const { done, value } = await chatCompletion.next();
          if (done) {
            break;
          }

          const chunk = value.choices[0]?.delta?.content;
          if (chunk) {
            await writer.write(encoder.encode(chunk));
          }
        }
      } catch (error: any) {
        try {
          if (error.message?.includes("exceeded your monthly included credits")) {
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
                    error.message ||
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
        openSelectProvider: true,
        message:
          error?.message || "An error occurred while processing your request.",
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  const authHeaders = await headers();
  const userToken = request.cookies.get(MY_TOKEN_KEY())?.value;

  const body = await request.json();
  const { prompt, previousPrompts, provider, selectedElementHtml, model, pages, files, } =
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

  let token = userToken;
  let billTo: string | null = null;

  /**
   * Handle local usage token, this bypass the need for a user token
   * and allows local testing without authentication.
   * This is useful for development and testing purposes.
   */
  // Use server-side inference token if available (supports any provider)
  if (process.env.INFERENCE_API_TOKEN && process.env.INFERENCE_API_TOKEN.length > 0) {
    token = process.env.INFERENCE_API_TOKEN;
  } else if (process.env.HF_TOKEN && process.env.HF_TOKEN.length > 0) {
    token = process.env.HF_TOKEN;
  }

  const ip = authHeaders.get("x-forwarded-for")?.includes(",")
    ? authHeaders.get("x-forwarded-for")?.split(",")[1].trim()
    : authHeaders.get("x-forwarded-for");

  if (!token) {
    ipAddresses.set(ip, (ipAddresses.get(ip) || 0) + 1);
    if (ipAddresses.get(ip) > MAX_REQUESTS_PER_IP) {
      return NextResponse.json(
        {
          ok: false,
          openLogin: true,
          message: "Log In to continue using the service",
        },
        { status: 429 }
      );
    }

    token = (process.env.DEFAULT_INFERENCE_TOKEN || process.env.DEFAULT_HF_TOKEN) as string;
    billTo = "hanzo";
  }

  const DEFAULT_PROVIDER = PROVIDERS.novita;
  const selectedProvider =
    provider === "auto"
      ? PROVIDERS[selectedModel.autoProvider as keyof typeof PROVIDERS]
      : PROVIDERS[provider as keyof typeof PROVIDERS] ?? DEFAULT_PROVIDER;

  // Use provider-specific API keys when available
  const providerApiKeys: Record<string, string | undefined> = {
    "hyperbolic": process.env.HYPERBOLIC_API_KEY,
    "groq": process.env.GROQ_API_KEY,
    "fireworks-ai": process.env.FIREWORKS_API_KEY,
    "sambanova": process.env.SAMBANOVA_API_KEY,
    "novita": process.env.NOVITA_API_KEY,
    "together": process.env.TOGETHER_API_KEY,
    "nebius": process.env.NEBIUS_API_KEY,
  };

  // Override token with provider-specific API key if available
  const providerApiKey = providerApiKeys[selectedProvider.id];
  if (providerApiKey) {
    token = providerApiKey;
  }

  const client = new InferenceClient(token);

  try {
    const response = await client.chatCompletion(
      {
        model: selectedModel.value,
        provider: selectedProvider.id as any,
        messages: [
          {
            role: "system",
            content: FOLLOW_UP_SYSTEM_PROMPT,
          },
          {
            role: "user",
            content: previousPrompts
              ? `Also here are the previous prompts:\n\n${previousPrompts.map((p: string) => `- ${p}`).join("\n")}`
              : "You are modifying the HTML file based on the user's request.",
          },
          {
            role: "assistant",

            content: `${
              selectedElementHtml
                ? `\n\nYou have to update ONLY the following element, NOTHING ELSE: \n\n\`\`\`html\n${selectedElementHtml}\n\`\`\``
                : ""
            }. Current pages: ${pages?.map((p: Page) => `- ${p.path} \n${p.html}`).join("\n")}. ${files?.length > 0 ? `Current images: ${files?.map((f: string) => `- ${f}`).join("\n")}.` : ""}`,
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        ...(selectedProvider.id !== "sambanova"
          ? {
              max_tokens: selectedProvider.max_tokens,
            }
          : {}),
      },
      billTo ? { billTo } : {}
    );

    const chunk = response.choices[0]?.message?.content;
    if (!chunk) {
      return NextResponse.json(
        { ok: false, message: "No content returned from the model" },
        { status: 400 }
      );
    }

    if (chunk) {
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
    } else {
      return NextResponse.json(
        { ok: false, message: "No content returned from the model" },
        { status: 400 }
      );
    }
  } catch (error: any) {
    if (error.message?.includes("exceeded your monthly included credits")) {
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
        openSelectProvider: true,
        message:
          error.message || "An error occurred while processing your request.",
      },
      { status: 500 }
    );
  }
}
