"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Network,
  Server,
  Cpu,
  MemoryStick,
  HardDrive,
  Activity,
  Zap,
  Globe,
  Shield,
  AlertCircle,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Settings,
  Terminal,
  Database,
  Cloud,
  Layers,
  GitBranch,
  Share2,
  Router as RouterIcon,
  Gauge,
  TrendingUp,
  TrendingDown,
  MoreVertical,
  Eye,
  Play,
  Pause,
  Power,
  Copy,
  Download,
  ChevronRight,
  ChevronDown,
  Signal,
  Wifi,
  WifiOff,
  Lock,
  Unlock
} from "lucide-react";
import { Button } from "@hanzo/ui";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@hanzo/ui";
import { Badge } from "@hanzo/ui";
import { Progress } from "@hanzo/ui";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@hanzo/ui";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@hanzo/ui";
import { HanzoLogo } from "@/components/HanzoLogo";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { Input } from "@hanzo/ui";
import { Tooltip, TooltipContent, TooltipTrigger } from "@hanzo/ui";

interface Node {
  id: string;
  name: string;
  type: "compute" | "storage" | "network" | "orchestrator" | "edge";
  status: "online" | "offline" | "maintenance" | "degraded";
  region: string;
  ip: string;
  uptime: number;
  lastSeen: Date;
  specs: {
    cpu: number;
    memory: number;
    storage: number;
    gpu?: number;
  };
  usage: {
    cpu: number;
    memory: number;
    storage: number;
    network: number;
    gpu?: number;
  };
  services: string[];
  connections: string[];
  metrics: {
    requestsPerSecond: number;
    latency: number;
    errorRate: number;
    throughput: number;
  };
  security: {
    encrypted: boolean;
    firewall: boolean;
    lastUpdate: Date;
  };
}

interface Cluster {
  id: string;
  name: string;
  nodes: string[];
  status: "healthy" | "degraded" | "critical";
  leader: string;
}

