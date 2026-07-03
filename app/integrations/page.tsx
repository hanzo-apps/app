"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Plus,
  Search,
  Check,
  X,
  Settings,
  ExternalLink,
  RefreshCw,
  Loader2,
  AlertCircle,
  ChevronRight,
  Github,
  Slack,
  Mail,
  Calendar,
  Database,
  Cloud,
  Code,
  Terminal,
  GitBranch,
  MessageSquare,
  Users,
  FileText,
  Package,
  Shield,
  Zap,
  Activity,
  Key,
  Link as LinkIcon,
  MoreHorizontal,
  CheckCircle,
  XCircle
} from "lucide-react";
import { Button } from "@hanzo/ui";
import { Input } from "@hanzo/ui";
import { Badge } from "@hanzo/ui";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@hanzo/ui";
import { Switch } from "@hanzo/ui";
import { Label } from "@hanzo/ui";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@hanzo/ui";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@hanzo/ui";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@hanzo/ui";
import { HanzoLogo } from "@/components/HanzoLogo";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { toast } from "sonner";

interface Integration {
  id: string;
  name: string;
  description: string;
  category: "development" | "communication" | "productivity" | "deployment" | "monitoring" | "security";
  icon: React.ReactNode;
  status: "connected" | "disconnected" | "error";
  features: string[];
  configRequired?: string[];
  lastSync?: Date;
  usage?: {
    events: number;
    quota: number;
  };
}

