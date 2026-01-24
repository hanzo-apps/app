"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@hanzo/ui";
import { Button } from "@hanzo/ui";
import { Badge } from "@hanzo/ui";
import { Input } from "@hanzo/ui";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@hanzo/ui";
import {
  Sparkles,
  ShoppingCart,
  BarChart,
  Megaphone,
  MessageSquare,
  Layout,
  FileText,
  Bitcoin,
  BookOpen,
  Play,
  ExternalLink,
  Github,
  Rocket,
  Code,
  Eye,
  Copy,
  Check,
  Zap
} from "lucide-react";

const templates = [
  {
    id: "ai-chat-interface",
    name: "AI Chat Interface",
    description: "Modern chat UI with streaming responses and markdown support",
    icon: <MessageSquare className="w-6 h-6" />,
    color: "from-[#fd4444] to-[#e03e3e]",
    features: ["Streaming responses", "Message history", "Dark theme"],
    category: "AI",
    path: "/templates/ai-chat-interface",
    hfUrl: "https://huggingface.co/spaces/hanzo-community/ai-chat-interface"
  },
  {
    id: "ecommerce-storefront",
    name: "E-commerce Storefront",
    description: "Complete online store with cart and product management",
    icon: <ShoppingCart className="w-6 h-6" />,
    color: "from-orange-500 to-pink-500",
    features: ["Product grid", "Shopping cart", "Filters"],
    category: "Commerce",
    path: "/templates/ecommerce-storefront",
    hfUrl: "https://huggingface.co/spaces/hanzo-community/ecommerce-storefront"
  },
  {
    id: "analytics-dashboard",
    name: "Analytics Dashboard",
    description: "Data visualization dashboard with charts and metrics",
    icon: <BarChart className="w-6 h-6" />,
    color: "from-[#fd4444] to-[#ff6b6b]",
    features: ["Metric cards", "Charts", "Real-time data"],
    category: "Analytics",
    path: "/templates/analytics-dashboard",
    hfUrl: "https://huggingface.co/spaces/hanzo-community/analytics-dashboard"
  },
  {
    id: "saas-landing",
    name: "SaaS Landing Page",
    description: "High-converting landing page with pricing and features",
    icon: <Megaphone className="w-6 h-6" />,
    color: "from-emerald-600 to-teal-600",
    features: ["Hero section", "Pricing tiers", "CTAs"],
    category: "Marketing",
    path: "/templates/saas-landing",
    hfUrl: "https://huggingface.co/spaces/hanzo-community/saas-landing"
  },
  {
    id: "social-feed",
    name: "Social Media Feed",
    description: "Twitter/X-like social feed with posts and interactions",
    icon: <Sparkles className="w-6 h-6" />,
    color: "from-cyan-500 to-cyan-600",
    features: ["Post creation", "Comments", "Real-time updates"],
    category: "Social",
    path: "/templates/social-feed",
    hfUrl: "https://huggingface.co/spaces/hanzo-community/social-feed"
  },
  {
    id: "kanban-board",
    name: "Kanban Board",
    description: "Trello-like task board with drag-and-drop",
    icon: <Layout className="w-6 h-6" />,
    color: "from-amber-500 to-amber-600",
    features: ["Drag & drop", "Task cards", "Multiple columns"],
    category: "Productivity",
    path: "/templates/kanban-board",
    hfUrl: "https://huggingface.co/spaces/hanzo-community/kanban-board"
  },
  {
    id: "markdown-editor",
    name: "Markdown Editor",
    description: "Live markdown editor with preview and export",
    icon: <FileText className="w-6 h-6" />,
    color: "from-blue-500 to-blue-600",
    features: ["Live preview", "Syntax highlighting", "Export"],
    category: "Tools",
    path: "/templates/markdown-editor",
    hfUrl: "https://huggingface.co/spaces/hanzo-community/markdown-editor"
  },
  {
    id: "crypto-portfolio",
    name: "Crypto Portfolio",
    description: "Cryptocurrency portfolio tracker with live prices",
    icon: <Bitcoin className="w-6 h-6" />,
    color: "from-yellow-500 to-orange-500",
    features: ["Holdings", "Price tracking", "Charts"],
    category: "Finance",
    path: "/templates/crypto-portfolio",
    hfUrl: "https://huggingface.co/spaces/hanzo-community/crypto-portfolio"
  },
  {
    id: "blog-platform",
    name: "Blog Platform",
    description: "Medium-like blog with articles and authors",
    icon: <BookOpen className="w-6 h-6" />,
    color: "from-rose-500 to-pink-500",
    features: ["Article editor", "Categories", "Comments"],
    category: "Content",
    path: "/templates/blog-platform",
    hfUrl: "https://huggingface.co/spaces/hanzo-community/blog-platform"
  },
  {
    id: "video-streaming",
    name: "Video Streaming",
    description: "YouTube-like video platform with player and comments",
    icon: <Play className="w-6 h-6" />,
    color: "from-red-600 to-red-500",
    features: ["Video player", "Comments", "Related videos"],
    category: "Media",
    path: "/templates/video-streaming",
    hfUrl: "https://huggingface.co/spaces/hanzo-community/video-streaming"
  }
];

