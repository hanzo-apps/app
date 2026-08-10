"use client";

import { YStack, XStack, SizableText, H1, Paragraph } from '@hanzo/ui';
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Copy, Download, Settings, RefreshCw, Split, Sparkles, Hash, Clock, DollarSign, Share2, History } from "lucide-react";
import { Button, Textarea, Badge, Card, CardContent, CardDescription, CardHeader, CardTitle, Slider, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, DropdownMenu, DropdownMenuContent, DropdownMenuTrigger, ScrollArea, toast } from '@hanzo/ui';
import { DEFAULT_MODEL } from "@/lib/providers";
import { useModels } from "@/lib/hooks/use-models";
import { Spinner } from "@/components/ui/spinner";
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

  // Left pane opens on the product default — DEFAULT_MODEL, never a literal.
  // The right pane is the CONTRAST it is compared against, so it names a
  // deliberately different model rather than restating the default.
  const [leftConfig, setLeftConfig] = useState<ModelConfig>({
    model: DEFAULT_MODEL,
    temperature: 0.7,
    maxTokens: 2048,
    topP: 1,
    frequencyPenalty: 0,
    presencePenalty: 0,
    systemPrompt: "You are a helpful AI assistant."
  });

  const [rightConfig, setRightConfig] = useState<ModelConfig>({
    model: "gpt-5.2",
    temperature: 0.7,
    maxTokens: 2048,
    topP: 1,
    frequencyPenalty: 0,
    presencePenalty: 0,
    systemPrompt: "You are a helpful AI assistant."
  });

  const [results, setResults] = useState<ComparisonResult[]>([]);
  const [activeResult, setActiveResult] = useState<ComparisonResult | null>(null);

  // The live gateway ladder — the same list the builder's picker reads, shaped
  // by the one catalog rule set in @/lib/providers. Never a hand-written list:
  // the previous one had drifted onto upstream vendor names (a brand leak) and
  // onto ids the gateway no longer serves.
  const { models } = useModels();

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
    <YStack rowGap="$4">
      <YStack rowGap="$2">
        <Label>Model</Label>
        <Select value={config.model} onValueChange={(value: string) => setConfig({ ...config, model: value })}>
          <SelectTrigger backgroundColor="$background" borderColor="$borderColor">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {models.map(model => (
              <SelectItem key={model.value} value={model.value}>
                <XStack alignItems="center" justifyContent="space-between" width="100%">
                  <span>{model.label}</span>
                </XStack>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </YStack>

      <YStack rowGap="$2">
        <XStack justifyContent="space-between">
          <Label>Temperature</Label>
          <SizableText fontSize="$1" color="$color11">{config.temperature}</SizableText>
        </XStack>
        <Slider
          value={[config.temperature]}
          onValueChange={([value]: number[]) => setConfig({ ...config, temperature: value })}
          min={0}
          max={1}
          step={0.1}
          width="100%"
  />
      </YStack>

      <YStack rowGap="$2">
        <XStack justifyContent="space-between">
          <Label>Max Tokens</Label>
          <SizableText fontSize="$1" color="$color11">{config.maxTokens}</SizableText>
        </XStack>
        <Slider
          value={[config.maxTokens]}
          onValueChange={([value]: number[]) => setConfig({ ...config, maxTokens: value })}
          min={256}
          max={8192}
          step={256}
          width="100%"
  />
      </YStack>

      <YStack rowGap="$2">
        <XStack justifyContent="space-between">
          <Label>Top P</Label>
          <SizableText fontSize="$1" color="$color11">{config.topP}</SizableText>
        </XStack>
        <Slider
          value={[config.topP]}
          onValueChange={([value]: number[]) => setConfig({ ...config, topP: value })}
          min={0}
          max={1}
          step={0.05}
          width="100%"
  />
      </YStack>

      <YStack rowGap="$2">
        <Label>System Prompt</Label>
        <Textarea
          value={config.systemPrompt}
          onChangeText={(value) => setConfig({ ...config, systemPrompt: value })}
          backgroundColor="$background" borderColor="$borderColor" color="$color" minHeight={80}
          placeholder="Enter system prompt..."
  />
      </YStack>
    </YStack>
  );

  return (
    <YStack minHeight="100%" backgroundColor="$background">
      {/* Header */}
      <YStack borderBottomWidth={1} borderColor="$borderColor" paddingHorizontal="$5" paddingVertical="$4">
        <YStack width="100%" maxWidth={1280} alignSelf="center">
          <XStack flexWrap="wrap" alignItems="center" justifyContent="space-between" rowGap="$3">
            <XStack alignItems="center" gap="$4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.back()}
                gap="$2"
              >
                <ArrowLeft size={16} />
                Back
              </Button>
              <H1 fontSize="$8" fontWeight="500" color="$color">Playground</H1>
              <Badge variant="outline">Compare Models</Badge>
            </XStack>

            <XStack flexWrap="wrap" alignItems="center" gap="$2">
              <Select value={selectedPreset} onValueChange={applyPreset}>
                <SelectTrigger width="100%" backgroundColor="$background" borderColor="$borderColor" $sm={{ width: 180 }}>
                  <SelectValue placeholder="Select preset" />
                </SelectTrigger>
                <SelectContent>
                  {presets.map(preset => (
                    <SelectItem key={preset.value} value={preset.value}>
                      <div>
                        <Paragraph fontWeight="500">{preset.label}</Paragraph>
                        <Paragraph fontSize="$1" color="$color11">{preset.description}</Paragraph>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button
                variant={splitView ? "default" : "outline"}
                size="sm"
                onClick={() => setSplitView(!splitView)}
                gap="$2"
              >
                <Split size={16} />
                {splitView ? "Split" : "Single"}
              </Button>

              <Button variant="outline" size="sm" gap="$2">
                <History size={16} />
                History
              </Button>

              <Button variant="outline" size="sm" gap="$2">
                <Share2 size={16} />
                Share
              </Button>
            </XStack>
          </XStack>
        </YStack>
      </YStack>

      <YStack width="100%" maxWidth={1280} alignSelf="center" paddingHorizontal="$5" paddingVertical="$5">
        <YStack gap="$5">
          {/* Left Panel - Prompt Input */}
          <YStack>
            <Card backgroundColor="$background" borderColor="$borderColor">
              <CardHeader>
                <CardTitle>Prompt</CardTitle>
                <CardDescription>Enter your prompt and configure models</CardDescription>
              </CardHeader>
              <CardContent rowGap="$4">
                <YStack rowGap="$2">
                  <XStack justifyContent="space-between" alignItems="center">
                    <Label>Quick Templates</Label>
                    <Button variant="ghost" size="sm" height="$5">
                      <SizableText fontSize="$1">View All</SizableText>
                    </Button>
                  </XStack>
                  <YStack rowGap="$1">
                    {promptTemplates.slice(0, 3).map((template, i) => (
                      <Button
                        key={i}
                        variant="ghost"
                        size="sm"
                        width="100%" justifyContent="flex-start" height="$6"
                        onClick={() => setPrompt(template.prompt)}
                      >
                        <SizableText fontSize="$1">{template.label}</SizableText>
                      </Button>
                    ))}
                  </YStack>
                </YStack>

                <YStack rowGap="$2">
                  <Label>Your Prompt</Label>
                  <Textarea
                    value={prompt}
                    onChangeText={(value) => setPrompt(value)}
                    placeholder="Enter your prompt here..."
                    backgroundColor="$color3" borderColor="$borderColor" color="$color" minHeight={150}
  />
                  <XStack justifyContent="space-between">
                    <SizableText fontSize="$1" color="$color11">{prompt.length} characters</SizableText>
                    <SizableText fontSize="$1" color="$color11">~{Math.ceil(prompt.length / 4)} tokens</SizableText>
                  </XStack>
                </YStack>

                <Button
                  onClick={handleGenerate}
                  disabled={isGenerating || !prompt.trim()}
                  width="100%" gap="$2"
                >
                  {isGenerating ? (
                    <>
                      <Spinner size={16} />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles size={16} />
                      Generate
                    </>
                  )}
                </Button>

                {/* Recent Results */}
                {results.length > 0 && (
                  <YStack rowGap="$2" paddingTop="$4" borderTopWidth={1} borderColor="$borderColor">
                    <Label>Recent Comparisons</Label>
                    <ScrollArea height={200}>
                      <YStack rowGap="$2">
                        {results.slice(0, 5).map(result => (
                          <Button
                            key={result.id}
                            onClick={() => setActiveResult(result)}
                            width="100%" alignItems="flex-start" padding="$2" borderRadius="$5" {...{ backgroundColor: activeResult?.id === result.id ? "$purple9" : "$color3", borderWidth: activeResult?.id === result.id ? 1 : undefined, borderColor: activeResult?.id === result.id ? "$purple9" : undefined, hoverStyle: activeResult?.id === result.id ? undefined : {"backgroundColor":"$color3"} }}
                          >
                            <Paragraph fontSize="$1" color="$color11" marginBottom="$1">
                              {result.timestamp.toLocaleTimeString()}
                            </Paragraph>
                            <Paragraph fontSize="$3" color="$color" numberOfLines={1}>
                              {result.prompt}
                            </Paragraph>
                            <XStack gap="$2" marginTop="$1">
                              {result.models.map(model => (
                                <Badge key={model.model} variant="outline">
                                  {model.model}
                                </Badge>
                              ))}
                            </XStack>
                          </Button>
                        ))}
                      </YStack>
                    </ScrollArea>
                  </YStack>
                )}
              </CardContent>
            </Card>
          </YStack>

          {/* Main Content - Model Outputs */}
          <YStack>
            <YStack gap="$4">
              {/* Left Model */}
              <Card backgroundColor="$background" borderColor="$borderColor">
                <CardHeader>
                  <XStack alignItems="center" justifyContent="space-between">
                    <XStack alignItems="center" gap="$2">
                      <YStack width="$2" height="$2" backgroundColor="$color11" borderRadius="$10" />
                      <CardTitle fontSize="$6">{leftConfig.model}</CardTitle>
                    </XStack>
                    <DropdownMenu placement="bottom-end">
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <Settings size={16} />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent width={320}>
                        <YStack padding="$4">
                          <ModelConfigPanel config={leftConfig} setConfig={setLeftConfig} side="left" />
                        </YStack>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </XStack>
                </CardHeader>
                <CardContent>
                  {activeResult ? (
                    <YStack rowGap="$4">
                      <ScrollArea height={400}>
                        <YStack maxWidth="none">
                          <Paragraph whiteSpace="pre-wrap" fontSize="$3" color="$color11">
                            {activeResult.models[0]?.response || "No response"}
                          </Paragraph>
                        </YStack>
                      </ScrollArea>

                      {/* Metrics */}
                      <XStack alignItems="center" gap="$4" paddingTop="$4" borderTopWidth={1} borderColor="$borderColor">
                        <XStack alignItems="center" gap="$1">
                          <Clock size={12} />
                          <SizableText fontSize="$1" color="$color11">
                            {activeResult.models[0]?.latency.toFixed(0)}ms
                          </SizableText>
                        </XStack>
                        <XStack alignItems="center" gap="$1">
                          <Hash size={12} />
                          <SizableText fontSize="$1" color="$color11">
                            {activeResult.models[0]?.tokens} tokens
                          </SizableText>
                        </XStack>
                        <XStack alignItems="center" gap="$1">
                          <DollarSign size={12} />
                          <SizableText fontSize="$1" color="$color11">
                            ${activeResult.models[0]?.cost.toFixed(4)}
                          </SizableText>
                        </XStack>
                      </XStack>

                      {/* Actions */}
                      <XStack gap="$2">
                        <Button variant="outline" size="sm" gap="$2">
                          <Copy size={12} />
                          Copy
                        </Button>
                        <Button variant="outline" size="sm" gap="$2">
                          <RefreshCw size={12} />
                          Regenerate
                        </Button>
                        <Button variant="outline" size="sm" gap="$2">
                          <Download size={12} />
                          Export
                        </Button>
                      </XStack>
                    </YStack>
                  ) : (
                    <XStack height={400} alignItems="center" justifyContent="center">
                      <YStack>
                        <Sparkles size={48} />
                        <Paragraph color="$color11">Generate a response to see output</Paragraph>
                      </YStack>
                    </XStack>
                  )}
                </CardContent>
              </Card>

              {/* Right Model (if split view) */}
              {splitView && (
                <Card backgroundColor="$background" borderColor="$borderColor">
                  <CardHeader>
                    <XStack alignItems="center" justifyContent="space-between">
                      <XStack alignItems="center" gap="$2">
                        <YStack width="$2" height="$2" backgroundColor="$color11" borderRadius="$10" />
                        <CardTitle fontSize="$6">{rightConfig.model}</CardTitle>
                      </XStack>
                      <DropdownMenu placement="bottom-end">
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <Settings size={16} />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent width={320}>
                          <YStack padding="$4">
                            <ModelConfigPanel config={rightConfig} setConfig={setRightConfig} side="right" />
                          </YStack>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </XStack>
                  </CardHeader>
                  <CardContent>
                    {activeResult && activeResult.models[1] ? (
                      <YStack rowGap="$4">
                        <ScrollArea height={400}>
                          <YStack maxWidth="none">
                            <Paragraph whiteSpace="pre-wrap" fontSize="$3" color="$color11">
                              {activeResult.models[1].response}
                            </Paragraph>
                          </YStack>
                        </ScrollArea>

                        {/* Metrics */}
                        <XStack alignItems="center" gap="$4" paddingTop="$4" borderTopWidth={1} borderColor="$borderColor">
                          <XStack alignItems="center" gap="$1">
                            <Clock size={12} />
                            <SizableText fontSize="$1" color="$color11">
                              {activeResult.models[1].latency.toFixed(0)}ms
                            </SizableText>
                          </XStack>
                          <XStack alignItems="center" gap="$1">
                            <Hash size={12} />
                            <SizableText fontSize="$1" color="$color11">
                              {activeResult.models[1].tokens} tokens
                            </SizableText>
                          </XStack>
                          <XStack alignItems="center" gap="$1">
                            <DollarSign size={12} />
                            <SizableText fontSize="$1" color="$color11">
                              ${activeResult.models[1].cost.toFixed(4)}
                            </SizableText>
                          </XStack>
                        </XStack>

                        {/* Actions */}
                        <XStack gap="$2">
                          <Button variant="outline" size="sm" gap="$2">
                            <Copy size={12} />
                            Copy
                          </Button>
                          <Button variant="outline" size="sm" gap="$2">
                            <RefreshCw size={12} />
                            Regenerate
                          </Button>
                          <Button variant="outline" size="sm" gap="$2">
                            <Download size={12} />
                            Export
                          </Button>
                        </XStack>
                      </YStack>
                    ) : (
                      <XStack height={400} alignItems="center" justifyContent="center">
                        <YStack>
                          <Sparkles size={48} />
                          <Paragraph color="$color11">Generate a response to see output</Paragraph>
                        </YStack>
                      </XStack>
                    )}
                  </CardContent>
                </Card>
              )}
            </YStack>

            {/* Comparison Stats */}
            {activeResult && splitView && activeResult.models.length > 1 && (
              <Card marginTop="$4" backgroundColor="$background" borderColor="$borderColor">
                <CardHeader>
                  <CardTitle>Comparison Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                  <YStack gap="$4">
                    <div>
                      <Paragraph fontSize="$3" color="$color11" marginBottom="$2">Speed Comparison</Paragraph>
                      <YStack rowGap="$2">
                        {activeResult.models.map(model => (
                          <XStack key={model.model} alignItems="center" justifyContent="space-between">
                            <SizableText fontSize="$1" color="$color11">{model.model}</SizableText>
                            <SizableText fontSize="$3" fontWeight="500" color="$color">
                              {model.latency.toFixed(0)}ms
                            </SizableText>
                          </XStack>
                        ))}
                      </YStack>
                      {activeResult.models[0].latency < activeResult.models[1].latency ? (
                        <Badge className="mt-2">
                          {leftConfig.model} is {((1 - activeResult.models[0].latency / activeResult.models[1].latency) * 100).toFixed(0)}% faster
                        </Badge>
                      ) : (
                        <Badge className="mt-2">
                          {rightConfig.model} is {((1 - activeResult.models[1].latency / activeResult.models[0].latency) * 100).toFixed(0)}% faster
                        </Badge>
                      )}
                    </div>

                    <div>
                      <Paragraph fontSize="$3" color="$color11" marginBottom="$2">Token Usage</Paragraph>
                      <YStack rowGap="$2">
                        {activeResult.models.map(model => (
                          <XStack key={model.model} alignItems="center" justifyContent="space-between">
                            <SizableText fontSize="$1" color="$color11">{model.model}</SizableText>
                            <SizableText fontSize="$3" fontWeight="500" color="$color">
                              {model.tokens}
                            </SizableText>
                          </XStack>
                        ))}
                      </YStack>
                    </div>

                    <div>
                      <Paragraph fontSize="$3" color="$color11" marginBottom="$2">Cost Analysis</Paragraph>
                      <YStack rowGap="$2">
                        {activeResult.models.map(model => (
                          <XStack key={model.model} alignItems="center" justifyContent="space-between">
                            <SizableText fontSize="$1" color="$color11">{model.model}</SizableText>
                            <SizableText fontSize="$3" fontWeight="500" color="$color">
                              ${model.cost.toFixed(4)}
                            </SizableText>
                          </XStack>
                        ))}
                      </YStack>
                      {activeResult.models[0].cost < activeResult.models[1].cost ? (
                        <Badge variant="outline" style={{ marginTop: 8, borderColor: 'var(--green8)', color: 'var(--green11)' }}>
                          {leftConfig.model} is {((1 - activeResult.models[0].cost / activeResult.models[1].cost) * 100).toFixed(0)}% cheaper
                        </Badge>
                      ) : (
                        <Badge variant="outline" style={{ marginTop: 8, borderColor: 'var(--green8)', color: 'var(--green11)' }}>
                          {rightConfig.model} is {((1 - activeResult.models[1].cost / activeResult.models[0].cost) * 100).toFixed(0)}% cheaper
                        </Badge>
                      )}
                    </div>
                  </YStack>
                </CardContent>
              </Card>
            )}
          </YStack>
        </YStack>
      </YStack>
    </YStack>
  );
}