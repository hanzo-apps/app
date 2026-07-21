// /store — the public, reachable per-org storefront. Renders the org's REAL
// cloud commerce catalog (via the /api/store/* BFF), lets a shopper add to cart,
// and turns checkout into a real Square-hosted session. The org is resolved
// server-side from the store config (never client input). Honest-empty when the
// catalog is empty; nothing is faked.
import { AppShell } from "@/components/app-shell";
import { Storefront } from "@/components/store/storefront";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Store",
  description: "Shop the catalog.",
};

export default function StorePage() {
  // ONE shell on every logged-in surface — the storefront renders inside AppShell
  // so the persistent sidebar/nav stays consistent with the rest of the product.
  return (
    <AppShell currentView="store">
      <Storefront />
    </AppShell>
  );
}
