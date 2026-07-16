/**
 * lib/reward-signal — the content-free reward-signal client + last-generation
 * id store.
 *
 * Contract under test:
 *  - no-op on a falsy requestId (never fabricate a signal / never POST)
 *  - POSTs the EXACT whitelisted body to the same-origin BFF with credentials
 *  - rating rides ONLY on the "rating" signal
 *  - a fetch rejection is swallowed (fire-and-forget never throws)
 *  - the same (id, signal) is not sent twice (natural dedupe)
 *  - the last-generation id store round-trips (ignores falsy)
 */
import {
  sendRewardSignal,
  setLastGenerationRequestId,
  getLastGenerationRequestId,
} from "@/lib/reward-signal";

describe("sendRewardSignal", () => {
  let mockFetch: jest.Mock;

  beforeEach(() => {
    // The helper never inspects the response; a plain resolved value avoids
    // depending on a `Response` global (absent under jsdom).
    mockFetch = jest.fn().mockResolvedValue({ ok: true, status: 202 });
    global.fetch = mockFetch as unknown as typeof fetch;
  });

  const bodyOf = (call: number) => JSON.parse(mockFetch.mock.calls[call][1].body as string);

  it("no-ops on a falsy requestId (no fetch)", async () => {
    await sendRewardSignal("", "up");
    await sendRewardSignal(null, "accept");
    await sendRewardSignal(undefined, "regenerate");
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("POSTs the exact whitelisted body to /v1/feedback with credentials", async () => {
    await sendRewardSignal("chatcmpl-accept", "accept");

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, opts] = mockFetch.mock.calls[0];
    expect(url).toBe("/v1/feedback");
    expect(opts.method).toBe("POST");
    expect(opts.credentials).toBe("include");
    expect(bodyOf(0)).toEqual({ request_id: "chatcmpl-accept", signal: "accept" });
  });

  it("includes rating ONLY for the rating signal", async () => {
    await sendRewardSignal("chatcmpl-rate", "rating", 3);
    expect(bodyOf(0)).toEqual({ request_id: "chatcmpl-rate", signal: "rating", rating: 3 });

    await sendRewardSignal("chatcmpl-up", "up", 3);
    expect(bodyOf(1)).toEqual({ request_id: "chatcmpl-up", signal: "up" });
  });

  it("swallows a fetch rejection (never throws)", async () => {
    mockFetch.mockRejectedValueOnce(new Error("network down"));
    await expect(sendRewardSignal("chatcmpl-fail", "down")).resolves.toBeUndefined();
  });

  it("does not send the same (id, signal) twice", async () => {
    await sendRewardSignal("chatcmpl-dup", "up");
    await sendRewardSignal("chatcmpl-dup", "up");
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });
});

describe("last-generation id store", () => {
  it("round-trips a set id and ignores falsy updates", () => {
    setLastGenerationRequestId("chatcmpl-123");
    expect(getLastGenerationRequestId()).toBe("chatcmpl-123");

    setLastGenerationRequestId(undefined);
    setLastGenerationRequestId(null);
    setLastGenerationRequestId("");
    expect(getLastGenerationRequestId()).toBe("chatcmpl-123");

    setLastGenerationRequestId("chatcmpl-456");
    expect(getLastGenerationRequestId()).toBe("chatcmpl-456");
  });
});
