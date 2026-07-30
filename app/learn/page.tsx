"use client";

import { SizableText, YStack, H1, Paragraph, XStack, H2, H3, Anchor } from '@hanzo/gui';
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
    <SizableText minHeight="100%" backgroundColor="$background" color="$color" display="flex" flexDirection="column">
      <Header />

      {/* Hero Section */}
      <SizableText paddingHorizontal="$4" paddingVertical="$10" textAlign="center" display="flex" flexDirection="column" $md={{ paddingHorizontal: "$6", paddingVertical: "$12" }}>
        <YStack maxWidth={896} alignSelf="center">
          <Badge marginBottom="$4" backgroundColor="$color12" color="$background" borderWidth={0}>
            <BookOpen size={16} />
            Hanzo Academy
          </Badge>
          <H1 fontSize="$11" fontWeight="500" marginBottom="$5" $md={{ fontSize: "$13" }}>
            Learn to build with AI superpowers
          </H1>
          <Paragraph fontSize="$7" color="$color11" marginBottom="$6" maxWidth={672} alignSelf="center">
            Free courses, tutorials, and resources to help you master AI development
          </Paragraph>
          <XStack alignItems="center" gap="$4" justifyContent="center">
            <Button size="lg" backgroundColor="$color12" color="$background" hoverStyle={{ backgroundColor: "$color12" }}>
              <PlayCircle size={20} />
              Start Learning
            </Button>
            <Button size="lg" variant="outline" borderColor="$color" color="$color" hoverStyle={{ backgroundColor: "$color3" }}>
              Browse Courses
            </Button>
          </XStack>
        </YStack>
      </SizableText>

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
                <SizableText alignItems="center" gap="$4" fontSize="$3" color="$color11" display="flex" flexDirection="row">
                  <SizableText alignItems="center" gap="$1">
                    <FileCode size={16} />
                    {path.courses} courses
                  </SizableText>
                  <SizableText alignItems="center" gap="$1">
                    <Clock size={16} />
                    {path.duration}
                  </SizableText>
                </SizableText>
              </YStack>
            ))}
          </YStack>
        </YStack>
      </YStack>

      {/* Courses Section */}
      <YStack paddingHorizontal="$4" paddingVertical="$10" $md={{ paddingHorizontal: "$6" }}>
        <YStack maxWidth={1280} alignSelf="center">
          <XStack alignItems="center" justifyContent="space-between" marginBottom="$6">
            <H2 fontSize="$8" fontWeight="500" $md={{ fontSize: "$10" }}>All Courses</H2>
            <Button variant="outline" borderColor="$color" color="$color" hoverStyle={{ backgroundColor: "$color3" }}>
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
                paddingHorizontal="$4" paddingVertical="$2" borderRadius="$6" fontSize="$3" fontWeight="500" whiteSpace="nowrap" {...{ backgroundColor: selectedCategory === cat ? "$color12" : "$color3", color: selectedCategory === cat ? "$background" : "$color", borderWidth: selectedCategory === cat ? undefined : 1, borderColor: selectedCategory === cat ? undefined : "$borderColor", hoverStyle: selectedCategory === cat ? undefined : {"color":"$color","backgroundColor":"$color3"} }}
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
                  <SizableText color="$color" fontSize="$1" paddingHorizontal="$3" paddingVertical="$1.5" alignItems="center" gap="$1" display="flex" flexDirection="row">
                    <Trophy size={12} />
                    Featured Course
                  </SizableText>
                )}
                <YStack padding="$5">
                  <YStack marginBottom="$4">
                    <Badge backgroundColor="$color3" color="$color" borderColor="$borderColor">
                      {course.level}
                    </Badge>
                  </YStack>

                  <H3 fontWeight="500" fontSize="$6" marginBottom="$2">
                    {course.title}
                  </H3>
                  <Paragraph fontSize="$3" color="$color11" marginBottom="$4">
                    {course.description}
                  </Paragraph>

                  <SizableText alignItems="center" justifyContent="space-between" fontSize="$3" color="$color11" paddingTop="$4" borderTopWidth={1} borderColor="$borderColor" display="flex" flexDirection="row">
                    <SizableText alignItems="center" gap="$1">
                      <Video size={16} />
                      {course.lessons} lessons
                    </SizableText>
                    <SizableText alignItems="center" gap="$1">
                      <Clock size={16} />
                      {course.duration}
                    </SizableText>
                  </SizableText>
                </YStack>
              </YStack>
            ))}
          </YStack>
        </YStack>
      </YStack>

      {/* Resources Section */}
      <YStack paddingHorizontal="$4" paddingVertical="$10" $md={{ paddingHorizontal: "$6" }}>
        <YStack maxWidth={1280} alignSelf="center">
          <SizableText textAlign="center" marginBottom="$8" display="flex" flexDirection="column">
            <H2 fontSize="$10" fontWeight="500" marginBottom="$4" $md={{ fontSize: "$11" }}>
              Additional Resources
            </H2>
            <Paragraph fontSize="$6" color="$color11">
              Everything you need to succeed
            </Paragraph>
          </SizableText>
          <YStack gap="$5">
            <YStack backgroundColor="$color3" borderRadius="$8" padding="$5" borderWidth={1} borderColor="$borderColor" hoverStyle={{ backgroundColor: "$color3" }}>
              <BookOpen size={32} color="$purple8" />
              <H3 fontSize="$7" fontWeight="500" marginBottom="$2">Documentation</H3>
              <Paragraph color="$color11" marginBottom="$4">Comprehensive guides and API references</Paragraph>
              <Link href="/docs"><SizableText color="$purple8" alignItems="center" gap="$1" hoverStyle={{ color: "$purple4" }}>
                Explore Docs <ArrowRight size={16} />
              </SizableText></Link>
            </YStack>
            <YStack backgroundColor="$color3" borderRadius="$8" padding="$5" borderWidth={1} borderColor="$borderColor" hoverStyle={{ backgroundColor: "$color3" }}>
              <Users size={32} color="$purple8" />
              <H3 fontSize="$7" fontWeight="500" marginBottom="$2">Community Forum</H3>
              <Paragraph color="$color11" marginBottom="$4">Get help and share knowledge with others</Paragraph>
              <Link href="/community"><SizableText color="$purple8" alignItems="center" gap="$1" hoverStyle={{ color: "$purple4" }}>
                Join Community <ArrowRight size={16} />
              </SizableText></Link>
            </YStack>
            <YStack backgroundColor="$color3" borderRadius="$8" padding="$5" borderWidth={1} borderColor="$borderColor" hoverStyle={{ backgroundColor: "$color3" }}>
              <Video size={32} color="$purple8" />
              <H3 fontSize="$7" fontWeight="500" marginBottom="$2">YouTube Channel</H3>
              <Paragraph color="$color11" marginBottom="$4">Video tutorials and live coding sessions</Paragraph>
              <Anchor href="https://youtube.com/@hanzoai" color="$purple8" alignItems="center" gap="$1" hoverStyle={{ color: "$purple4" }}>
                Watch Videos <ArrowRight size={16} />
              </Anchor>
            </YStack>
          </YStack>
        </YStack>
      </YStack>

      {/* CTA Section */}
      <SizableText paddingHorizontal="$4" paddingVertical="$11" textAlign="center" display="flex" flexDirection="column" $md={{ paddingHorizontal: "$6" }}>
        <YStack maxWidth={896} alignSelf="center">
          <H2 fontSize="$10" fontWeight="500" marginBottom="$5" $md={{ fontSize: "$11" }}>
            Start your learning journey today
          </H2>
          <Paragraph fontSize="$7" color="$color11" marginBottom="$6">
            Join thousands of developers mastering AI development
          </Paragraph>
          <Button size="lg" backgroundColor="$color12" color="$background" hoverStyle={{ backgroundColor: "$color12" }}>
            Start Free Course
            <ArrowRight size={20} />
          </Button>
        </YStack>
      </SizableText>
    </SizableText>
  );
}