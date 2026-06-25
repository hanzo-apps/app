"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from "@hanzo/ui";
import { Button } from "@hanzo/ui";
import { Textarea } from "@hanzo/ui";
import { Badge } from "@hanzo/ui";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@hanzo/ui";
import { AspectRatio } from "@hanzo/ui";
import { ScrollArea } from "@hanzo/ui";
import {
  Sparkles,
  Wand2,
  Download,
  RefreshCw,
  Loader2,
  ImageIcon,
  Heart,
  Trash2
} from "lucide-react";
import { cn } from "@/lib/utils";

interface GeneratedImage {
  id: string;
  prompt: string;
  style: string;
  ratio: string;
  seed: number;
  liked: boolean;
}

const STYLE_PRESETS = [
  { id: "photorealistic", name: "Photorealistic" },
  { id: "digital-art", name: "Digital Art" },
  { id: "anime", name: "Anime" },
  { id: "oil-painting", name: "Oil Painting" },
  { id: "3d-render", name: "3D Render" },
  { id: "watercolor", name: "Watercolor" }
];

const ASPECT_RATIOS = [
  { id: "1:1", name: "Square (1:1)", ratio: 1 },
  { id: "16:9", name: "Landscape (16:9)", ratio: 16 / 9 },
  { id: "9:16", name: "Portrait (9:16)", ratio: 9 / 16 }
];

const PROMPT_IDEAS = [
  "A serene mountain lake at sunrise, mist over the water",
  "Futuristic city skyline with flying vehicles, neon lights",
  "A cozy reading nook with warm light and plants",
  "Abstract geometric patterns in vivid gradients"
];

// Deterministic gradient stand-in for a generated image (no external API).
function gradientFor(seed: number): string {
  const a = (seed * 47) % 360;
  const b = (seed * 131) % 360;
  return `linear-gradient(135deg, hsl(${a} 80% 55%), hsl(${b} 75% 45%))`;
}

export default function AIImageGenerator() {
  const [prompt, setPrompt] = useState("");
  const [style, setStyle] = useState("photorealistic");
  const [ratio, setRatio] = useState("1:1");
  const [isGenerating, setIsGenerating] = useState(false);
  const [images, setImages] = useState<GeneratedImage[]>([]);

  const selectedRatio = ASPECT_RATIOS.find((r) => r.id === ratio) ?? ASPECT_RATIOS[0];

  const handleGenerate = async () => {
    if (!prompt.trim() || isGenerating) return;
    setIsGenerating(true);

    // Simulate the generation latency of a text-to-image model.
    await new Promise((resolve) => setTimeout(resolve, 1400));

    const batch: GeneratedImage[] = Array.from({ length: 4 }).map((_, i) => ({
      id: `${Date.now()}-${i}`,
      prompt,
      style,
      ratio,
      seed: Math.floor(Math.random() * 100000),
      liked: false
    }));

    setImages((prev) => [...batch, ...prev]);
    setIsGenerating(false);
  };

  const toggleLike = (id: string) =>
    setImages((prev) =>
      prev.map((img) => (img.id === id ? { ...img, liked: !img.liked } : img))
    );

  const remove = (id: string) =>
    setImages((prev) => prev.filter((img) => img.id !== id));

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-6xl mx-auto grid lg:grid-cols-[360px_1fr] gap-6">
        {/* Controls */}
        <Card className="h-fit">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#fd4444] to-[#ff6b6b] flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <CardTitle>AI Image Generator</CardTitle>
                <CardDescription>Powered by @hanzo/ui components</CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Prompt</label>
              <Textarea
                placeholder="Describe the image you want to create..."
                value={prompt}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setPrompt(e.target.value)}
                className="min-h-[100px]"
              />
              <div className="flex flex-wrap gap-1">
                {PROMPT_IDEAS.map((idea) => (
                  <Badge
                    key={idea}
                    variant="secondary"
                    className="cursor-pointer text-xs"
                    onClick={() => setPrompt(idea)}
                  >
                    {idea.slice(0, 22)}…
                  </Badge>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Style</label>
              <Select value={style} onValueChange={setStyle}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STYLE_PRESETS.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Aspect Ratio</label>
              <Select value={ratio} onValueChange={setRatio}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ASPECT_RATIOS.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>

          <CardFooter>
            <Button
              onClick={handleGenerate}
              disabled={isGenerating || !prompt.trim()}
              className="w-full bg-gradient-to-r from-[#fd4444] to-[#ff6b6b]"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating…
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4 mr-2" />
                  Generate
                </>
              )}
            </Button>
          </CardFooter>
        </Card>

        {/* Gallery */}
        <Card className="min-h-[80vh]">
          <CardHeader className="border-b">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Gallery</CardTitle>
              <Badge variant="outline">{images.length} images</Badge>
            </div>
          </CardHeader>
          <ScrollArea className="h-[calc(80vh-72px)] p-4">
            {isGenerating && (
              <div className="grid sm:grid-cols-2 gap-4 mb-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <AspectRatio key={i} ratio={selectedRatio.ratio}>
                    <div className="w-full h-full rounded-lg bg-muted animate-pulse flex items-center justify-center">
                      <ImageIcon className="w-8 h-8 text-muted-foreground/40" />
                    </div>
                  </AspectRatio>
                ))}
              </div>
            )}

            {images.length === 0 && !isGenerating ? (
              <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground py-20">
                <ImageIcon className="w-12 h-12 mb-3 opacity-40" />
                <p>No images yet. Enter a prompt and generate your first image.</p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-4">
                {images.map((img) => {
                  const r = ASPECT_RATIOS.find((x) => x.id === img.ratio)?.ratio ?? 1;
                  return (
                    <div key={img.id} className="group relative">
                      <AspectRatio ratio={r}>
                        <div
                          className="w-full h-full rounded-lg"
                          style={{ background: gradientFor(img.seed) }}
                        />
                      </AspectRatio>
                      <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/70 to-transparent rounded-b-lg opacity-0 group-hover:opacity-100 transition-opacity">
                        <p className="text-xs text-white line-clamp-1">{img.prompt}</p>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-[10px] text-white/70">
                            {STYLE_PRESETS.find((s) => s.id === img.style)?.name} · seed {img.seed}
                          </span>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-white hover:bg-white/20"
                              onClick={() => toggleLike(img.id)}
                            >
                              <Heart className={cn("w-3.5 h-3.5", img.liked && "fill-current text-[#fd4444]")} />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-white hover:bg-white/20">
                              <Download className="w-3.5 h-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-white hover:bg-white/20">
                              <RefreshCw className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-white hover:bg-white/20"
                              onClick={() => remove(img.id)}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </Card>
      </div>
    </div>
  );
}
