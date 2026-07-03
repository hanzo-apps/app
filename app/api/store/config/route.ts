// GET /api/store/config — the resolved store binding for this deployment
// (org, mode, store id, currency, enabled subsystems). Public: contains no
// secrets. The storefront reads this to know its currency/mode. 409 when the
// project is not bound to a store.
import { NextRequest, NextResponse } from "next/server";
import { resolveBinding, notConfigured } from "@/lib/store-bff";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const spaceId = req.nextUrl.searchParams.get("space_id") || undefined;
  const resolved = await resolveBinding(spaceId);
  if (!resolved) return notConfigured();
  const { config } = resolved;
  return NextResponse.json({
    org: config.org,
    mode: config.mode,
    subsystems: config.subsystems,
    storefront: config.storefront,
  });
}