const categories = ["All", "AI", "Commerce", "Analytics", "Marketing", "Social", "Productivity", "Tools", "Finance", "Content", "Media"];

export default function TemplateGallery() {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filteredTemplates = templates.filter(template => {
    const matchesCategory = selectedCategory === "All" || template.category === selectedCategory;
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          template.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleCopy = async (templateId: string) => {
    const command = `npx create-hanzo-app@latest my-app --template ${templateId}`;
    await navigator.clipboard.writeText(command);
    setCopiedId(templateId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="h-screen overflow-y-auto bg-gradient-to-b from-background to-muted">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-4 mb-2">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#fd4444] to-[#e03e3e] flex items-center justify-center">
                  <Sparkles className="w-7 h-7 text-white" />
                </div>
                <h1 className="text-3xl font-bold">Hanzo Community Gallery</h1>
              </div>
              <p className="text-muted-foreground ml-16">
                Community AI-edited templates showcasing the power of Hanzo Cloud - Deploy & edit instantly!
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="outline" className="gap-2" onClick={() => window.open('https://github.com/hanzoai/ui', '_blank')}>
                <Github className="w-4 h-4" />
                View Source
              </Button>
              <Button className="gap-2 bg-gradient-to-r from-[#fd4444] to-[#e03e3e] hover:from-[#e03e3e] hover:to-[#fd4444]">
                <Rocket className="w-4 h-4" />
                Deploy All
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Filters */}
      <div className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <Input
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
              className="w-64"
            />
            <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
              <TabsList className="grid grid-flow-col auto-cols-fr">
                {categories.map(cat => (
                  <TabsTrigger key={cat} value={cat}>
                    {cat}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
            <Badge variant="secondary" className="ml-auto">
              {filteredTemplates.length} templates
            </Badge>
          </div>
        </div>
      </div>

      {/* Template Grid */}
      <div className="container mx-auto px-6 py-8">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredTemplates.map(template => (
            <Card key={template.id} className="group overflow-hidden hover:shadow-xl transition-all duration-200 hover:-translate-y-1">
              {/* Color bar */}
              <div className={`h-1 bg-gradient-to-r ${template.color}`} />

              <CardHeader>
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-12 h-12 rounded-lg bg-gradient-to-r ${template.color} flex items-center justify-center text-white shadow-lg`}>
                    {template.icon}
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {template.category}
                  </Badge>
                </div>
                <CardTitle className="text-lg">{template.name}</CardTitle>
                <CardDescription className="text-sm line-clamp-2">
                  {template.description}
                </CardDescription>
              </CardHeader>

              <CardContent className="pb-3">
                <div className="flex flex-wrap gap-1">
                  {template.features.map(feature => (
                    <Badge key={feature} variant="secondary" className="text-xs px-2 py-0">
                      {feature}
                    </Badge>
                  ))}
                </div>
              </CardContent>

              <CardFooter className="flex gap-2 pt-3">
                <Button
                  className="flex-1 gap-1 bg-gradient-to-r from-[#fd4444] to-[#e03e3e] hover:from-[#e03e3e] hover:to-[#fd4444]"
                  size="sm"
                  onClick={() => window.location.href = `/new`}
                >
                  <Zap className="w-3 h-3" />
                  Deploy
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 gap-1"
                  onClick={() => window.location.href = `/new`}
                >
                  <Code className="w-3 h-3" />
                  Edit
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        {/* Empty state */}
        {filteredTemplates.length === 0 && (
          <div className="text-center py-20">
            <p className="text-muted-foreground text-lg">No templates found matching your criteria.</p>
            <Button
              variant="link"
              onClick={() => {
                setSelectedCategory("All");
                setSearchQuery("");
              }}
              className="mt-2"
            >
              Clear filters
            </Button>
          </div>
        )}
      </div>

      {/* Quick Start Section */}
      <section className="border-t bg-muted/50">
        <div className="container mx-auto px-6 py-12">
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold mb-4">Quick Start</h2>
            <p className="text-muted-foreground mb-6">
              Get started with any template in seconds. All templates are built with @hanzo/ui components and can be customized to fit your needs.
            </p>
            <div className="bg-background rounded-lg p-6 border">
              <code className="text-sm font-mono">
                npx create-hanzo-app@latest my-app --template [template-name]
              </code>
            </div>
            <div className="flex items-center justify-center gap-4 mt-6">
              <Button variant="outline" size="sm" onClick={() => window.open('https://hanzo.ai/docs', '_blank')}>
                <BookOpen className="w-4 h-4 mr-2" />
                Documentation
              </Button>
              <Button variant="outline" size="sm" onClick={() => window.open('https://github.com/hanzoai/ui', '_blank')}>
                <Code className="w-4 h-4 mr-2" />
                Component Library
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}