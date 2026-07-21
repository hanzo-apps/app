// POST /v1/store/checkout — turn a cart (or explicit items) into a REAL
// Square-hosted checkout session. Public: no shopper login required to pay.
// The org is resolved server-side (never from client input); items reference
// the catalog by productId/slug so commerce prices them from the org's real
// listing. Returns { checkoutUrl, sessionId } — the shopper completes payment
// on Square's hosted page (sandbox when the org is in test mode).
//
// Body: { items: [{ productId?|productSlug?|variantSku?, quantity, name? }],
//         customer?: { fullName?, email? }, successUrl?, cancelUrl? }
import { NextRequest, NextResponse } from "next/server";
import { resolveBinding, notConfigured, commerceErrorResponse } from "@/lib/store-bff";
import { createCheckoutSession, type CheckoutItem } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const spaceId = req.nextUrl.searchParams.get("space_id") || undefined;
  const resolved = await resolveBinding(spaceId);
  if (!resolved) return notConfigured();

  let body: {
    items?: Array<{
      productId?: string;
      productSlug?: string;
      variantSku?: string;
      name?: string;
      quantity?: number;
    }>;
    customer?: { fullName?: string; email?: string };
    successUrl?: string;
    cancelUrl?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const rawItems = body.items || [];
  if (rawItems.length === 0) {
    return NextResponse.json(
      { error: "no_items", message: "items is required" },
      { status: 400 },
    );
  }
  const items: CheckoutItem[] = [];
  for (const it of rawItems) {
    if (!it.productId && !it.productSlug && !it.variantSku) {
      return NextResponse.json(
        { error: "invalid_item", message: "each item needs productId, productSlug, or variantSku" },
        { status: 400 },
      );
    }
    const quantity = Number.isFinite(it.quantity) ? Number(it.quantity) : 1;
    if (quantity <= 0) {
      return NextResponse.json(
        { error: "invalid_quantity", message: "quantity must be > 0" },
        { status: 400 },
      );
    }
    items.push({
      productId: it.productId,
      productSlug: it.productSlug,
      variantSku: it.variantSku,
      name: it.name,
      quantity,
    });
  }

  const origin =
    req.headers.get("origin") ||
    req.nextUrl.origin ||
    "https://hanzo.app";
  const successUrl = body.successUrl || `${origin}/store/success`;
  const cancelUrl = body.cancelUrl || `${origin}/store/cancel`;

  try {
    const session = await createCheckoutSession({
      org: resolved.binding.org,
      currency: resolved.binding.currency,
      items,
      successUrl,
      cancelUrl,
      customer: body.customer,
    });
    return NextResponse.json(session);
  } catch (e) {
    return commerceErrorResponse(e);
  }
}
