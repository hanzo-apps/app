"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Play,
  Copy,
  Download,
  Settings,
  RefreshCw,
  Loader2,
  Split,
  Maximize2,
  Minimize2,
  ChevronDown,
  Sparkles,
  Zap,
  Code2,
  FileText,
  Hash,
  Clock,
  DollarSign,
  AlertCircle,
  CheckCircle,
  Share2,
  Save,
  History,
  BarChart3
} from "lucide-react";
import { Button } from "@hanzo/ui";
import { Textarea } from "@hanzo/ui";
import { Badge } from "@hanzo/ui";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@hanzo/ui";
import { Slider } from "@hanzo/ui";
import { Switch } from "@hanzo/ui";
import { Label } from "@hanzo/ui";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@hanzo/ui";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from "@hanzo/ui";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@hanzo/ui";
import { ScrollArea } from "@hanzo/ui";
import { HanzoLogo } from "@/components/HanzoLogo";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { toast } from "sonner";

interface ModelConfig {
  model: string;
  temperature: number;
  maxTokens: number;
  topP: number;
  frequencyPenalty: number;
  presencePenalty: number;
  systemPrompt: string;
}

interface ComparisonResult {
  id: string;
  prompt: string;
  timestamp: Date;
  models: {
    model: string;
    response: string;
    latency: number;
    tokens: number;
    cost: number;
    streaming: boolean;
    error?: string;
  }[];
}

