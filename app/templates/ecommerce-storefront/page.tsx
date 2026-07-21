// Ecommerce storefront TEMPLATE — a self-contained demo of the storefront. It
// shares ONE implementation (components/store/storefront.tsx) with the live
// /store route (DRY), but renders in `demo` mode: a complete sample catalog so a
// browsing visitor sees a finished storefront, not the live store's "not bound to
// a store" empty state. The real /store still renders the org's cloud catalog.
import { Storefront } from "@/components/store/storefront";

export default function EcommerceStorefront() {
  return <Storefront demo />;
}