export default function NodesPage() {
  const router = useRouter();
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [selectedView, setSelectedView] = useState<"grid" | "topology" | "list">("topology");
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Mock data for demonstration
  const [nodes] = useState<Node[]>([
    {
      id: "node-master-1",
      name: "Master-01",
      type: "orchestrator",
      status: "online",
      region: "us-west-2",
      ip: "10.0.1.10",
      uptime: 99.99,
      lastSeen: new Date(),
      specs: { cpu: 64, memory: 256, storage: 2000 },
      usage: { cpu: 35, memory: 42, storage: 60, network: 45 },
      services: ["Kubernetes", "Docker", "Prometheus", "Grafana"],
      connections: ["node-compute-1", "node-compute-2", "node-storage-1"],
      metrics: { requestsPerSecond: 1250, latency: 12, errorRate: 0.01, throughput: 850 },
      security: { encrypted: true, firewall: true, lastUpdate: new Date(Date.now() - 1000 * 60 * 30) }
    },
    {
      id: "node-compute-1",
      name: "Compute-01",
      type: "compute",
      status: "online",
      region: "us-west-2",
      ip: "10.0.2.20",
      uptime: 99.95,
      lastSeen: new Date(),
      specs: { cpu: 128, memory: 512, storage: 4000, gpu: 8 },
      usage: { cpu: 78, memory: 65, storage: 45, network: 60, gpu: 85 },
      services: ["LLM-Service", "Inference-Engine", "CUDA"],
      connections: ["node-master-1", "node-storage-1", "node-network-1"],
      metrics: { requestsPerSecond: 3500, latency: 8, errorRate: 0.02, throughput: 2100 },
      security: { encrypted: true, firewall: true, lastUpdate: new Date(Date.now() - 1000 * 60 * 45) }
    },
    {
      id: "node-compute-2",
      name: "Compute-02",
      type: "compute",
      status: "online",
      region: "us-east-1",
      ip: "10.0.2.21",
      uptime: 99.92,
      lastSeen: new Date(),
      specs: { cpu: 128, memory: 512, storage: 4000, gpu: 8 },
      usage: { cpu: 62, memory: 55, storage: 38, network: 40, gpu: 70 },
      services: ["LLM-Service", "Training-Engine", "CUDA"],
      connections: ["node-master-1", "node-storage-1", "node-network-1"],
      metrics: { requestsPerSecond: 2800, latency: 10, errorRate: 0.01, throughput: 1800 },
      security: { encrypted: true, firewall: true, lastUpdate: new Date(Date.now() - 1000 * 60 * 60) }
    },
    {
      id: "node-storage-1",
      name: "Storage-01",
      type: "storage",
      status: "online",
      region: "us-west-2",
      ip: "10.0.3.30",
      uptime: 99.999,
      lastSeen: new Date(),
      specs: { cpu: 32, memory: 128, storage: 50000 },
      usage: { cpu: 25, memory: 35, storage: 72, network: 80 },
      services: ["MinIO", "PostgreSQL", "Redis", "Elasticsearch"],
      connections: ["node-master-1", "node-compute-1", "node-compute-2"],
      metrics: { requestsPerSecond: 5000, latency: 3, errorRate: 0.001, throughput: 4500 },
      security: { encrypted: true, firewall: true, lastUpdate: new Date(Date.now() - 1000 * 60 * 20) }
    },
    {
      id: "node-network-1",
      name: "Network-01",
      type: "network",
      status: "online",
      region: "global",
      ip: "10.0.4.40",
      uptime: 99.98,
      lastSeen: new Date(),
      specs: { cpu: 16, memory: 64, storage: 500 },
      usage: { cpu: 15, memory: 25, storage: 10, network: 95 },
      services: ["LoadBalancer", "Firewall", "VPN", "CDN"],
      connections: ["node-compute-1", "node-compute-2", "node-edge-1"],
      metrics: { requestsPerSecond: 10000, latency: 1, errorRate: 0.005, throughput: 9500 },
      security: { encrypted: true, firewall: true, lastUpdate: new Date() }
    },
    {
      id: "node-edge-1",
      name: "Edge-01",
      type: "edge",
      status: "degraded",
      region: "eu-west-1",
      ip: "10.0.5.50",
      uptime: 98.5,
      lastSeen: new Date(Date.now() - 1000 * 60 * 2),
      specs: { cpu: 8, memory: 32, storage: 250 },
      usage: { cpu: 90, memory: 85, storage: 60, network: 70 },
      services: ["Cache", "CDN-Edge", "WAF"],
      connections: ["node-network-1"],
      metrics: { requestsPerSecond: 500, latency: 25, errorRate: 0.1, throughput: 450 },
      security: { encrypted: true, firewall: false, lastUpdate: new Date(Date.now() - 1000 * 60 * 60 * 2) }
    }
  ]);

  const [clusters] = useState<Cluster[]>([
    {
      id: "cluster-main",
      name: "Main Cluster",
      nodes: ["node-master-1", "node-compute-1", "node-compute-2", "node-storage-1"],
      status: "healthy",
      leader: "node-master-1"
    },
    {
      id: "cluster-edge",
      name: "Edge Cluster",
      nodes: ["node-edge-1", "node-network-1"],
      status: "degraded",
      leader: "node-network-1"
    }
  ]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "online": return "text-green-500";
      case "offline": return "text-red-500";
      case "maintenance": return "text-yellow-500";
      case "degraded": return "text-amber-500";
      case "healthy": return "text-green-500";
      case "critical": return "text-red-500";
      default: return "text-neutral-400";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "online":
      case "healthy": return <CheckCircle2 className="w-4 h-4" />;
      case "offline":
      case "critical": return <XCircle className="w-4 h-4" />;
      case "maintenance": return <Settings className="w-4 h-4" />;
      case "degraded": return <AlertCircle className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  const getNodeIcon = (type: string) => {
    switch (type) {
      case "orchestrator": return <Server className="w-5 h-5" />;
      case "compute": return <Cpu className="w-5 h-5" />;
      case "storage": return <Database className="w-5 h-5" />;
      case "network": return <RouterIcon className="w-5 h-5" />;
      case "edge": return <Globe className="w-5 h-5" />;
      default: return <Server className="w-5 h-5" />;
    }
  };

  const totalStats = {
    totalNodes: nodes.length,
    onlineNodes: nodes.filter(n => n.status === "online").length,
    totalCpu: nodes.reduce((acc, n) => acc + n.specs.cpu, 0),
    totalMemory: nodes.reduce((acc, n) => acc + n.specs.memory, 0),
    totalStorage: nodes.reduce((acc, n) => acc + n.specs.storage / 1000, 0),
    avgCpuUsage: Math.round(nodes.reduce((acc, n) => acc + n.usage.cpu, 0) / nodes.length),
    avgMemoryUsage: Math.round(nodes.reduce((acc, n) => acc + n.usage.memory, 0) / nodes.length),
    totalRequests: nodes.reduce((acc, n) => acc + n.metrics.requestsPerSecond, 0)
  };

  // Draw network topology
  useEffect(() => {
    if (selectedView === "topology" && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Set canvas size
      canvas.width = canvas.offsetWidth;
      canvas.height = 600;

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Node positions
      const nodePositions: Record<string, { x: number; y: number }> = {
        "node-master-1": { x: canvas.width / 2, y: 100 },
        "node-compute-1": { x: canvas.width / 3, y: 250 },
        "node-compute-2": { x: (canvas.width / 3) * 2, y: 250 },
        "node-storage-1": { x: canvas.width / 2, y: 400 },
        "node-network-1": { x: canvas.width - 150, y: 250 },
        "node-edge-1": { x: 150, y: 250 }
      };

      // Draw connections
      ctx.strokeStyle = "#404040";
      ctx.lineWidth = 2;
      nodes.forEach(node => {
        const fromPos = nodePositions[node.id];
        if (fromPos) {
          node.connections.forEach(connId => {
            const toPos = nodePositions[connId];
            if (toPos) {
              ctx.beginPath();
              ctx.moveTo(fromPos.x, fromPos.y);
              ctx.lineTo(toPos.x, toPos.y);
              ctx.stroke();
            }
          });
        }
      });

      // Draw nodes
      nodes.forEach(node => {
        const pos = nodePositions[node.id];
        if (pos) {
          // Node circle
          ctx.beginPath();
          ctx.arc(pos.x, pos.y, 30, 0, Math.PI * 2);
          ctx.fillStyle = node.status === "online" ? "#10b981" :
                         node.status === "degraded" ? "#f59e0b" : "#737373";
          ctx.fill();

          // Node label
          ctx.fillStyle = "#ffffff";
          ctx.font = "12px sans-serif";
          ctx.textAlign = "center";
          ctx.fillText(node.name, pos.x, pos.y + 50);

          // Node type icon (simplified)
          ctx.font = "20px sans-serif";
          const icon = node.type === "orchestrator" ? "👑" :
                      node.type === "compute" ? "🖥️" :
                      node.type === "storage" ? "💾" :
                      node.type === "network" ? "🌐" : "📡";
          ctx.fillText(icon, pos.x, pos.y + 5);
        }
      });
    }
  }, [selectedView, nodes]);

  const filteredNodes = nodes.filter(node =>
    node.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    node.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
    node.region.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <header className="border-b border-neutral-800 px-6 py-4">
        <div className="container mx-auto">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-4">
              <Link href="/" className="flex items-center gap-2">
                <HanzoLogo className="w-8 h-8 text-white" />
                <span className="text-xl font-medium text-white">Node Infrastructure</span>
              </Link>
              <Badge variant="outline" className="gap-1">
                <Signal className="w-3 h-3" />
                {totalStats.onlineNodes}/{totalStats.totalNodes} Online
              </Badge>
            </div>

            <div className="flex items-center gap-4">
              <Link href="/tasks">
                <Button variant="outline" className="gap-2">
                  <Activity className="w-4 h-4" />
                  View Tasks
                </Button>
              </Link>
              <Button
                variant={autoRefresh ? "default" : "outline"}
                size="sm"
                onClick={() => setAutoRefresh(!autoRefresh)}
                className="gap-2"
              >
                <RefreshCw className={cn("w-4 h-4", autoRefresh && "animate-spin")} />
                Auto-refresh
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card className="bg-neutral-900 border-neutral-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-neutral-400">Total Resources</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-neutral-500">CPU</span>
                  <span className="text-sm font-medium text-white">{totalStats.totalCpu} cores</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-neutral-500">Memory</span>
                  <span className="text-sm font-medium text-white">{totalStats.totalMemory} GB</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-neutral-500">Storage</span>
                  <span className="text-sm font-medium text-white">{totalStats.totalStorage.toFixed(1)} TB</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-neutral-900 border-neutral-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-neutral-400">Average Usage</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-neutral-500">CPU</span>
                    <span className="text-neutral-400">{totalStats.avgCpuUsage}%</span>
                  </div>
                  <Progress value={totalStats.avgCpuUsage} className="h-1" />
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-neutral-500">Memory</span>
                    <span className="text-neutral-400">{totalStats.avgMemoryUsage}%</span>
                  </div>
                  <Progress value={totalStats.avgMemoryUsage} className="h-1" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-neutral-900 border-neutral-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-neutral-400">Network Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-medium text-white">
                  {(totalStats.totalRequests / 1000).toFixed(1)}k
                </span>
                <span className="text-xs text-neutral-500">req/s</span>
              </div>
              <div className="flex items-center gap-1 mt-1">
                <TrendingUp className="w-3 h-3 text-green-500" />
                <span className="text-xs text-green-500">+12.5%</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-neutral-900 border-neutral-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-neutral-400">Clusters</CardTitle>
            </CardHeader>
            <CardContent>
              {clusters.map(cluster => (
                <div key={cluster.id} className="flex items-center justify-between mb-1">
                  <span className="text-xs text-neutral-400">{cluster.name}</span>
                  <div className={cn("flex items-center gap-1", getStatusColor(cluster.status))}>
                    {getStatusIcon(cluster.status)}
                    <span className="text-xs capitalize">{cluster.status}</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* View Controls */}
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-6">
          <div className="flex items-center gap-2">
            <Button
              variant={selectedView === "topology" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedView("topology")}
            >
              <Network className="w-4 h-4 mr-1" />
              Topology
            </Button>
            <Button
              variant={selectedView === "grid" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedView("grid")}
            >
              <Layers className="w-4 h-4 mr-1" />
              Grid
            </Button>
            <Button
              variant={selectedView === "list" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedView("list")}
            >
              <Server className="w-4 h-4 mr-1" />
              List
            </Button>
          </div>

          <Input
            placeholder="Search nodes..."
            className="w-full md:w-64 bg-neutral-900 border-neutral-800"
            value={searchQuery}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Main Content */}
        {selectedView === "topology" && (
          <Card className="bg-neutral-900 border-neutral-800 p-6">
            <canvas ref={canvasRef} className="w-full" />
          </Card>
        )}

        {selectedView === "grid" && (
          <div className="grid grid-cols-3 gap-4">
            {filteredNodes.map(node => (
              <Card
                key={node.id}
                className="bg-neutral-900 border-neutral-800 cursor-pointer hover:border-neutral-700 transition-colors"
                onClick={() => setSelectedNode(node)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      {getNodeIcon(node.type)}
                      <div>
                        <CardTitle className="text-base">{node.name}</CardTitle>
                        <CardDescription className="text-xs">{node.region} • {node.ip}</CardDescription>
                      </div>
                    </div>
                    <div className={cn("flex items-center gap-1", getStatusColor(node.status))}>
                      {getStatusIcon(node.status)}
                      <span className="text-xs capitalize">{node.status}</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-neutral-500">CPU</span>
                        <span className="text-neutral-400">{node.usage.cpu}%</span>
                      </div>
                      <Progress value={node.usage.cpu} className="h-1" />
                    </div>
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-neutral-500">Memory</span>
                        <span className="text-neutral-400">{node.usage.memory}%</span>
                      </div>
                      <Progress value={node.usage.memory} className="h-1" />
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {node.type}
                    </Badge>
                    <span className="text-xs text-neutral-500">
                      {node.services.length} services
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {selectedView === "list" && (
          <Card className="bg-neutral-900 border-neutral-800">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-neutral-800">
                    <th className="text-left p-4 text-sm font-medium text-neutral-400">Node</th>
                    <th className="text-left p-4 text-sm font-medium text-neutral-400">Status</th>
                    <th className="text-left p-4 text-sm font-medium text-neutral-400">Type</th>
                    <th className="text-left p-4 text-sm font-medium text-neutral-400">Region</th>
                    <th className="text-left p-4 text-sm font-medium text-neutral-400">CPU</th>
                    <th className="text-left p-4 text-sm font-medium text-neutral-400">Memory</th>
                    <th className="text-left p-4 text-sm font-medium text-neutral-400">Network</th>
                    <th className="text-left p-4 text-sm font-medium text-neutral-400">Services</th>
                    <th className="text-left p-4 text-sm font-medium text-neutral-400">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredNodes.map(node => (
                    <tr key={node.id} className="border-b border-neutral-800 hover:bg-neutral-800/50">
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          {getNodeIcon(node.type)}
                          <div>
                            <p className="text-sm font-medium text-white">{node.name}</p>
                            <p className="text-xs text-neutral-500">{node.ip}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className={cn("flex items-center gap-1", getStatusColor(node.status))}>
                          {getStatusIcon(node.status)}
                          <span className="text-sm capitalize">{node.status}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <Badge variant="outline" className="text-xs">
                          {node.type}
                        </Badge>
                      </td>
                      <td className="p-4 text-sm text-neutral-400">{node.region}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <Progress value={node.usage.cpu} className="h-1 w-16" />
                          <span className="text-xs text-neutral-400">{node.usage.cpu}%</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <Progress value={node.usage.memory} className="h-1 w-16" />
                          <span className="text-xs text-neutral-400">{node.usage.memory}%</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <Progress value={node.usage.network} className="h-1 w-16" />
                          <span className="text-xs text-neutral-400">{node.usage.network}%</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="text-xs text-neutral-400">{node.services.length} active</span>
                      </td>
                      <td className="p-4">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setSelectedNode(node)}>
                              <Eye className="w-4 h-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Terminal className="w-4 h-4 mr-2" />
                              SSH Connect
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>
                              <RefreshCw className="w-4 h-4 mr-2" />
                              Restart
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-yellow-500">
                              <Pause className="w-4 h-4 mr-2" />
                              Maintenance Mode
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-red-500">
                              <Power className="w-4 h-4 mr-2" />
                              Shutdown
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>

      {/* Node Details Modal */}
      {selectedNode && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-6 z-50">
          <Card className="bg-neutral-900 border-neutral-800 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  {getNodeIcon(selectedNode.type)}
                  <div>
                    <CardTitle className="text-xl">{selectedNode.name}</CardTitle>
                    <CardDescription>
                      {selectedNode.region} • {selectedNode.ip} • Uptime: {selectedNode.uptime}%
                    </CardDescription>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSelectedNode(null)}
                >
                  <XCircle className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="metrics">Metrics</TabsTrigger>
                  <TabsTrigger value="services">Services</TabsTrigger>
                  <TabsTrigger value="security">Security</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <h3 className="text-sm font-medium text-neutral-400">Specifications</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-neutral-500">CPU Cores</span>
                          <span className="text-sm text-white">{selectedNode.specs.cpu}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-neutral-500">Memory</span>
                          <span className="text-sm text-white">{selectedNode.specs.memory} GB</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-neutral-500">Storage</span>
                          <span className="text-sm text-white">{selectedNode.specs.storage} GB</span>
                        </div>
                        {selectedNode.specs.gpu && (
                          <div className="flex justify-between">
                            <span className="text-sm text-neutral-500">GPU Units</span>
                            <span className="text-sm text-white">{selectedNode.specs.gpu}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h3 className="text-sm font-medium text-neutral-400">Current Usage</h3>
                      <div className="space-y-2">
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-neutral-500">CPU</span>
                            <span className="text-white">{selectedNode.usage.cpu}%</span>
                          </div>
                          <Progress value={selectedNode.usage.cpu} className="h-2" />
                        </div>
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-neutral-500">Memory</span>
                            <span className="text-white">{selectedNode.usage.memory}%</span>
                          </div>
                          <Progress value={selectedNode.usage.memory} className="h-2" />
                        </div>
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-neutral-500">Storage</span>
                            <span className="text-white">{selectedNode.usage.storage}%</span>
                          </div>
                          <Progress value={selectedNode.usage.storage} className="h-2" />
                        </div>
                        {selectedNode.usage.gpu !== undefined && (
                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="text-neutral-500">GPU</span>
                              <span className="text-white">{selectedNode.usage.gpu}%</span>
                            </div>
                            <Progress value={selectedNode.usage.gpu} className="h-2" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-neutral-400 mb-2">Connections</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedNode.connections.map(conn => {
                        const connNode = nodes.find(n => n.id === conn);
                        return (
                          <Badge key={conn} variant="outline" className="gap-1">
                            {connNode && getStatusIcon(connNode.status)}
                            {connNode?.name || conn}
                          </Badge>
                        );
                      })}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="metrics" className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Card className="bg-neutral-800 border-neutral-700">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Requests/Second</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-2xl font-medium text-white">
                          {selectedNode.metrics.requestsPerSecond}
                        </p>
                      </CardContent>
                    </Card>
                    <Card className="bg-neutral-800 border-neutral-700">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Latency</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-2xl font-medium text-white">
                          {selectedNode.metrics.latency}ms
                        </p>
                      </CardContent>
                    </Card>
                    <Card className="bg-neutral-800 border-neutral-700">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Error Rate</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-2xl font-medium text-white">
                          {selectedNode.metrics.errorRate}%
                        </p>
                      </CardContent>
                    </Card>
                    <Card className="bg-neutral-800 border-neutral-700">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Throughput</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-2xl font-medium text-white">
                          {selectedNode.metrics.throughput} MB/s
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="services" className="mt-4">
                  <div className="space-y-2">
                    {selectedNode.services.map((service, i) => (
                      <div key={i} className="flex items-center justify-between p-3 bg-neutral-800 rounded">
                        <div className="flex items-center gap-2">
                          <Cloud className="w-4 h-4 text-neutral-400" />
                          <span className="text-sm text-white">{service}</span>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          Running
                        </Badge>
                      </div>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="security" className="mt-4">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-neutral-800 rounded">
                      <div className="flex items-center gap-2">
                        {selectedNode.security.encrypted ? (
                          <Lock className="w-4 h-4 text-green-500" />
                        ) : (
                          <Unlock className="w-4 h-4 text-red-500" />
                        )}
                        <span className="text-sm text-white">Encryption</span>
                      </div>
                      <Badge variant={selectedNode.security.encrypted ? "default" : "destructive"}>
                        {selectedNode.security.encrypted ? "Enabled" : "Disabled"}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-neutral-800 rounded">
                      <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4 text-neutral-400" />
                        <span className="text-sm text-white">Firewall</span>
                      </div>
                      <Badge variant={selectedNode.security.firewall ? "default" : "destructive"}>
                        {selectedNode.security.firewall ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-neutral-800 rounded">
                      <div className="flex items-center gap-2">
                        <RefreshCw className="w-4 h-4 text-neutral-400" />
                        <span className="text-sm text-white">Last Security Update</span>
                      </div>
                      <span className="text-sm text-neutral-400">
                        {selectedNode.security.lastUpdate.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}