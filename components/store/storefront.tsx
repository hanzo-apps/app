"use client";

import { YStack, XStack, H1, SizableText, Paragraph, H2, Image, H3 } from '@hanzo/ui';
import { glass } from "@/lib/chrome";
// Ecommerce storefront — the REAL per-org store surface.
//
// This template used to render a hardcoded fixture array. It now BINDS to the
// org's cloud commerce catalog via the BFF (/v1/store/*): it reads the real
// catalog, builds a real cart, and turns checkout into a real Square-hosted
// session. Honest-empty when the catalog is empty; nothing is faked.
// See universe/docs/architecture/hanzo-app-cloud-integration.md §6.

import { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardFooter, Button, Badge, Input, AspectRatio } from '@hanzo/ui';
import { ShoppingCart, Search, Store as StoreIcon } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";

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

export function Storefront() {
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
        const res = await fetch("/v1/store/products", { cache: "no-store" });
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
    const res = await fetch("/v1/store/cart", { method: "POST" });
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
        await fetch(`/v1/store/cart/${encodeURIComponent(id)}/items`, {
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
      const res = await fetch("/v1/store/checkout", {
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
    <YStack minHeight="100%" backgroundColor="$background">
      <YStack {...glass(2)} borderBottomWidth={1} position="sticky" top="$0" zIndex={50}>
        <XStack width="100%" maxWidth={1280} alignSelf="center" paddingHorizontal="$5" paddingVertical="$4" alignItems="center" justifyContent="space-between" gap="$4">
          <H1 fontSize="$8" fontWeight="500" display="flex" alignItems="center" gap="$2">
            <StoreIcon size={24} /> Store
          </H1>
          <XStack alignItems="center" gap="$4">
            <YStack position="relative" display="none" $md={{ display: "flex" }}>
              <Search size={16} />
              <Input
                placeholder="Search products..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                paddingLeft={36} width={200} $lg={{ width: 300 }}
  />
            </YStack>
            <Button
              onClick={checkout}
              disabled={cartCount === 0 || checkingOut}
              position="relative" gap="$2"
            >
              {checkingOut ? (
                <Spinner size={20} />
              ) : (
                <ShoppingCart size={20} />
              )}
              {cartCount > 0 ? `Checkout (${cartCount})` : "Cart"}
            </Button>
          </XStack>
        </XStack>
      </YStack>

      <YStack paddingVertical="$8">
        <YStack width="100%" maxWidth={1280} alignSelf="center" paddingHorizontal="$5">
          {loading && (
            <XStack alignItems="center" justifyContent="center" paddingVertical="$12">
              <Spinner size={24} /> <SizableText color="$color11">Loading catalog…</SizableText>
            </XStack>
          )}

          {!loading && error && (
            <YStack maxWidth={448} alignSelf="center" alignItems="center" paddingVertical="$12">
              <StoreIcon size={40} />
              <Paragraph color="$color11" textAlign="center">{error}</Paragraph>
            </YStack>
          )}

          {!loading && !error && products.length === 0 && (
            <YStack maxWidth={448} alignSelf="center" alignItems="center" paddingVertical="$12">
              <StoreIcon size={40} />
              <H2 fontSize="$6" fontWeight="500" marginBottom="$1" textAlign="center">No products yet</H2>
              <Paragraph color="$color11" textAlign="center">
                This store is connected but its catalog is empty. Add a product
                to see it here.
              </Paragraph>
            </YStack>
          )}

          {!loading && !error && products.length > 0 && (
            <>
              <Paragraph fontSize="$3" color="$color11" marginBottom="$5">
                Showing {products.length} product{products.length === 1 ? "" : "s"}
              </Paragraph>
              <YStack gap="$5">
                {products.map((product) => (
                  <Card key={product.key} overflow="hidden" group>
                    <YStack position="relative">
                      <AspectRatio ratio={1}>
                        {product.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <Image
                            src={product.image}
                            alt={product.name}
                            objectFit="cover" width="100%" height="100%" $group-hover={{ scale: 1.05 }}
  />
                        ) : (
                          <XStack width="100%" height="100%" alignItems="center" justifyContent="center" backgroundColor="$color3">
                            <StoreIcon size={32} />
                          </XStack>
                        )}
                      </AspectRatio>
                      {product.listPriceCents &&
                        product.listPriceCents > product.priceCents && (
                          <Badge className="absolute top-2 left-2">Sale</Badge>
                        )}
                    </YStack>
                    <CardContent padding="$4">
                      <H3 fontWeight="500" marginBottom="$1">{product.name}</H3>
                      {product.headline && (
                        <Paragraph fontSize="$3" color="$color11" marginBottom="$2" numberOfLines={2}>
                          {product.headline}
                        </Paragraph>
                      )}
                      <XStack alignItems="center" gap="$2" marginBottom="$1">
                        <SizableText fontSize="$8" fontWeight="500">
                          {money(product.priceCents, product.currency || currency)}
                        </SizableText>
                        {product.listPriceCents &&
                          product.listPriceCents > product.priceCents && (
                            <SizableText fontSize="$3" color="$color11" textDecorationLine="line-through">
                              {money(
                                product.listPriceCents,
                                product.currency || currency,
                              )}
                            </SizableText>
                          )}
                      </XStack>
                    </CardContent>
                    <CardFooter padding="$4" paddingTop="$0">
                      <Button
                        width="100%"
                        disabled={!product.available}
                        onClick={() => addToCart(product)}
                      >
                        <ShoppingCart size={16} />
                        {product.available
                          ? (cart[product.key] || 0) > 0
                            ? `In cart (${cart[product.key]})`
                            : "Add to Cart"
                          : "Unavailable"}
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </YStack>
            </>
          )}
        </YStack>
      </YStack>
    </YStack>
  );
}
