// /store/success — landing after a completed Square-hosted checkout. Square
// appends its own order/transaction params to the redirect URL; we surface a
// clear confirmation and a path back to the store.
import Link from "next/link";
import { Button } from "@hanzo/ui";
import { CheckCircle2 } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = { title: "Order confirmed" };

export default function StoreSuccessPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-6">
      <div className="max-w-md text-center">
        <CheckCircle2 className="w-12 h-12 mx-auto mb-4 text-green-500" />
        <h1 className="text-2xl font-bold mb-2">Thank you — your order is confirmed</h1>
        <p className="text-muted-foreground mb-6">
          Payment completed on Square. A receipt has been sent to your email.
        </p>
        <Button asChild>
          <Link href="/store">Back to store</Link>
        </Button>
      </div>
    </div>
  );
}
