"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@hanzo/ui";
import { Button } from "@hanzo/ui";
import { Badge } from "@hanzo/ui";
import { Avatar, AvatarFallback, AvatarImage } from "@hanzo/ui";
import { Input } from "@hanzo/ui";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@hanzo/ui";
import { AspectRatio } from "@hanzo/ui";
import {
  Bookmark,
  Heart,
  MessageCircle,
  Share2,
  TrendingUp,
  Clock,
  Search,
  Edit,
  BarChart,
  Users
} from "lucide-react";

const featuredArticle = {
  id: "1",
  title: "Building Scalable Applications with @hanzo/ui Components",
  excerpt: "Discover how to create production-ready applications using the comprehensive @hanzo/ui component library. Learn best practices and advanced patterns.",
  author: {
    name: "Sarah Chen",
    avatar: "/api/placeholder/40/40",
    bio: "Senior Developer Advocate"
  },
  coverImage: "/api/placeholder/1200/600",
  readTime: "12 min read",
  publishDate: "Dec 10, 2024",
  category: "Engineering",
  likes: 342,
  comments: 48
};

const articles = [
  {
    id: "2",
    title: "The Future of AI-Powered Development",
    excerpt: "Exploring how artificial intelligence is revolutionizing the way we build software.",
    author: { name: "Alex Rivera", avatar: "/api/placeholder/40/40" },
    coverImage: "/api/placeholder/400/300",
    readTime: "8 min",
    publishDate: "Dec 11, 2024",
    category: "AI",
    likes: 256,
    trending: true
  },
  {
    id: "3",
    title: "Design Systems at Scale",
    excerpt: "How to maintain consistency across large applications with design systems.",
    author: { name: "Jordan Park", avatar: "/api/placeholder/40/40" },
    coverImage: "/api/placeholder/400/300",
    readTime: "6 min",
    publishDate: "Dec 9, 2024",
    category: "Design",
    likes: 189
  },
  {
    id: "4",
    title: "State Management Best Practices",
    excerpt: "Modern approaches to managing application state in React applications.",
    author: { name: "Morgan Lee", avatar: "/api/placeholder/40/40" },
    coverImage: "/api/placeholder/400/300",
    readTime: "10 min",
    publishDate: "Dec 8, 2024",
    category: "React",
    likes: 423
  }
];

const categories = [
  { name: "All", count: 156 },
  { name: "Engineering", count: 42 },
  { name: "Design", count: 38 },
  { name: "AI", count: 31 },
  { name: "React", count: 28 },
  { name: "Product", count: 17 }
];

const popularAuthors = [
  { name: "Sarah Chen", followers: 12400, articles: 42 },
  { name: "Alex Rivera", followers: 8900, articles: 38 },
  { name: "Jordan Park", followers: 7200, articles: 31 }
];

