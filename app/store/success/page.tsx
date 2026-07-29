import StoreSuccessPageView from './view';

// /store/success — landing after a completed Square-hosted checkout. Square
// appends its own order/transaction params to the redirect URL; we surface a
// clear confirmation and a path back to the store.

export const dynamic = "force-dynamic";

export const metadata = { title: "Order confirmed" };

export default function StoreSuccessPage() {
  return <StoreSuccessPageView />;
}