export default function PlaygroundPage() {
  const router = useRouter();
  const [prompt, setPrompt] = useState("");
  const [splitView, setSplitView] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState("default");

  const [leftConfig, setLeftConfig] = useState<ModelConfig>({
    model: "Claude 3.5 Sonnet",
    temperature: 0.7,
    maxTokens: 2048,
    topP: 1,
    frequencyPenalty: 0,
    presencePenalty: 0,
    systemPrompt: "You are a helpful AI assistant."
  });

  const [rightConfig, setRightConfig] = useState<ModelConfig>({
    model: "GPT-4 Turbo",
    temperature: 0.7,
    maxTokens: 2048,
    topP: 1,
    frequencyPenalty: 0,
    presencePenalty: 0,
    systemPrompt: "You are a helpful AI assistant."
  });

  const [results, setResults] = useState<ComparisonResult[]>([]);
  const [activeResult, setActiveResult] = useState<ComparisonResult | null>(null);

  const models = [
    { value: "Claude 3.5 Sonnet", label: "Claude 3.5 Sonnet", provider: "Anthropic" },
    { value: "Claude 3.5 Haiku", label: "Claude 3.5 Haiku", provider: "Anthropic" },
    { value: "GPT-4 Turbo", label: "GPT-4 Turbo", provider: "OpenAI" },
    { value: "GPT-4", label: "GPT-4", provider: "OpenAI" },
    { value: "GPT-3.5 Turbo", label: "GPT-3.5 Turbo", provider: "OpenAI" },
    { value: "Gemini Pro", label: "Gemini Pro", provider: "Google" },
    { value: "Llama 3 70B", label: "Llama 3 70B", provider: "Meta" },
    { value: "Mixtral 8x7B", label: "Mixtral 8x7B", provider: "Mistral" }
  ];

  const presets = [
    { value: "default", label: "Default", description: "Balanced settings" },
    { value: "creative", label: "Creative", description: "Higher temperature, more diverse" },
    { value: "precise", label: "Precise", description: "Lower temperature, more focused" },
    { value: "code", label: "Code Generation", description: "Optimized for coding tasks" },
    { value: "chat", label: "Chat", description: "Conversational settings" },
    { value: "analysis", label: "Analysis", description: "Structured, analytical responses" }
  ];

  const promptTemplates = [
    { label: "Explain concept", prompt: "Explain [concept] in simple terms with examples" },
    { label: "Code review", prompt: "Review this code and suggest improvements:\n```\n[code]\n```" },
    { label: "Creative writing", prompt: "Write a short story about [topic] in the style of [author]" },
    { label: "Data analysis", prompt: "Analyze this data and provide insights:\n[data]" },
    { label: "Problem solving", prompt: "How would you solve this problem: [problem description]" }
  ];

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error("Please enter a prompt");
      return;
    }

    setIsGenerating(true);

    // Simulate generation
    setTimeout(() => {
      const newResult: ComparisonResult = {
        id: Date.now().toString(),
        prompt: prompt,
        timestamp: new Date(),
        models: [
          {
            model: leftConfig.model,
            response: `This is a simulated response from ${leftConfig.model} to the prompt: "${prompt}"\n\nThe response demonstrates how the model would handle this request with the configured parameters:\n- Temperature: ${leftConfig.temperature}\n- Max Tokens: ${leftConfig.maxTokens}\n- Top P: ${leftConfig.topP}\n\nThe model provides a comprehensive answer that addresses the key aspects of your query while maintaining coherence and relevance throughout the response.`,
            latency: 1234 + Math.random() * 1000,
            tokens: 156 + Math.floor(Math.random() * 100),
            cost: 0.0024 + Math.random() * 0.001,
            streaming: true
          }
        ]
      };

      if (splitView) {
        newResult.models.push({
          model: rightConfig.model,
          response: `This is a simulated response from ${rightConfig.model} to the prompt: "${prompt}"\n\nThis model approaches the query differently, showcasing its unique characteristics:\n- Temperature: ${rightConfig.temperature}\n- Max Tokens: ${rightConfig.maxTokens}\n- Top P: ${rightConfig.topP}\n\nThe response style and content may vary from the other model, allowing you to compare different approaches and select the most suitable one for your use case.`,
          latency: 987 + Math.random() * 800,
          tokens: 142 + Math.floor(Math.random() * 80),
          cost: 0.0018 + Math.random() * 0.0008,
          streaming: true
        });
      }

      setResults([newResult, ...results]);
      setActiveResult(newResult);
      setIsGenerating(false);
    }, 2000);
  };

  const applyPreset = (preset: string) => {
    switch (preset) {
      case "creative":
        setLeftConfig(prev => ({ ...prev, temperature: 0.9, topP: 0.95 }));
        setRightConfig(prev => ({ ...prev, temperature: 0.9, topP: 0.95 }));
        break;
      case "precise":
        setLeftConfig(prev => ({ ...prev, temperature: 0.3, topP: 0.9 }));
        setRightConfig(prev => ({ ...prev, temperature: 0.3, topP: 0.9 }));
        break;
      case "code":
        setLeftConfig(prev => ({ ...prev, temperature: 0.2, maxTokens: 4096, systemPrompt: "You are an expert programmer. Provide clean, efficient, and well-commented code." }));
        setRightConfig(prev => ({ ...prev, temperature: 0.2, maxTokens: 4096, systemPrompt: "You are an expert programmer. Provide clean, efficient, and well-commented code." }));
        break;
      default:
        setLeftConfig(prev => ({ ...prev, temperature: 0.7, topP: 1 }));
        setRightConfig(prev => ({ ...prev, temperature: 0.7, topP: 1 }));
    }
    setSelectedPreset(preset);
  };

  const ModelConfigPanel = ({ config, setConfig, side }: { config: ModelConfig, setConfig: any, side: "left" | "right" }) => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Model</Label>
        <Select value={config.model} onValueChange={(value: string) => setConfig({ ...config, model: value })}>
          <SelectTrigger className="bg-neutral-900 border-neutral-700">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {models.map(model => (
              <SelectItem key={model.value} value={model.value}>
                <div className="flex items-center justify-between w-full">
                  <span>{model.label}</span>
                  <Badge variant="outline" className="ml-2 text-xs">{model.provider}</Badge>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between">
          <Label>Temperature</Label>
          <span className="text-xs text-gray-500">{config.temperature}</span>
        </div>
        <Slider
          value={[config.temperature]}
          onValueChange={([value]: number[]) => setConfig({ ...config, temperature: value })}
          min={0}
          max={1}
          step={0.1}
          className="w-full"
        />
      </div>

      <div className="space-y-2">
        <div className="flex justify-between">
          <Label>Max Tokens</Label>
          <span className="text-xs text-gray-500">{config.maxTokens}</span>
        </div>
        <Slider
          value={[config.maxTokens]}
          onValueChange={([value]: number[]) => setConfig({ ...config, maxTokens: value })}
          min={256}
          max={8192}
          step={256}
          className="w-full"
        />
      </div>

      <div className="space-y-2">
        <div className="flex justify-between">
          <Label>Top P</Label>
          <span className="text-xs text-gray-500">{config.topP}</span>
        </div>
        <Slider
          value={[config.topP]}
          onValueChange={([value]: number[]) => setConfig({ ...config, topP: value })}
          min={0}
          max={1}
          step={0.05}
          className="w-full"
        />
      </div>

      <div className="space-y-2">
        <Label>System Prompt</Label>
        <Textarea
          value={config.systemPrompt}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setConfig({ ...config, systemPrompt: e.target.value })}
          className="bg-neutral-900 border-neutral-700 text-white min-h-[80px]"
          placeholder="Enter system prompt..."
        />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <header className="border-b border-neutral-800 px-6 py-4">
        <div className="container mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.back()}
                className="gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
              <h1 className="text-2xl font-bold text-white">Playground</h1>
              <Badge variant="outline">Compare Models</Badge>
            </div>

            <div className="flex items-center gap-4">
              <Select value={selectedPreset} onValueChange={applyPreset}>
                <SelectTrigger className="w-[180px] bg-neutral-900 border-neutral-700">
                  <SelectValue placeholder="Select preset" />
                </SelectTrigger>
                <SelectContent>
                  {presets.map(preset => (
                    <SelectItem key={preset.value} value={preset.value}>
                      <div>
                        <p className="font-medium">{preset.label}</p>
                        <p className="text-xs text-gray-500">{preset.description}</p>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button
                variant={splitView ? "default" : "outline"}
                size="sm"
                onClick={() => setSplitView(!splitView)}
                className="gap-2"
              >
                <Split className="w-4 h-4" />
                {splitView ? "Split" : "Single"}
              </Button>

              <Button variant="outline" size="sm" className="gap-2">
                <History className="w-4 h-4" />
                History
              </Button>

              <Button variant="outline" size="sm" className="gap-2">
                <Share2 className="w-4 h-4" />
                Share
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-6">
        <div className="grid grid-cols-12 gap-6">
          {/* Left Panel - Prompt Input */}
          <div className="col-span-3">
            <Card className="bg-neutral-900 border-neutral-800">
              <CardHeader>
                <CardTitle>Prompt</CardTitle>
                <CardDescription>Enter your prompt and configure models</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label>Quick Templates</Label>
                    <Button variant="ghost" size="sm" className="h-6 text-xs">
                      View All
                    </Button>
                  </div>
                  <div className="space-y-1">
                    {promptTemplates.slice(0, 3).map((template, i) => (
                      <Button
                        key={i}
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start text-xs h-8"
                        onClick={() => setPrompt(template.prompt)}
                      >
                        {template.label}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Your Prompt</Label>
                  <Textarea
                    value={prompt}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setPrompt(e.target.value)}
                    placeholder="Enter your prompt here..."
                    className="bg-neutral-800 border-neutral-700 text-white min-h-[150px]"
                  />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>{prompt.length} characters</span>
                    <span>~{Math.ceil(prompt.length / 4)} tokens</span>
                  </div>
                </div>

                <Button
                  onClick={handleGenerate}
                  disabled={isGenerating || !prompt.trim()}
                  className="w-full gap-2"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Generate
                    </>
                  )}
                </Button>

                {/* Recent Results */}
                {results.length > 0 && (
                  <div className="space-y-2 pt-4 border-t border-neutral-800">
                    <Label>Recent Comparisons</Label>
                    <ScrollArea className="h-[200px]">
                      <div className="space-y-2">
                        {results.slice(0, 5).map(result => (
                          <button
                            key={result.id}
                            onClick={() => setActiveResult(result)}
                            className={cn(
                              "w-full text-left p-2 rounded-lg transition-colors",
                              activeResult?.id === result.id
                                ? "bg-purple-500/20 border border-purple-500/30"
                                : "bg-neutral-800 hover:bg-neutral-700"
                            )}
                          >
                            <p className="text-xs text-gray-400 mb-1">
                              {result.timestamp.toLocaleTimeString()}
                            </p>
                            <p className="text-sm text-white truncate">
                              {result.prompt}
                            </p>
                            <div className="flex gap-2 mt-1">
                              {result.models.map(model => (
                                <Badge key={model.model} variant="outline" className="text-xs">
                                  {model.model}
                                </Badge>
                              ))}
                            </div>
                          </button>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Main Content - Model Outputs */}
          <div className="col-span-9">
            <div className={cn("grid gap-4", splitView ? "grid-cols-2" : "grid-cols-1")}>
              {/* Left Model */}
              <Card className="bg-neutral-900 border-neutral-800">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-purple-500 rounded-full" />
                      <CardTitle className="text-lg">{leftConfig.model}</CardTitle>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <Settings className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-80 bg-neutral-900 border-neutral-800">
                        <div className="p-4">
                          <ModelConfigPanel config={leftConfig} setConfig={setLeftConfig} side="left" />
                        </div>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent>
                  {activeResult ? (
                    <div className="space-y-4">
                      <ScrollArea className="h-[400px]">
                        <div className="prose prose-invert max-w-none">
                          <p className="whitespace-pre-wrap text-sm text-gray-300">
                            {activeResult.models[0]?.response || "No response"}
                          </p>
                        </div>
                      </ScrollArea>

                      {/* Metrics */}
                      <div className="flex items-center gap-4 pt-4 border-t border-neutral-800">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-gray-500" />
                          <span className="text-xs text-gray-400">
                            {activeResult.models[0]?.latency.toFixed(0)}ms
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Hash className="w-3 h-3 text-gray-500" />
                          <span className="text-xs text-gray-400">
                            {activeResult.models[0]?.tokens} tokens
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <DollarSign className="w-3 h-3 text-gray-500" />
                          <span className="text-xs text-gray-400">
                            ${activeResult.models[0]?.cost.toFixed(4)}
                          </span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="gap-2">
                          <Copy className="w-3 h-3" />
                          Copy
                        </Button>
                        <Button variant="outline" size="sm" className="gap-2">
                          <RefreshCw className="w-3 h-3" />
                          Regenerate
                        </Button>
                        <Button variant="outline" size="sm" className="gap-2">
                          <Download className="w-3 h-3" />
                          Export
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="h-[400px] flex items-center justify-center">
                      <div className="text-center">
                        <Sparkles className="w-12 h-12 text-gray-700 mx-auto mb-4" />
                        <p className="text-gray-500">Generate a response to see output</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Right Model (if split view) */}
              {splitView && (
                <Card className="bg-neutral-900 border-neutral-800">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full" />
                        <CardTitle className="text-lg">{rightConfig.model}</CardTitle>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <Settings className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-80 bg-neutral-900 border-neutral-800">
                          <div className="p-4">
                            <ModelConfigPanel config={rightConfig} setConfig={setRightConfig} side="right" />
                          </div>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {activeResult && activeResult.models[1] ? (
                      <div className="space-y-4">
                        <ScrollArea className="h-[400px]">
                          <div className="prose prose-invert max-w-none">
                            <p className="whitespace-pre-wrap text-sm text-gray-300">
                              {activeResult.models[1].response}
                            </p>
                          </div>
                        </ScrollArea>

                        {/* Metrics */}
                        <div className="flex items-center gap-4 pt-4 border-t border-neutral-800">
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-gray-500" />
                            <span className="text-xs text-gray-400">
                              {activeResult.models[1].latency.toFixed(0)}ms
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Hash className="w-3 h-3 text-gray-500" />
                            <span className="text-xs text-gray-400">
                              {activeResult.models[1].tokens} tokens
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <DollarSign className="w-3 h-3 text-gray-500" />
                            <span className="text-xs text-gray-400">
                              ${activeResult.models[1].cost.toFixed(4)}
                            </span>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" className="gap-2">
                            <Copy className="w-3 h-3" />
                            Copy
                          </Button>
                          <Button variant="outline" size="sm" className="gap-2">
                            <RefreshCw className="w-3 h-3" />
                            Regenerate
                          </Button>
                          <Button variant="outline" size="sm" className="gap-2">
                            <Download className="w-3 h-3" />
                            Export
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="h-[400px] flex items-center justify-center">
                        <div className="text-center">
                          <Sparkles className="w-12 h-12 text-gray-700 mx-auto mb-4" />
                          <p className="text-gray-500">Generate a response to see output</p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Comparison Stats */}
            {activeResult && splitView && activeResult.models.length > 1 && (
              <Card className="mt-4 bg-neutral-900 border-neutral-800">
                <CardHeader>
                  <CardTitle>Comparison Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-gray-400 mb-2">Speed Comparison</p>
                      <div className="space-y-2">
                        {activeResult.models.map(model => (
                          <div key={model.model} className="flex items-center justify-between">
                            <span className="text-xs text-gray-500">{model.model}</span>
                            <span className="text-sm font-medium text-white">
                              {model.latency.toFixed(0)}ms
                            </span>
                          </div>
                        ))}
                      </div>
                      {activeResult.models[0].latency < activeResult.models[1].latency ? (
                        <Badge className="mt-2 text-xs">
                          {leftConfig.model} is {((1 - activeResult.models[0].latency / activeResult.models[1].latency) * 100).toFixed(0)}% faster
                        </Badge>
                      ) : (
                        <Badge className="mt-2 text-xs">
                          {rightConfig.model} is {((1 - activeResult.models[1].latency / activeResult.models[0].latency) * 100).toFixed(0)}% faster
                        </Badge>
                      )}
                    </div>

                    <div>
                      <p className="text-sm text-gray-400 mb-2">Token Usage</p>
                      <div className="space-y-2">
                        {activeResult.models.map(model => (
                          <div key={model.model} className="flex items-center justify-between">
                            <span className="text-xs text-gray-500">{model.model}</span>
                            <span className="text-sm font-medium text-white">
                              {model.tokens}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <p className="text-sm text-gray-400 mb-2">Cost Analysis</p>
                      <div className="space-y-2">
                        {activeResult.models.map(model => (
                          <div key={model.model} className="flex items-center justify-between">
                            <span className="text-xs text-gray-500">{model.model}</span>
                            <span className="text-sm font-medium text-white">
                              ${model.cost.toFixed(4)}
                            </span>
                          </div>
                        ))}
                      </div>
                      {activeResult.models[0].cost < activeResult.models[1].cost ? (
                        <Badge variant="outline" className="mt-2 text-xs border-green-500/50 text-green-400">
                          {leftConfig.model} is {((1 - activeResult.models[0].cost / activeResult.models[1].cost) * 100).toFixed(0)}% cheaper
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="mt-2 text-xs border-green-500/50 text-green-400">
                          {rightConfig.model} is {((1 - activeResult.models[1].cost / activeResult.models[0].cost) * 100).toFixed(0)}% cheaper
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}