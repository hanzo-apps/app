/**
 * @jest-environment node
 *
 * BFF tests for GET /v1/models — the builder's DYNAMIC model-picker source.
 *
 * The contract under test:
 *  - the list is live from the gateway: every CHAT model survives whoever made
 *    it, the non-conversation surfaces (embeddings / asr / tts / guard / vl /
 *    image / video / rerank / routers) are dropped, ids become display names,
 *    each row carries its family, and two routes to one model collapse to one
 *    row; descriptions pass through
 *  - it ALWAYS returns a usable list (HTTP 200) so the picker never breaks:
 *    no session, gateway error, or an empty result → offline `fallback: true`
 *  - the signed-in user's bearer is forwarded to the gateway
 *  - the live per-user list is privately cached; the fallback is no-store
 *
 * The upstream gateway is stubbed with MSW.
 */
import { NextRequest } from "next/server";
import { http, HttpResponse } from "msw";
import { clearJwksCache } from "@hanzo/iam/auth";

import { server } from "../../../jest.setup";
import { IAM, CLIENT_ID, iamHandlers, mint } from "../../iam-fixture";

import { GET as listModels } from "@/app/v1/models/route";
import { DEFAULT_MODEL, FALLBACK_MODELS } from "@/lib/providers";
import { FREE_MODEL } from "@hanzo/ai";

const GATEWAY = "https://api.hanzo.ai/v1";

function req(token?: string) {
  const headers = new Headers();
  if (token) headers.set("authorization", `Bearer ${AUTH}`);
  return new NextRequest("http://localhost/v1/models", { headers });
}

// A token is only a caller if IAM signed it, so these suites mint real ones
// against an in-process IAM (tests/iam-fixture). `AUTH` stands in wherever a
// case used to hand over a made-up string.
let AUTH: string;
beforeEach(async () => {
  process.env.IAM_URL = IAM;
  process.env.IAM_CLIENT_ID = CLIENT_ID;
  clearJwksCache();
  server.use(...(await iamHandlers()));
  AUTH = await mint();
});