export default function IntegrationsPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [showConfigDialog, setShowConfigDialog] = useState(false);
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  const integrations: Integration[] = [
    {
      id: "github",
      name: "GitHub",
      description: "Connect repositories, manage issues, and automate workflows",
      category: "development",
      icon: <Github className="w-5 h-5" />,
      status: "connected",
      features: ["Repository sync", "Issue tracking", "Pull request automation", "Actions integration"],
      lastSync: new Date(Date.now() - 1000 * 60 * 5),
      usage: { events: 1247, quota: 5000 }
    },
    {
      id: "linear",
      name: "Linear",
      description: "Modern issue tracking and project management",
      category: "productivity",
      icon: <GitBranch className="w-5 h-5" />,
      status: "connected",
      features: ["Issue sync", "Project boards", "Cycle tracking", "Roadmap integration"],
      lastSync: new Date(Date.now() - 1000 * 60 * 30),
      usage: { events: 892, quota: 2000 }
    },
    {
      id: "slack",
      name: "Slack",
      description: "Team communication and notifications",
      category: "communication",
      icon: <MessageSquare className="w-5 h-5" />,
      status: "connected",
      features: ["Real-time notifications", "Channel integration", "Bot commands", "File sharing"],
      lastSync: new Date(Date.now() - 1000 * 60 * 2),
      usage: { events: 3421, quota: 10000 }
    },
    {
      id: "vercel",
      name: "Vercel",
      description: "Deploy and host your applications",
      category: "deployment",
      icon: <Zap className="w-5 h-5" />,
      status: "disconnected",
      features: ["Automatic deployments", "Preview environments", "Analytics", "Edge functions"],
      configRequired: ["API Token", "Team ID"]
    },
    {
      id: "aws",
      name: "AWS",
      description: "Amazon Web Services cloud infrastructure",
      category: "deployment",
      icon: <Cloud className="w-5 h-5" />,
      status: "disconnected",
      features: ["S3 storage", "Lambda functions", "EC2 instances", "CloudWatch monitoring"],
      configRequired: ["Access Key ID", "Secret Access Key", "Region"]
    },
    {
      id: "openai",
      name: "OpenAI",
      description: "GPT models and AI capabilities",
      category: "development",
      icon: <Activity className="w-5 h-5" />,
      status: "connected",
      features: ["GPT-4 access", "DALL-E integration", "Embeddings API", "Fine-tuning"],
      lastSync: new Date(),
      usage: { events: 5892, quota: 10000 }
    },
    {
      id: "anthropic",
      name: "Anthropic",
      description: "Claude AI models and tools",
      category: "development",
      icon: <Terminal className="w-5 h-5" />,
      status: "connected",
      features: ["Claude 3.5", "Constitutional AI", "Long context", "Tool use"],
      lastSync: new Date(),
      usage: { events: 4123, quota: 8000 }
    },
    {
      id: "notion",
      name: "Notion",
      description: "Knowledge base and documentation",
      category: "productivity",
      icon: <FileText className="w-5 h-5" />,
      status: "disconnected",
      features: ["Page sync", "Database integration", "Templates", "Collaborative editing"],
      configRequired: ["Integration Token", "Workspace ID"]
    },
    {
      id: "discord",
      name: "Discord",
      description: "Community and support channels",
      category: "communication",
      icon: <Users className="w-5 h-5" />,
      status: "disconnected",
      features: ["Server integration", "Bot commands", "Voice channels", "Webhooks"],
      configRequired: ["Bot Token", "Server ID"]
    },
    {
      id: "datadog",
      name: "Datadog",
      description: "Application performance monitoring",
      category: "monitoring",
      icon: <Activity className="w-5 h-5" />,
      status: "error",
      features: ["APM", "Log aggregation", "Metrics", "Alerting"],
      lastSync: new Date(Date.now() - 1000 * 60 * 60)
    },
    {
      id: "sentry",
      name: "Sentry",
      description: "Error tracking and performance monitoring",
      category: "monitoring",
      icon: <AlertCircle className="w-5 h-5" />,
      status: "connected",
      features: ["Error tracking", "Performance monitoring", "Release tracking", "User feedback"],
      lastSync: new Date(Date.now() - 1000 * 60 * 15),
      usage: { events: 156, quota: 1000 }
    },
    {
      id: "auth0",
      name: "Auth0",
      description: "Authentication and authorization",
      category: "security",
      icon: <Shield className="w-5 h-5" />,
      status: "disconnected",
      features: ["SSO", "MFA", "User management", "Role-based access"],
      configRequired: ["Domain", "Client ID", "Client Secret"]
    }
  ];

  const categories = [
    { id: "all", label: "All", count: integrations.length },
    { id: "development", label: "Development", count: integrations.filter(i => i.category === "development").length },
    { id: "communication", label: "Communication", count: integrations.filter(i => i.category === "communication").length },
    { id: "productivity", label: "Productivity", count: integrations.filter(i => i.category === "productivity").length },
    { id: "deployment", label: "Deployment", count: integrations.filter(i => i.category === "deployment").length },
    { id: "monitoring", label: "Monitoring", count: integrations.filter(i => i.category === "monitoring").length },
    { id: "security", label: "Security", count: integrations.filter(i => i.category === "security").length }
  ];

  const filteredIntegrations = integrations.filter(integration => {
    const matchesSearch = integration.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         integration.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || integration.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const connectedCount = integrations.filter(i => i.status === "connected").length;
  const errorCount = integrations.filter(i => i.status === "error").length;

  const handleConnect = async (integration: Integration) => {
    setSelectedIntegration(integration);
    if (integration.configRequired) {
      setShowConfigDialog(true);
    } else {
      setIsConnecting(true);
      // Simulate connection
      setTimeout(() => {
        setIsConnecting(false);
        toast.success(`Connected to ${integration.name}`);
      }, 2000);
    }
  };

  const handleDisconnect = (integration: Integration) => {
    toast.success(`Disconnected from ${integration.name}`);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "connected":
        return (
          <Badge className="gap-1 bg-green-500/10 text-green-500 border-green-500/30">
            <CheckCircle className="w-3 h-3" />
            Connected
          </Badge>
        );
      case "error":
        return (
          <Badge className="gap-1 bg-red-500/10 text-red-500 border-red-500/30">
            <XCircle className="w-3 h-3" />
            Error
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="gap-1">
            Disconnected
          </Badge>
        );
    }
  };

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
              <h1 className="text-2xl font-bold text-white">Integrations</h1>
              <Badge variant="outline">
                {connectedCount} connected
              </Badge>
              {errorCount > 0 && (
                <Badge variant="destructive">
                  {errorCount} errors
                </Badge>
              )}
            </div>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Request Integration
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-6">
        <div className="grid grid-cols-12 gap-6">
          {/* Sidebar */}
          <div className="col-span-3">
            <div className="sticky top-6 space-y-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <Input
                  placeholder="Search integrations..."
                  className="pl-10 bg-neutral-900 border-neutral-800"
                  value={searchQuery}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                />
              </div>

              {/* Categories */}
              <div className="space-y-1">
                {categories.map(category => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={cn(
                      "w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors",
                      selectedCategory === category.id
                        ? "bg-purple-500/10 text-purple-400 border border-purple-500/20"
                        : "text-gray-400 hover:text-white hover:bg-neutral-900"
                    )}
                  >
                    <span>{category.label}</span>
                    <span className="text-xs opacity-60">{category.count}</span>
                  </button>
                ))}
              </div>

              {/* Quick Stats */}
              <Card className="bg-neutral-900 border-neutral-800">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Usage Overview</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-400">API Calls</span>
                      <span className="text-gray-400">15.7k / 50k</span>
                    </div>
                    <div className="w-full bg-neutral-800 rounded-full h-2">
                      <div className="bg-purple-500 h-2 rounded-full" style={{ width: "31%" }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-400">Webhooks</span>
                      <span className="text-gray-400">892 / 1000</span>
                    </div>
                    <div className="w-full bg-neutral-800 rounded-full h-2">
                      <div className="bg-blue-500 h-2 rounded-full" style={{ width: "89%" }} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Main Content */}
          <div className="col-span-9">
            <div className="grid gap-4">
              {filteredIntegrations.map(integration => (
                <Card key={integration.id} className="bg-neutral-900 border-neutral-800">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-lg bg-neutral-800 flex items-center justify-center text-white">
                          {integration.icon}
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <CardTitle className="text-white">{integration.name}</CardTitle>
                            {getStatusBadge(integration.status)}
                          </div>
                          <CardDescription>{integration.description}</CardDescription>
                          {integration.lastSync && (
                            <p className="text-xs text-gray-500">
                              Last synced {new Date(integration.lastSync).toLocaleTimeString()}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {integration.status === "connected" ? (
                          <>
                            <Button variant="outline" size="sm" className="gap-2">
                              <RefreshCw className="w-3 h-3" />
                              Sync
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem>
                                  <Settings className="w-4 h-4 mr-2" />
                                  Configure
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <ExternalLink className="w-4 h-4 mr-2" />
                                  View Documentation
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-red-500"
                                  onClick={() => handleDisconnect(integration)}
                                >
                                  <X className="w-4 h-4 mr-2" />
                                  Disconnect
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </>
                        ) : integration.status === "error" ? (
                          <Button variant="destructive" size="sm" className="gap-2">
                            <AlertCircle className="w-3 h-3" />
                            Fix Connection
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            className="gap-2"
                            onClick={() => handleConnect(integration)}
                            disabled={isConnecting}
                          >
                            {isConnecting && selectedIntegration?.id === integration.id ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <LinkIcon className="w-3 h-3" />
                            )}
                            Connect
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardHeader>

                  {integration.status === "connected" && (
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <p className="text-sm font-medium text-gray-400">Features</p>
                          <div className="flex flex-wrap gap-1">
                            {integration.features.map(feature => (
                              <Badge key={feature} variant="outline" className="text-xs">
                                {feature}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        {integration.usage && (
                          <div className="space-y-2">
                            <p className="text-sm font-medium text-gray-400">Usage</p>
                            <div className="space-y-1">
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Events</span>
                                <span className="text-white">
                                  {integration.usage.events.toLocaleString()} / {integration.usage.quota.toLocaleString()}
                                </span>
                              </div>
                              <div className="w-full bg-neutral-800 rounded-full h-1.5">
                                <div
                                  className="bg-purple-500 h-1.5 rounded-full"
                                  style={{ width: `${(integration.usage.events / integration.usage.quota) * 100}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Configuration Dialog */}
      <Dialog open={showConfigDialog} onOpenChange={setShowConfigDialog}>
        <DialogContent className="bg-neutral-900 border-neutral-800">
          <DialogHeader>
            <DialogTitle>Configure {selectedIntegration?.name}</DialogTitle>
            <DialogDescription>
              Enter the required configuration to connect this integration.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {selectedIntegration?.configRequired?.map(field => (
              <div key={field} className="space-y-2">
                <Label>{field}</Label>
                <Input
                  placeholder={`Enter ${field.toLowerCase()}`}
                  className="bg-neutral-800 border-neutral-700"
                  type={field.includes("Secret") || field.includes("Token") ? "password" : "text"}
                />
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfigDialog(false)}>
              Cancel
            </Button>
            <Button onClick={() => {
              setShowConfigDialog(false);
              toast.success(`Connected to ${selectedIntegration?.name}`);
            }}>
              Connect
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}