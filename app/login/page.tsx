'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useIam } from '@hanzo/iam/react';
import { HanzoBrand } from '@/components/HanzoLogo';
import { Loader2, Sparkles, Zap, Monitor, Apple, Terminal, Smartphone } from 'lucide-react';

/**
 * /login — HIP-0111 canonical. There is no local credential form: Hanzo IAM
 * owns every credential interaction. On mount we start the OAuth2 PKCE redirect
 * to IAM via the `@hanzo/iam` SDK (`login()`), exactly like hanzo.ai / chat /
 * console. The right-hand panel and the local-runtime download links are
 * app-specific chrome, not auth.
 */
export default function LoginPage() {
  const { login } = useIam();
  const [currentIdea, setCurrentIdea] = useState(0);
  const [isTyping, setIsTyping] = useState(true);

  useEffect(() => {
    // Honor a `?redirect=<path>` deep link (middleware stamps it when bouncing
    // a protected route here) so the post-login callback returns the user
    // there. Same-origin absolute paths only — never a protocol-relative /
    // off-origin target. The callback re-guards via loginRedirectDestination.
    try {
      const r = new URLSearchParams(window.location.search).get('redirect');
      if (r && r.startsWith('/') && !r.startsWith('//') && !r.startsWith('/\\')) {
        window.localStorage.setItem('redirectAfterLogin', r);
      }
    } catch {
      /* storage / URL unavailable */
    }
    login();
  }, [login]);

  const ideas = [
    'Build a SaaS dashboard with real-time analytics',
    'Create an AI-powered chat application',
    'Design a modern e-commerce platform',
    'Develop a social media scheduler with AI',
    'Build a cryptocurrency trading dashboard',
    'Create a video streaming platform like Netflix',
    'Design a project management tool with AI insights',
    'Build a marketplace for digital products',
    'Create a learning management system',
    'Develop a fitness tracking app with AI coach',
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

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navigation */}
      <nav className="absolute top-0 left-0 right-0 z-50">
        <div className="max-w-[1400px] mx-auto px-6 py-5 flex items-center justify-between">
          <Link href="/" className="flex items-center">
            <HanzoBrand className="text-foreground" markClassName="w-8 h-8" />
          </Link>
        </div>
      </nav>

      {/* Main Content */}
      <div className="min-h-screen flex">
        {/* Left Side - Redirecting to IAM */}
        <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-20">
          <div className="w-full max-w-md text-center">
            <div className="flex justify-center mb-10">
              <HanzoBrand
                className="text-foreground"
                markClassName="w-11 h-11"
                wordmarkClassName="text-3xl"
              />
            </div>

            <h1 className="text-4xl font-medium mb-4 tracking-tight">Welcome back</h1>
            <p className="text-muted-foreground text-lg mb-10">Taking you to Hanzo ID to sign in</p>

            <div className="flex items-center justify-center gap-2 text-muted-foreground mb-12">
              <Loader2 className="w-5 h-5 animate-spin" />
              <p className="text-sm">Redirecting to secure sign in…</p>
            </div>

            {/* Desktop App Options */}
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground text-center">Run locally without login</p>

              <div className="grid grid-cols-2 gap-3">
                <a
                  href="https://github.com/hanzoai/app/releases/latest"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 p-3.5 bg-muted hover:bg-accent rounded-xl border border-border transition-all group"
                >
                  <Monitor className="w-4 h-4 text-muted-foreground group-hover:text-foreground" />
                  <span className="text-sm text-muted-foreground group-hover:text-foreground">Windows</span>
                </a>

                <a
                  href="https://github.com/hanzoai/app/releases/latest"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 p-3.5 bg-muted hover:bg-accent rounded-xl border border-border transition-all group"
                >
                  <Apple className="w-4 h-4 text-muted-foreground group-hover:text-foreground" />
                  <span className="text-sm text-muted-foreground group-hover:text-foreground">macOS</span>
                </a>

                <a
                  href="https://github.com/hanzoai/app/releases/latest"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 p-3.5 bg-muted hover:bg-accent rounded-xl border border-border transition-all group"
                >
                  <Terminal className="w-4 h-4 text-muted-foreground group-hover:text-foreground" />
                  <span className="text-sm text-muted-foreground group-hover:text-foreground">Linux</span>
                </a>

                <div className="flex items-center justify-center gap-2 p-3.5 bg-muted rounded-xl border border-border opacity-40 cursor-not-allowed">
                  <Smartphone className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Mobile</span>
                </div>
              </div>

              <p className="text-xs text-muted-foreground text-center">
                Mobile coming soon • Local AI models included
              </p>
            </div>
          </div>
        </div>

        {/* Right Side - Animated Ideas */}
        <div className="hidden lg:flex w-1/2 items-center justify-center px-6 py-20 bg-gradient-to-br from-card via-background to-card relative overflow-hidden">
          <div className="absolute inset-0 opacity-20">
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 1px)`,
                backgroundSize: '40px 40px',
              }}
            />
          </div>

          <div className="absolute top-1/4 -right-32 w-96 h-96 bg-foreground/5 rounded-full blur-3xl animate-pulse" />
          <div
            className="absolute bottom-1/4 -left-32 w-96 h-96 bg-foreground/5 rounded-full blur-3xl animate-pulse"
            style={{ animationDelay: '2s' }}
          />

          <div className="relative z-10 max-w-xl w-full">
            <div className="mb-8">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-accent backdrop-blur-sm rounded-full border border-border mb-6">
                <Sparkles className="w-4 h-4 text-foreground" />
                <span className="text-sm text-foreground">AI-powered development</span>
              </div>

              <h2 className="text-3xl font-medium mb-4">Start building in seconds</h2>

              <p className="text-muted-foreground mb-8">
                Describe your idea and watch AI bring it to life instantly
              </p>
            </div>

            <div className="bg-muted backdrop-blur-sm rounded-2xl border border-border p-6">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-foreground/60 rounded-full mt-2 animate-pulse" />
                <div className="flex-1">
                  <p className="text-muted-foreground text-xs uppercase tracking-wider mb-3">Try something like</p>
                  <div className="min-h-[60px]">
                    <p
                      className={`text-xl text-foreground transition-all duration-500 font-light ${isTyping ? 'opacity-100' : 'opacity-0'}`}
                    >
                      {ideas[currentIdea]}
                      <span className="inline-block w-0.5 h-6 bg-foreground/60 ml-1 animate-pulse" />
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-border">
                <div className="flex items-center justify-end">
                  <div className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-xl font-medium text-sm">
                    <Zap className="w-3.5 h-3.5" />
                    Generate
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-6 mt-10">
              <div className="text-center">
                <p className="text-3xl font-light text-foreground">10k+</p>
                <p className="text-xs text-muted-foreground mt-1">Apps built</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-light text-foreground">50ms</p>
                <p className="text-xs text-muted-foreground mt-1">Response time</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-light text-foreground">400+</p>
                <p className="text-xs text-muted-foreground mt-1">AI models</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
