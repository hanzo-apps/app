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
import { Broke, pipe, stream, turn, within } from '@/lib/sse';
import { UNAVAILABLE } from '@/lib/gateway';

/** Everything the reader received, in order, once the body has closed. */
async function read(r: Response): Promise<string> {
  const reader = r.body!.getReader();
  const decoder = new TextDecoder();
  let text = '';
  for (;;) {
    const { done, value } = await reader.read();
    if (done) return text;
    text += decoder.decode(value, { stream: true });
  }
}

/** A reader over the body, one decoded chunk at a time. */
function chunks(r: Response) {
  const reader = r.body!.getReader();
  const decoder = new TextDecoder();
  return {
    next: async () => {
      const { value } = await reader.read();
      return decoder.decode(value);
    },
    drain: async () => {
      for (;;) if ((await reader.read()).done) return;
    },
  };
}

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

describe('within', () => {
  it('answers with the value when the promise settles in time', async () => {
    expect(await within(1_000, Promise.resolve('head'))).toBe('head');
  });

  it('answers null when it does not, and leaves the promise alone', async () => {
    let settle!: (v: string) => void;
    const slow = new Promise<string>((r) => (settle = r));
    expect(await within(10, slow)).toBeNull();
    settle('late');
    expect(await slow).toBe('late'); // still the caller's to await
  });

  it('answers null for a rejection rather than throwing at the race', async () => {
    // The caller awaits the same promise again, where it has a body to report on.
    const failed = Promise.reject(new Error('no route'));
    expect(await within(1_000, failed)).toBeNull();
    await expect(failed).rejects.toThrow('no route');
  });
});

describe('stream', () => {
  it('hands over the head before the work has produced anything', async () => {
    // The head is what the proxy is waiting for. Nothing may be awaited ahead
    // of it: an edge that never sees a response answers for us.
    let settle!: () => void;
    const held = new Promise<void>((r) => (settle = r));

    const r = stream(async (write) => {
      await held;
      await write('<html>');
    }, 0);

    expect(r.status).toBe(200);
    expect(r.headers.get('X-Accel-Buffering')).toBe('no');
    expect(r.headers.get('Cache-Control')).toBe('no-cache, no-transform');

    settle();
    expect(await read(r)).toBe('<html>');
  });

  it('nudges the connection while the work has said nothing', async () => {
    // A model that thinks for minutes streams none of the thinking, and a proxy
    // reads that silence as a dead origin.
    let settle!: () => void;
    const held = new Promise<void>((r) => (settle = r));

    const r = stream(async (write) => {
      await held;
      await write('<html>');
    }, 10);

    const body = chunks(r);
    expect(await body.next()).toBe(' ');
    settle();
    await body.drain();
  });

  it('stops nudging once real content is flowing', async () => {
    let settle!: () => void;
    const held = new Promise<void>((r) => (settle = r));

    const r = stream(async (write) => {
      await write('<!DOCTYPE html>');
      await held;
      await write('<body>');
    }, 10);

    setTimeout(settle, 60);
    // A space landing here would be a space in somebody's markup.
    expect(await read(r)).toBe('<!DOCTYPE html><body>');
  });

  it('writes a throw as the envelope the client keys on', async () => {
    const r = stream(async () => {
      throw new Broke('You are out of credits.');
    }, 0);
    expect(JSON.parse(await read(r))).toEqual({
      ok: false,
      message: 'You are out of credits.',
    });
  });

  it('falls back to the honest generic when a throw states nothing', async () => {
    const r = stream(async () => {
      throw new Error();
    }, 0);
    expect(JSON.parse(await read(r))).toEqual({ ok: false, message: UNAVAILABLE });
  });

  it('leaves an envelope readable through the beats that preceded it', async () => {
    // The client trims before parsing, so a refusal that lands after a wait is
    // still JSON to it.
    let settle!: () => void;
    const held = new Promise<void>((r) => (settle = r));
    const r = stream(async () => {
      await held;
      throw new Broke('Sign in again.');
    }, 10);

    setTimeout(settle, 45);
    const body = await read(r);
    expect(body).toMatch(/^ +\{/);
    expect(JSON.parse(body.trim()).message).toBe('Sign in again.');
  });
});
