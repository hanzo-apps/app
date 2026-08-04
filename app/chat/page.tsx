"use client";

import { XStack, YStack, Paragraph, SizableText, H2 } from '@hanzo/gui';
import { useState, useEffect, useRef } from "react";
import { useUser } from "@/hooks/useUser";
import Link from "next/link";
import { MessageCircle, Plus, Search, Settings, Code2, Paperclip, Edit3, Trash2, Copy, Share2, Sparkles, Image as ImageIcon, Mic, StopCircle, PanelLeftClose, PanelLeft, RefreshCw, Bot, User, ArrowUp, MoreHorizontal, Users } from "lucide-react";
import { Button, Input, ScrollArea, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Textarea } from '@hanzo/ui';
import { DEFAULT_MODEL } from "@/lib/providers";
import { useModels } from "@/lib/hooks/use-models";
import { type BotAgent, TEAM_PRESETS, getBotGateway } from "@/lib/bot-gateway";

interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
  attachments?: string[];
  model?: string;
  agentId?: string;
  agentName?: string;
  agentEmoji?: string;
  isStreaming?: boolean;
  error?: boolean;
}

interface Chat {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
  model: string;
  agentId?: string;
}

export default function ChatPage() {
  const { user } = useUser();
  const [chats, setChats] = useState<Chat[]>([
    {
      id: "1",
      title: "React Performance Optimization",
      messages: [
        {
          id: "1",
          role: "user",
          content: "What are the best practices for optimizing React app performance?",
          timestamp: new Date(Date.now() - 3600000),
        },
        {
          id: "2",
          role: "assistant",
          content: "Here are key strategies for optimizing React performance:\n\n1. **Code Splitting & Lazy Loading**\n   - Use React.lazy() and Suspense for route-based splitting\n   - Implement dynamic imports for heavy components\n\n2. **Memoization Techniques**\n   - Use React.memo() for expensive components\n   - Apply useMemo() for costly computations\n   - Utilize useCallback() for function references\n\n3. **Virtual List Rendering**\n   - Implement react-window or react-virtualized for long lists\n   - Only render visible items in viewport\n\n4. **State Management**\n   - Keep state as local as possible\n   - Use context API judiciously\n   - Consider state management libraries for complex apps\n\n5. **Bundle Optimization**\n   - Tree shaking and dead code elimination\n   - Minimize bundle size with tools like webpack-bundle-analyzer\n\nWould you like me to elaborate on any of these techniques?",
          timestamp: new Date(Date.now() - 3500000),
          model: DEFAULT_MODEL
        }
      ],
      createdAt: new Date(Date.now() - 86400000),
      updatedAt: new Date(Date.now() - 3500000),
      model: DEFAULT_MODEL
    },
    {
      id: "2",
      title: "TypeScript Best Practices",
      messages: [],
      createdAt: new Date(Date.now() - 172800000),
      updatedAt: new Date(Date.now() - 172800000),
      model: "gpt-5.2"
    },
    {
      id: "3",
      title: "Building a REST API",
      messages: [],
      createdAt: new Date(Date.now() - 259200000),
      updatedAt: new Date(Date.now() - 259200000),
      model: DEFAULT_MODEL
    }
  ]);

  const [activeChat, setActiveChat] = useState<Chat | null>(chats[0]);
  const [inputMessage, setInputMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(
    () => typeof window !== "undefined" && !window.matchMedia("(min-width:1024px)").matches
  );
  // Default and list both come from the one catalog — no literals here.
  const { models } = useModels();
  const [selectedModel, setSelectedModel] = useState(DEFAULT_MODEL);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isStreaming, setIsStreaming] = useState(false);

  // Agent/bot selection
  const [agents, setAgents] = useState<BotAgent[]>(TEAM_PRESETS);
  const [selectedAgentId, setSelectedAgentId] = useState<string>("dev");
  const [gatewayConnected, setGatewayConnected] = useState(false);

  const selectedAgent = agents.find((a) => a.id === selectedAgentId) ?? agents[0];

  // Load agents from gateway
  useEffect(() => {
    const gw = getBotGateway();
    gw.listAgents()
      .then((list) => {
        if (list.length > 0) setAgents(list);
        setGatewayConnected(true);
      })
      .catch(() => {
        // Gateway unavailable - use static presets
        setGatewayConnected(false);
      });

    // Listen for agent streaming events
    const unsub = gw.on("agent", (payload: unknown) => {
      const p = payload as { text?: string; runId?: string; done?: boolean };
      if (!p?.text) return;
      // Update the streaming message content
      setActiveChat((prev) => {
        if (!prev) return prev;
        const msgs = [...prev.messages];
        const last = msgs[msgs.length - 1];
        if (last?.role === "assistant" && last.isStreaming) {
          msgs[msgs.length - 1] = {
            ...last,
            content: last.content + p.text,
            isStreaming: !p.done,
          };
          return { ...prev, messages: msgs, updatedAt: new Date() };
        }
        return prev;
      });
      if (p.done) setIsStreaming(false);
    });

    return () => { unsub(); };
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeChat?.messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [inputMessage]);

  const sendMessage = async () => {
    if (!inputMessage.trim() || !activeChat || isStreaming) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: inputMessage,
      timestamp: new Date(),
    };

    // Update current chat
    const updatedChat: Chat = {
      ...activeChat,
      messages: [...activeChat.messages, newMessage],
      updatedAt: new Date(),
      agentId: selectedAgentId,
    };

    setActiveChat(updatedChat);
    setChats(prev => prev.map(c => c.id === activeChat.id ? updatedChat : c));
    setInputMessage("");
    setIsStreaming(true);

    // Create streaming response placeholder
    const aiResponse: Message = {
      id: (Date.now() + 1).toString(),
      role: "assistant",
      content: "",
      timestamp: new Date(),
      model: selectedModel,
      agentId: selectedAgentId,
      agentName: selectedAgent?.name,
      agentEmoji: selectedAgent?.emoji,
      isStreaming: true
    };

    const chatWithStreamingResponse = {
      ...updatedChat,
      messages: [...updatedChat.messages, aiResponse],
      updatedAt: new Date(),
    };

    setActiveChat(chatWithStreamingResponse);
    setChats(prev => prev.map(c => c.id === activeChat.id ? chatWithStreamingResponse : c));

    // Try bot gateway first, fall back to simulated response
    if (gatewayConnected) {
      try {
        const gw = getBotGateway();
        await gw.sendMessage({
          message: inputMessage,
          agentId: selectedAgentId,
          sessionKey: `agent:${selectedAgentId}:main`,
        });
        // Response will come via the "agent" event listener
        return;
      } catch {
        // Fall through to simulated response
      }
    }

    // Simulated streaming response (when gateway is unavailable)
    const fullResponse = `${selectedAgent?.emoji ?? ""} **${selectedAgent?.name ?? "Hanzo"}** here.\n\n${inputMessage.length > 20 ? `I'll help you with that.` : `I'll help you with "${inputMessage}".`}\n\nThis is a simulated response - connect to the bot gateway for real AI responses.\n\nTo start the bot gateway:\n\`\`\`\ncd ~/work/hanzo/bot && make dev\n\`\`\``;

    let currentText = "";
    const words = fullResponse.split(" ");
    let wordIndex = 0;

    const streamInterval = setInterval(() => {
      if (wordIndex < words.length) {
        currentText += (wordIndex > 0 ? " " : "") + words[wordIndex];
        wordIndex++;

        const updatedResponse = {
          ...aiResponse,
          content: currentText
        };

        const chatWithUpdatedResponse = {
          ...chatWithStreamingResponse,
          messages: [...updatedChat.messages, updatedResponse],
          updatedAt: new Date(),
        };

        setActiveChat(chatWithUpdatedResponse);
        setChats(prev => prev.map(c => c.id === activeChat.id ? chatWithUpdatedResponse : c));
      } else {
        clearInterval(streamInterval);
        setIsStreaming(false);

        const finalResponse = {
          ...aiResponse,
          content: currentText,
          isStreaming: false
        };

        const finalChat = {
          ...chatWithStreamingResponse,
          messages: [...updatedChat.messages, finalResponse],
          updatedAt: new Date(),
        };

        setActiveChat(finalChat);
        setChats(prev => prev.map(c => c.id === activeChat.id ? finalChat : c));
      }
    }, 50);
  };

  const selectChat = (chat: Chat) => {
    setActiveChat(chat);
    // Below lg the sidebar is an overlay — dismiss it once a chat is chosen
    if (typeof window !== "undefined" && !window.matchMedia("(min-width:1024px)").matches) {
      setSidebarCollapsed(true);
    }
  };

  const createNewChat = () => {
    const newChat: Chat = {
      id: Date.now().toString(),
      title: "New Chat",
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      model: selectedModel
    };

    setChats([newChat, ...chats]);
    setActiveChat(newChat);
  };

  const deleteChat = (chatId: string) => {
    setChats(prev => prev.filter(c => c.id !== chatId));
    if (activeChat?.id === chatId) {
      setActiveChat(chats.find(c => c.id !== chatId) || null);
    }
  };

  const duplicateChat = (chatId: string) => {
    const chatToDuplicate = chats.find(c => c.id === chatId);
    if (chatToDuplicate) {
      const newChat: Chat = {
        ...chatToDuplicate,
        id: Date.now().toString(),
        title: `${chatToDuplicate.title} (Copy)`,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      setChats([newChat, ...chats]);
    }
  };

  const copyMessage = (content: string) => {
    navigator.clipboard.writeText(content);
  };

  // Filter chats based on search
  const filteredChats = chats.filter(chat =>
    chat.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    chat.messages.some(m => m.content.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Sort chats by date
  const sortedChats = [...filteredChats].sort((a, b) =>
    b.updatedAt.getTime() - a.updatedAt.getTime()
  );

  // Format relative time
  const formatRelativeTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <XStack position="relative" height="100%" backgroundColor="$background">
      {/* Sidebar — overlay drawer below lg so it never steals width; in flow at lg+ */}
      <YStack position="absolute" top="$0" bottom="$0" left="$0" zIndex={30} backgroundColor="$background" borderRightWidth={1} borderColor="$borderColor" $lg={{ position: "relative", zIndex: 0 }} {...{ width: sidebarCollapsed ? "$0" : 256, overflow: sidebarCollapsed ? "hidden" : undefined }}>
        {/* Sidebar Header */}
        <YStack padding="$3" borderBottomWidth={1} borderColor="$borderColor">
          <Button
            onClick={createNewChat}
            width="100%" backgroundColor="$background" color="$color" borderWidth={1} borderColor="$borderColor" justifyContent="flex-start" gap="$2" hoverStyle={{ backgroundColor: "$color3" }}
          >
            <Plus size={16} />
            New chat
          </Button>
        </YStack>

        {/* Search */}
        <YStack padding="$3">
          <YStack position="relative">
            <Search size={16} color="$color11" />
            <Input
              placeholder="Search"
              value={searchQuery}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
              paddingLeft={36} backgroundColor="$background" borderColor="$borderColor" color="$color" placeholderTextColor="$color11"
  />
          </YStack>
        </YStack>

        {/* Chat List */}
        <ScrollArea flex={1}>
          <YStack padding="$2" rowGap="$1">
            {sortedChats.map(chat => (
              <Button
                key={chat.id}
                onClick={() => selectChat(chat)}
                width="100%" textAlign="left" padding="$3" borderRadius="$5" group position="relative" {...{ backgroundColor: activeChat?.id === chat.id ? "$color3" : undefined, color: activeChat?.id === chat.id ? "$color" : "$color11", hoverStyle: activeChat?.id === chat.id ? undefined : {"backgroundColor":"$color3","color":"$color"} }}
              >
                <XStack alignItems="flex-start" gap="$3">
                  <MessageCircle size={16} />
                  <YStack flex={1} minWidth={0}>
                    <Paragraph fontSize="$3" fontWeight="500" numberOfLines={1}>{chat.title}</Paragraph>
                    <Paragraph fontSize="$1" color="$color11" marginTop="$0.5">
                      {formatRelativeTime(chat.updatedAt)}
                    </Paragraph>
                  </YStack>
                </XStack>

                {/* Hover Actions */}
                <YStack position="absolute" right="$2" top="$2" opacity={0} $group-hover={{ opacity: 1 }}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" padding="$0">
                        <MoreHorizontal size={16} />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" width="$19">
                      <DropdownMenuItem onClick={() => duplicateChat(chat.id)}>
                        <Copy size={16} />
                        Duplicate
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Edit3 size={16} />
                        Rename
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Share2 size={16} />
                        Share
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => deleteChat(chat.id)}
                        color="$red9"
                      >
                        <Trash2 size={16} />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </YStack>
              </Button>
            ))}
          </YStack>
        </ScrollArea>
      </YStack>

      {/* Main Chat Area */}
      <YStack flex={1} minWidth={0}>
        {/* Chat Header */}
        <YStack borderBottomWidth={1} borderColor="$borderColor" padding="$3">
          <XStack alignItems="center" justifyContent="space-between" flexWrap="wrap" rowGap="$2">
            <XStack alignItems="center" gap="$3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                color="$color11" hoverStyle={{ color: "$color" }}
              >
                {sidebarCollapsed ? <PanelLeft size={16} /> : <PanelLeftClose size={16} />}
              </Button>
              <XStack alignItems="center" gap="$2">
                {/* Agent Selector */}
                <Select value={selectedAgentId} onValueChange={setSelectedAgentId}>
                  <SelectTrigger minWidth={0} flex={1} backgroundColor="$background" borderColor="$borderColor" color="$color" $md={{ flex: 0, width: 160 }}>
                    <SelectValue>
                      <SizableText alignItems="center" gap="$2">
                        <span>{selectedAgent?.emoji}</span>
                        <span>{selectedAgent?.name}</span>
                      </SizableText>
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <DropdownMenuLabel color="$color11" fontSize="$1" paddingHorizontal="$2" paddingVertical="$1">
                      <Users size={12} />
                      Team Agents
                    </DropdownMenuLabel>
                    {agents.map((agent) => (
                      <SelectItem key={agent.id} value={agent.id}>
                        <SizableText alignItems="center" gap="$2">
                          <span>{agent.emoji}</span>
                          <span>{agent.name}</span>
                          {agent.description && (
                            <SizableText fontSize="$1" color="$color11" marginLeft="$1">{agent.description}</SizableText>
                          )}
                        </SizableText>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Model Selector */}
                <Select value={selectedModel} onValueChange={setSelectedModel}>
                  <SelectTrigger minWidth={0} flex={1} backgroundColor="$background" borderColor="$borderColor" color="$color" $md={{ flex: 0, width: 180 }}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {models.map((m) => (
                      <SelectItem key={m.value} value={m.value}>
                        {m.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Gateway status indicator */}
                <YStack width="$2" height="$2" borderRadius="$10" {...{ backgroundColor: gatewayConnected ? "$green9" : "$color11" }} title={gatewayConnected ? "Bot gateway connected" : "Bot gateway offline"} />
              </XStack>
            </XStack>
            <XStack alignItems="center" gap="$2">
              <Link href="/playground">
                <Button variant="ghost" size="sm" color="$color11" hoverStyle={{ color: "$color" }}>
                  <Code2 size={16} />
                  <SizableText display="none">Playground</SizableText>
                </Button>
              </Link>
              <Link href="/agents">
                <Button variant="ghost" size="sm" color="$color11" hoverStyle={{ color: "$color" }}>
                  <Bot size={16} />
                  <SizableText display="none">Agents</SizableText>
                </Button>
              </Link>
              <Link href="/integrations">
                <Button variant="ghost" size="sm" color="$color11" hoverStyle={{ color: "$color" }}>
                  <Settings size={16} />
                </Button>
              </Link>
            </XStack>
          </XStack>
        </YStack>

        {/* Messages */}
        <ScrollArea flex={1}>
          <YStack padding="$5" maxWidth={896} alignSelf="center">
            {activeChat ? (
              <YStack rowGap="$5">
                {activeChat.messages.map((message, index) => (
                  <YStack key={message.id} group>
                    <XStack gap="$4">
                      {message.role === "assistant" ? (
                        <XStack width="$6" height="$6" borderRadius="$5" alignItems="center" justifyContent="center" flexShrink={0}>
                          <SizableText color="white" fontWeight="500" fontSize="$3">
                            {message.agentEmoji ?? "H"}
                          </SizableText>
                        </XStack>
                      ) : (
                        <XStack width="$6" height="$6" borderRadius="$10" backgroundColor="$color3" alignItems="center" justifyContent="center" flexShrink={0}>
                          <User size={16} color="$color11" />
                        </XStack>
                      )}
                      <YStack flex={1} rowGap="$2">
                        <XStack alignItems="center" gap="$2">
                          <SizableText fontWeight="500" color="$color">
                            {message.role === "assistant"
                              ? (message.agentName ?? "Hanzo")
                              : "You"}
                          </SizableText>
                          {message.model && (
                            <SizableText fontSize="$1" color="$color11">{message.model}</SizableText>
                          )}
                          <SizableText fontSize="$1" color="$color11">
                            {formatRelativeTime(message.timestamp)}
                          </SizableText>
                        </XStack>
                        <SizableText color="$color" maxWidth="none" display="flex" flexDirection="column">
                          <Paragraph whiteSpace="pre-wrap">{message.content}</Paragraph>
                          {message.isStreaming && (
                            <SizableText width="$2" height="$4" marginLeft="$1" backgroundColor="$color" />
                          )}
                        </SizableText>
                        {message.role === "assistant" && !message.isStreaming && (
                          <XStack alignItems="center" gap="$2" opacity={0} $group-hover={{ opacity: 1 }}>
                            <Button
                              variant="ghost"
                              size="sm"
                              paddingHorizontal="$2" color="$color11" hoverStyle={{ color: "$color" }}
                              onClick={() => copyMessage(message.content)}
                            >
                              <Copy size={12} />
                              Copy
                            </Button>
                            <Button variant="ghost" size="sm" paddingHorizontal="$2" color="$color11" hoverStyle={{ color: "$color" }}>
                              <RefreshCw size={12} />
                              Regenerate
                            </Button>
                            <Button variant="ghost" size="sm" paddingHorizontal="$2" color="$color11" hoverStyle={{ color: "$color" }}>
                              <Share2 size={12} />
                            </Button>
                          </XStack>
                        )}
                      </YStack>
                    </XStack>
                  </YStack>
                ))}
                <div ref={messagesEndRef} />
              </YStack>
            ) : (
              <XStack alignItems="center" justifyContent="center" height="100%">
                <SizableText textAlign="center" rowGap="$4" display="flex" flexDirection="column">
                  <XStack width="$11" height="$11" borderRadius="$8" alignItems="center" justifyContent="center" alignSelf="center">
                    <SizableText color="white" fontWeight="500" fontSize="$11">{selectedAgent?.emoji ?? "H"}</SizableText>
                  </XStack>
                  <H2 fontSize="$8" fontWeight="500" color="$color">Chat with {selectedAgent?.name ?? "Hanzo"}</H2>
                  <Paragraph color="$color11" maxWidth={448}>
                    {selectedAgent?.description ?? "Start a new chat or select an existing one to continue your conversation"}
                  </Paragraph>
                  <Button onClick={createNewChat} gap="$2">
                    <Plus size={16} />
                    New Chat
                  </Button>
                </SizableText>
              </XStack>
            )}
          </YStack>
        </ScrollArea>

        {/* Input Area */}
        {activeChat && (
          <YStack borderTopWidth={1} borderColor="$borderColor" padding="$4">
            <YStack maxWidth={896} alignSelf="center">
              <XStack alignItems="flex-end" gap="$3">
                <XStack gap="$1">
                  <Button variant="ghost" size="sm" color="$color11" hoverStyle={{ color: "$color" }}>
                    <Paperclip size={16} />
                  </Button>
                  <Button variant="ghost" size="sm" color="$color11" hoverStyle={{ color: "$color" }}>
                    <ImageIcon size={16} />
                  </Button>
                  <Button variant="ghost" size="sm" color="$color11" hoverStyle={{ color: "$color" }}>
                    <Mic size={16} />
                  </Button>
                </XStack>
                <YStack flex={1} position="relative">
                  <Textarea
                    ref={textareaRef}
                    value={inputMessage}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setInputMessage(e.target.value)}
                    onKeyDown={(e: React.KeyboardEvent<HTMLTextAreaElement>) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                      }
                    }}
                    placeholder={`Message ${selectedAgent?.name ?? "Hanzo"}...`}
                    minHeight={44} maxHeight={200} backgroundColor="$background" borderColor="$borderColor" color="$color" placeholderTextColor="$color11" resize="none" paddingRight="$8"
                    rows={1}
  />
                  <Button
                    onClick={sendMessage}
                    disabled={!inputMessage.trim() || isStreaming}
                    size="sm"
                    position="absolute" right="$2" bottom="$2" height="$6" width="$6" padding="$0" backgroundColor="$color12" color="$background" hoverStyle={{ backgroundColor: "$color12" }} disabledStyle={{ opacity: 0.5 }}
                  >
                    {isStreaming ? (
                      <StopCircle size={16} />
                    ) : (
                      <ArrowUp size={16} />
                    )}
                  </Button>
                </YStack>
              </XStack>
              <XStack alignItems="center" justifyContent="space-between" marginTop="$2">
                <Paragraph fontSize="$1" color="$color11">
                  {isStreaming ? "Generating..." : "Press Enter to send, Shift+Enter for new line"}
                </Paragraph>
                <XStack alignItems="center" gap="$2">
                  <Button variant="ghost" size="sm" height="$5" fontSize="$1" color="$color11" hoverStyle={{ color: "$color" }}>
                    <Sparkles size={12} />
                    Enhance prompt
                  </Button>
                </XStack>
              </XStack>
            </YStack>
          </YStack>
        )}
      </YStack>
    </XStack>
  );
}