export default function BlogPlatform() {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-8">
              <h1 className="text-2xl font-bold">Hanzo Blog</h1>
              <nav className="hidden md:flex items-center gap-6">
                {categories.slice(0, 5).map(cat => (
                  <button
                    key={cat.name}
                    onClick={() => setSelectedCategory(cat.name)}
                    className={`text-sm font-medium transition-colors hover:text-primary ${
                      selectedCategory === cat.name
                        ? "text-primary"
                        : "text-muted-foreground"
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </nav>
            </div>

            <div className="flex items-center gap-4">
              <div className="relative hidden md:block">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search articles..."
                  value={searchQuery}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setSearchQuery(e.target.value)}
                  className="pl-9 w-[250px]"
                />
              </div>
              <Button className="bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600">
                <Edit className="w-4 h-4 mr-2" />
                Write
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Featured Article */}
      <section className="container mx-auto px-6 py-8">
        <Card className="overflow-hidden">
          <div className="grid md:grid-cols-2 gap-6">
            <AspectRatio ratio={16/9}>
              <img
                src={featuredArticle.coverImage}
                alt={featuredArticle.title}
                className="object-cover w-full h-full"
              />
            </AspectRatio>
            <div className="p-6 flex flex-col justify-center">
              <Badge className="w-fit mb-4 bg-rose-100 text-rose-700 border-rose-200">{featuredArticle.category}</Badge>
              <h2 className="text-3xl font-bold mb-4">{featuredArticle.title}</h2>
              <p className="text-muted-foreground mb-6">{featuredArticle.excerpt}</p>

              <div className="flex items-center gap-4 mb-6">
                <Avatar>
                  <AvatarImage src={featuredArticle.author.avatar} />
                  <AvatarFallback>
                    {featuredArticle.author.name.split(" ").map(n => n[0]).join("")}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{featuredArticle.author.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {featuredArticle.publishDate} · {featuredArticle.readTime}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <Button className="bg-rose-600 hover:bg-rose-700">Read Article</Button>
                <Button variant="ghost" size="icon">
                  <Bookmark className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </section>

      {/* Main Content */}
      <section className="container mx-auto px-6 py-8">
        <Tabs defaultValue="latest" className="space-y-6">
          <TabsList>
            <TabsTrigger value="latest">Latest</TabsTrigger>
            <TabsTrigger value="trending">Trending</TabsTrigger>
            <TabsTrigger value="following">Following</TabsTrigger>
          </TabsList>

          <TabsContent value="latest" className="space-y-6">
            <div className="grid md:grid-cols-3 gap-8">
              {/* Articles Grid */}
              <div className="md:col-span-2 space-y-6">
                {articles.map(article => (
                  <Card key={article.id} className="overflow-hidden">
                    <div className="grid md:grid-cols-3 gap-4">
                      <AspectRatio ratio={4/3}>
                        <img
                          src={article.coverImage}
                          alt={article.title}
                          className="object-cover w-full h-full rounded-lg"
                        />
                      </AspectRatio>
                      <div className="md:col-span-2 p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline">{article.category}</Badge>
                          {article.trending && (
                            <Badge variant="secondary" className="gap-1">
                              <TrendingUp className="w-3 h-3" />
                              Trending
                            </Badge>
                          )}
                        </div>
                        <h3 className="font-semibold text-lg mb-2">{article.title}</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          {article.excerpt}
                        </p>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={article.author.avatar} />
                              <AvatarFallback>
                                {article.author.name.split(" ").map(n => n[0]).join("")}
                              </AvatarFallback>
                            </Avatar>
                            <div className="text-sm">
                              <p className="font-medium">{article.author.name}</p>
                              <p className="text-muted-foreground">
                                {article.publishDate} · {article.readTime}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 text-sm text-muted-foreground">
                            <button className="flex items-center gap-1 hover:text-primary">
                              <Heart className="w-4 h-4" />
                              {article.likes}
                            </button>
                            <button className="hover:text-primary">
                              <MessageCircle className="w-4 h-4" />
                            </button>
                            <button className="hover:text-primary">
                              <Share2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}

                <Button variant="outline" className="w-full">
                  Load More Articles
                </Button>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Popular Authors */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="w-5 h-5" />
                      Popular Authors
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {popularAuthors.map(author => (
                        <div key={author.name} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarFallback>
                                {author.name.split(" ").map(n => n[0]).join("")}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium text-sm">{author.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {author.articles} articles
                              </p>
                            </div>
                          </div>
                          <Button size="sm" variant="outline">Follow</Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Your Stats */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart className="w-5 h-5" />
                      Your Stats
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Articles Read</span>
                        <span className="font-medium">42</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Reading Streak</span>
                        <span className="font-medium">7 days</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Bookmarks</span>
                        <span className="font-medium">18</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Following</span>
                        <span className="font-medium">23</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Reading List */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="w-5 h-5" />
                      Reading List
                    </CardTitle>
                    <CardDescription>Articles saved for later</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <p className="text-sm">TypeScript Best Practices</p>
                      <p className="text-sm">Understanding React Server Components</p>
                      <p className="text-sm">CSS Grid Layout Guide</p>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button variant="outline" className="w-full">View All</Button>
                  </CardFooter>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </section>
    </div>
  );
}