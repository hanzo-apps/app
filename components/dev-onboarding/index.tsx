"use client";

import { useState, useEffect, useRef } from "react";
import {
  Sparkles,
  Code2,
  Zap,
  Rocket,
  Send,
  Github,
  Upload,
  FolderOpen,
  CheckCircle,
  Loader2,
  MessageSquare,
  ArrowRight,
  Brain,
  Palette,
  Database,
  Shield,
  Globe,
  Terminal,
  Clock
} from "lucide-react";
import { Button } from "@hanzo/ui";
import { Input } from "@hanzo/ui";
import { Textarea } from "@hanzo/ui";
import { Card } from "@hanzo/ui";
import { Badge } from "@hanzo/ui";
import { Progress } from "@hanzo/ui";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  type GalleryTemplate,
  snapshotCatalog,
  popularTemplates,
} from "@/lib/gallery-catalog";

// Fork a real template into the editor.
function forkHref(t: GalleryTemplate) {
  return `/dev?template=hanzo-apps/${t.slug}&action=edit`;
}

interface DevOnboardingProps {
  initialPrompt?: string;
  onComplete: (prompt: string, plan?: string) => void;
}

interface PlanStep {
  id: string;
  title: string;
  description: string;
  status: "pending" | "current" | "completed";
  icon: React.ReactNode;
}

const getCategoryIcon = (category: string) => {
  const icons: { [key: string]: React.ReactNode } = {
    "web": <Globe className="w-4 h-4" />,
    "ai": <Brain className="w-4 h-4" />,
    "design": <Palette className="w-4 h-4" />,
    "database": <Database className="w-4 h-4" />,
    "security": <Shield className="w-4 h-4" />,
    "code": <Code2 className="w-4 h-4" />
  };
  return icons[category] || <Code2 className="w-4 h-4" />;
};

const features = [
  {
    title: "Instant Generation",
    description: "5ms response time",
    icon: <Zap className="w-4 h-4" />
  },
  {
    title: "100+ AI Models",
    description: "Latest LLMs available",
    icon: <Brain className="w-4 h-4" />
  },
  {
    title: "Full-Stack Apps",
    description: "Frontend to backend",
    icon: <Database className="w-4 h-4" />
  },
  {
    title: "Beautiful UIs",
    description: "Tailored & shadowui",
    icon: <Palette className="w-4 h-4" />
  }
];

