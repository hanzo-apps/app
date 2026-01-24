"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@hanzo/ui";
import { Button } from "@hanzo/ui";
import { Badge } from "@hanzo/ui";
import { Avatar, AvatarFallback, AvatarImage } from "@hanzo/ui";
import { AspectRatio } from "@hanzo/ui";
import { ScrollArea } from "@hanzo/ui";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@hanzo/ui";
import { Textarea } from "@hanzo/ui";
import { Progress } from "@hanzo/ui";
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Volume2,
  Maximize,
  ThumbsUp,
  ThumbsDown,
  Share2,
  Download,
  Bell,
  MoreVertical,
  Eye,
  Clock
} from "lucide-react";

const currentVideo = {
  id: "1",
  title: "Building Modern UIs with @hanzo/ui Components",
  channel: {
    name: "Hanzo Dev",
    avatar: "/api/placeholder/40/40",
    subscribers: "42.3k",
    verified: true
  },
  views: 123456,
  likes: 5432,
  dislikes: 89,
  publishedAt: "2 days ago",
  duration: "15:42",
  description: `In this comprehensive tutorial, we'll explore the powerful @hanzo/ui component library and learn how to build beautiful, responsive user interfaces.

Topics covered:
• Setting up @hanzo/ui in your project
• Understanding the component architecture
• Building responsive layouts
• Customizing themes and styles
• Best practices and performance optimization

Resources:
- Documentation: https://hanzo.ai/docs
- GitHub: https://github.com/hanzoai/ui
- Discord: https://discord.gg/hanzoai

Timestamps:
00:00 Introduction
02:15 Installation and Setup
05:30 Component Overview
08:45 Building Your First Interface
12:00 Advanced Patterns
14:30 Conclusion`
};

const relatedVideos = [
  {
    id: "2",
    title: "Advanced React Patterns",
    channel: "Code Academy",
    thumbnail: "/api/placeholder/320/180",
    duration: "23:15",
    views: "89k",
    publishedAt: "1 week ago"
  },
  {
    id: "3",
    title: "Tailwind CSS Mastery",
    channel: "Design Pro",
    thumbnail: "/api/placeholder/320/180",
    duration: "18:30",
    views: "156k",
    publishedAt: "3 days ago"
  },
  {
    id: "4",
    title: "State Management in 2024",
    channel: "React Weekly",
    thumbnail: "/api/placeholder/320/180",
    duration: "31:45",
    views: "45k",
    publishedAt: "5 days ago"
  },
  {
    id: "5",
    title: "Building a SaaS from Scratch",
    channel: "Startup School",
    thumbnail: "/api/placeholder/320/180",
    duration: "45:20",
    views: "234k",
    publishedAt: "2 weeks ago"
  }
];

const comments = [
  {
    id: "1",
    author: {
      name: "Sarah Chen",
      avatar: "/api/placeholder/32/32"
    },
    content: "This is exactly what I needed! The @hanzo/ui components are so well designed.",
    likes: 42,
    timestamp: "1 day ago",
    replies: 3
  },
  {
    id: "2",
    author: {
      name: "Alex Rivera",
      avatar: "/api/placeholder/32/32"
    },
    content: "Great tutorial! Can you do a video on integrating with Next.js 14?",
    likes: 28,
    timestamp: "2 days ago",
    replies: 1
  },
  {
    id: "3",
    author: {
      name: "Jordan Park",
      avatar: "/api/placeholder/32/32"
    },
    content: "The component library looks amazing. Love the dark mode support!",
    likes: 15,
    timestamp: "2 days ago",
    replies: 0
  }
];

