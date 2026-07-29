"use client";

import Link from "next/link";
import { Button } from "@hanzo/ui";
import { Badge } from "@hanzo/ui";
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
    <div className="min-h-screen bg-background text-foreground">
      <Header />

      {/* Hero Section */}
      <section className="px-4 md:px-8 py-16 md:py-24 text-center">
        <div className="max-w-4xl mx-auto">
          <Badge className="mb-4 bg-primary text-primary-foreground border-0">
            <BookOpen className="w-4 h-4 mr-2" />
            Hanzo Academy
          </Badge>
          <h1 className="text-4xl md:text-6xl font-medium mb-6">
            Learn to build with AI superpowers
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Free courses, tutorials, and resources to help you master AI development
          </p>
          <div className="flex items-center gap-4 justify-center">
            <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90">
              <PlayCircle className="mr-2 w-5 h-5" />
              Start Learning
            </Button>
            <Button size="lg" variant="outline" className="border-foreground/20 text-foreground hover:bg-accent">
              Browse Courses
            </Button>
          </div>
        </div>
      </section>

      {/* Learning Paths */}
      <section className="px-4 md:px-8 py-12 border-y border-border">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl font-medium mb-8">Popular Learning Paths</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {learningPaths.map(path => (
              <div key={path.title} className="bg-muted hover:bg-accent rounded-2xl p-6 border border-border hover:border-violet-500/50 transition-all cursor-pointer">
                <div className="inline-flex rounded-lg border border-border bg-muted p-2 mb-4">
                  <path.icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-medium mb-2">{path.title}</h3>
                <p className="text-sm text-muted-foreground mb-4">{path.description}</p>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <FileCode className="w-4 h-4" />
                    {path.courses} courses
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {path.duration}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Courses Section */}
      <section className="px-4 md:px-8 py-16">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl md:text-3xl font-medium">All Courses</h2>
            <Button variant="outline" className="border-foreground/20 text-foreground hover:bg-accent">
              <Video className="w-5 h-5 mr-2" />
              Watch Live Classes
            </Button>
          </div>

          {/* Category Filter */}
          <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
                  selectedCategory === cat
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-foreground/70 hover:text-foreground hover:bg-accent border border-border'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Course Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map(course => (
              <div key={course.id} className="bg-muted hover:bg-accent rounded-2xl border border-border overflow-hidden">
                {course.featured && (
                  <div className="bg-gradient-to-r from-violet-500 to-purple-500 text-foreground text-xs px-3 py-1.5 flex items-center gap-1">
                    <Trophy className="w-3 h-3" />
                    Featured Course
                  </div>
                )}
                <div className="p-6">
                  <div className="mb-4">
                    <Badge className="bg-muted text-foreground border-border">
                      {course.level}
                    </Badge>
                  </div>

                  <h3 className="font-medium text-lg mb-2">
                    {course.title}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {course.description}
                  </p>

                  <div className="flex items-center justify-between text-sm text-muted-foreground pt-4 border-t border-border">
                    <span className="flex items-center gap-1">
                      <Video className="w-4 h-4" />
                      {course.lessons} lessons
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {course.duration}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Resources Section */}
      <section className="px-4 md:px-8 py-16 bg-gradient-to-b from-transparent via-violet-950/10 to-transparent">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-medium mb-4">
              Additional Resources
            </h2>
            <p className="text-lg text-muted-foreground">
              Everything you need to succeed
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-muted hover:bg-accent rounded-2xl p-6 border border-border">
              <BookOpen className="w-8 h-8 mb-4 text-violet-400" />
              <h3 className="text-xl font-medium mb-2">Documentation</h3>
              <p className="text-muted-foreground mb-4">Comprehensive guides and API references</p>
              <Link href="/docs" className="text-violet-400 hover:text-violet-300 flex items-center gap-1">
                Explore Docs <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="bg-muted hover:bg-accent rounded-2xl p-6 border border-border">
              <Users className="w-8 h-8 mb-4 text-violet-400" />
              <h3 className="text-xl font-medium mb-2">Community Forum</h3>
              <p className="text-muted-foreground mb-4">Get help and share knowledge with others</p>
              <Link href="/community" className="text-violet-400 hover:text-violet-300 flex items-center gap-1">
                Join Community <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="bg-muted hover:bg-accent rounded-2xl p-6 border border-border">
              <Video className="w-8 h-8 mb-4 text-violet-400" />
              <h3 className="text-xl font-medium mb-2">YouTube Channel</h3>
              <p className="text-muted-foreground mb-4">Video tutorials and live coding sessions</p>
              <a href="https://youtube.com/@hanzoai" className="text-violet-400 hover:text-violet-300 flex items-center gap-1">
                Watch Videos <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-4 md:px-8 py-20 text-center">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-medium mb-6">
            Start your learning journey today
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            Join thousands of developers mastering AI development
          </p>
          <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90">
            Start Free Course
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
        </div>
      </section>
    </div>
  );
}