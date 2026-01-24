"use client";

import { useState, useRef, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from "@hanzo/ui";
import { Button } from "@hanzo/ui";
import { Input } from "@hanzo/ui";
import { ScrollArea } from "@hanzo/ui";
import { Avatar, AvatarFallback, AvatarImage } from "@hanzo/ui";
import { Badge } from "@hanzo/ui";
import { Textarea } from "@hanzo/ui";
import {
  Send,
  Bot,
  User,
  Copy,
  Download,
  RefreshCw,
  Loader2,
  Sparkles,
  Settings
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
}

export default function AIChatInterface() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content: "Hello! I'm your AI assistant powered by @hanzo/ui. How can I help you today?",
      timestamp: new Date(),
    }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    // Simulate streaming response
    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: "assistant",
      content: "",
      timestamp: new Date(),
      isStreaming: true
    };

    setMessages(prev => [...prev, assistantMessage]);

    // Simulate streaming text
    const response = `I understand you're asking about "${input}". Let me help you with that.

This response demonstrates the streaming capability of our chat interface built with @hanzo/ui components. The interface features:

• Real-time message streaming
• Markdown support for rich text formatting
• Code syntax highlighting
• Responsive design that works on all devices
• Dark/light theme support

The UI is built entirely with @hanzo/ui primitives like Card, Button, ScrollArea, and Avatar components, ensuring consistency with the Hanzo design system.`;

    let currentText = "";
    const words = response.split(" ");

    for (let i = 0; i < words.length; i++) {
      currentText += (i > 0 ? " " : "") + words[i];
      await new Promise(resolve => setTimeout(resolve, 30));

      setMessages(prev => prev.map(msg =>
        msg.id === assistantMessage.id
          ? { ...msg, content: currentText }
          : msg
      ));
    }

    setMessages(prev => prev.map(msg =>
      msg.id === assistantMessage.id
        ? { ...msg, isStreaming: false }
        : msg
    ));

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto">
        <Card className="h-[80vh] flex flex-col">
          <CardHeader className="border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#fd4444] to-[#ff6b6b] flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div>
                  <CardTitle>AI Chat Interface</CardTitle>
                  <CardDescription>Powered by @hanzo/ui components</CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">GPT-4</Badge>
                <Button variant="ghost" size="icon">
                  <Settings className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>

          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "flex gap-3",
                    message.role === "user" ? "justify-end" : "justify-start"
                  )}
                >
                  {message.role === "assistant" && (
                    <Avatar>
                      <AvatarFallback className="bg-[#fd4444]/10">
                        <Bot className="w-5 h-5 text-[#fd4444]" />
                      </AvatarFallback>
                    </Avatar>
                  )}

                  <Card className={cn(
                    "max-w-[70%]",
                    message.role === "user"
                      ? "bg-gradient-to-r from-[#fd4444] to-[#ff6b6b] text-white"
                      : "bg-muted"
                  )}>
                    <CardContent className="p-3">
                      <p className="whitespace-pre-wrap">
                        {message.content}
                        {message.isStreaming && (
                          <span className="inline-block w-2 h-4 ml-1 bg-[#fd4444] animate-pulse" />
                        )}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs opacity-60">
                          {message.timestamp.toLocaleTimeString()}
                        </span>
                        {message.role === "assistant" && !message.isStreaming && (
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" className="h-6 w-6">
                              <Copy className="w-3 h-3" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-6 w-6">
                              <RefreshCw className="w-3 h-3" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {message.role === "user" && (
                    <Avatar>
                      <AvatarFallback>
                        <User className="w-5 h-5" />
                      </AvatarFallback>
                    </Avatar>
                  )}
                </div>
              ))}
              <div ref={scrollRef} />
            </div>
          </ScrollArea>

          <CardFooter className="border-t p-4">
            <div className="flex gap-2 w-full">
              <Textarea
                placeholder="Type your message..."
                value={input}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setInput(e.target.value)}
                onKeyDown={(e: React.KeyboardEvent<HTMLTextAreaElement>) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                className="min-h-[50px] max-h-[150px]"
              />
              <Button
                onClick={handleSend}
                disabled={isLoading || !input.trim()}
                className="px-4"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}