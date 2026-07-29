import StoreCancelPageView from './view';

// /store/cancel — landing when a shopper abandons the Square-hosted checkout.

export const dynamic = "force-dynamic";

export const metadata = { title: "Checkout canceled" };

export default function StoreCancelPage() {
  return <StoreCancelPageView />;
}