describe("BFF: GET /v1/models", () => {
  it("returns the offline fallback (200) when no token cookie is present", async () => {
    const res = await listModels(req());
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.fallback).toBe(true);
    expect(body.models).toHaveLength(FALLBACK_MODELS.length);
    const offlineIds = body.models.map((m: { value: string }) => m.value);
    // Offline default is DEFAULT_MODEL verbatim, and it MUST be a
    // FALLBACK_MODELS entry — otherwise the offline default names a model the
    // picker cannot show. Asserted against the constants, not a copy of their
    // current values, so changing the default cannot leave this test agreeing
    // with itself while the product disagrees.
    expect(body.defaultModel).toBe(DEFAULT_MODEL);
    expect(offlineIds).toContain(DEFAULT_MODEL);
    // The three enso rungs the family actually serves. `enso-pro` is listed by
    // ai from a pin but the family has no such SKU, so it must NOT appear.
    expect(offlineIds).toContain("enso");
    expect(offlineIds).toContain("enso-flash");
    expect(offlineIds).toContain("enso-ultra");
    expect(offlineIds).not.toContain("enso-pro");
    // The zen5 ladder is NOT served by the gateway (GET /v1/models carries no
    // zen id at all), so it must not be offered: picking one sent a dead id and
    // the empty result read as the model misbehaving.
    expect(offlineIds.some((id: string) => id.startsWith("zen5"))).toBe(false);
    expect(res.headers.get("cache-control")).toBe("no-store");
  });

  it("shapes the live gateway list: forwards the bearer, drops non-chat surfaces, names and groups the rest", async () => {
    let seenAuth: string | null = null;
    server.use(
      http.get(`${GATEWAY}/models`, ({ request }) => {
        seenAuth = request.headers.get("authorization");
        return HttpResponse.json({
          data: [
            { id: "zen5-coder" },
            { id: "zen5-pro" },
            { id: "zen3-omni", description: "Multimodal chat" },
            { id: "zen5-embedding-4b" }, // dropped: embedding
            { id: "zen3-asr" }, // dropped: asr
            { id: "zen3-tts" }, // dropped: tts
            { id: "zen3-guard" }, // dropped: guard
            { id: "zen3-vl" }, // dropped: vision-only
            // KEPT. This used to be dropped for not being a `zen` id, which is
            // how a product that advertises 400+ models shipped a picker
            // carrying four families. Membership is "is it a chat model", not
            // "is it ours".
            { id: "qwen/qwen3.5-397b", owned_by: "alibaba" },
          ],
        });
      })
    );

    const res = await listModels(req("tok-abc"));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(seenAuth).toBe(`Bearer ${AUTH}`);
    expect(body.ok).toBe(true);
    expect(body.fallback).toBe(false);
    // Every row carries the family the client groups and marks by, so no picker
    // re-derives one from the id.
    expect(body.models).toEqual([
      { value: "zen5-coder", label: "Zen 5 Coder", family: "zen" },
      { value: "zen5-pro", label: "Zen 5 Pro", family: "zen" },
      {
        value: "zen3-omni",
        label: "Zen 3 Omni",
        family: "zen",
        description: "Multimodal chat",
      },
      // A `vendor/model` id names itself in its second half.
      { value: "qwen/qwen3.5-397b", label: "Qwen 3.5 397B", family: "qwen" },
    ]);
    expect(body.defaultModel).toBe("zen5-coder");
    expect(res.headers.get("cache-control")).toBe("private, max-age=300");
  });

  it("carries the gateway's own metadata through to the picker", async () => {
    server.use(
      http.get(`${GATEWAY}/models`, () =>
        HttpResponse.json({
          data: [
            {
              id: "claude-opus-4.8",
              owned_by: "anthropic",
              premium: true,
              context_window: 1_000_000,
            },
            // The same model over the resold route. One row must survive, and it
            // must keep what only this row states.
            { id: "claude-opus-4-8", owned_by: "do-ai", context_window: 1_000_000 },
          ],
        })
      )
    );
    const body = await (await listModels(req("tok-abc"))).json();
    expect(body.models).toEqual([
      {
        value: "claude-opus-4.8",
        label: "Claude Opus 4.8",
        family: "claude",
        premium: true,
        context: 1_000_000,
      },
    ]);
  });

  it("honors a gateway-specified default when it is in the filtered list", async () => {
    server.use(
      http.get(`${GATEWAY}/models`, () =>
        HttpResponse.json({
          default_model: "zen5-pro",
          data: [{ id: "zen5-coder" }, { id: "zen5-pro" }],
        })
      )
    );
    const res = await listModels(req("tok-abc"));
    expect((await res.json()).defaultModel).toBe("zen5-pro");
  });

  it("falls back (200) on a gateway error so the picker never breaks", async () => {
    server.use(
      http.get(`${GATEWAY}/models`, () =>
        HttpResponse.json({ error: "boom" }, { status: 500 })
      )
    );
    const res = await listModels(req("tok-abc"));
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.fallback).toBe(true);
    expect(body.models).toHaveLength(FALLBACK_MODELS.length);
  });

  // Which model a caller OPENS on follows the balance, because the balance is
  // what the gateway gate charges against. A brand-new account has none, so a
  // page that opens on a priced rung is refused on its first message.
  describe("the model a caller opens on", () => {
    const balance = (body: unknown, status = 200) =>
      http.get("https://api.hanzo.ai/v1/billing/balance", () =>
        HttpResponse.json(body as Record<string, unknown>, { status })
      );
    // DEFAULT_MODEL is listed BY NAME rather than spelled out, because "the paid
    // default" below is only a claim about the default if the gateway actually
    // offers it. Spelled out, this fixture silently stopped covering that the
    // day the default moved off `enso`, and the assertion started passing on
    // `models[0]` instead.
    const ladder = () =>
      http.get(`${GATEWAY}/models`, () =>
        HttpResponse.json({
          data: [{ id: "enso" }, { id: "enso-free" }, { id: "zen5-pro" }, { id: DEFAULT_MODEL }],
        })
      );

    it("opens a spent-out caller on the free model, with the paid rungs still offered", async () => {
      server.use(ladder(), balance({ available: 0 }));
      const body = await (await listModels(req("tok-abc"))).json();

      expect(body.defaultModel).toBe(FREE_MODEL);
      // Free LEADS; nothing was trimmed to get it there — the rungs this caller
      // cannot pay for yet are the ones they grow into.
      expect(body.models[0].value).toBe(FREE_MODEL);
      const ids = body.models.map((m: { value: string }) => m.value);
      expect(ids).toEqual(expect.arrayContaining(["enso", "zen5-pro"]));
      expect(ids).toHaveLength(4);
    });

    it("leaves a funded caller on the paid default, in the gateway's order", async () => {
      server.use(ladder(), balance({ available: 500 }));
      const body = await (await listModels(req("tok-abc"))).json();

      expect(body.defaultModel).toBe(DEFAULT_MODEL);
      expect(body.models[0].value).not.toBe(FREE_MODEL);
    });

    // A balance that could not be READ is not a spent-out one; treating it as
    // one would open every caller on the free model during a moment's trouble.
    it("does not treat an unreadable balance as spent out", async () => {
      server.use(ladder(), balance({ error: "boom" }, 500));
      const body = await (await listModels(req("tok-abc"))).json();

      expect(body.defaultModel).toBe(DEFAULT_MODEL);
      expect(body.models[0].value).not.toBe(FREE_MODEL);
    });
  });

  it("falls back (200) when the gateway serves no build models", async () => {
    server.use(
      http.get(`${GATEWAY}/models`, () =>
        HttpResponse.json({
          data: [{ id: "zen5-embedding-4b" }, { id: "text-embedding-3" }],
        })
      )
    );
    const res = await listModels(req("tok-abc"));
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.fallback).toBe(true);
  });
});
