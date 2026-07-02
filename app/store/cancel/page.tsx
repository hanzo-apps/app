// /store/cancel — landing when a shopper abandons the Square-hosted checkout.
import Link from "next/link";
import { Button } from "@hanzo/ui";
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
        <Button asChild>
          <Link href="/store">Return to store</Link>
        </Button>
      </div>
    </div>
  );
}
