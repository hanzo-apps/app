"use client";

import { SizableText, YStack, H1, Paragraph, XStack, H2, H3 } from '@hanzo/ui';
// `Anchor` is not on @hanzo/ui's barrel yet — the dts build drops it, the
// same way it drops the GuiElement type. Tracked; everything else in this
// file comes from @hanzo/ui.
import { Anchor } from '@hanzo/gui';
import Link from "next/link";
import { Button, Badge } from '@hanzo/ui';
import { BookOpen, Video, FileCode, Users, Trophy, Clock, ArrowRight, PlayCircle, Code2, Bot, Rocket } from "lucide-react";
import { useState } from "react";
import Header from "@/components/layout/header";

export default function LearnPage() {
  const [selectedCategory, setSelectedCategory] = useState("All");

  const categories = ["All", "Getting Started", "Tutorials", "AI & ML", "Best Practices", "Advanced"];

  const courses = [
    {
      id: "1",
      title: "Build Your First AI App",
      description: "Learn the basics of Hanzo AI and build a complete application from scratch",
      duration: "2 hours",
      level: "Beginner",
      category: "Getting Started",
      lessons: 12,
      featured: true
    },
    {
      id: "2",
      title: "Advanced AI Model Training",
      description: "Deep dive into training custom AI models and fine-tuning for specific use cases",
      duration: "4 hours",
      level: "Advanced",
      category: "AI & ML",
      lessons: 24
    },
    {
      id: "3",
      title: "Building Scalable SaaS Applications",
      description: "Learn how to architect and deploy production-ready SaaS applications",
      duration: "3 hours",
      level: "Intermediate",
      category: "Best Practices",
      lessons: 18
    },
    {
      id: "4",
      title: "Real-time Chat Applications",
      description: "Build interactive chat apps with WebSocket support and AI responses",
      duration: "2.5 hours",
      level: "Intermediate",
      category: "Tutorials",
      lessons: 15
    },
    {
      id: "5",
      title: "Performance Optimization",
      description: "Master techniques for optimizing your Hanzo applications for speed and efficiency",
      duration: "2 hours",
      level: "Advanced",
      category: "Advanced",
      lessons: 10
    },
    {
      id: "6",
      title: "Authentication & Security",
      description: "Implement secure authentication and protect your applications",
      duration: "1.5 hours",
      level: "Intermediate",
      category: "Best Practices",
      lessons: 8,
      featured: true
    }
  ];

  const filteredCourses = selectedCategory === "All"
    ? courses
    : courses.filter(c => c.category === selectedCategory);

  const learningPaths = [
    {
      title: "Full-Stack Developer",
      description: "Master both frontend and backend development",
      courses: 8,
      duration: "24 hours",
      icon: Code2
    },
    {
      title: "AI Engineer",
      description: "Become an expert in AI model development",
      courses: 10,
      duration: "32 hours",
      icon: Bot
    },
    {
      title: "Product Builder",
      description: "Learn to build and launch successful products",
      courses: 6,
      duration: "18 hours",
      icon: Rocket
    }
  ];

  return (
    <YStack minHeight="100%" backgroundColor="$background">
      <Header />

      {/* Hero Section */}
      <YStack paddingHorizontal="$4" paddingVertical="$10" $md={{ paddingHorizontal: "$6", paddingVertical: "$12" }}>
        <YStack maxWidth={896} alignSelf="center">
          <YStack marginBottom="$4">
            <Badge variant="default">
              <BookOpen size={16} />
              Hanzo Academy
            </Badge>
          </YStack>
          <H1 fontSize="$11" fontWeight="500" marginBottom="$5" textAlign="center" $md={{ fontSize: "$13" }} lineHeight="1.1">
            Learn how to build on Hanzo
          </H1>
          <Paragraph fontSize="$7" color="$color11" marginBottom="$6" maxWidth={672} alignSelf="center" textAlign="center" lineHeight="1.4">
            Courses and walk-throughs for the builder, Hanzo Cloud and the API.
          </Paragraph>
          <XStack alignItems="center" gap="$4" justifyContent="center">
            <Button size="lg" backgroundColor="$color5" borderWidth={1} borderColor="$color6" hoverStyle={{ backgroundColor: "$color6" }}>
              <PlayCircle size={20} />
              Start Learning
            </Button>
            <Button size="lg" variant="outline" borderColor="$color" hoverStyle={{ backgroundColor: "$color3" }}>
              Browse Courses
            </Button>
          </XStack>
        </YStack>
      </YStack>

      {/* Learning Paths */}
      <YStack paddingHorizontal="$4" paddingVertical="$8" borderTopWidth={1} borderBottomWidth={1} borderColor="$borderColor" $md={{ paddingHorizontal: "$6" }}>
        <YStack maxWidth={1280} alignSelf="center">
          <H2 fontSize="$8" fontWeight="500" marginBottom="$6">Popular Learning Paths</H2>
          <YStack gap="$5">
            {learningPaths.map(path => (
              <YStack key={path.title} backgroundColor="$color3" borderRadius="$8" padding="$5" borderWidth={1} borderColor="$borderColor" cursor="pointer" hoverStyle={{ backgroundColor: "$color3", borderColor: "$purple9" }}>
                <XStack borderRadius="$5" borderWidth={1} borderColor="$borderColor" backgroundColor="$color3" padding="$2" marginBottom="$4">
                  <path.icon size={24} />
                </XStack>
                <H3 fontSize="$6" fontWeight="500" marginBottom="$2">{path.title}</H3>
                <Paragraph fontSize="$3" color="$color11" marginBottom="$4">{path.description}</Paragraph>
                <XStack alignItems="center" gap="$4">
                  <XStack alignItems="center" gap="$1">
                    <FileCode size={16} />
                    <SizableText fontSize="$3" color="$color11">{path.courses} courses</SizableText>
                  </XStack>
                  <XStack alignItems="center" gap="$1">
                    <Clock size={16} />
                    <SizableText fontSize="$3" color="$color11">{path.duration}</SizableText>
                  </XStack>
                </XStack>
              </YStack>
            ))}
          </YStack>
        </YStack>
      </YStack>

      {/* Courses Section */}
      <YStack paddingHorizontal="$4" paddingVertical="$10" $md={{ paddingHorizontal: "$6" }}>
        <YStack maxWidth={1280} alignSelf="center">
          <XStack alignItems="center" justifyContent="space-between" marginBottom="$6">
            <H2 fontSize="$8" fontWeight="500" $md={{ fontSize: "$10" }} lineHeight="1.1">All Courses</H2>
            <Button variant="outline" borderColor="$color" hoverStyle={{ backgroundColor: "$color3" }}>
              <Video size={20} />
              Watch Live Classes
            </Button>
          </XStack>

          {/* Category Filter */}
          <XStack alignItems="center" gap="$2" marginBottom="$6" paddingBottom="$2" overflow="scroll">
            {categories.map(cat => (
              <Button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                variant={selectedCategory === cat ? "default" : "outline"}
                paddingHorizontal="$4" paddingVertical="$2" borderRadius="$6" style={{ whiteSpace: "nowrap" }}
              >
                {cat}
              </Button>
            ))}
          </XStack>

          {/* Course Grid */}
          <YStack gap="$5">
            {filteredCourses.map(course => (
              <YStack key={course.id} backgroundColor="$color3" borderRadius="$8" borderWidth={1} borderColor="$borderColor" overflow="hidden" hoverStyle={{ backgroundColor: "$color3" }}>
                {course.featured && (
                  <XStack paddingHorizontal="$3" paddingVertical="$1.5" alignItems="center" gap="$1">
                    <Trophy size={12} />
                    <SizableText color="$color" fontSize="$1">Featured Course</SizableText>
                  </XStack>
                )}
                <YStack padding="$5">
                  <YStack marginBottom="$4">
                    <Badge variant="secondary">
                      {course.level}
                    </Badge>
                  </YStack>

                  <H3 fontWeight="500" fontSize="$6" marginBottom="$2">
                    {course.title}
                  </H3>
                  <Paragraph fontSize="$3" color="$color11" marginBottom="$4">
                    {course.description}
                  </Paragraph>

                  <XStack alignItems="center" justifyContent="space-between" paddingTop="$4" borderTopWidth={1} borderColor="$borderColor">
                    <XStack alignItems="center" gap="$1">
                      <Video size={16} />
                      <SizableText fontSize="$3" color="$color11">{course.lessons} lessons</SizableText>
                    </XStack>
                    <XStack alignItems="center" gap="$1">
                      <Clock size={16} />
                      <SizableText fontSize="$3" color="$color11">{course.duration}</SizableText>
                    </XStack>
                  </XStack>
                </YStack>
              </YStack>
            ))}
          </YStack>
        </YStack>
      </YStack>

      {/* Resources Section */}
      <YStack paddingHorizontal="$4" paddingVertical="$10" $md={{ paddingHorizontal: "$6" }}>
        <YStack maxWidth={1280} alignSelf="center">
          <YStack marginBottom="$8">
            <H2 fontSize="$10" fontWeight="500" marginBottom="$4" textAlign="center" $md={{ fontSize: "$11" }} lineHeight="1.1">
              Where else to look
            </H2>
            <Paragraph fontSize="$6" color="$color11" textAlign="center">
              The docs, the community, and the videos.
            </Paragraph>
          </YStack>
          <YStack gap="$5">
            <YStack backgroundColor="$color3" borderRadius="$8" padding="$5" borderWidth={1} borderColor="$borderColor" hoverStyle={{ backgroundColor: "$color3" }}>
              <BookOpen size={32} />
              <H3 fontSize="$7" fontWeight="500" marginBottom="$2">Documentation</H3>
              <Paragraph color="$color11" marginBottom="$4">Guides and the API reference</Paragraph>
              <Link href="/docs"><SizableText color="$purple8" hoverStyle={{ color: "$purple4" }}>
                Explore Docs <ArrowRight size={16} />
              </SizableText></Link>
            </YStack>
            <YStack backgroundColor="$color3" borderRadius="$8" padding="$5" borderWidth={1} borderColor="$borderColor" hoverStyle={{ backgroundColor: "$color3" }}>
              <Users size={32} />
              <H3 fontSize="$7" fontWeight="500" marginBottom="$2">Community Forum</H3>
              <Paragraph color="$color11" marginBottom="$4">Get help and share knowledge with others</Paragraph>
              <Link href="/community"><SizableText color="$purple8" hoverStyle={{ color: "$purple4" }}>
                Join Community <ArrowRight size={16} />
              </SizableText></Link>
            </YStack>
            <YStack backgroundColor="$color3" borderRadius="$8" padding="$5" borderWidth={1} borderColor="$borderColor" hoverStyle={{ backgroundColor: "$color3" }}>
              <Video size={32} />
              <H3 fontSize="$7" fontWeight="500" marginBottom="$2">YouTube Channel</H3>
              <Paragraph color="$color11" marginBottom="$4">Video tutorials and live coding sessions</Paragraph>
              <Anchor href="https://youtube.com/@hanzoai" color="$purple8" display="flex" alignItems="center" gap="$1" hoverStyle={{ color: "$purple4" }}>
                Watch Videos <ArrowRight size={16} />
              </Anchor>
            </YStack>
          </YStack>
        </YStack>
      </YStack>

      {/* CTA Section */}
      <YStack paddingHorizontal="$4" paddingVertical="$11" $md={{ paddingHorizontal: "$6" }}>
        <YStack maxWidth={896} alignSelf="center">
          <H2 fontSize="$10" fontWeight="500" marginBottom="$5" textAlign="center" $md={{ fontSize: "$11" }} lineHeight="1.1">
            Read one, then go and build something
          </H2>
          <Paragraph fontSize="$7" color="$color11" marginBottom="$6" textAlign="center" lineHeight="1.4">
            The courses assume nothing. Open the first one and follow along in the builder.
          </Paragraph>
          <Button size="lg" backgroundColor="$color5" borderWidth={1} borderColor="$color6" hoverStyle={{ backgroundColor: "$color6" }}>
            Start Free Course
            <ArrowRight size={20} />
          </Button>
        </YStack>
      </YStack>
    </YStack>
  );
}