// GET /api/store/orders/[id] — read one order recorded per-org in commerce.
import { NextRequest, NextResponse } from "next/server";
import { resolveBinding, notConfigured, commerceErrorResponse } from "@/lib/store-bff";
import { getOrder } from "@/lib/store";

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
    const order = await getOrder(resolved.binding, id);
    if (!order) return NextResponse.json({ error: "not_found" }, { status: 404 });
    return NextResponse.json({ order });
  } catch (e) {
    return commerceErrorResponse(e);
  }
}
