"use client";

import { useState, useEffect } from "react";
import { Button } from "@hanzo/ui";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@hanzo/ui";
import { Badge } from "@hanzo/ui";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@hanzo/ui";
import {
  Sparkles,
  Code,
  Zap,
  Copy,
  Globe,
  Github,
  Rocket,
  ArrowRight,
  Check,
  Loader2
} from "lucide-react";

interface TemplateLoaderProps {
  templateRepo: {
    platform: string;
    owner: string;
    name: string;
    fullUrl: string;
  };
  action: "edit" | "deploy";
  onProceed: (mode: "fork" | "edit" | "deploy") => void;
}

export function TemplateLoader({ templateRepo, action, onProceed }: TemplateLoaderProps) {
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [selectedMode, setSelectedMode] = useState<"fork" | "edit" | "deploy">(
    action === "deploy" ? "deploy" : "edit"
  );

  const templateTitle = templateRepo.name
    .replace(/-/g, " ")
    .replace(/\b\w/g, (l) => l.toUpperCase())
    .replace("Template ", "");

  const handleCopyCommand = () => {
    const command = `npx create-hanzo-app@latest my-app --template ${templateRepo.owner}/${templateRepo.name}`;
    navigator.clipboard.writeText(command);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleProceed = () => {
    setLoading(true);
    onProceed(selectedMode);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full shadow-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-gradient-to-br from-[#fd4444] to-[#ff6b6b] flex items-center justify-center">
            <Sparkles className="w-9 h-9 text-white" />
          </div>
          <CardTitle className="text-3xl font-bold">{templateTitle}</CardTitle>
          <CardDescription className="text-lg mt-2">
            From {templateRepo.platform === "github" ? "GitHub" : "Hugging Face"}: {templateRepo.owner}/{templateRepo.name}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="bg-muted rounded-lg p-4">
            <h3 className="font-semibold mb-2">What would you like to do?</h3>
            <Tabs value={selectedMode} onValueChange={(v: string) => setSelectedMode(v as "edit" | "fork" | "deploy")}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="edit">
                  <Code className="w-4 h-4 mr-2" />
                  Edit
                </TabsTrigger>
                <TabsTrigger value="fork">
                  <Copy className="w-4 h-4 mr-2" />
                  Fork
                </TabsTrigger>
                <TabsTrigger value="deploy">
                  <Zap className="w-4 h-4 mr-2" />
                  Deploy
                </TabsTrigger>
              </TabsList>

              <TabsContent value="edit" className="mt-4 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                    <Code className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h4 className="font-semibold">Edit in Hanzo Cloud IDE</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      Start editing immediately in our cloud development environment.
                      No setup required - just code and see live previews.
                    </p>
                    <div className="flex gap-2 mt-2">
                      <Badge variant="secondary">Instant Start</Badge>
                      <Badge variant="secondary">Live Preview</Badge>
                      <Badge variant="secondary">AI Assistant</Badge>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="fork" className="mt-4 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-red-100 dark:bg-[#fd4444]/20 flex items-center justify-center flex-shrink-0">
                    <Copy className="w-5 h-5 text-[#fd4444] dark:text-[#ff6b6b]" />
                  </div>
                  <div>
                    <h4 className="font-semibold">Fork to Your Account</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      Create your own copy of this template. You'll get your own repository
                      that you can customize and deploy independently.
                    </p>
                    <div className="flex gap-2 mt-2">
                      <Badge variant="secondary">Own Repository</Badge>
                      <Badge variant="secondary">Full Control</Badge>
                      <Badge variant="secondary">Version Control</Badge>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="deploy" className="mt-4 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                    <Rocket className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <h4 className="font-semibold">Deploy to Hanzo Cloud</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      Deploy this template instantly to Hanzo Cloud. Get a live URL
                      and automatic SSL certificate in seconds.
                    </p>
                    <div className="flex gap-2 mt-2">
                      <Badge variant="secondary">Instant Deploy</Badge>
                      <Badge variant="secondary">Custom Domain</Badge>
                      <Badge variant="secondary">Auto Scaling</Badge>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          <div className="border rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold">Quick Start Command</h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopyCommand}
                className="h-8 px-2"
              >
                {copied ? (
                  <>
                    <Check className="w-3 h-3 mr-1" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3 mr-1" />
                    Copy
                  </>
                )}
              </Button>
            </div>
            <code className="block bg-muted px-3 py-2 rounded text-xs overflow-x-auto">
              npx create-hanzo-app@latest my-app --template {templateRepo.owner}/{templateRepo.name}
            </code>
          </div>

          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <a
              href={templateRepo.fullUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 hover:text-foreground transition-colors"
            >
              <Github className="w-4 h-4" />
              View Source
            </a>
            <a
              href={`https://hanzo.app/docs/templates/${templateRepo.name}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 hover:text-foreground transition-colors"
            >
              <Globe className="w-4 h-4" />
              Documentation
            </a>
          </div>
        </CardContent>

        <CardFooter className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => window.history.back()}
            className="flex-1"
            disabled={loading}
          >
            Back to Gallery
          </Button>
          <Button
            onClick={handleProceed}
            className="flex-1 bg-gradient-to-r from-[#fd4444] to-[#ff6b6b] hover:from-[#e03e3e] hover:to-[#fd4444]"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Loading...
              </>
            ) : (
              <>
                {selectedMode === "edit" && "Open Editor"}
                {selectedMode === "fork" && "Fork Template"}
                {selectedMode === "deploy" && "Deploy Now"}
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}