"use client";

import { YStack, XStack, H1, SizableText, H2, Paragraph, Image, H3 } from '@hanzo/gui';
import { useState } from "react";
import { Card, CardContent, CardFooter, Button, Badge, Input, AspectRatio, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@hanzo/ui';
import { ShoppingCart, Search, Star, Filter, Heart, Share2 } from "lucide-react";

const products = [
  {
    id: "1",
    name: "Premium Wireless Headphones",
    price: 299.99,
    image: "/api/placeholder/400/400",
    rating: 4.5,
    reviews: 234,
    badge: "Best Seller",
    variants: ["Black", "White", "Blue"]
  },
  {
    id: "2",
    name: "Smart Watch Pro",
    price: 399.99,
    image: "/api/placeholder/400/400",
    rating: 4.8,
    reviews: 567,
    badge: "New",
    variants: ["Silver", "Gold", "Space Gray"]
  },
  {
    id: "3",
    name: "Portable Speaker",
    price: 149.99,
    image: "/api/placeholder/400/400",
    rating: 4.3,
    reviews: 189,
    badge: null,
    variants: ["Red", "Black", "Green"]
  },
  {
    id: "4",
    name: "Laptop Stand",
    price: 79.99,
    image: "/api/placeholder/400/400",
    rating: 4.6,
    reviews: 432,
    badge: "Sale",
    variants: ["Aluminum", "Wood"]
  }
];

const categories = ["All Products", "Electronics", "Accessories", "Audio", "Computing"];

export default function EcommerceStorefront() {
  const [selectedCategory, setSelectedCategory] = useState("All Products");
  const [cart, setCart] = useState<{ id: string; quantity: number }[]>([]);

  const addToCart = (productId: string) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === productId);
      if (existing) {
        return prev.map(item =>
          item.id === productId
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { id: productId, quantity: 1 }];
    });
  };

  const cartItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <YStack minHeight="100%" backgroundColor="$background">
      {/* Header */}
      <YStack borderBottomWidth={1} position="sticky" top="$0" backgroundColor="$background" backdropFilter="blur(8px)" zIndex={50} className="supports-[backdrop-filter]:bg-background/60">
        <YStack width="100%" maxWidth={1280} alignSelf="center" paddingHorizontal="$5" paddingVertical="$4">
          <XStack alignItems="center" justifyContent="space-between">
            <XStack alignItems="center" gap="$6">
              <H1 fontSize="$8" fontWeight="700">Store</H1>
              <YStack display="none" alignItems="center" gap="$5">
                {categories.map(category => (
                  <Button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                  >
                    <SizableText fontSize="$3" fontWeight="500" color={selectedCategory === category ? "$color12" : "$color11"} hoverStyle={{ color: "$color12" }}>
                      {category}
                    </SizableText>
                  </Button>
                ))}
              </YStack>
            </XStack>

            <XStack alignItems="center" gap="$4">
              <YStack position="relative" display="none">
                <Search size={16} color="$color11" />
                <Input
                  placeholder="Search products..."
                  paddingLeft={36} width={200} $lg={{ width: 300 }}
  />
              </YStack>

              <Button variant="ghost" size="icon" position="relative">
                <ShoppingCart size={20} />
                {cartItemsCount > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center">
                    {cartItemsCount}
                  </Badge>
                )}
              </Button>
            </XStack>
          </XStack>
        </YStack>
      </YStack>

      {/* Hero Section - Orange/Pink Gradient Theme */}
      <SizableText color="white" paddingVertical="$10" display="flex" flexDirection="column">
        <YStack width="100%" maxWidth={1280} alignSelf="center" paddingHorizontal="$5">
          <YStack maxWidth={768}>
            <H2 fontSize="$11" fontWeight="700" marginBottom="$4">
              Summer Collection
            </H2>
            <Paragraph fontSize="$7" marginBottom="$5" opacity={0.9}>
              Discover our latest products built with @hanzo/ui components
            </Paragraph>
            <Button size="lg" variant="secondary">
              Shop Now
            </Button>
          </YStack>
        </YStack>
      </SizableText>

      {/* Filters Bar */}
      <YStack borderBottomWidth={1}>
        <YStack width="100%" maxWidth={1280} alignSelf="center" paddingHorizontal="$5" paddingVertical="$4">
          <XStack alignItems="center" justifyContent="space-between">
            <XStack alignItems="center" gap="$4">
              <Button variant="outline" gap="$2">
                <Filter size={16} />
                Filters
              </Button>
              <Select defaultValue="featured">
                <SelectTrigger width={180}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="featured">Featured</SelectItem>
                  <SelectItem value="price-low">Price: Low to High</SelectItem>
                  <SelectItem value="price-high">Price: High to Low</SelectItem>
                  <SelectItem value="rating">Highest Rated</SelectItem>
                  <SelectItem value="newest">Newest</SelectItem>
                </SelectContent>
              </Select>
            </XStack>
            <Paragraph fontSize="$3" color="$color11">
              Showing {products.length} products
            </Paragraph>
          </XStack>
        </YStack>
      </YStack>

      {/* Products Grid */}
      <YStack paddingVertical="$8">
        <YStack width="100%" maxWidth={1280} alignSelf="center" paddingHorizontal="$5">
          <YStack gap="$5">
            {products.map(product => (
              <Card key={product.id} overflow="hidden" group>
                <YStack position="relative">
                  <AspectRatio ratio={1}>
                    <Image
                      src={product.image}
                      alt={product.name}
                      objectFit="cover" width="100%" height="100%" $group-hover={{ scale: 1.05 }}
  />
                  </AspectRatio>
                  {product.badge && (
                    <Badge className="absolute top-2 left-2">
                      {product.badge}
                    </Badge>
                  )}
                  <YStack position="absolute" top="$2" right="$2" gap="$1" opacity={0} $group-hover={{ opacity: 1 }}>
                    <Button size="icon" variant="secondary" height="$6" width="$6">
                      <Heart size={16} />
                    </Button>
                    <Button size="icon" variant="secondary" height="$6" width="$6">
                      <Share2 size={16} />
                    </Button>
                  </YStack>
                </YStack>

                <CardContent padding="$4">
                  <H3 fontWeight="600" marginBottom="$2">{product.name}</H3>
                  <XStack alignItems="center" gap="$2" marginBottom="$2">
                    <XStack alignItems="center">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          size={16}
  />
                      ))}
                    </XStack>
                    <SizableText fontSize="$3" color="$color11">
                      ({product.reviews})
                    </SizableText>
                  </XStack>
                  <XStack alignItems="center" justifyContent="space-between" marginBottom="$3">
                    <SizableText fontSize="$8" fontWeight="700">
                      ${product.price}
                    </SizableText>
                  </XStack>

                  {/* Variant Selector */}
                  <YStack marginBottom="$3">
                    <Select defaultValue={product.variants[0]}>
                      <SelectTrigger width="100%" height="$6">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {product.variants.map(variant => (
                          <SelectItem key={variant} value={variant}>
                            {variant}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </YStack>
                </CardContent>

                <CardFooter padding="$4" paddingTop="$0">
                  <Button
                    width="100%"
                    onClick={() => addToCart(product.id)}
                  >
                    <ShoppingCart size={16} />
                    Add to Cart
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </YStack>
        </YStack>
      </YStack>

      {/* Features */}
      <YStack paddingVertical="$8" backgroundColor="$color3">
        <YStack width="100%" maxWidth={1280} alignSelf="center" paddingHorizontal="$5">
          <YStack gap="$6">
            <SizableText textAlign="center" display="flex" flexDirection="column">
              <XStack width="$8" height="$8" borderRadius="$10" backgroundColor="$orange9" alignItems="center" justifyContent="center" alignSelf="center" marginBottom="$3">
                <ShoppingCart size={24} color="$orange9" />
              </XStack>
              <H3 fontWeight="600" marginBottom="$1">Free Shipping</H3>
              <Paragraph fontSize="$3" color="$color11">
                On orders over $100
              </Paragraph>
            </SizableText>
            <SizableText textAlign="center" display="flex" flexDirection="column">
              <XStack width="$8" height="$8" borderRadius="$10" backgroundColor="$pink9" alignItems="center" justifyContent="center" alignSelf="center" marginBottom="$3">
                <Star size={24} color="$pink9" />
              </XStack>
              <H3 fontWeight="600" marginBottom="$1">Quality Products</H3>
              <Paragraph fontSize="$3" color="$color11">
                100% authentic brands
              </Paragraph>
            </SizableText>
            <SizableText textAlign="center" display="flex" flexDirection="column">
              <XStack width="$8" height="$8" borderRadius="$10" backgroundColor="$red9" alignItems="center" justifyContent="center" alignSelf="center" marginBottom="$3">
                <Heart size={24} color="$red9" />
              </XStack>
              <H3 fontWeight="600" marginBottom="$1">24/7 Support</H3>
              <Paragraph fontSize="$3" color="$color11">
                Dedicated customer service
              </Paragraph>
            </SizableText>
          </YStack>
        </YStack>
      </YStack>
    </YStack>
  );
}