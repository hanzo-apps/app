// POST /api/store/cart/[id]/items — set (add/replace) a line item's quantity.
// Body: { productId? , productSlug? , variantSku? , quantity }
import { NextRequest, NextResponse } from "next/server";
import { resolveBinding, notConfigured, commerceErrorResponse } from "@/lib/store-bff";
import { setCartItem } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const spaceId = req.nextUrl.searchParams.get("space_id") || undefined;
  const resolved = await resolveBinding(spaceId);
  if (!resolved) return notConfigured();

  let body: {
    productId?: string;
    productSlug?: string;
    variantSku?: string;
    quantity?: number;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  if (!body.productId && !body.productSlug && !body.variantSku) {
    return NextResponse.json(
      { error: "missing_item", message: "productId, productSlug, or variantSku is required" },
      { status: 400 },
    );
  }
  const quantity = Number.isFinite(body.quantity) ? Number(body.quantity) : 1;

  try {
    const cart = await setCartItem(resolved.binding, id, {
      productId: body.productId,
      productSlug: body.productSlug,
      variantSku: body.variantSku,
      quantity,
    });
    return NextResponse.json({ cart });
  } catch (e) {
    return commerceErrorResponse(e);
  }
}
