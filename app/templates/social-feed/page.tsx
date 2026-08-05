"use client";

import { YStack, XStack, Paragraph } from '@hanzo/gui';
import { glass } from "@/lib/chrome";
import { useState } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, Button, Avatar, AvatarFallback, AvatarImage, Textarea, Badge, Tabs, TabsList, TabsTrigger, ScrollArea } from '@hanzo/ui';
import {
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  MoreHorizontal,
  Image,
  Send,
  TrendingUp,
  Users,
  Hash
} from "lucide-react";

const posts = [
  {
    id: "1",
    author: {
      name: "Sarah Chen",
      username: "@sarahchen",
      avatar: "/api/placeholder/40/40",
      verified: true
    },
    content: "Just shipped a new feature using @hanzo/ui components! The DX is incredible 🚀",
    timestamp: "2h ago",
    likes: 42,
    comments: 8,
    shares: 3,
    hasImage: false
  },
  {
    id: "2",
    author: {
      name: "Alex Rivera",
      username: "@alexdev",
      avatar: "/api/placeholder/40/40",
      verified: false
    },
    content: "Building with @hanzo/ui has completely changed how I approach UI development. The component system is so well thought out!",
    timestamp: "4h ago",
    likes: 128,
    comments: 24,
    shares: 15,
    hasImage: true,
    image: "/api/placeholder/600/400"
  },
  {
    id: "3",
    author: {
      name: "Jordan Park",
      username: "@jordanpark",
      avatar: "/api/placeholder/40/40",
      verified: true
    },
    content: "Who else is excited about the new Hanzo AI templates? Just forked one and got started in seconds!",
    timestamp: "6h ago",
    likes: 89,
    comments: 31,
    shares: 12,
    hasImage: false
  }
];

const trending = [
  { tag: "#HanzoUI", posts: "2.4k" },
  { tag: "#BuildInPublic", posts: "1.8k" },
  { tag: "#ReactDev", posts: "3.2k" },
  { tag: "#OpenSource", posts: "5.1k" }
];

const suggestions = [
  { name: "Hanzo AI", username: "@hanzoai", verified: true, followers: "42k" },
  { name: "React", username: "@reactjs", verified: true, followers: "892k" },
  { name: "Vercel", username: "@vercel", verified: true, followers: "234k" }
];

