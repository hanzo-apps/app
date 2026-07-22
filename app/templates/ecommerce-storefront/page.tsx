// Ecommerce storefront template — the REAL per-org store surface. The
// implementation lives in one place (components/store/storefront.tsx) and is
// shared with the public /store route (DRY, one storefront).
import { Storefront } from "@/components/store/storefront";

export const dynamic = "force-dynamic";

export default function EcommerceStorefront() {
  return <Storefront />;
}
