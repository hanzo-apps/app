// /store — the public, reachable per-org storefront. Renders the org's REAL
// cloud commerce catalog (via the /v1/store/* BFF), lets a shopper add to cart,
// and turns checkout into a real Square-hosted session. The org is resolved
// server-side from the store config (never client input). Honest-empty when the
// catalog is empty; nothing is faked.
import { Storefront } from "@/components/store/storefront";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Store",
  description: "Shop the catalog.",
};

export default function StorePage() {
  return <Storefront />;
}
