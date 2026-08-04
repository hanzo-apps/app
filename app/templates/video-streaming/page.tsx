"use client";

import { YStack, XStack, Image, SizableText, Paragraph, H4 } from '@hanzo/gui';
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, Button, Badge, Avatar, AvatarFallback, AvatarImage, AspectRatio, ScrollArea, Tabs, TabsContent, TabsList, TabsTrigger, Textarea, Progress } from '@hanzo/ui';
import { Play, Pause, SkipForward, SkipBack, Volume2, Maximize, ThumbsUp, ThumbsDown, Share2, Download, Bell, MoreVertical, Eye } from "lucide-react";

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
    <YStack minHeight="100%" backgroundColor="$background">
      <YStack width="100%" maxWidth={1280} alignSelf="center" paddingHorizontal="$5" paddingVertical="$5">
        <YStack gap="$5">
          {/* Main Content */}
          <YStack>
            {/* Video Player */}
            <Card overflow="hidden">
              <AspectRatio ratio={16/9}>
                <YStack position="relative" width="100%" height="100%" backgroundColor="black">
                  {/* Video Placeholder */}
                  <XStack position="absolute" top={0} right={0} bottom={0} left={0} alignItems="center" justifyContent="center">
                    <Image
                      src="/api/placeholder/1280/720"
                      alt="Video thumbnail"
                      width="100%" height="100%" objectFit="cover"
  />
                    {!isPlaying && (
                      <XStack position="absolute" top={0} right={0} bottom={0} left={0} backgroundColor="black" alignItems="center" justifyContent="center">
                        <Button
                          size="icon"
                          height="$10" width="$10" borderRadius="$10" backgroundColor="#171717" hoverStyle={{ backgroundColor: "#000000" }}
                          onClick={() => setIsPlaying(true)}
                        >
                          <Play size={32} />
                        </Button>
                      </XStack>
                    )}
                  </XStack>

                  {/* Video Controls */}
                  <YStack position="absolute" bottom="$0" left="$0" right="$0" padding="$4">
                    {/* Progress Bar */}
                    <YStack marginBottom="$4">
                      <Progress value={progress} height="$1" backgroundColor="white" />
                      <XStack alignItems="center" justifyContent="space-between" marginTop="$1">
                        <SizableText fontSize="$1" color="white">5:32</SizableText>
                        <SizableText fontSize="$1" color="white">15:42</SizableText>
                      </XStack>
                    </YStack>

                    {/* Controls */}
                    <XStack alignItems="center" justifyContent="space-between">
                      <XStack alignItems="center" gap="$2">
                        <Button
                          size="icon"
                          variant="ghost"
                          hoverStyle={{ backgroundColor: "white" }}
                          onClick={() => setIsPlaying(!isPlaying)}
                        >
                          <SizableText color="white">{isPlaying ? <Pause size={20} /> : <Play size={20} />}</SizableText>
                        </Button>
                        <Button size="icon" variant="ghost" hoverStyle={{ backgroundColor: "white" }}>
                          <SizableText color="white"><SkipBack size={20} /></SizableText>
                        </Button>
                        <Button size="icon" variant="ghost" hoverStyle={{ backgroundColor: "white" }}>
                          <SizableText color="white"><SkipForward size={20} /></SizableText>
                        </Button>
                        <Button size="icon" variant="ghost" hoverStyle={{ backgroundColor: "white" }}>
                          <SizableText color="white"><Volume2 size={20} /></SizableText>
                        </Button>
                      </XStack>
                      <Button size="icon" variant="ghost" hoverStyle={{ backgroundColor: "white" }}>
                        <SizableText color="white"><Maximize size={20} /></SizableText>
                      </Button>
                    </XStack>
                  </YStack>
                </YStack>
              </AspectRatio>
            </Card>

            {/* Video Info */}
            <Card marginTop="$4">
              <CardHeader>
                <CardTitle>{currentVideo.title}</CardTitle>
                <XStack alignItems="center" justifyContent="space-between">
                  <XStack alignItems="center" gap="$4">
                    <XStack alignItems="center" gap="$1">
                      <Eye size={16} />
                      <SizableText fontSize="$3" color="$color11">
                        {currentVideo.views.toLocaleString()} views
                      </SizableText>
                    </XStack>
                    <SizableText fontSize="$3" color="$color11">{currentVideo.publishedAt}</SizableText>
                  </XStack>
                  <XStack alignItems="center" gap="$2">
                    <Button variant="ghost" gap="$2">
                      <ThumbsUp size={16} />
                      {currentVideo.likes.toLocaleString()}
                    </Button>
                    <Button variant="ghost" gap="$2">
                      <ThumbsDown size={16} />
                    </Button>
                    <Button variant="ghost" gap="$2">
                      <Share2 size={16} />
                      Share
                    </Button>
                    <Button variant="ghost" gap="$2">
                      <Download size={16} />
                      Download
                    </Button>
                  </XStack>
                </XStack>
              </CardHeader>
              <CardContent>
                <XStack alignItems="center" justifyContent="space-between" marginBottom="$4">
                  <XStack alignItems="center" gap="$4">
                    <Avatar>
                      <AvatarImage src={currentVideo.channel.avatar} />
                      <AvatarFallback>HD</AvatarFallback>
                    </Avatar>
                    <div>
                      <XStack alignItems="center" gap="$2">
                        <Paragraph fontWeight="500">{currentVideo.channel.name}</Paragraph>
                        {currentVideo.channel.verified && (
                          <Badge variant="outline">✓</Badge>
                        )}
                      </XStack>
                      <Paragraph fontSize="$3" color="$color11">
                        {currentVideo.channel.subscribers} subscribers
                      </Paragraph>
                    </div>
                    <Button>
                      <Bell size={16} />
                      Subscribe
                    </Button>
                  </XStack>
                </XStack>

                <Tabs defaultValue="description" marginTop="$4">
                  <TabsList>
                    <TabsTrigger value="description">Description</TabsTrigger>
                    <TabsTrigger value="transcript">Transcript</TabsTrigger>
                    <TabsTrigger value="chapters">Chapters</TabsTrigger>
                  </TabsList>
                  <TabsContent value="description" marginTop="$4">
                    <YStack>
                      <SizableText whiteSpace="pre-wrap" fontSize="$3">
                        {currentVideo.description}
                      </SizableText>
                    </YStack>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            {/* Comments Section */}
            <Card marginTop="$4">
              <CardHeader>
                <CardTitle>{comments.length} Comments</CardTitle>
              </CardHeader>
              <CardContent>
                <XStack gap="$3" marginBottom="$5">
                  <Avatar>
                    <AvatarFallback>U</AvatarFallback>
                  </Avatar>
                  <YStack flex={1}>
                    <Textarea
                      placeholder="Add a comment..."
                      value={comment}
                      onChangeText={(t) => setComment(t)}
                      minHeight={80}
  />
                    <XStack justifyContent="flex-end" gap="$2" marginTop="$2">
                      <Button variant="ghost" onClick={() => setComment("")}>Cancel</Button>
                      <Button disabled={!comment.trim()} backgroundColor="$color12" hoverStyle={{ backgroundColor: "$color12" }}>Comment</Button>
                    </XStack>
                  </YStack>
                </XStack>

                <YStack rowGap="$4">
                  {comments.map(comment => (
                    <XStack key={comment.id} gap="$3">
                      <Avatar height="$6" width="$6">
                        <AvatarImage src={comment.author.avatar} />
                        <AvatarFallback>
                          {comment.author.name.split(" ").map(n => n[0]).join("")}
                        </AvatarFallback>
                      </Avatar>
                      <YStack flex={1}>
                        <XStack alignItems="center" gap="$2" marginBottom="$1">
                          <Paragraph fontWeight="500" fontSize="$3">{comment.author.name}</Paragraph>
                          <SizableText fontSize="$1" color="$color11">{comment.timestamp}</SizableText>
                        </XStack>
                        <Paragraph fontSize="$3" marginBottom="$2">{comment.content}</Paragraph>
                        <XStack alignItems="center" gap="$4">
                          <Button variant="ghost" size="sm" height="auto" padding="$0" gap="$1">
                            <ThumbsUp size={12} />
                            {comment.likes}
                          </Button>
                          <Button variant="ghost" size="sm" height="auto" padding="$0">
                            <ThumbsDown size={12} />
                          </Button>
                          <Button variant="ghost" size="sm" height="auto" padding="$0">
                            Reply
                          </Button>
                        </XStack>
                        {comment.replies > 0 && (
                          <Button variant="ghost" size="sm" marginTop="$2" padding="$0">
                            View {comment.replies} replies
                          </Button>
                        )}
                      </YStack>
                      <Button variant="ghost" size="icon">
                        <MoreVertical size={16} />
                      </Button>
                    </XStack>
                  ))}
                </YStack>
              </CardContent>
            </Card>
          </YStack>

          {/* Sidebar - Related Videos */}
          <YStack>
            <Card>
              <CardHeader>
                <CardTitle>Related Videos</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea height={800}>
                  <YStack rowGap="$4">
                    {relatedVideos.map(video => (
                      <XStack key={video.id} gap="$3" cursor="pointer" group>
                        <YStack position="relative">
                          <AspectRatio ratio={16/9} width="$17">
                            <Image
                              src={video.thumbnail}
                              alt={video.title}
                              objectFit="cover" width="100%" height="100%" borderRadius="$2"
  />
                          </AspectRatio>
                          <YStack position="absolute" bottom="$1" right="$1" backgroundColor="black" paddingHorizontal="$1" borderRadius="$2">
                            <SizableText color="white" fontSize="$1">{video.duration}</SizableText>
                          </YStack>
                        </YStack>
                        <YStack flex={1}>
                          <H4 fontWeight="500" fontSize="$3" numberOfLines={2} $group-hover={{ color: "$color12" }}>
                            {video.title}
                          </H4>
                          <Paragraph fontSize="$1" color="$color11" marginTop="$1">
                            {video.channel}
                          </Paragraph>
                          <XStack alignItems="center" gap="$2" marginTop="$1">
                            <SizableText fontSize="$1" color="$color11">{video.views} views</SizableText>
                            <SizableText fontSize="$1" color="$color11">•</SizableText>
                            <SizableText fontSize="$1" color="$color11">{video.publishedAt}</SizableText>
                          </XStack>
                        </YStack>
                      </XStack>
                    ))}
                  </YStack>
                </ScrollArea>
              </CardContent>
            </Card>
          </YStack>
        </YStack>
      </YStack>
    </YStack>
  );
}