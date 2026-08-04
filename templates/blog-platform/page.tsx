"use client";

import { YStack, XStack, H1, Image, H2, Paragraph, H3, SizableText } from '@hanzo/gui';
import { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle, Button, Badge, Avatar, AvatarFallback, AvatarImage, Input, Tabs, TabsContent, TabsList, TabsTrigger, AspectRatio } from '@hanzo/ui';
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
    <YStack minHeight="100%" backgroundColor="$background">
      {/* Header */}
      <YStack borderBottomWidth={1}>
        <YStack width="100%" maxWidth={1280} alignSelf="center" paddingHorizontal="$5" paddingVertical="$4">
          <XStack alignItems="center" justifyContent="space-between">
            <XStack alignItems="center" gap="$6">
              <H1 fontSize="$8" fontWeight="700">Hanzo Blog</H1>
              <XStack display="none" $md={{ display: "flex" }} alignItems="center" gap="$5">
                {categories.slice(0, 5).map(cat => (
                  <Button
                    key={cat.name}
                    onClick={() => setSelectedCategory(cat.name)}
                    group
                  >
                    <SizableText fontSize="$3" fontWeight="500" color={selectedCategory === cat.name ? "$color12" : "$color11"} $group-hover={{ color: "$color12" }}>
                      {cat.name}
                    </SizableText>
                  </Button>
                ))}
              </XStack>
            </XStack>

            <XStack alignItems="center" gap="$4">
              <YStack position="relative" display="none" $md={{ display: "flex" }}>
                <Search size={16} />
                <Input
                  placeholder="Search articles..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  paddingLeft={36} width={250}
  />
              </YStack>
              <Button>
                <Edit size={16} />
                Write
              </Button>
            </XStack>
          </XStack>
        </YStack>
      </YStack>

      {/* Featured Article */}
      <YStack width="100%" maxWidth={1280} alignSelf="center" paddingHorizontal="$5" paddingVertical="$6">
        <Card overflow="hidden">
          <YStack gap="$5">
            <AspectRatio ratio={16/9}>
              <Image
                src={featuredArticle.coverImage}
                alt={featuredArticle.title}
                objectFit="cover" width="100%" height="100%"
  />
            </AspectRatio>
            <YStack padding="$5" justifyContent="center">
              <Badge variant="secondary" className="mb-4">{featuredArticle.category}</Badge>
              <H2 fontSize="$10" fontWeight="700" marginBottom="$4">{featuredArticle.title}</H2>
              <Paragraph color="$color11" marginBottom="$5">{featuredArticle.excerpt}</Paragraph>

              <XStack alignItems="center" gap="$4" marginBottom="$5">
                <Avatar>
                  <AvatarImage src={featuredArticle.author.avatar} />
                  <AvatarFallback>
                    {featuredArticle.author.name.split(" ").map(n => n[0]).join("")}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <Paragraph fontWeight="500">{featuredArticle.author.name}</Paragraph>
                  <Paragraph fontSize="$3" color="$color11">
                    {featuredArticle.publishDate} · {featuredArticle.readTime}
                  </Paragraph>
                </div>
              </XStack>

              <XStack alignItems="center" gap="$4">
                <Button backgroundColor="$red10" hoverStyle={{ backgroundColor: "$red11" }}>Read Article</Button>
                <Button variant="ghost" size="icon">
                  <Bookmark size={16} />
                </Button>
              </XStack>
            </YStack>
          </YStack>
        </Card>
      </YStack>

      {/* Main Content */}
      <YStack width="100%" maxWidth={1280} alignSelf="center" paddingHorizontal="$5" paddingVertical="$6">
        <Tabs defaultValue="latest" rowGap="$5">
          <TabsList>
            <TabsTrigger value="latest">Latest</TabsTrigger>
            <TabsTrigger value="trending">Trending</TabsTrigger>
            <TabsTrigger value="following">Following</TabsTrigger>
          </TabsList>

          <TabsContent value="latest" rowGap="$5">
            <YStack gap="$6">
              {/* Articles Grid */}
              <YStack rowGap="$5">
                {articles.map(article => (
                  <Card key={article.id} overflow="hidden">
                    <YStack gap="$4">
                      <AspectRatio ratio={4/3}>
                        <Image
                          src={article.coverImage}
                          alt={article.title}
                          objectFit="cover" width="100%" height="100%" borderRadius="$5"
  />
                      </AspectRatio>
                      <YStack padding="$4">
                        <XStack alignItems="center" gap="$2" marginBottom="$2">
                          <Badge variant="outline">{article.category}</Badge>
                          {article.trending && (
                            <Badge variant="secondary" className="gap-1">
                              <TrendingUp size={12} />
                              Trending
                            </Badge>
                          )}
                        </XStack>
                        <H3 fontWeight="600" fontSize="$6" marginBottom="$2">{article.title}</H3>
                        <Paragraph fontSize="$3" color="$color11" marginBottom="$4">
                          {article.excerpt}
                        </Paragraph>

                        <XStack alignItems="center" justifyContent="space-between">
                          <XStack alignItems="center" gap="$3">
                            <Avatar height="$6" width="$6">
                              <AvatarImage src={article.author.avatar} />
                              <AvatarFallback>
                                {article.author.name.split(" ").map(n => n[0]).join("")}
                              </AvatarFallback>
                            </Avatar>
                            <SizableText fontSize="$3" display="flex" flexDirection="column">
                              <Paragraph fontWeight="500">{article.author.name}</Paragraph>
                              <Paragraph color="$color11">
                                {article.publishDate} · {article.readTime}
                              </Paragraph>
                            </SizableText>
                          </XStack>

                          <SizableText alignItems="center" gap="$3" fontSize="$3" color="$color11" display="flex" flexDirection="row">
                            <Button alignItems="center" gap="$1">
                              <Heart size={16} />
                              {article.likes}
                            </Button>
                            <Button>
                              <MessageCircle size={16} />
                            </Button>
                            <Button>
                              <Share2 size={16} />
                            </Button>
                          </SizableText>
                        </XStack>
                      </YStack>
                    </YStack>
                  </Card>
                ))}

                <Button variant="outline" width="100%">
                  Load More Articles
                </Button>
              </YStack>

              {/* Sidebar */}
              <YStack rowGap="$5">
                {/* Popular Authors */}
                <Card>
                  <CardHeader>
                    <CardTitle display="flex" alignItems="center" gap="$2">
                      <Users size={20} />
                      Popular Authors
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <YStack rowGap="$4">
                      {popularAuthors.map(author => (
                        <XStack key={author.name} alignItems="center" justifyContent="space-between">
                          <XStack alignItems="center" gap="$3">
                            <Avatar>
                              <AvatarFallback>
                                {author.name.split(" ").map(n => n[0]).join("")}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <Paragraph fontWeight="500" fontSize="$3">{author.name}</Paragraph>
                              <Paragraph fontSize="$1" color="$color11">
                                {author.articles} articles
                              </Paragraph>
                            </div>
                          </XStack>
                          <Button size="sm" variant="outline">Follow</Button>
                        </XStack>
                      ))}
                    </YStack>
                  </CardContent>
                </Card>

                {/* Your Stats */}
                <Card>
                  <CardHeader>
                    <CardTitle display="flex" alignItems="center" gap="$2">
                      <BarChart size={20} />
                      Your Stats
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <YStack rowGap="$3">
                      <XStack justifyContent="space-between">
                        <SizableText fontSize="$3" color="$color11">Articles Read</SizableText>
                        <SizableText fontWeight="500">42</SizableText>
                      </XStack>
                      <XStack justifyContent="space-between">
                        <SizableText fontSize="$3" color="$color11">Reading Streak</SizableText>
                        <SizableText fontWeight="500">7 days</SizableText>
                      </XStack>
                      <XStack justifyContent="space-between">
                        <SizableText fontSize="$3" color="$color11">Bookmarks</SizableText>
                        <SizableText fontWeight="500">18</SizableText>
                      </XStack>
                      <XStack justifyContent="space-between">
                        <SizableText fontSize="$3" color="$color11">Following</SizableText>
                        <SizableText fontWeight="500">23</SizableText>
                      </XStack>
                    </YStack>
                  </CardContent>
                </Card>

                {/* Reading List */}
                <Card>
                  <CardHeader>
                    <CardTitle display="flex" alignItems="center" gap="$2">
                      <Clock size={20} />
                      Reading List
                    </CardTitle>
                    <CardDescription>Articles saved for later</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <YStack rowGap="$3">
                      <Paragraph fontSize="$3">TypeScript Best Practices</Paragraph>
                      <Paragraph fontSize="$3">Understanding React Server Components</Paragraph>
                      <Paragraph fontSize="$3">CSS Grid Layout Guide</Paragraph>
                    </YStack>
                  </CardContent>
                  <CardFooter>
                    <Button variant="outline" width="100%">View All</Button>
                  </CardFooter>
                </Card>
              </YStack>
            </YStack>
          </TabsContent>
        </Tabs>
      </YStack>
    </YStack>
  );
}