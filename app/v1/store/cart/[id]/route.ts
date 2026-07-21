// GET /v1/store/cart/[id] — read a cart by id (per-org).
import { NextRequest, NextResponse } from "next/server";
import { resolveBinding, notConfigured, commerceErrorResponse } from "@/lib/store-bff";
import { getCart } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const spaceId = req.nextUrl.searchParams.get("space_id") || undefined;
  const resolved = await resolveBinding(spaceId);
  if (!resolved) return notConfigured();
  try {
    const cart = await getCart(resolved.binding, id);
    if (!cart) return NextResponse.json({ error: "not_found" }, { status: 404 });
    return NextResponse.json({ cart });
  } catch (e) {
    return commerceErrorResponse(e);
  }
}
