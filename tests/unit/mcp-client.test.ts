/** @jest-environment jsdom */
import { fetchMcpServers, fetchMcpToolCount } from "@/lib/mcp";

/**
 * The three-valued contract, behaviourally: null means "did not answer in a
 * shape this build understands", and ONLY a well-formed answer may claim
 * emptiness. A shape drift that collapsed into [] is how a settings pane
 * starts lying — the org has servers, the pane says none, the person
 * re-registers a duplicate.
 */
const answer = (status: number, body: unknown) => {
  global.fetch = jest.fn(async () => ({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  })) as unknown as typeof fetch;
};

describe("fetchMcpServers", () => {
  it("reads the envelope spellings the lineages use", async () => {
    answer(200, { data: [{ id: "a", name: "Alpha", url: "https://a" }] });
    await expect(fetchMcpServers()).resolves.toEqual([
      { id: "a", name: "Alpha", url: "https://a" },
    ]);
    answer(200, { servers: [{ name: "Beta" }] });
    await expect(fetchMcpServers()).resolves.toEqual([{ id: "Beta", name: "Beta", url: undefined }]);
    answer(200, [{ id: "c", name: "Gamma" }]);
    await expect(fetchMcpServers()).resolves.toHaveLength(1);
  });

  it("claims emptiness only from a well-formed empty answer", async () => {
    answer(200, { data: [] });
    await expect(fetchMcpServers()).resolves.toEqual([]);
  });

  it("answers null — not [] — for errors and unknown shapes", async () => {
    answer(500, {});
    await expect(fetchMcpServers()).resolves.toBeNull();
    answer(200, { unexpected: true });
    await expect(fetchMcpServers()).resolves.toBeNull();
    global.fetch = jest.fn(async () => {
      throw new Error("network");
    }) as unknown as typeof fetch;
    await expect(fetchMcpServers()).resolves.toBeNull();
  });

  it("drops rows with no identity rather than rendering blank lines", async () => {
    answer(200, { data: [{ url: "https://nameless" }, { id: "ok", name: "OK" }] });
    await expect(fetchMcpServers()).resolves.toEqual([{ id: "ok", name: "OK", url: undefined }]);
  });
});

describe("fetchMcpToolCount", () => {
  it("counts a well-formed list and refuses the rest", async () => {
    answer(200, { tools: [1, 2, 3] });
    await expect(fetchMcpToolCount()).resolves.toBe(3);
    answer(200, {});
    await expect(fetchMcpToolCount()).resolves.toBeNull();
    answer(401, {});
    await expect(fetchMcpToolCount()).resolves.toBeNull();
  });
});
