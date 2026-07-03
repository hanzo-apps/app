// /store/cancel — landing when a shopper abandons the Square-hosted checkout.
import Link from "next/link";
import { XCircle } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = { title: "Checkout canceled" };

export default function StoreCancelPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-6">
      <div className="max-w-md text-center">
        <XCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
        <h1 className="text-2xl font-bold mb-2">Checkout canceled</h1>
        <p className="text-muted-foreground mb-6">
          No payment was taken. Your cart is still here when you’re ready.
        </p>
        <Link
          href="/store"
          className="inline-flex items-center justify-center rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Return to store
        </Link>
      </div>
    </div>
  );
}