export default function VideoStreaming() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(80);
  const [progress, setProgress] = useState(35);
  const [comment, setComment] = useState("");

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-6">
        <div className="grid grid-cols-12 gap-6">
          {/* Main Content */}
          <div className="col-span-12 lg:col-span-8">
            {/* Video Player */}
            <Card className="overflow-hidden">
              <AspectRatio ratio={16/9}>
                <div className="relative w-full h-full bg-black">
                  {/* Video Placeholder */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <img
                      src="/api/placeholder/1280/720"
                      alt="Video thumbnail"
                      className="w-full h-full object-cover"
                    />
                    {!isPlaying && (
                      <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                        <Button
                          size="icon"
                          className="h-16 w-16 rounded-full bg-[#fd4444] hover:bg-[#e03e3e]"
                          onClick={() => setIsPlaying(true)}
                        >
                          <Play className="w-8 h-8 ml-1" />
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Video Controls */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                    {/* Progress Bar */}
                    <div className="mb-4">
                      <Progress value={progress} className="h-1 bg-white/30" />
                      <div className="flex items-center justify-between mt-1 text-xs text-white">
                        <span>5:32</span>
                        <span>15:42</span>
                      </div>
                    </div>

                    {/* Controls */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="text-white hover:bg-white/20"
                          onClick={() => setIsPlaying(!isPlaying)}
                        >
                          {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                        </Button>
                        <Button size="icon" variant="ghost" className="text-white hover:bg-white/20">
                          <SkipBack className="w-5 h-5" />
                        </Button>
                        <Button size="icon" variant="ghost" className="text-white hover:bg-white/20">
                          <SkipForward className="w-5 h-5" />
                        </Button>
                        <Button size="icon" variant="ghost" className="text-white hover:bg-white/20">
                          <Volume2 className="w-5 h-5" />
                        </Button>
                      </div>
                      <Button size="icon" variant="ghost" className="text-white hover:bg-white/20">
                        <Maximize className="w-5 h-5" />
                      </Button>
                    </div>
                  </div>
                </div>
              </AspectRatio>
            </Card>

            {/* Video Info */}
            <Card className="mt-4">
              <CardHeader>
                <CardTitle>{currentVideo.title}</CardTitle>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Eye className="w-4 h-4" />
                      {currentVideo.views.toLocaleString()} views
                    </span>
                    <span>{currentVideo.publishedAt}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" className="gap-2">
                      <ThumbsUp className="w-4 h-4" />
                      {currentVideo.likes.toLocaleString()}
                    </Button>
                    <Button variant="ghost" className="gap-2">
                      <ThumbsDown className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" className="gap-2">
                      <Share2 className="w-4 h-4" />
                      Share
                    </Button>
                    <Button variant="ghost" className="gap-2">
                      <Download className="w-4 h-4" />
                      Download
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <Avatar>
                      <AvatarImage src={currentVideo.channel.avatar} />
                      <AvatarFallback>HD</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold">{currentVideo.channel.name}</p>
                        {currentVideo.channel.verified && (
                          <Badge variant="outline" className="h-5 px-1 border-[#fd4444] text-[#fd4444]">✓</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {currentVideo.channel.subscribers} subscribers
                      </p>
                    </div>
                    <Button className="bg-gradient-to-r from-[#fd4444] to-[#ff6b6b] hover:from-[#e03e3e] hover:to-[#fd4444]">
                      <Bell className="w-4 h-4 mr-2" />
                      Subscribe
                    </Button>
                  </div>
                </div>

                <Tabs defaultValue="description" className="mt-4">
                  <TabsList>
                    <TabsTrigger value="description">Description</TabsTrigger>
                    <TabsTrigger value="transcript">Transcript</TabsTrigger>
                    <TabsTrigger value="chapters">Chapters</TabsTrigger>
                  </TabsList>
                  <TabsContent value="description" className="mt-4">
                    <div className="whitespace-pre-wrap text-sm">
                      {currentVideo.description}
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            {/* Comments Section */}
            <Card className="mt-4">
              <CardHeader>
                <CardTitle>{comments.length} Comments</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-3 mb-6">
                  <Avatar>
                    <AvatarFallback>U</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <Textarea
                      placeholder="Add a comment..."
                      value={comment}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setComment(e.target.value)}
                      className="min-h-[80px]"
                    />
                    <div className="flex justify-end gap-2 mt-2">
                      <Button variant="ghost" onClick={() => setComment("")}>Cancel</Button>
                      <Button disabled={!comment.trim()} className="bg-[#fd4444] hover:bg-[#e03e3e]">Comment</Button>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  {comments.map(comment => (
                    <div key={comment.id} className="flex gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={comment.author.avatar} />
                        <AvatarFallback>
                          {comment.author.name.split(" ").map(n => n[0]).join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium text-sm">{comment.author.name}</p>
                          <span className="text-xs text-muted-foreground">{comment.timestamp}</span>
                        </div>
                        <p className="text-sm mb-2">{comment.content}</p>
                        <div className="flex items-center gap-4">
                          <Button variant="ghost" size="sm" className="h-auto p-0 gap-1">
                            <ThumbsUp className="w-3 h-3" />
                            {comment.likes}
                          </Button>
                          <Button variant="ghost" size="sm" className="h-auto p-0">
                            <ThumbsDown className="w-3 h-3" />
                          </Button>
                          <Button variant="ghost" size="sm" className="h-auto p-0">
                            Reply
                          </Button>
                        </div>
                        {comment.replies > 0 && (
                          <Button variant="ghost" size="sm" className="mt-2 p-0 text-[#fd4444]">
                            View {comment.replies} replies
                          </Button>
                        )}
                      </div>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - Related Videos */}
          <div className="col-span-12 lg:col-span-4">
            <Card>
              <CardHeader>
                <CardTitle>Related Videos</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[800px]">
                  <div className="space-y-4">
                    {relatedVideos.map(video => (
                      <div key={video.id} className="flex gap-3 cursor-pointer group">
                        <div className="relative">
                          <AspectRatio ratio={16/9} className="w-40">
                            <img
                              src={video.thumbnail}
                              alt={video.title}
                              className="object-cover w-full h-full rounded"
                            />
                          </AspectRatio>
                          <div className="absolute bottom-1 right-1 bg-black/80 text-white text-xs px-1 rounded">
                            {video.duration}
                          </div>
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-sm line-clamp-2 group-hover:text-primary">
                            {video.title}
                          </h4>
                          <p className="text-xs text-muted-foreground mt-1">
                            {video.channel}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                            <span>{video.views} views</span>
                            <span>•</span>
                            <span>{video.publishedAt}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}