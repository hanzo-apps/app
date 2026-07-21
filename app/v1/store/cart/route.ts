// POST /v1/store/cart — create a cart in the org's store.
import { NextRequest, NextResponse } from "next/server";
import { resolveBinding, notConfigured, commerceErrorResponse } from "@/lib/store-bff";
import { createCart } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const spaceId = req.nextUrl.searchParams.get("space_id") || undefined;
  const resolved = await resolveBinding(spaceId);
  if (!resolved) return notConfigured();
  try {
    const cart = await createCart(resolved.binding);
    return NextResponse.json({ cart }, { status: 201 });
  } catch (e) {
    return commerceErrorResponse(e);
  }
}
