// GET /v1/store/products — the org's REAL catalog, read from commerce.
// Honest-empty ([]) when the catalog is empty; never a fixture. 409 when the
// project is not bound to a store; 401 when the storefront needs a Published
// token or a signed-in merchant.
import { NextRequest, NextResponse } from "next/server";
import { resolveBinding, notConfigured, commerceErrorResponse } from "@/lib/store-bff";
import { listProducts } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const spaceId = req.nextUrl.searchParams.get("space_id") || undefined;
  const resolved = await resolveBinding(spaceId);
  if (!resolved) return notConfigured();
  try {
    const products = await listProducts(resolved.binding);
    return NextResponse.json({
      org: resolved.config.org,
      storeId: resolved.binding.storeId,
      currency: resolved.binding.currency,
      products,
    });
  } catch (e) {
    return commerceErrorResponse(e);
  }
}
