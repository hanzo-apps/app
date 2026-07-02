import {
  gatewayChat,
  contentFromCompletion,
  resolveGatewayAuth,
  DEFAULT_MODEL,
} from "@/lib/gateway";

const START_REWRITE_PROMPT = ">>>>>>> START PROMPT >>>>>>";
const END_REWRITE_PROMPT = ">>>>>>> END PROMPT >>>>>>";

/**
 * Rewrite a short user prompt into a richer build spec via the Hanzo gateway.
 * `token` is the caller's IAM access token (forwarded); falls back to the KMS
 * service key. Returns the original prompt on any failure — never blocks.
 */
export const callAiRewritePrompt = async (
  prompt: string,
  { token }: { token?: string | null }
): Promise<string> => {
  const auth = resolveGatewayAuth(token);
  if (!auth) return prompt;

  try {
    const res = await gatewayChat({
      auth,
      model: DEFAULT_MODEL,
      stream: false,
      messages: [
        {
          role: "system",
          content: `You are a helpful assistant that rewrites prompts to make them better. All the prompts will be about creating a website or app.
Try to make the prompt more detailed and specific to create a good UI/UX Design and good code.
Format the result by following this format:
${START_REWRITE_PROMPT}
new prompt here
${END_REWRITE_PROMPT}
If you don't rewrite the prompt, return the original prompt.
Make sure to return the prompt in the same language as the prompt you are given. Also IMPORTANT: Make sure to keep the original intent of the prompt. Improve it it needed, but don't change the original intent.
`,
        },
        { role: "user", content: prompt },
      ],
    });
    if (!res.ok) return prompt;
    const responseContent = contentFromCompletion(await res.json());
    if (!responseContent) return prompt;
    const startIndex = responseContent.indexOf(START_REWRITE_PROMPT);
    const endIndex = responseContent.indexOf(END_REWRITE_PROMPT);
    if (startIndex === -1 || endIndex === -1) return prompt;
    return responseContent.substring(startIndex + START_REWRITE_PROMPT.length, endIndex).trim();
  } catch {
    return prompt;
  }
};
