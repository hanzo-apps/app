// GET /api/store/products/[key] — one real product listing by key.
import { NextRequest, NextResponse } from "next/server";
import { resolveBinding, notConfigured, commerceErrorResponse } from "@/lib/store-bff";
import { getProduct } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ key: string }> },
) {
  const { key } = await params;
  const spaceId = req.nextUrl.searchParams.get("space_id") || undefined;
  const resolved = await resolveBinding(spaceId);
  if (!resolved) return notConfigured();
  try {
    const product = await getProduct(resolved.binding, key);
    if (!product) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }
    return NextResponse.json({ product });
  } catch (e) {
    return commerceErrorResponse(e);
  }
}
