'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { HanzoLogo } from '@/components/HanzoLogo';
import { Button } from "@hanzo/ui";
import { Loader2, Sparkles, ArrowRight, Monitor, Apple, Terminal, Smartphone, Zap } from 'lucide-react';

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [currentIdea, setCurrentIdea] = useState(0);
  const [isTyping, setIsTyping] = useState(true);

  // Animated ideas/prompts
  const ideas = [
    "Build a SaaS dashboard with real-time analytics",
    "Create an AI-powered chat application",
    "Design a modern e-commerce platform",
    "Develop a social media scheduler with AI",
    "Build a cryptocurrency trading dashboard",
    "Create a video streaming platform like Netflix",
    "Design a project management tool with AI insights",
    "Build a marketplace for digital products",
    "Create a learning management system",
    "Develop a fitness tracking app with AI coach"
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setIsTyping(false);
      setTimeout(() => {
        setCurrentIdea((prev) => (prev + 1) % ideas.length);
        setIsTyping(true);
      }, 500);
    }, 4000);

    return () => clearInterval(interval);
  }, [ideas.length]);

  const handleHuggingFaceLogin = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/auth/login');
      const data = await response.json();

      if (data.url) {
        console.log('Auth URL received:', data.url);
        window.location.href = data.url;
      } else {
        console.error('No auth URL received');
        setLoading(false);
      }
    } catch (error) {
      console.error('Login error:', error);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Navigation */}
      <nav className="absolute top-0 left-0 right-0 z-50">
        <div className="max-w-[1400px] mx-auto px-6 py-5 flex items-center justify-between">
          <Link href="/" className="flex items-center">
            <HanzoLogo className="w-8 h-8 text-white" />
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/signup">
              <Button variant="outline" className="border-white/30 text-white hover:bg-white/10 hover:border-white/50">
                Sign up
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="min-h-screen flex">
        {/* Left Side - Login Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-20">
          <div className="w-full max-w-md">
            {/* Main Card */}
            <div className="text-center mb-12">
              <h1 className="text-5xl font-bold mb-4 tracking-tight">Welcome back</h1>
              <p className="text-white/50 text-lg">Sign in to continue building</p>
            </div>

            {/* Login Options */}
            <div className="space-y-4">
              {/* Hugging Face Login Button */}
              <Button
                onClick={handleHuggingFaceLogin}
                disabled={loading}
                className="w-full bg-white text-black hover:bg-white/90 h-12 font-medium relative group"
                size="lg"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
                      <circle cx="9" cy="10" r="1.5"/>
                      <circle cx="15" cy="10" r="1.5"/>
                      <path d="M8 15c0 2.21 1.79 4 4 4s4-1.79 4-4"/>
                    </svg>
                    Continue with Hugging Face
                    <ArrowRight className="w-4 h-4 ml-auto opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                  </>
                )}
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/10"></div>
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-black px-4 text-white/40">or</span>
                </div>
              </div>

              {/* Desktop App Options */}
              <div className="space-y-4 pt-2">
                <p className="text-sm text-white/40 text-center">Or run locally without login</p>

                <div className="grid grid-cols-2 gap-3">
                  <a
                    href="https://github.com/hanzoai/app/releases/latest"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 p-3.5 bg-white/[0.02] hover:bg-white/[0.06] rounded-xl border border-white/[0.06] transition-all group"
                  >
                    <Monitor className="w-4 h-4 text-white/40 group-hover:text-white/60" />
                    <span className="text-sm text-white/60 group-hover:text-white/80">Windows</span>
                  </a>

                  <a
                    href="https://github.com/hanzoai/app/releases/latest"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 p-3.5 bg-white/[0.02] hover:bg-white/[0.06] rounded-xl border border-white/[0.06] transition-all group"
                  >
                    <Apple className="w-4 h-4 text-white/40 group-hover:text-white/60" />
                    <span className="text-sm text-white/60 group-hover:text-white/80">macOS</span>
                  </a>

                  <a
                    href="https://github.com/hanzoai/app/releases/latest"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 p-3.5 bg-white/[0.02] hover:bg-white/[0.06] rounded-xl border border-white/[0.06] transition-all group"
                  >
                    <Terminal className="w-4 h-4 text-white/40 group-hover:text-white/60" />
                    <span className="text-sm text-white/60 group-hover:text-white/80">Linux</span>
                  </a>

                  <div className="flex items-center justify-center gap-2 p-3.5 bg-white/[0.02] rounded-xl border border-white/[0.06] opacity-40 cursor-not-allowed">
                    <Smartphone className="w-4 h-4 text-white/30" />
                    <span className="text-sm text-white/40">Mobile</span>
                  </div>
                </div>

                <p className="text-xs text-white/30 text-center">
                  Mobile coming soon • Local AI models included
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-12 text-center">
              <p className="text-sm text-white/40">
                Don&apos;t have an account?{' '}
                <Link href="/signup" className="text-white hover:text-white/80 underline underline-offset-4">
                  Sign up
                </Link>
              </p>
            </div>
          </div>
        </div>

        {/* Right Side - Animated Ideas */}
        <div className="hidden lg:flex w-1/2 items-center justify-center px-6 py-20 bg-gradient-to-br from-gray-900 via-black to-gray-900 relative overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-20">
            <div className="absolute inset-0" style={{
              backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 1px)`,
              backgroundSize: '40px 40px'
            }} />
          </div>

          {/* Animated Gradient Orbs */}
          <div className="absolute top-1/4 -right-32 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 -left-32 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />

          {/* Content */}
          <div className="relative z-10 max-w-xl w-full">
            <div className="mb-8">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/10 backdrop-blur-sm rounded-full border border-white/20 mb-6">
                <Sparkles className="w-4 h-4 text-yellow-400" />
                <span className="text-sm text-white/80">AI-powered development</span>
              </div>

              <h2 className="text-3xl font-bold mb-4">
                Start building in seconds
              </h2>

              <p className="text-white/60 mb-8">
                Describe your idea and watch AI bring it to life instantly
              </p>
            </div>

            {/* Chat-like Input Preview */}
            <div className="bg-white/[0.03] backdrop-blur-sm rounded-2xl border border-white/[0.08] p-6">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-emerald-400 rounded-full mt-2 animate-pulse" />
                <div className="flex-1">
                  <p className="text-white/30 text-xs uppercase tracking-wider mb-3">Try something like</p>
                  <div className="min-h-[60px]">
                    <p className={`text-xl text-white/90 transition-all duration-500 font-light ${isTyping ? 'opacity-100' : 'opacity-0'}`}>
                      {ideas[currentIdea]}
                      <span className="inline-block w-0.5 h-6 bg-white/60 ml-1 animate-pulse" />
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-white/[0.06]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button className="text-white/20 hover:text-white/40 transition-colors">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                      </svg>
                    </button>
                    <button className="text-white/20 hover:text-white/40 transition-colors">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                      </svg>
                    </button>
                  </div>
                  <button className="flex items-center gap-2 px-5 py-2.5 bg-white text-black rounded-xl hover:bg-white/90 transition-all font-medium text-sm">
                    <Zap className="w-3.5 h-3.5" />
                    Generate
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-6 mt-10">
              <div className="text-center">
                <p className="text-3xl font-light text-white/80">10k+</p>
                <p className="text-xs text-white/30 mt-1">Apps built</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-light text-white/80">50ms</p>
                <p className="text-xs text-white/30 mt-1">Response time</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-light text-white/80">100+</p>
                <p className="text-xs text-white/30 mt-1">AI models</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}