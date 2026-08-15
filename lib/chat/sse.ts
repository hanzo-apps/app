/**
 * readSseDeltas — consume an OpenAI-compatible chat-completions SSE body and
 * yield content deltas as they arrive. The ONE client-side SSE parser for chat
 * mode (page + tests share it).
 *
 * Returns the model the frames named as serving the stream, which is not always
 * the one asked for: the gateway answers a paid model on a free route during an
 * outage, and says so in `chunk.model`.
 */
export async function readSseDeltas(
  body: ReadableStream<Uint8Array>,
  onDelta: (text: string) => void,
): Promise<string | undefined> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let served: string | undefined;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    // SSE frames are separated by a blank line; keep the trailing partial.
    const frames = buffer.split('\n\n');
    buffer = frames.pop() ?? '';
    for (const frame of frames) {
      for (const line of frame.split('\n')) {
        if (!line.startsWith('data:')) continue;
        const data = line.slice(5).trim();
        if (!data || data === '[DONE]') continue;
        try {
          const chunk = JSON.parse(data);
          if (!served && typeof chunk?.model === 'string') served = chunk.model;
          const delta = chunk?.choices?.[0]?.delta?.content;
          if (typeof delta === 'string' && delta) onDelta(delta);
        } catch {
          // A partial or non-JSON frame — skip; the stream stays live.
        }
      }
    }
  }
  return served;
}
