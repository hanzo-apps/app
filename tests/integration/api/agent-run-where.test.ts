/**
 * @jest-environment node
 *
 * WHERE a run edits — the first frame of `/v1/agents/runs`, and the only thing
 * that separates a run whose work is saved from one whose work is not.
 *
 * Two bugs live here, and both were silent.
 *
 * THE FIRST is the one that hid for weeks: `runAgent` falls back to an in-memory
 * project when it is handed no filesystem, and every other observable of the run
 * is identical either way. The fix is not the fallback — a scratch page should not
 * pay for a pod — it is that `durable` now rides on the wire and the UI marks the
 * run from it.
 *
 * THE SECOND is the second message of every conversation. This route RELEASES the
 * sandbox it opened when a run ends: the pod goes and the project's disk stays. So
 * the id a turn hands the client is a 404 by the time the next turn quotes it, and
 * a route that preferred the id and stopped there reported "nothing you do is
 * saved" for a project whose checkout was sitting right there. A dead id must fall
 * through to the project — falling back to MEMORY is for having nowhere to work.
 *
 * The gateway is stubbed with MSW, so what is under test is this route's DECISION
 * and not the cluster's mood: the sandbox service is made to answer exactly as it
 * does live (404 for a released sandbox, 201 for a fresh one).
 */
import { NextRequest } from "next/server";
import { http, HttpResponse } from "msw";
import { clearJwksCache } from "@hanzo/iam/auth";

import { server } from "../../../jest.setup";
import { IAM, CLIENT_ID, iamHandlers, mint } from "../../iam-fixture";

import { POST as runs } from "@/app/v1/agents/runs/route";

const GATEWAY = "https://api.hanzo.ai/v1";
const DEAD = "m_released_last_turn";
const FRESH = "m_fresh_pod";

let AUTH: string;

beforeEach(async () => {
  process.env.IAM_URL = IAM;
  process.env.IAM_CLIENT_ID = CLIENT_ID;
  clearJwksCache();
  server.use(...(await iamHandlers()));
  AUTH = await mint();
});

/** The sandbox service, answering the way the live one does. */
function sandboxes(opts: { deadIsGone?: boolean; freshIsWritable?: boolean } = {}) {
  const { deadIsGone = true, freshIsWritable = true } = opts;
  return [
    // A released sandbox is GONE, not merely unwritable — this is the 404 that a
    // reused id actually meets.
    http.post(`${GATEWAY}/sandboxes/${DEAD}/exec`, () =>
      deadIsGone
        ? HttpResponse.json({ status: 404, error: "sandbox not found" }, { status: 404 })
        : HttpResponse.json({ exitCode: 0, stdout: "", stderr: "" }),
    ),
    http.post(`${GATEWAY}/sandboxes/${FRESH}/exec`, () =>
      HttpResponse.json(
        freshIsWritable
          ? { exitCode: 0, stdout: "", stderr: "" }
          : { exitCode: 1, stdout: "drwxr-xr-x 3 root root 4096 .", stderr: "" },
      ),
    ),
    http.post(`${GATEWAY}/sandboxes`, () =>
      HttpResponse.json({ id: FRESH, project: "luxquest", status: "running" }, { status: 201 }),
    ),
    http.delete(`${GATEWAY}/sandboxes/:id`, () => new HttpResponse(null, { status: 204 })),
    // The session registry and the model: present, and deliberately boring. A run
    // that finishes with no tool calls is enough — the frame under test is emitted
    // before the model is asked anything.
    http.post(`${GATEWAY}/agents/sessions`, () => HttpResponse.json({ id: "s_1" })),
    http.post(`${GATEWAY}/agents/sessions/:id/events`, () => HttpResponse.json({ ok: true })),
    http.get(`${GATEWAY}/agents/sessions/:id/control`, () => HttpResponse.json({ actions: [] })),
    http.post(`${GATEWAY}/chat/completions`, () =>
      HttpResponse.json({ choices: [{ message: { content: "done" }, finish_reason: "stop" }] }),
    ),
  ];
}

/** Start a run and give back its first `sandbox` frame. */
async function where(body: Record<string, unknown>) {
  const res = await runs(
    new NextRequest("https://hanzo.app/v1/agents/runs", {
      method: "POST",
      headers: {
        cookie: `hanzo_iam_access_token=${AUTH}`,
        host: "hanzo.app",
        origin: "https://hanzo.app",
        "sec-fetch-site": "same-origin",
        "content-type": "application/json",
      },
      body: JSON.stringify(body),
    }),
  );
  expect(res.status).toBe(200);

  const reader = (res.body as ReadableStream<Uint8Array>).getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  for (let i = 0; i < 50; i++) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    for (const line of buffer.split("\n")) {
      if (!line.startsWith("data:")) continue;
      const event = JSON.parse(line.slice(5).trim()) as { type: string };
      if (event.type === "sandbox") {
        await reader.cancel().catch(() => {});
        return event as { type: "sandbox"; durable: boolean; id?: string; reason?: string };
      }
    }
  }
  throw new Error(`no sandbox frame in the stream: ${buffer.slice(0, 400)}`);
}

describe("the first frame says where the run edits", () => {
  it("a named project gets a sandbox, and the run is durable", async () => {
    server.use(...sandboxes());
    expect(await where({ prompt: "x", project: "luxquest" })).toMatchObject({
      durable: true,
      id: FRESH,
    });
  });

  it("a DEAD id falls through to the project — not to memory", async () => {
    server.use(...sandboxes());
    // Turn two, quoting turn one's released sandbox. The checkout is still on the
    // project's disk; the only thing that went away is the pod.
    expect(await where({ prompt: "x", id: DEAD, project: "luxquest" })).toMatchObject({
      durable: true,
      id: FRESH,
    });
  });

  it("a dead id with NO project has nowhere to fall — and says so", async () => {
    server.use(...sandboxes());
    const frame = await where({ prompt: "x", id: DEAD });
    expect(frame.durable).toBe(false);
    expect(frame.reason).toBeTruthy();
  });

  it("a sandbox that opens but cannot be WRITTEN to is not durable, and says why", async () => {
    // Live today for every project: the volume mounts root-owned into a container
    // running as uid 1000. A pod that is Running and refuses every write is the
    // silent-fallback bug wearing a healthy pod.
    server.use(...sandboxes({ freshIsWritable: false }));
    const frame = await where({ prompt: "x", project: "luxquest" });
    expect(frame.durable).toBe(false);
    expect(frame.reason).toMatch(/not writable/i);
  });

  it("naming nothing is the scratch case — allowed, and still announced", async () => {
    server.use(...sandboxes());
    const frame = await where({ prompt: "x" });
    expect(frame.durable).toBe(false);
    expect(frame.reason).toMatch(/no project named/i);
  });
});