export function DevOnboarding({ initialPrompt = "", onComplete }: DevOnboardingProps) {
  const [stage, setStage] = useState<"welcome" | "planning" | "ready">(
    initialPrompt ? "planning" : "welcome"
  );
  const [prompt, setPrompt] = useState(initialPrompt);
  const [planLines, setPlanLines] = useState<string[]>([]);
  const [currentThought, setCurrentThought] = useState("");
  const [inputMessage, setInputMessage] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [executionSteps, setExecutionSteps] = useState<Array<{ text: string; status: "thinking" | "done" }>>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const planEndRef = useRef<HTMLDivElement>(null);
  const thoughtsEndRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Real "popular" templates from the gallery catalog. Seed from the bundled
  // snapshot (instant, never empty) then refresh from the live catalog.
  const [popular, setPopular] = useState<GalleryTemplate[]>(
    () => popularTemplates(snapshotCatalog().templates, 6),
  );
  useEffect(() => {
    let alive = true;
    fetch("/api/templates")
      .then((r) => r.json())
      .then((d) => {
        if (alive && Array.isArray(d.templates) && d.templates.length) {
          setPopular(popularTemplates(d.templates, 6));
        }
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  // Start planning if we have an initial prompt
  useEffect(() => {
    if (initialPrompt && stage === "planning") {
      startPlanning(initialPrompt);
    }
  }, [initialPrompt, stage]);

  // Auto-scroll plan and thoughts (only when streaming, with debounce)
  useEffect(() => {
    if (isStreaming && planLines.length > 0) {
      const timer = setTimeout(() => {
        planEndRef.current?.scrollIntoView({ behavior: "auto", block: "nearest" });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [planLines.length, isStreaming]);

  useEffect(() => {
    if (isStreaming && executionSteps.length > 0) {
      const timer = setTimeout(() => {
        thoughtsEndRef.current?.scrollIntoView({ behavior: "auto", block: "nearest" });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [executionSteps.length, isStreaming]);

  const startPlanning = async (userPrompt: string) => {
    setStage("planning");
    setPrompt(userPrompt);
    setIsStreaming(true);

    // Execution thoughts that will appear on the left
    const thoughts = [
      "🔍 Analyzing user requirements...",
      "🧠 Understanding project scope and identifying key features...",
      "🏗️ Designing optimal architecture for scalability...",
      "📦 Selecting best packages and dependencies...",
      "🎨 Planning UI component structure with @hanzo/ui...",
      "⚡ Mapping out data flow and state management...",
      "🔐 Configuring authentication and security layers...",
      "🚀 Optimizing for performance and user experience...",
      "✨ Adding final touches and enhancements...",
      "✅ Finalizing development plan..."
    ];

    // Plan that will stream line by line on the right
    const planContent = [
      `Project: ${userPrompt}`,
      "",
      "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
      "TECHNOLOGY STACK",
      "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
      "",
      "Frontend Framework:",
      "  • Next.js 14 with App Router",
      "  • React 18 with Server Components",
      "  • TypeScript for type safety",
      "",
      "UI Components:",
      "  • @hanzo/ui (shadcn fork)",
      "  • Tailwind CSS for styling",
      "  • Framer Motion for animations",
      "",
      "State Management:",
      "  • Zustand for global state",
      "  • React Query for server state",
      "  • React Hook Form for forms",
      "",
      "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
      "CORE FEATURES",
      "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
      "",
      "1. User Authentication",
      "   - Social login (Google, GitHub)",
      "   - JWT token management",
      "   - Protected routes",
      "",
      "2. Real-time Functionality",
      "   - WebSocket connections",
      "   - Live updates",
      "   - Optimistic UI updates",
      "",
      "3. Responsive Design",
      "   - Mobile-first approach",
      "   - Dark/light theme support",
      "   - Accessibility features",
      "",
      "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
      "IMPLEMENTATION PHASES",
      "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
      "",
      "Phase 1: Foundation (Now)",
      "  ✓ Project setup and configuration",
      "  ✓ Core dependencies installation",
      "  ✓ Basic routing structure",
      "",
      "Phase 2: UI Development",
      "  → Component library setup",
      "  → Layout components",
      "  → Interactive elements",
      "",
      "Phase 3: Feature Implementation",
      "  → Core functionality",
      "  → API integration",
      "  → Data persistence",
      "",
      "Phase 4: Polish & Deploy",
      "  → Performance optimization",
      "  → Testing & debugging",
      "  → Production deployment",
      "",
      "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
      "",
      "Ready to start building! 🚀"
    ];

    let thoughtIndex = 0;
    let lineIndex = 0;
    let thoughtInterval: NodeJS.Timeout;
    let planInterval: NodeJS.Timeout;

    // Start showing thoughts on the left
    thoughtInterval = setInterval(() => {
      if (thoughtIndex < thoughts.length) {
        const newThought = thoughts[thoughtIndex];
        setCurrentThought(newThought);
        setExecutionSteps(prev => [
          ...prev.map(s => ({ ...s, status: "done" as const })),
          { text: newThought, status: "thinking" as const }
        ]);
        thoughtIndex++;

        // Update progress based on thoughts
        const thoughtProgress = (thoughtIndex / thoughts.length) * 100;
        setProgress(thoughtProgress);
      } else {
        clearInterval(thoughtInterval);
        // Mark last thought as done
        setExecutionSteps(prev =>
          prev.map(s => ({ ...s, status: "done" as const }))
        );
      }
    }, 1500);

    // Start streaming plan lines on the right
    setTimeout(() => {
      planInterval = setInterval(() => {
        if (lineIndex < planContent.length) {
          setPlanLines(prev => [...prev, planContent[lineIndex]]);
          lineIndex++;
        } else {
          clearInterval(planInterval);
          setIsStreaming(false);

          setTimeout(() => {
            setStage("ready");
          }, 1000);
        }
      }, 80); // Faster line streaming for better effect
    }, 500); // Small delay before starting plan

    return () => {
      clearInterval(thoughtInterval);
      clearInterval(planInterval);
    };
  };

  const sendMessage = () => {
    if (!inputMessage.trim()) return;

    // Add user input to the plan
    setPlanLines(prev => [
      ...prev,
      "",
      "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
      "USER REQUEST",
      "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
      inputMessage,
      "",
      "Incorporating into plan...",
      "✓ Requirements updated"
    ]);

    // Add a thinking step
    setExecutionSteps(prev => [
      ...prev,
      { text: `💭 Processing: "${inputMessage}"`, status: "thinking" as const }
    ]);

    setTimeout(() => {
      setExecutionSteps(prev =>
        prev.map(s => ({ ...s, status: "done" as const }))
      );
    }, 1000);

    setInputMessage("");
  };

  // Selecting a real template forks it into the editor (clone + customize),
  // rather than running the canned plan animation.
  const handleTemplateSelect = (template: GalleryTemplate) => {
    router.push(forkHref(template));
  };

  const handleImportProject = (source: "github" | "hanzo") => {
    // This would open a dialog to enter repo URL
    const exampleUrl = source === "github"
      ? "https://github.com/username/repo"
      : "https://hanzo.ai/projects/username/project";

    startPlanning(`Import and enhance project from ${exampleUrl}`);
  };

  if (stage === "welcome") {
    return (
      <div className="min-h-screen h-screen overflow-y-auto bg-black flex items-center justify-center p-6">
        <div className="max-w-6xl w-full">
          <div className="text-center mb-12">
            <div className="w-20 h-20 bg-gradient-to-br from-[#fd4444] to-[#ff6b6b] rounded-2xl flex items-center justify-center mb-6 mx-auto">
              <span className="text-white font-bold text-4xl">H</span>
            </div>
            <h1 className="text-4xl font-bold text-white mb-4">
              Welcome to Hanzo AI ✨
            </h1>
            <p className="text-xl text-gray-400">
              Your AI-powered development platform is ready
            </p>
          </div>

          {/* Quick Start Options */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <Card className="bg-neutral-900 border-neutral-800 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">
                Start with a prompt
              </h3>
              <Textarea
                placeholder="Describe what you want to build..."
                className="bg-neutral-800 border-neutral-700 text-white mb-4 min-h-[100px]"
                value={prompt}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setPrompt(e.target.value)}
              />
              <Button
                className="w-full gap-2"
                onClick={() => prompt && startPlanning(prompt)}
                disabled={!prompt.trim()}
              >
                <Sparkles className="w-4 h-4" />
                Start Building
              </Button>
            </Card>

            <Card className="bg-neutral-900 border-neutral-800 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">
                Import existing project
              </h3>
              <div className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full justify-start gap-2"
                  onClick={() => handleImportProject("github")}
                >
                  <Github className="w-4 h-4" />
                  Import from GitHub
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start gap-2"
                  onClick={() => handleImportProject("hanzo")}
                >
                  <Upload className="w-4 h-4" />
                  Import from Hanzo
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start gap-2"
                >
                  <FolderOpen className="w-4 h-4" />
                  Upload project files
                </Button>
              </div>
            </Card>
          </div>

          {/* Popular templates — real gallery templates with real previews */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">
                Start from a template
              </h3>
              <Link href="/gallery">
                <Button variant="ghost" size="sm" className="gap-2">
                  <Globe className="w-4 h-4" />
                  Browse all
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
              {popular.map((template) => (
                <button
                  key={template.slug}
                  onClick={() => handleTemplateSelect(template)}
                  className="flex flex-col overflow-hidden rounded-lg border border-neutral-800 bg-neutral-900 hover:border-[#fd4444]/50 hover:-translate-y-0.5 transition-all text-left group"
                >
                  <div className="relative aspect-[16/10] bg-neutral-950 overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={template.screenshotUrl}
                      alt={`${template.displayName} preview`}
                      loading="lazy"
                      className="w-full h-full object-cover object-top group-hover:scale-[1.03] transition-transform"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).style.display = "none";
                      }}
                    />
                    <Badge className="absolute top-1.5 right-1.5 bg-black/70 text-white border-neutral-700 text-[10px]">
                      {template.category}
                    </Badge>
                  </div>
                  <div className="p-3">
                    <p className="text-white font-medium text-sm truncate">{template.displayName}</p>
                    <p className="text-gray-500 text-xs mt-0.5 line-clamp-1">
                      {template.description || template.framework}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {features.map((feature, i) => (
              <div key={i} className="text-center">
                <div className="w-12 h-12 bg-neutral-900 rounded-lg flex items-center justify-center text-[#fd4444] mb-2 mx-auto">
                  {feature.icon}
                </div>
                <p className="text-white text-sm font-medium">{feature.title}</p>
                <p className="text-gray-500 text-xs">{feature.description}</p>
              </div>
            ))}
          </div>

          {/* Stats */}
          <div className="flex justify-center gap-8 mt-8 text-center">
            <div>
              <p className="text-2xl font-bold text-[#fd4444]">10,000+</p>
              <p className="text-xs text-gray-500">apps built</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-[#fd4444]">5ms</p>
              <p className="text-xs text-gray-500">generation</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-[#fd4444]">100+</p>
              <p className="text-xs text-gray-500">AI models</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (stage === "planning" || stage === "ready") {
    return (
      <div className="h-screen overflow-hidden bg-black flex">
        {/* Left Side - AI Thinking */}
        <div className="w-1/2 border-r border-neutral-800 p-6 overflow-y-auto">
          <div className="flex flex-col">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-[#fd4444] to-[#ff6b6b] rounded-xl flex items-center justify-center mb-4 mx-auto animate-pulse">
                <span className="text-white font-bold text-2xl">H</span>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">
                {stage === "planning" ? "Building your app..." : "Ready to build! 🚀"}
              </h2>
              <p className="text-gray-400">
                {stage === "planning" ? "AI is thinking and executing" : "Everything is configured"}
              </p>
            </div>

            {/* Progress */}
            {stage === "planning" && (
              <div className="mb-6">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-400">Progress</span>
                  <span className="text-[#fd4444]">{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            )}

            {/* AI Thoughts / Execution Steps */}
            <div className="flex-1 overflow-y-auto">
              <div className="space-y-2">
                {executionSteps.map((step, index) => (
                  <div
                    key={index}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-lg transition-all",
                      step.status === "thinking"
                        ? "bg-[#fd4444]/10 border border-[#fd4444]/30"
                        : "bg-neutral-900 border border-neutral-800 opacity-60"
                    )}
                  >
                    {step.status === "thinking" ? (
                      <Loader2 className="w-4 h-4 text-[#fd4444] animate-spin" />
                    ) : (
                      <CheckCircle className="w-4 h-4 text-green-400" />
                    )}
                    <p className={cn(
                      "text-sm",
                      step.status === "thinking" ? "text-[#ff6b6b]" : "text-gray-400"
                    )}>
                      {step.text}
                    </p>
                  </div>
                ))}
                <div ref={thoughtsEndRef} />
              </div>
            </div>

            {/* Action Button */}
            {stage === "ready" && (
              <Button
                className="w-full mt-6 gap-2"
                size="lg"
                onClick={() => onComplete(prompt, planLines.join("\n"))}
              >
                <Rocket className="w-4 h-4" />
                Start Building
                <ArrowRight className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Right Side - Plan Output */}
        <div className="w-1/2 flex flex-col">
          <div className="p-4 border-b border-neutral-800">
            <div className="flex items-center gap-3">
              <Terminal className="w-5 h-5 text-[#fd4444]" />
              <div>
                <h3 className="text-white font-medium">Development Plan</h3>
                <p className="text-xs text-gray-500">Streaming line by line</p>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto bg-neutral-950 p-4">
            <pre className="font-mono text-xs leading-relaxed">
              {planLines.map((line, i) => (
                <div
                  key={i}
                  className={cn(
                    "animate-fadeIn",
                    line.startsWith("━") && "text-[#fd4444]",
                    line.startsWith("  •") && "text-gray-400",
                    line.startsWith("  ✓") && "text-green-400",
                    line.startsWith("  →") && "text-blue-400",
                    line.includes("Phase") && "text-yellow-400 font-bold",
                    line === "" && "h-3",
                    !line.startsWith(" ") && !line.startsWith("━") && line !== "" && "text-white"
                  )}
                  style={{ animationDelay: `${i * 20}ms` }}
                >
                  {line || "\u00A0"}
                </div>
              ))}
              {isStreaming && (
                <span className="inline-block w-2 h-3 bg-[#fd4444] animate-pulse ml-1" />
              )}
              <div ref={planEndRef} />
            </pre>
          </div>

          <div className="p-4 border-t border-neutral-800">
            <div className="flex gap-2">
              <Input
                placeholder="Add requirements or ask questions..."
                className="flex-1 bg-neutral-900 border-neutral-700 text-white"
                value={inputMessage}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInputMessage(e.target.value)}
                onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
              />
              <Button
                onClick={sendMessage}
                disabled={!inputMessage.trim()}
                size="icon"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Add additional requirements while the plan generates
            </p>
          </div>
        </div>
      </div>
    );
  }

  return null;
}