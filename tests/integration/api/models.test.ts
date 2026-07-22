/**
 * @jest-environment node
 *
 * BFF tests for GET /v1/models — the builder's DYNAMIC model-picker source.
 *
 * The contract under test:
 *  - the list is live from the gateway: only Zen build SKUs survive the filter
 *    (embeddings / asr / tts / guard / vl-only and non-`zen` ids are dropped),
 *    ids are prettified into labels, descriptions pass through
 *  - it ALWAYS returns a usable list (HTTP 200) so the picker never breaks:
 *    no session, gateway error, or an empty result → offline `fallback: true`
 *  - the signed-in user's bearer is forwarded to the gateway
 *  - the live per-user list is privately cached; the fallback is no-store
 *
 * The upstream gateway is stubbed with MSW.
 */
import { NextRequest } from "next/server";
import { http, HttpResponse } from "msw";
import { server } from "../../../jest.setup";

import { GET as listModels } from "@/app/v1/models/route";

const GATEWAY = "https://api.hanzo.ai/v1";

function req(token?: string) {
  const headers = new Headers();
  if (token) headers.set("cookie", `hanzo_token=${token}`);
  return new NextRequest("http://localhost/v1/models", { headers });
}

describe("BFF: GET /v1/models", () => {
  it("returns the offline fallback (200) when no token cookie is present", async () => {
    const res = await listModels(req());
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.fallback).toBe(true);
    // Offline default is DEFAULT_MODEL verbatim — now enso (Enso Pro), which IS a
    // FALLBACK_MODELS entry, so the offline default is selectable in the picker.
    expect(body.defaultModel).toBe("enso");
    expect(body.models).toHaveLength(9);
    const offlineIds = body.models.map((m: { value: string }) => m.value);
    expect(offlineIds).toContain("enso");
    expect(offlineIds).toContain("zen5-coder");
    expect(res.headers.get("cache-control")).toBe("no-store");
  });

  it("shapes the live gateway list: forwards the bearer, filters to build SKUs, prettifies labels", async () => {
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
            { id: "qwen/qwen3.5-397b" }, // dropped: not a zen id
          ],
        });
      })
    );

    const res = await listModels(req("tok-abc"));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(seenAuth).toBe("Bearer tok-abc");
    expect(body.ok).toBe(true);
    expect(body.fallback).toBe(false);
    expect(body.models).toEqual([
      { value: "zen5-coder", label: "Zen 5 Coder" },
      { value: "zen5-pro", label: "Zen 5 Pro" },
      { value: "zen3-omni", label: "Zen 3 Omni", description: "Multimodal chat" },
    ]);
    expect(body.defaultModel).toBe("zen5-coder");
    expect(res.headers.get("cache-control")).toBe("private, max-age=300");
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
    expect(body.models).toHaveLength(9);
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
