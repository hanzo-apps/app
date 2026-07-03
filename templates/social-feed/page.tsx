"use client";

import { useState } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@hanzo/ui";
import { Button } from "@hanzo/ui";
import { Avatar, AvatarFallback, AvatarImage } from "@hanzo/ui";
import { Textarea } from "@hanzo/ui";
import { Badge } from "@hanzo/ui";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@hanzo/ui";
import { ScrollArea } from "@hanzo/ui";
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
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto flex">
        {/* Left Sidebar */}
        <div className="w-64 border-r min-h-screen p-6">
          <div className="space-y-2">
            <Button variant="ghost" className="w-full justify-start gap-3">
              <Hash className="w-5 h-5" />
              Explore
            </Button>
            <Button variant="ghost" className="w-full justify-start gap-3">
              <Users className="w-5 h-5" />
              Communities
            </Button>
            <Button variant="ghost" className="w-full justify-start gap-3">
              <Bookmark className="w-5 h-5" />
              Bookmarks
            </Button>
          </div>
        </div>

        {/* Main Feed */}
        <div className="flex-1 border-r">
          {/* Header */}
          <div className="border-b sticky top-0 bg-background/95 backdrop-blur">
            <Tabs value={selectedTab} onValueChange={setSelectedTab}>
              <TabsList className="w-full justify-start rounded-none h-12">
                <TabsTrigger value="for-you" className="flex-1">For You</TabsTrigger>
                <TabsTrigger value="following" className="flex-1">Following</TabsTrigger>
                <TabsTrigger value="trending" className="flex-1">Trending</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Create Post */}
          <Card className="rounded-none border-b border-x-0">
            <CardContent className="p-4">
              <div className="flex gap-3">
                <Avatar>
                  <AvatarFallback>U</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <Textarea
                    placeholder="What's happening?"
                    value={newPost}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNewPost(e.target.value)}
                    className="border-0 p-0 resize-none focus-visible:ring-0"
                  />
                  <div className="flex items-center justify-between mt-4">
                    <div className="flex gap-2">
                      <Button variant="ghost" size="icon">
                        <Image className="w-4 h-4" />
                      </Button>
                    </div>
                    <Button disabled={!newPost.trim()}>
                      <Send className="w-4 h-4 mr-2" />
                      Post
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Feed */}
          <ScrollArea className="h-[calc(100vh-8rem)]">
            {posts.map(post => (
              <Card key={post.id} className="rounded-none border-b border-x-0">
                <CardHeader className="flex flex-row items-start justify-between pb-3">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={post.author.avatar} />
                      <AvatarFallback>
                        {post.author.name.split(" ").map(n => n[0]).join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-1">
                        <p className="font-semibold">{post.author.name}</p>
                        {post.author.verified && (
                          <Badge variant="outline" className="h-5 px-1">✓</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {post.author.username} · {post.timestamp}
                      </p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon">
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </CardHeader>

                <CardContent className="pb-3">
                  <p>{post.content}</p>
                  {post.hasImage && (
                    <img
                      src={post.image}
                      alt="Post content"
                      className="mt-3 rounded-lg w-full"
                    />
                  )}
                </CardContent>

                <CardFooter className="justify-between">
                  <Button variant="ghost" size="sm" className="gap-2">
                    <MessageCircle className="w-4 h-4" />
                    {post.comments}
                  </Button>
                  <Button variant="ghost" size="sm" className="gap-2">
                    <Heart className="w-4 h-4" />
                    {post.likes}
                  </Button>
                  <Button variant="ghost" size="sm" className="gap-2">
                    <Share2 className="w-4 h-4" />
                    {post.shares}
                  </Button>
                  <Button variant="ghost" size="icon">
                    <Bookmark className="w-4 h-4" />
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </ScrollArea>
        </div>

        {/* Right Sidebar */}
        <div className="w-80 p-6 space-y-6">
          {/* Trending */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-cyan-600" />
                Trending Now
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {trending.map((item, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{item.tag}</p>
                      <p className="text-sm text-muted-foreground">{item.posts} posts</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Suggestions */}
          <Card>
            <CardHeader>
              <CardTitle>Who to Follow</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {suggestions.map(user => (
                  <div key={user.username} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback>
                          {user.name.split(" ").map(n => n[0]).join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-1">
                          <p className="font-medium text-sm">{user.name}</p>
                          {user.verified && (
                            <Badge variant="outline" className="h-4 px-1 text-xs border-cyan-500 text-cyan-600">✓</Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">{user.username}</p>
                      </div>
                    </div>
                    <Button size="sm" className="bg-cyan-600 hover:bg-cyan-700">Follow</Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}