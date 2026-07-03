"use client";

import Link from "next/link";
import { Button } from "@hanzo/ui";
import { HanzoLogo } from "@/components/HanzoLogo";
import { Badge } from "@hanzo/ui";
import { BookOpen, Video, FileCode, Users, Trophy, Clock, ArrowRight, PlayCircle, Star } from "lucide-react";
import { useState } from "react";

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
      students: 5420,
      rating: 4.9,
      featured: true,
      instructor: "Sarah Chen",
      instructorAvatar: "👩‍💻"
    },
    {
      id: "2",
      title: "Advanced AI Model Training",
      description: "Deep dive into training custom AI models and fine-tuning for specific use cases",
      duration: "4 hours",
      level: "Advanced",
      category: "AI & ML",
      lessons: 24,
      students: 2890,
      rating: 4.8,
      instructor: "Dr. Alex Kim",
      instructorAvatar: "👨‍🔬"
    },
    {
      id: "3",
      title: "Building Scalable SaaS Applications",
      description: "Learn how to architect and deploy production-ready SaaS applications",
      duration: "3 hours",
      level: "Intermediate",
      category: "Best Practices",
      lessons: 18,
      students: 3567,
      rating: 4.9,
      instructor: "Mike Johnson",
      instructorAvatar: "🧑‍💼"
    },
    {
      id: "4",
      title: "Real-time Chat Applications",
      description: "Build interactive chat apps with WebSocket support and AI responses",
      duration: "2.5 hours",
      level: "Intermediate",
      category: "Tutorials",
      lessons: 15,
      students: 4123,
      rating: 4.7,
      instructor: "Emma Davis",
      instructorAvatar: "👩‍🎨"
    },
    {
      id: "5",
      title: "Performance Optimization",
      description: "Master techniques for optimizing your Hanzo applications for speed and efficiency",
      duration: "2 hours",
      level: "Advanced",
      category: "Advanced",
      lessons: 10,
      students: 1890,
      rating: 4.8,
      instructor: "Tom Wilson",
      instructorAvatar: "🚀"
    },
    {
      id: "6",
      title: "Authentication & Security",
      description: "Implement secure authentication and protect your applications",
      duration: "1.5 hours",
      level: "Intermediate",
      category: "Best Practices",
      lessons: 8,
      students: 2456,
      rating: 4.9,
      featured: true,
      instructor: "Lisa Park",
      instructorAvatar: "🔐"
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
      icon: "💻"
    },
    {
      title: "AI Engineer",
      description: "Become an expert in AI model development",
      courses: 10,
      duration: "32 hours",
      icon: "🤖"
    },
    {
      title: "Product Builder",
      description: "Learn to build and launch successful products",
      courses: 6,
      duration: "18 hours",
      icon: "🚀"
    }
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Navigation */}
      <nav className="border-b border-white/10 sticky top-0 bg-[#0a0a0a]/80 backdrop-blur-xl z-50">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2.5">
              <HanzoLogo className="w-8 h-8 text-white" />
              <span className="text-xl font-bold">Hanzo</span>
            </Link>
            <div className="hidden md:flex items-center gap-6">
              <Link href="/community" className="text-white/70 hover:text-white">Community</Link>
              <Link href="/pricing" className="text-white/70 hover:text-white">Pricing</Link>
              <Link href="/enterprise" className="text-white/70 hover:text-white">Enterprise</Link>
              <Link href="/learn" className="text-white font-medium">Learn</Link>
            </div>
          </div>
          <Button className="bg-white text-black hover:bg-white/90">
            Get Started
          </Button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="px-4 md:px-8 py-16 md:py-24 text-center">
        <div className="max-w-4xl mx-auto">
          <Badge className="mb-4 bg-gradient-to-r from-violet-600 to-purple-600 text-white border-0">
            <BookOpen className="w-4 h-4 mr-2" />
            Hanzo Academy
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Learn to build with{" "}
            <span className="bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">
              AI superpowers
            </span>
          </h1>
          <p className="text-xl text-white/60 mb-8 max-w-2xl mx-auto">
            Free courses, tutorials, and resources to help you master AI development
          </p>
          <div className="flex items-center gap-4 justify-center">
            <Button size="lg" className="bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-400 hover:to-purple-400">
              <PlayCircle className="mr-2 w-5 h-5" />
              Start Learning
            </Button>
            <Button size="lg" variant="outline" className="border-white/20 text-white hover:bg-white/10">
              Browse Courses
            </Button>
          </div>
        </div>
      </section>

      {/* Learning Paths */}
      <section className="px-4 md:px-8 py-12 border-y border-white/10">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl font-bold mb-8">Popular Learning Paths</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {learningPaths.map(path => (
              <div key={path.title} className="bg-[#1a1a1a] rounded-2xl p-6 border border-white/10 hover:border-violet-500/50 transition-all cursor-pointer">
                <div className="text-3xl mb-4">{path.icon}</div>
                <h3 className="text-lg font-semibold mb-2">{path.title}</h3>
                <p className="text-sm text-white/60 mb-4">{path.description}</p>
                <div className="flex items-center gap-4 text-sm text-white/40">
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
            <h2 className="text-2xl md:text-3xl font-bold">All Courses</h2>
            <Button variant="outline" className="border-white/20 text-white hover:bg-white/10">
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
                    ? 'bg-white text-black'
                    : 'bg-white/5 text-white/70 hover:text-white hover:bg-white/10 border border-white/10'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Course Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map(course => (
              <div key={course.id} className="bg-[#1a1a1a] rounded-2xl border border-white/10 hover:border-violet-500/50 transition-all overflow-hidden group cursor-pointer">
                {course.featured && (
                  <div className="bg-gradient-to-r from-violet-500 to-purple-500 text-white text-xs px-3 py-1.5 flex items-center gap-1">
                    <Trophy className="w-3 h-3" />
                    Featured Course
                  </div>
                )}
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <Badge className={`
                      ${course.level === "Beginner" ? "bg-green-500/20 text-green-400 border-green-500/30" :
                        course.level === "Intermediate" ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" :
                        "bg-red-500/20 text-red-400 border-red-500/30"}
                    `}>
                      {course.level}
                    </Badge>
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-400 fill-current" />
                      <span className="text-sm text-white/60">{course.rating}</span>
                    </div>
                  </div>

                  <h3 className="font-semibold text-lg mb-2 group-hover:text-violet-400 transition-colors">
                    {course.title}
                  </h3>
                  <p className="text-sm text-white/60 mb-4">
                    {course.description}
                  </p>

                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center">
                      <span className="text-xs">{course.instructorAvatar}</span>
                    </div>
                    <span className="text-sm text-white/50">{course.instructor}</span>
                  </div>

                  <div className="flex items-center justify-between text-sm text-white/40 pt-4 border-t border-white/10">
                    <span className="flex items-center gap-1">
                      <Video className="w-4 h-4" />
                      {course.lessons} lessons
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {course.duration}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {course.students.toLocaleString()}
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
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Additional Resources
            </h2>
            <p className="text-lg text-white/60">
              Everything you need to succeed
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-[#1a1a1a] rounded-2xl p-6 border border-white/10">
              <BookOpen className="w-8 h-8 mb-4 text-violet-400" />
              <h3 className="text-xl font-semibold mb-2">Documentation</h3>
              <p className="text-white/60 mb-4">Comprehensive guides and API references</p>
              <Link href="/docs" className="text-violet-400 hover:text-violet-300 flex items-center gap-1">
                Explore Docs <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="bg-[#1a1a1a] rounded-2xl p-6 border border-white/10">
              <Users className="w-8 h-8 mb-4 text-violet-400" />
              <h3 className="text-xl font-semibold mb-2">Community Forum</h3>
              <p className="text-white/60 mb-4">Get help and share knowledge with others</p>
              <Link href="/community" className="text-violet-400 hover:text-violet-300 flex items-center gap-1">
                Join Community <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="bg-[#1a1a1a] rounded-2xl p-6 border border-white/10">
              <Video className="w-8 h-8 mb-4 text-violet-400" />
              <h3 className="text-xl font-semibold mb-2">YouTube Channel</h3>
              <p className="text-white/60 mb-4">Video tutorials and live coding sessions</p>
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
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Start your learning journey today
          </h2>
          <p className="text-xl text-white/60 mb-8">
            Join thousands of developers mastering AI development
          </p>
          <Button size="lg" className="bg-white text-black hover:bg-white/90">
            Start Free Course
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
        </div>
      </section>
    </div>
  );
}