export default function SocialFeed() {
  const [newPost, setNewPost] = useState("");
  const [selectedTab, setSelectedTab] = useState("for-you");

  return (
    <YStack minHeight="100%" backgroundColor="$background">
      <XStack maxWidth={1280} alignSelf="center">
        {/* Left Sidebar */}
        <YStack width={256} borderRightWidth={1} minHeight="100%" padding="$5">
          <YStack rowGap="$2">
            <Button variant="ghost" width="100%" justifyContent="flex-start" gap="$3">
              <Hash size={20} />
              Explore
            </Button>
            <Button variant="ghost" width="100%" justifyContent="flex-start" gap="$3">
              <Users size={20} />
              Communities
            </Button>
            <Button variant="ghost" width="100%" justifyContent="flex-start" gap="$3">
              <Bookmark size={20} />
              Bookmarks
            </Button>
          </YStack>
        </YStack>

        {/* Main Feed */}
        <YStack flex={1} borderRightWidth={1}>
          {/* Header */}
          <YStack {...glass(2)} borderBottomWidth={1} position="sticky" top="$0">
            <Tabs value={selectedTab} onValueChange={setSelectedTab}>
              <TabsList width="100%" justifyContent="flex-start" borderRadius={0} height="$8">
                <TabsTrigger value="for-you" flex={1}>For You</TabsTrigger>
                <TabsTrigger value="following" flex={1}>Following</TabsTrigger>
                <TabsTrigger value="trending" flex={1}>Trending</TabsTrigger>
              </TabsList>
            </Tabs>
          </YStack>

          {/* Create Post */}
          <Card borderRadius={0} borderBottomWidth={1} borderLeftWidth={0} borderRightWidth={0}>
            <CardContent padding="$4">
              <XStack gap="$3">
                <Avatar>
                  <AvatarFallback>U</AvatarFallback>
                </Avatar>
                <YStack flex={1}>
                  <Textarea
                    placeholder="What's happening?"
                    value={newPost}
                    onChangeText={(value) => setNewPost(value)}
                    borderWidth={0} padding="$0"
  />
                  <XStack alignItems="center" justifyContent="space-between" marginTop="$4">
                    <XStack gap="$2">
                      <Button variant="ghost" size="icon">
                        <Image size={16} />
                      </Button>
                    </XStack>
                    <Button disabled={!newPost.trim()}>
                      <Send size={16} />
                      Post
                    </Button>
                  </XStack>
                </YStack>
              </XStack>
            </CardContent>
          </Card>

          {/* Feed */}
          <ScrollArea height="calc(100vh-8rem)">
            {posts.map(post => (
              <Card key={post.id} borderRadius={0} borderBottomWidth={1} borderLeftWidth={0} borderRightWidth={0}>
                <CardHeader flexDirection="row" alignItems="flex-start" justifyContent="space-between" paddingBottom="$3">
                  <XStack alignItems="center" gap="$3">
                    <Avatar>
                      <AvatarImage src={post.author.avatar} />
                      <AvatarFallback>
                        {post.author.name.split(" ").map(n => n[0]).join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <XStack alignItems="center" gap="$1">
                        <Paragraph fontWeight="500">{post.author.name}</Paragraph>
                        {post.author.verified && (
                          <Badge variant="outline">✓</Badge>
                        )}
                      </XStack>
                      <Paragraph fontSize="$3" color="$color11">
                        {post.author.username} · {post.timestamp}
                      </Paragraph>
                    </div>
                  </XStack>
                  <Button variant="ghost" size="icon">
                    <MoreHorizontal size={16} />
                  </Button>
                </CardHeader>

                <CardContent paddingBottom="$3">
                  <p>{post.content}</p>
                  {post.hasImage && (
                    <img
                      src={post.image}
                      alt="Post content"
                      style={{ marginTop: 12, borderRadius: 8, width: "100%" }}
  />
                  )}
                </CardContent>

                <CardFooter justifyContent="space-between">
                  <Button variant="ghost" size="sm" gap="$2">
                    <MessageCircle size={16} />
                    {post.comments}
                  </Button>
                  <Button variant="ghost" size="sm" gap="$2">
                    <Heart size={16} />
                    {post.likes}
                  </Button>
                  <Button variant="ghost" size="sm" gap="$2">
                    <Share2 size={16} />
                    {post.shares}
                  </Button>
                  <Button variant="ghost" size="icon">
                    <Bookmark size={16} />
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </ScrollArea>
        </YStack>

        {/* Right Sidebar */}
        <YStack width={320} padding="$5" rowGap="$5">
          {/* Trending */}
          <Card>
            <CardHeader>
              <CardTitle display="flex" alignItems="center" gap="$2">
                <TrendingUp size={20} />
                Trending Now
              </CardTitle>
            </CardHeader>
            <CardContent>
              <YStack rowGap="$3">
                {trending.map((item, i) => (
                  <XStack key={i} alignItems="center" justifyContent="space-between">
                    <div>
                      <Paragraph fontWeight="500">{item.tag}</Paragraph>
                      <Paragraph fontSize="$3" color="$color11">{item.posts} posts</Paragraph>
                    </div>
                  </XStack>
                ))}
              </YStack>
            </CardContent>
          </Card>

          {/* Suggestions */}
          <Card>
            <CardHeader>
              <CardTitle>Who to Follow</CardTitle>
            </CardHeader>
            <CardContent>
              <YStack rowGap="$4">
                {suggestions.map(user => (
                  <XStack key={user.username} alignItems="center" justifyContent="space-between">
                    <XStack alignItems="center" gap="$3">
                      <Avatar>
                        <AvatarFallback>
                          {user.name.split(" ").map(n => n[0]).join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <XStack alignItems="center" gap="$1">
                          <Paragraph fontWeight="500" fontSize="$3">{user.name}</Paragraph>
                          {user.verified && (
                            <Badge variant="outline">✓</Badge>
                          )}
                        </XStack>
                        <Paragraph fontSize="$1" color="$color11">{user.username}</Paragraph>
                      </div>
                    </XStack>
                    <Button variant="outline" size="sm">Follow</Button>
                  </XStack>
                ))}
              </YStack>
            </CardContent>
          </Card>
        </YStack>
      </XStack>
    </YStack>
  );
}