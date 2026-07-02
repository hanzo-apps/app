"use client";

// Ecommerce storefront — the REAL per-org store surface.
//
// This template used to render a hardcoded fixture array. It now BINDS to the
// org's cloud commerce catalog via the BFF (/api/store/*): it reads the real
// catalog, builds a real cart, and turns checkout into a real Square-hosted
// session. Honest-empty when the catalog is empty; nothing is faked.
// See universe/docs/architecture/hanzo-app-cloud-integration.md §6.

import { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardFooter } from "@hanzo/ui";
import { Button } from "@hanzo/ui";
import { Badge } from "@hanzo/ui";
import { Input } from "@hanzo/ui";
import { AspectRatio } from "@hanzo/ui";
import { ShoppingCart, Search, Store as StoreIcon, Loader2 } from "lucide-react";

interface StoreProduct {
  key: string;
  productId?: string;
  slug?: string;
  variantSku?: string;
  name: string;
  headline?: string;
  description?: string;
  image?: string;
  images: string[];
  priceCents: number;
  listPriceCents?: number;
  currency: string;
  available: boolean;
}

interface ProductsResponse {
  org: string;
  storeId: string;
  currency: string;
  products: StoreProduct[];
}

interface CartLineRef {
  productId?: string;
  productSlug?: string;
  variantSku?: string;
  quantity: number;
}

function money(cents: number, currency: string): string {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency || "USD",
    }).format(cents / 100);
  } catch {
    return `$${(cents / 100).toFixed(2)}`;
  }
}

function itemRef(p: StoreProduct): CartLineRef {
  return p.productId
    ? { productId: p.productId, quantity: 1 }
    : p.slug
      ? { productSlug: p.slug, quantity: 1 }
      : { variantSku: p.variantSku || p.key, quantity: 1 };
}

export default function EcommerceStorefront() {
  const [data, setData] = useState<ProductsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [cart, setCart] = useState<Record<string, number>>({});
  const [cartId, setCartId] = useState<string | null>(null);
  const [checkingOut, setCheckingOut] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch("/api/store/products", { cache: "no-store" });
        const body = await res.json();
        if (!alive) return;
        if (!res.ok) {
          setError(
            body?.message ||
              (res.status === 409
                ? "This project isn't bound to a store yet."
                : "Could not load the catalog."),
          );
          setData(null);
        } else {
          setData(body);
        }
      } catch {
        if (alive) setError("Could not reach the store.");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const ensureCart = useCallback(async (): Promise<string> => {
    if (cartId) return cartId;
    const res = await fetch("/api/store/cart", { method: "POST" });
    const body = await res.json();
    if (!res.ok) throw new Error(body?.message || "Could not create a cart");
    const id = body?.cart?.id as string;
    setCartId(id);
    return id;
  }, [cartId]);

  const addToCart = useCallback(
    async (p: StoreProduct) => {
      const nextQty = (cart[p.key] || 0) + 1;
      setCart((prev) => ({ ...prev, [p.key]: nextQty }));
      try {
        const id = await ensureCart();
        const ref = itemRef(p);
        await fetch(`/api/store/cart/${encodeURIComponent(id)}/items`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...ref, quantity: nextQty }),
        });
      } catch {
        // Revert optimistic add on failure.
        setCart((prev) => ({ ...prev, [p.key]: Math.max(0, nextQty - 1) }));
      }
    },
    [cart, ensureCart],
  );

  const checkout = useCallback(async () => {
    if (!data) return;
    const items = data.products
      .filter((p) => (cart[p.key] || 0) > 0)
      .map((p) => ({ ...itemRef(p), quantity: cart[p.key], name: p.name }));
    if (items.length === 0) return;
    setCheckingOut(true);
    try {
      const res = await fetch("/api/store/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      });
      const body = await res.json();
      if (res.ok && body?.checkoutUrl) {
        window.location.href = body.checkoutUrl; // real Square-hosted page
      } else {
        setError(body?.message || "Checkout is not available yet.");
      }
    } catch {
      setError("Checkout failed to start.");
    } finally {
      setCheckingOut(false);
    }
  }, [cart, data]);

  const cartCount = Object.values(cart).reduce((s, q) => s + q, 0);
  const products = (data?.products || []).filter((p) =>
    query ? p.name.toLowerCase().includes(query.toLowerCase()) : true,
  );
  const currency = data?.currency || "USD";

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b sticky top-0 bg-background/95 backdrop-blur z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <StoreIcon className="w-6 h-6" /> Store
          </h1>
          <div className="flex items-center gap-4">
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search products..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-9 w-[200px] lg:w-[300px]"
              />
            </div>
            <Button
              onClick={checkout}
              disabled={cartCount === 0 || checkingOut}
              className="relative gap-2"
            >
              {checkingOut ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <ShoppingCart className="w-5 h-5" />
              )}
              {cartCount > 0 ? `Checkout (${cartCount})` : "Cart"}
            </Button>
          </div>
        </div>
      </header>

      <section className="py-12">
        <div className="container mx-auto px-6">
          {loading && (
            <div className="flex items-center justify-center py-24 text-muted-foreground">
              <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading catalog…
            </div>
          )}

          {!loading && error && (
            <div className="max-w-md mx-auto text-center py-24">
              <StoreIcon className="w-10 h-10 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">{error}</p>
            </div>
          )}

          {!loading && !error && products.length === 0 && (
            <div className="max-w-md mx-auto text-center py-24">
              <StoreIcon className="w-10 h-10 mx-auto mb-4 text-muted-foreground" />
              <h2 className="text-lg font-semibold mb-1">No products yet</h2>
              <p className="text-muted-foreground">
                This store is connected but its catalog is empty. Add a product
                to see it here.
              </p>
            </div>
          )}

          {!loading && !error && products.length > 0 && (
            <>
              <p className="text-sm text-muted-foreground mb-6">
                Showing {products.length} product{products.length === 1 ? "" : "s"}
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {products.map((product) => (
                  <Card key={product.key} className="overflow-hidden group">
                    <div className="relative">
                      <AspectRatio ratio={1}>
                        {product.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={product.image}
                            alt={product.name}
                            className="object-cover w-full h-full group-hover:scale-105 transition-transform"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-muted">
                            <StoreIcon className="w-8 h-8 text-muted-foreground" />
                          </div>
                        )}
                      </AspectRatio>
                      {product.listPriceCents &&
                        product.listPriceCents > product.priceCents && (
                          <Badge className="absolute top-2 left-2">Sale</Badge>
                        )}
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-semibold mb-1">{product.name}</h3>
                      {product.headline && (
                        <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                          {product.headline}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-2xl font-bold">
                          {money(product.priceCents, product.currency || currency)}
                        </span>
                        {product.listPriceCents &&
                          product.listPriceCents > product.priceCents && (
                            <span className="text-sm text-muted-foreground line-through">
                              {money(
                                product.listPriceCents,
                                product.currency || currency,
                              )}
                            </span>
                          )}
                      </div>
                    </CardContent>
                    <CardFooter className="p-4 pt-0">
                      <Button
                        className="w-full"
                        disabled={!product.available}
                        onClick={() => addToCart(product)}
                      >
                        <ShoppingCart className="w-4 h-4 mr-2" />
                        {product.available
                          ? (cart[product.key] || 0) > 0
                            ? `In cart (${cart[product.key]})`
                            : "Add to Cart"
                          : "Unavailable"}
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
