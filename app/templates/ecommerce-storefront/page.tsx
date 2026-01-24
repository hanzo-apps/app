"use client";

import { useState } from "react";
import { Card, CardContent, CardFooter } from "@hanzo/ui";
import { Button } from "@hanzo/ui";
import { Badge } from "@hanzo/ui";
import { Input } from "@hanzo/ui";
import { AspectRatio } from "@hanzo/ui";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@hanzo/ui";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@hanzo/ui";
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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-8">
              <h1 className="text-2xl font-bold">Store</h1>
              <nav className="hidden md:flex items-center gap-6">
                {categories.map(category => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`text-sm font-medium transition-colors hover:text-primary ${
                      selectedCategory === category
                        ? "text-primary"
                        : "text-muted-foreground"
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </nav>
            </div>

            <div className="flex items-center gap-4">
              <div className="relative hidden md:block">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search products..."
                  className="pl-9 w-[200px] lg:w-[300px]"
                />
              </div>

              <Button variant="ghost" size="icon" className="relative">
                <ShoppingCart className="w-5 h-5" />
                {cartItemsCount > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center">
                    {cartItemsCount}
                  </Badge>
                )}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section - Orange/Pink Gradient Theme */}
      <section className="bg-gradient-to-r from-[#fd4444] to-[#ff6b6b] text-white py-16">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl">
            <h2 className="text-4xl font-bold mb-4">
              Summer Collection
            </h2>
            <p className="text-xl mb-6 opacity-90">
              Discover our latest products built with @hanzo/ui components
            </p>
            <Button size="lg" variant="secondary">
              Shop Now
            </Button>
          </div>
        </div>
      </section>

      {/* Filters Bar */}
      <div className="border-b">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="outline" className="gap-2">
                <Filter className="w-4 h-4" />
                Filters
              </Button>
              <Select defaultValue="featured">
                <SelectTrigger className="w-[180px]">
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
            </div>
            <p className="text-sm text-muted-foreground">
              Showing {products.length} products
            </p>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <section className="py-12">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map(product => (
              <Card key={product.id} className="overflow-hidden group">
                <div className="relative">
                  <AspectRatio ratio={1}>
                    <img
                      src={product.image}
                      alt={product.name}
                      className="object-cover w-full h-full group-hover:scale-105 transition-transform"
                    />
                  </AspectRatio>
                  {product.badge && (
                    <Badge className="absolute top-2 left-2">
                      {product.badge}
                    </Badge>
                  )}
                  <div className="absolute top-2 right-2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button size="icon" variant="secondary" className="h-8 w-8">
                      <Heart className="w-4 h-4" />
                    </Button>
                    <Button size="icon" variant="secondary" className="h-8 w-8">
                      <Share2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <CardContent className="p-4">
                  <h3 className="font-semibold mb-2">{product.name}</h3>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${
                            i < Math.floor(product.rating)
                              ? "fill-yellow-400 text-yellow-400"
                              : "text-muted-foreground"
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-sm text-muted-foreground">
                      ({product.reviews})
                    </span>
                  </div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-2xl font-bold">
                      ${product.price}
                    </span>
                  </div>

                  {/* Variant Selector */}
                  <div className="mb-3">
                    <Select defaultValue={product.variants[0]}>
                      <SelectTrigger className="w-full h-8 text-sm">
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
                  </div>
                </CardContent>

                <CardFooter className="p-4 pt-0">
                  <Button
                    className="w-full"
                    onClick={() => addToCart(product.id)}
                  >
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    Add to Cart
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-12 bg-muted">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-[#fd4444]/10 flex items-center justify-center mx-auto mb-3">
                <ShoppingCart className="w-6 h-6 text-[#fd4444]" />
              </div>
              <h3 className="font-semibold mb-1">Free Shipping</h3>
              <p className="text-sm text-muted-foreground">
                On orders over $100
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-[#ff6b6b]/10 flex items-center justify-center mx-auto mb-3">
                <Star className="w-6 h-6 text-[#ff6b6b]" />
              </div>
              <h3 className="font-semibold mb-1">Quality Products</h3>
              <p className="text-sm text-muted-foreground">
                100% authentic brands
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-[#fd4444]/10 flex items-center justify-center mx-auto mb-3">
                <Heart className="w-6 h-6 text-[#fd4444]" />
              </div>
              <h3 className="font-semibold mb-1">24/7 Support</h3>
              <p className="text-sm text-muted-foreground">
                Dedicated customer service
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}