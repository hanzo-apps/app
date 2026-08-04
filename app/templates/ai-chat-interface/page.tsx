"use client";

import { YStack, XStack, Paragraph, SizableText } from '@hanzo/gui';
import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle, Button, ScrollArea, Avatar, AvatarFallback, Badge, Textarea } from '@hanzo/ui';
import { Send, Bot, User, Copy, RefreshCw, Sparkles, Settings } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
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
    <YStack minHeight="100%" backgroundColor="$background" padding="$4">
      <YStack maxWidth={896} alignSelf="center">
        <Card height="80vh" flexDirection="column">
          <CardHeader borderBottomWidth={1}>
            <XStack alignItems="center" justifyContent="space-between">
              <XStack alignItems="center" gap="$2">
                <XStack width="$7" height="$7" borderRadius="$5" borderWidth={1} borderColor="$borderColor" backgroundColor="$color3" alignItems="center" justifyContent="center">
                  <Sparkles size={24} />
                </XStack>
                <div>
                  <CardTitle>AI Chat Interface</CardTitle>
                  <CardDescription>Powered by @hanzo/ui components</CardDescription>
                </div>
              </XStack>
              <XStack alignItems="center" gap="$2">
                <Badge variant="outline">GPT-4</Badge>
                <Button variant="ghost" size="icon">
                  <Settings size={16} />
                </Button>
              </XStack>
            </XStack>
          </CardHeader>

          <ScrollArea flex={1} padding="$4">
            <YStack rowGap="$4">
              {messages.map((message) => (
                <XStack
                  key={message.id}
                  gap="$3" {...{ justifyContent: message.role === "user" ? "flex-end" : "flex-start" }}
                >
                  {message.role === "assistant" && (
                    <Avatar>
                      <AvatarFallback backgroundColor="$color3">
                        <Bot size={20} />
                      </AvatarFallback>
                    </Avatar>
                  )}

                  <Card maxWidth="70%" {...{ backgroundColor: message.role === "user" ? "$color3" : "transparent", borderColor: message.role === "user" ? "$borderColor" : "transparent" }}>
                    <CardContent padding="$3">
                      <Paragraph whiteSpace="pre-wrap" color="$color">
                        {message.content}
                        {message.isStreaming && (
                          <SizableText width="$2" height="$4" marginLeft="$1" backgroundColor="$color" />
                        )}
                      </Paragraph>
                      <XStack alignItems="center" gap="$2" marginTop="$2">
                        <SizableText fontSize="$1" opacity={0.6}>
                          {message.timestamp.toLocaleTimeString()}
                        </SizableText>
                        {message.role === "assistant" && !message.isStreaming && (
                          <XStack gap="$1">
                            <Button variant="ghost" size="icon">
                              <Copy size={12} />
                            </Button>
                            <Button variant="ghost" size="icon">
                              <RefreshCw size={12} />
                            </Button>
                          </XStack>
                        )}
                      </XStack>
                    </CardContent>
                  </Card>

                  {message.role === "user" && (
                    <Avatar>
                      <AvatarFallback>
                        <User size={20} />
                      </AvatarFallback>
                    </Avatar>
                  )}
                </XStack>
              ))}
              <div ref={scrollRef} />
            </YStack>
          </ScrollArea>

          <CardFooter borderTopWidth={1} padding="$4">
            <XStack gap="$2" width="100%">
              <Textarea
                placeholder="Type your message..."
                value={input}
                onChangeText={(t) => setInput(t)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                minHeight={50} maxHeight={150}
  />
              <Button
                onClick={handleSend}
                disabled={isLoading || !input.trim()}
                paddingHorizontal="$4"
              >
                {isLoading ? (
                  <Spinner size={16} />
                ) : (
                  <Send size={16} />
                )}
              </Button>
            </XStack>
          </CardFooter>
        </Card>
      </YStack>
    </YStack>
  );
}