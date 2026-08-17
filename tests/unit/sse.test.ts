/**
 * @jest-environment node
 *
 * Node, not jsdom: this is byte-stream logic and jsdom supplies neither
 * `TextEncoder` nor `ReadableStream`.
 *
 * An error frame is an answer.
 *
 * The bug these pin: a `200` SSE body carrying
 * `data: {"error":{"message":"Upstream error from Nvidia: Internal server
 * error"}}` read as a stream with no content, `/v1/generate` answered `200` with
 * a 51-byte body holding only the routed-model trailer, and the builder said
 * "That model didn't respond" for a fault the next attempt clears.
 */
import { Broke, pipe, turn } from '@/lib/sse';
import { UNAVAILABLE } from '@/lib/gateway';

/** An SSE body from a list of `data:` payloads, framed the way the gateway frames them. */
function sse(...payloads: string[]): ReadableStream<Uint8Array> {
  const text = payloads.map((p) => `data: ${p}\n\n`).join('');
  const bytes = new TextEncoder().encode(text);
  return new ReadableStream({
    start(c) {
      // One byte at a time, so a frame split across reads is covered too.
      for (const b of bytes) c.enqueue(new Uint8Array([b]));
      c.close();
    },
  });
}

const chunk = (content: string, model = 'enso', id = 'chatcmpl-1') =>
  JSON.stringify({ id, model, choices: [{ delta: { content } }] });

const ERROR_FRAME = JSON.stringify({
  error: { message: 'Upstream error from Nvidia: Internal server error' },
});

describe('pipe', () => {
  it('hands over each content delta and reports model + id', async () => {
    const got: string[] = [];
    const out = await pipe(sse(chunk('<!DOCTYPE'), chunk(' html>'), '[DONE]'), (d) => {
      got.push(d);
    });
    expect(got.join('')).toBe('<!DOCTYPE html>');
    expect(out).toEqual({ model: 'enso', id: 'chatcmpl-1' });
  });

  it('throws the upstream sentence when the stream carries an error frame', async () => {
    await expect(pipe(sse(chunk('<!DOC'), ERROR_FRAME, '[DONE]'), () => {})).rejects.toThrow(
      'Upstream error from Nvidia: Internal server error',
    );
  });

  it('throws when a stream completes having emitted no content', async () => {
    // Exactly the 51-byte case: an envelope with a model and an id, no delta.
    const envelope = JSON.stringify({ id: 'chatcmpl-1', model: 'enso', choices: [{ delta: {} }] });
    await expect(pipe(sse(envelope, '[DONE]'), () => {})).rejects.toThrow(UNAVAILABLE);
  });

  it('ignores a non-JSON keepalive rather than treating it as an answer', async () => {
    const got: string[] = [];
    await pipe(sse(': keepalive', chunk('ok'), '[DONE]'), (d) => {
      got.push(d);
    });
    expect(got.join('')).toBe('ok');
  });
});

describe('turn', () => {
  it('re-asks a broken turn and returns what the second ask produced', async () => {
    const got: string[] = [];
    let asks = 0;
    const out = await turn(
      sse(ERROR_FRAME, '[DONE]'),
      async () => {
        asks++;
        return sse(chunk('<html>'), '[DONE]');
      },
      (d) => {
        got.push(d);
      },
    );
    expect(asks).toBe(1);
    expect(got.join('')).toBe('<html>');
    expect(out.model).toBe('enso');
  });

  it('never re-asks once a fragment has reached the reader', async () => {
    // Restarting here would splice two generations into one page.
    const got: string[] = [];
    let asks = 0;
    await expect(
      turn(
        sse(chunk('<!DOCTYPE html>'), ERROR_FRAME, '[DONE]'),
        async () => {
          asks++;
          return sse(chunk('other'), '[DONE]');
        },
        (d) => {
          got.push(d);
        },
      ),
    ).rejects.toThrow('Upstream error from Nvidia');
    expect(asks).toBe(0);
    expect(got.join('')).toBe('<!DOCTYPE html>');
  });

  it('gives up after the stated number of attempts', async () => {
    let asks = 0;
    await expect(
      turn(
        sse(ERROR_FRAME, '[DONE]'),
        async () => {
          asks++;
          return sse(ERROR_FRAME, '[DONE]');
        },
        () => {},
        3,
      ),
    ).rejects.toThrow(Broke);
    expect(asks).toBe(2); // three asks in total, two of them re-asks
  });

  it('nudges an idle stream so a proxy does not read silence as a dead origin', async () => {
    // Enso's headers land at 2.2s and its first frame over 118s later; every
    // proxy in between closes at 100s of nothing.
    const got: string[] = [];
    let release!: () => void;
    const held = new Promise<void>((r) => (release = r));
    const slow = new ReadableStream<Uint8Array>({
      async start(c) {
        await held;
        c.enqueue(new TextEncoder().encode(`data: ${chunk('<html>')}\n\ndata: [DONE]\n\n`));
        c.close();
      },
    });

    const done = turn(slow, async () => slow, (d) => { got.push(d); }, 3, 10);
    // One beat is the whole claim — the connection was nudged while idle.
    // Counting more would only measure how loaded the test runner is.
    while (!got.length) await new Promise((r) => setTimeout(r, 5));
    expect(got.every((g) => g === ' ')).toBe(true);

    release();
    await done;
    expect(got.at(-1)).toBe('<html>');
  });

  it('stops nudging once real content is flowing', async () => {
    const got: string[] = [];
    let release!: () => void;
    const held = new Promise<void>((r) => (release = r));
    const enc = new TextEncoder();
    const stream = new ReadableStream<Uint8Array>({
      async start(c) {
        c.enqueue(enc.encode(`data: ${chunk('<!DOCTYPE html>')}\n\n`));
        await held;
        c.enqueue(enc.encode(`data: ${chunk('<body>')}\n\ndata: [DONE]\n\n`));
        c.close();
      },
    });

    const done = turn(stream, async () => stream, (d) => { got.push(d); }, 3, 10);
    await new Promise((r) => setTimeout(r, 45));
    release();
    await done;
    // A space landing here would be a space in somebody's markup.
    expect(got.join('')).toBe('<!DOCTYPE html><body>');
  });

  it('reports a refusal on the re-ask rather than retrying it forever', async () => {
    await expect(
      turn(
        sse(ERROR_FRAME, '[DONE]'),
        async () => {
          throw new Broke('You are out of credits.');
        },
        () => {},
      ),
    ).rejects.toThrow('You are out of credits.');
  });
});
