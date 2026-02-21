"use client";

import { use, useState, useEffect } from "react";
import { useUser } from "@/hooks/useUser";
import { useMount, useTimeoutFn } from "react-use";
import Link from "next/link";
import { Loader2, CheckCircle2, Sparkles, Zap, Rocket, Code2, Brain, Palette } from "lucide-react";
import { HanzoLogo } from "@/components/HanzoLogo";

export default function AuthCallback({
  searchParams,
}: {
  searchParams: Promise<{ code: string }>;
}) {
  const [showButton, setShowButton] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [currentIdea, setCurrentIdea] = useState(0);
  const [isTyping, setIsTyping] = useState(true);
  const { code } = use(searchParams);
  const { loginFromCode } = useUser();

  // Fun loading messages
  const loadingSteps = [
    { icon: "🔐", text: "Verifying your identity...", completed: false },
    { icon: "🎫", text: "Validating access token...", completed: false },
    { icon: "🚀", text: "Setting up your workspace...", completed: false },
    { icon: "✨", text: "Loading AI models...", completed: false },
    { icon: "🎉", text: "Almost there...", completed: false },
  ];

  const [steps, setSteps] = useState(loadingSteps);

  // Animated ideas for the right side
  const ideas = [
    "Build a real-time collaborative editor",
    "Create an AI-powered code reviewer",
    "Design a machine learning dashboard",
    "Develop a blockchain explorer interface",
    "Build a 3D visualization tool",
    "Create a voice-controlled smart home app",
    "Design a social media analytics platform",
    "Build an automated trading bot interface",
    "Create a virtual reality workspace",
    "Design a quantum computing simulator"
  ];

  // Features to showcase
  const features = [
    { icon: <Zap className="w-5 h-5" />, title: "Instant Generation", desc: "50ms response time" },
    { icon: <Brain className="w-5 h-5" />, title: "100+ AI Models", desc: "Latest LLMs available" },
    { icon: <Code2 className="w-5 h-5" />, title: "Full-Stack Apps", desc: "Frontend to backend" },
    { icon: <Palette className="w-5 h-5" />, title: "Beautiful UIs", desc: "Tailwind & shadcn/ui" },
  ];

  useMount(async () => {
    if (code) {
      await loginFromCode(code);
    }
  });

  // Animate loading steps
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev < steps.length - 1) {
          setSteps((s) => {
            const newSteps = [...s];
            newSteps[prev].completed = true;
            return newSteps;
          });
          return prev + 1;
        }
        return prev;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [steps.length]);

  // Cycle through ideas
  useEffect(() => {
    const interval = setInterval(() => {
      setIsTyping(false);
      setTimeout(() => {
        setCurrentIdea((prev) => (prev + 1) % ideas.length);
        setIsTyping(true);
      }, 500);
    }, 3500);

    return () => clearInterval(interval);
  }, [ideas.length]);

  useTimeoutFn(
    () => setShowButton(true),
    7000 // Show button after 7 seconds
  );

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="min-h-screen flex">
        {/* Left Side - Login Progress */}
        <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-20">
          <div className="w-full max-w-md">
            {/* Logo */}
            <div className="flex justify-center mb-12">
              <HanzoLogo className="w-12 h-12 text-white" />
            </div>

            {/* Main Card */}
            <div className="text-center mb-10">
              <h1 className="text-4xl font-bold mb-4 tracking-tight">
                {currentStep < steps.length - 1 ? "Logging you in..." : "Almost ready!"}
              </h1>
              <p className="text-white/50 text-lg">
                Setting up your AI workspace
              </p>
            </div>

            {/* Progress Steps */}
            <div className="space-y-4 mb-10">
              {steps.map((step, index) => (
                <div
                  key={index}
                  className={`flex items-center gap-4 p-4 rounded-xl border transition-all duration-500 ${
                    index === currentStep
                      ? "bg-white/10 border-white/20 scale-105"
                      : step.completed
                      ? "bg-green-500/10 border-green-500/20"
                      : "bg-white/5 border-white/10 opacity-50"
                  }`}
                >
                  <div className="text-2xl">
                    {step.completed ? <CheckCircle2 className="w-6 h-6 text-green-400" /> :
                     index === currentStep ? <Loader2 className="w-6 h-6 text-white animate-spin" /> :
                     <span>{step.icon}</span>}
                  </div>
                  <div className="flex-1 text-left">
                    <p className={`text-sm ${index === currentStep ? "text-white" : step.completed ? "text-green-400" : "text-white/50"}`}>
                      {step.text}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Action Button */}
            <div className="text-center">
              {showButton ? (
                <div className="space-y-4">
                  <Link href="/">
                    <button className="w-full bg-white text-black px-6 py-3 rounded-xl font-medium hover:bg-white/90 transition-all flex items-center justify-center gap-2">
                      <Sparkles className="w-4 h-4" />
                      Go to Dashboard
                    </button>
                  </Link>
                  <p className="text-xs text-white/40">
                    You should be redirected automatically
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center justify-center gap-2 text-white/60">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <p className="text-sm">Authenticating with Hanzo IAM...</p>
                  </div>
                  <p className="text-xs text-white/40">
                    This usually takes a few seconds
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Side - Animated Content */}
        <div className="hidden lg:block w-1/2 relative overflow-hidden bg-gradient-to-br from-black via-gray-900 to-black">
          {/* Grid Background */}
          <div className="absolute inset-0 opacity-20">
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
                backgroundSize: '40px 40px'
              }}
            />
          </div>

          {/* Animated Gradient Orbs */}
          <div className="absolute top-1/4 -right-32 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 -left-32 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />

          {/* Content */}
          <div className="relative z-10 h-full flex flex-col justify-center px-16">
            {/* Welcome Message */}
            <div className="mb-10">
              <h2 className="text-3xl font-bold mb-4">
                Welcome to Hanzo AI ✨
              </h2>
              <p className="text-white/60 text-lg">
                Your AI-powered development platform is getting ready
              </p>
            </div>

            {/* Animated Idea Display */}
            <div className="bg-white/[0.03] backdrop-blur-sm rounded-2xl border border-white/[0.08] p-6 mb-10">
              <div className="flex items-start gap-3">
                <Rocket className="w-5 h-5 text-purple-400 mt-1 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-white/30 text-xs uppercase tracking-wider mb-3">Next, you could build</p>
                  <div className="min-h-[60px]">
                    <p className={`text-xl text-white/90 transition-all duration-500 font-light ${isTyping ? 'opacity-100' : 'opacity-0'}`}>
                      {ideas[currentIdea]}
                      <span className="inline-block w-0.5 h-6 bg-white/60 ml-1 animate-pulse" />
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Features Grid */}
            <div className="grid grid-cols-2 gap-4">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className="bg-white/[0.02] backdrop-blur-sm rounded-xl border border-white/[0.06] p-4 hover:bg-white/[0.04] transition-all"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="text-purple-400">{feature.icon}</div>
                    <h3 className="text-sm font-medium text-white/80">{feature.title}</h3>
                  </div>
                  <p className="text-xs text-white/40">{feature.desc}</p>
                </div>
              ))}
            </div>

            {/* Bottom Stats */}
            <div className="mt-10 flex items-center justify-between text-xs text-white/30">
              <div>10,000+ apps built</div>
              <div>•</div>
              <div>50ms generation</div>
              <div>•</div>
              <div>100+ AI models</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}