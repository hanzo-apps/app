"use client";

import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import {
  Bug,
  CheckCircle2,
  AlertCircle,
  Activity,
  Eye,
  Terminal,
  Play,
  Pause,
  RotateCw,
  Shield
} from "lucide-react";
import { Button } from "@hanzo/ui";
import Loading from "@/components/loading";

interface TestResult {
  id: string;
  type: "error" | "warning" | "success";
  message: string;
  file?: string;
  line?: number;
  column?: number;
  timestamp: Date;
  fixed?: boolean;
  fixApplied?: string;
}

interface AgentTask {
  id: string;
  name: string;
  status: "pending" | "running" | "completed" | "failed";
  progress: number;
  output?: string;
  error?: string;
  startTime?: Date;
  endTime?: Date;
  screenshot?: string;
}

interface MCPTool {
  name: string;
  description: string;
  available: boolean;
  lastUsed?: Date;
  usage: number;
}

export function AISupervisor({
  pages,
  iframeRef,
  isAiWorking,
  onAutoFix,
}: {
  pages: any[];
  iframeRef: React.RefObject<HTMLIFrameElement | null>;
  isAiWorking: boolean;
  onAutoFix: (fixes: string[]) => void;
}) {
  const [isSupervising, setIsSupervising] = useState(false);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [agentTasks, setAgentTasks] = useState<AgentTask[]>([]);
  const [mcpTools, setMcpTools] = useState<MCPTool[]>([]);
  const [isAutoFixing, setIsAutoFixing] = useState(false);
  const [visualInspectionEnabled, setVisualInspectionEnabled] = useState(true);
  const [sandboxStatus, setSandboxStatus] = useState<"idle" | "running" | "error">("idle");
  const supervisorInterval = useRef<NodeJS.Timeout | undefined>(undefined);
  const websocketRef = useRef<WebSocket | null>(null);

  // Initialize MCP tools
  useEffect(() => {
    initializeMCPTools();
    connectToSupervisor();

    return () => {
      if (websocketRef.current) {
        websocketRef.current.close();
      }
    };
  }, []);

  const initializeMCPTools = async () => {
    try {
      const response = await fetch("/api/mcp/tools");
      const tools = await response.json();

      setMcpTools([
        {
          name: "hanzo-mcp",
          description: "Core MCP tool suite with 260+ tools",
          available: tools.hanzoMcp || false,
          usage: 0,
        },
        {
          name: "browser-automation",
          description: "Playwright-based browser control",
          available: tools.browserAutomation || false,
          usage: 0,
        },
        {
          name: "code-analysis",
          description: "Static code analysis and linting",
          available: tools.codeAnalysis || false,
          usage: 0,
        },
        {
          name: "visual-regression",
          description: "Visual diff and regression testing",
          available: tools.visualRegression || false,
          usage: 0,
        },
        {
          name: "performance-monitor",
          description: "Runtime performance monitoring",
          available: tools.performanceMonitor || false,
          usage: 0,
        }
      ]);
    } catch (error) {
      console.error("Failed to initialize MCP tools:", error);
      toast.error("MCP tools initialization failed");
    }
  };

  const connectToSupervisor = () => {
    try {
      const ws = new WebSocket(process.env.NEXT_PUBLIC_SUPERVISOR_WS || "ws://localhost:8080/supervisor");

      ws.onopen = () => {
        console.log("Connected to AI Supervisor");
        setSandboxStatus("idle");
      };

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        handleSupervisorMessage(data);
      };

      ws.onerror = (error) => {
        console.error("Supervisor WebSocket error:", error);
        setSandboxStatus("error");
      };

      ws.onclose = () => {
        console.log("Supervisor connection closed");
        setSandboxStatus("idle");
        // Attempt to reconnect after 5 seconds
        setTimeout(connectToSupervisor, 5000);
      };

      websocketRef.current = ws;
    } catch (error) {
      console.error("Failed to connect to supervisor:", error);
    }
  };

  const handleSupervisorMessage = (data: any) => {
    switch (data.type) {
      case "test-result":
        setTestResults(prev => [...prev, data.result]);
        if (data.result.type === "error" && !isAutoFixing) {
          handleAutoFix([data.result]);
        }
        break;

      case "agent-update":
        setAgentTasks(prev =>
          prev.map(task =>
            task.id === data.task.id ? { ...task, ...data.task } : task
          )
        );
        break;

      case "visual-inspection":
        if (data.screenshot) {
          handleVisualInspection(data.screenshot, data.analysis);
        }
        break;

      case "mcp-tool-used":
        setMcpTools(prev =>
          prev.map(tool =>
            tool.name === data.toolName
              ? { ...tool, usage: tool.usage + 1, lastUsed: new Date() }
              : tool
          )
        );
        break;
    }
  };

  const startSupervision = () => {
    setIsSupervising(true);
    setSandboxStatus("running");

    // Start continuous monitoring
    supervisorInterval.current = setInterval(() => {
      if (iframeRef.current?.contentWindow) {
        runTests();
        captureVisualState();
        checkPerformance();
      }
    }, 5000); // Check every 5 seconds

    // Send start command to supervisor
    if (websocketRef.current?.readyState === WebSocket.OPEN) {
      websocketRef.current.send(JSON.stringify({
        type: "start-supervision",
        pages: pages.map(p => ({ path: p.path, content: p.html }))
      }));
    }

    toast.success("AI Supervisor activated");
  };

  const stopSupervision = () => {
    setIsSupervising(false);
    setSandboxStatus("idle");

    if (supervisorInterval.current) {
      clearInterval(supervisorInterval.current);
    }

    // Send stop command to supervisor
    if (websocketRef.current?.readyState === WebSocket.OPEN) {
      websocketRef.current.send(JSON.stringify({ type: "stop-supervision" }));
    }

    toast.info("AI Supervisor paused");
  };

  const runTests = async () => {
    if (!iframeRef.current?.contentWindow) return;

    try {
      // Inject test runner into iframe
      const testScript = `
        (function() {
          const errors = [];
          const warnings = [];

          // Check for console errors
          const originalError = console.error;
          console.error = function(...args) {
            errors.push({ type: 'console-error', message: args.join(' ') });
            originalError.apply(console, args);
          };

          // Check for broken images
          document.querySelectorAll('img').forEach(img => {
            if (!img.complete || img.naturalHeight === 0) {
              errors.push({ type: 'broken-image', message: 'Broken image: ' + img.src });
            }
          });

          // Check for broken links
          document.querySelectorAll('a').forEach(link => {
            if (link.href && link.href.includes('undefined')) {
              warnings.push({ type: 'broken-link', message: 'Potential broken link: ' + link.href });
            }
          });

          // Check for accessibility issues
          const images = document.querySelectorAll('img:not([alt])');
          if (images.length > 0) {
            warnings.push({
              type: 'accessibility',
              message: images.length + ' images missing alt text'
            });
          }

          // Check for performance issues
          if (document.querySelectorAll('*').length > 5000) {
            warnings.push({
              type: 'performance',
              message: 'DOM has ' + document.querySelectorAll('*').length + ' elements (consider optimization)'
            });
          }

          return { errors, warnings };
        })();
      `;

      const result = await (iframeRef.current.contentWindow as any).eval(testScript);

      const timestamp = new Date();
      result.errors?.forEach((error: any) => {
        setTestResults(prev => [...prev, {
          id: `${timestamp.getTime()}-${Math.random()}`,
          type: "error",
          message: error.message,
          timestamp,
        }]);
      });

      result.warnings?.forEach((warning: any) => {
        setTestResults(prev => [...prev, {
          id: `${timestamp.getTime()}-${Math.random()}`,
          type: "warning",
          message: warning.message,
          timestamp,
        }]);
      });

      if (!result.errors?.length && !result.warnings?.length) {
        setTestResults(prev => [...prev, {
          id: `${timestamp.getTime()}-${Math.random()}`,
          type: "success",
          message: "All tests passed",
          timestamp,
        }]);
      }
    } catch (error) {
      console.error("Test execution failed:", error);
    }
  };

  const captureVisualState = async () => {
    if (!visualInspectionEnabled || !iframeRef.current) return;

    try {
      // Use html2canvas or similar to capture screenshot
      const canvas = await html2canvas(iframeRef.current);
      const screenshot = canvas.toDataURL("image/png");

      // Send to AI for visual analysis
      if (websocketRef.current?.readyState === WebSocket.OPEN) {
        websocketRef.current.send(JSON.stringify({
          type: "analyze-visual",
          screenshot,
          timestamp: new Date(),
        }));
      }
    } catch (error) {
      console.error("Visual capture failed:", error);
    }
  };

  const checkPerformance = () => {
    if (!iframeRef.current?.contentWindow?.performance) return;

    const perf = iframeRef.current.contentWindow.performance;
    const timing = perf.timing;
    const loadTime = timing.loadEventEnd - timing.navigationStart;

    if (loadTime > 3000) {
      setTestResults(prev => [...prev, {
        id: `perf-${Date.now()}`,
        type: "warning",
        message: `Page load time is ${loadTime}ms (target: <3000ms)`,
        timestamp: new Date(),
      }]);
    }
  };

  const handleAutoFix = async (errors: TestResult[]) => {
    if (isAutoFixing || !errors.length) return;

    setIsAutoFixing(true);
    const fixes: string[] = [];

    for (const error of errors) {
      if (error.fixed) continue;

      try {
        const response = await fetch("/api/ai/auto-fix", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            error: error.message,
            type: error.type,
            context: pages[0]?.html,
          }),
        });

        const { fix, applied } = await response.json();

        if (fix && applied) {
          fixes.push(fix);
          setTestResults(prev =>
            prev.map(r =>
              r.id === error.id ? { ...r, fixed: true, fixApplied: fix } : r
            )
          );
        }
      } catch (err) {
        console.error("Auto-fix failed:", err);
      }
    }

    if (fixes.length > 0) {
      onAutoFix(fixes);
      toast.success(`Applied ${fixes.length} automatic fixes`);
    }

    setIsAutoFixing(false);
  };

  const handleVisualInspection = async (screenshot: string, analysis: any) => {
    // Process visual analysis results
    if (analysis.issues?.length > 0) {
      analysis.issues.forEach((issue: any) => {
        setTestResults(prev => [...prev, {
          id: `visual-${Date.now()}-${Math.random()}`,
          type: issue.severity === "error" ? "error" : "warning",
          message: issue.description,
          timestamp: new Date(),
        }]);
      });
    }
  };

  const createAgentTask = (name: string, command: string) => {
    const task: AgentTask = {
      id: `task-${Date.now()}`,
      name,
      status: "pending",
      progress: 0,
      startTime: new Date(),
    };

    setAgentTasks(prev => [...prev, task]);

    // Send task to supervisor
    if (websocketRef.current?.readyState === WebSocket.OPEN) {
      websocketRef.current.send(JSON.stringify({
        type: "execute-task",
        task: { ...task, command },
      }));
    }

    return task.id;
  };

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-purple-400" />
          <h3 className="text-lg font-semibold text-white">AI Supervisor</h3>
          <div className="flex items-center gap-1">
            {sandboxStatus === "running" && (
              <span className="flex items-center gap-1 text-xs text-green-400">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                Active
              </span>
            )}
            {sandboxStatus === "error" && (
              <span className="flex items-center gap-1 text-xs text-red-400">
                <div className="w-2 h-2 bg-red-400 rounded-full" />
                Error
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant={visualInspectionEnabled ? "default" : "outline"}
            onClick={() => setVisualInspectionEnabled(!visualInspectionEnabled)}
            className="gap-1"
          >
            <Eye className="w-4 h-4" />
            Visual
          </Button>

          {isSupervising ? (
            <Button
              size="sm"
              variant="destructive"
              onClick={stopSupervision}
              className="gap-1"
            >
              <Pause className="w-4 h-4" />
              Pause
            </Button>
          ) : (
            <Button
              size="sm"
              variant="default"
              onClick={startSupervision}
              disabled={isAiWorking}
              className="gap-1"
            >
              <Play className="w-4 h-4" />
              Start
            </Button>
          )}
        </div>
      </div>

      {/* MCP Tools Status */}
      <div className="mb-4 p-3 bg-neutral-800/50 rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-300">MCP Tools</span>
          <Button
            size="xs"
            variant="ghost"
            onClick={initializeMCPTools}
            className="gap-1"
          >
            <RotateCw className="w-3 h-3" />
            Refresh
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {mcpTools.map(tool => (
            <div
              key={tool.name}
              className="flex items-center justify-between text-xs"
            >
              <span className="text-gray-400">{tool.name}</span>
              <div className="flex items-center gap-2">
                {tool.available ? (
                  <CheckCircle2 className="w-3 h-3 text-green-400" />
                ) : (
                  <AlertCircle className="w-3 h-3 text-yellow-400" />
                )}
                {tool.usage > 0 && (
                  <span className="text-gray-500">({tool.usage}x)</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Test Results */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-300">Test Results</span>
          {isAutoFixing && (
            <span className="flex items-center gap-1 text-xs text-blue-400">
              <Loading overlay={false} className="!size-3" />
              Auto-fixing...
            </span>
          )}
        </div>
        <div className="max-h-40 overflow-y-auto space-y-1">
          {testResults.slice(-5).reverse().map(result => (
            <div
              key={result.id}
              className="flex items-start gap-2 text-xs p-2 bg-neutral-800/30 rounded"
            >
              {result.type === "error" && (
                <Bug className="w-3 h-3 text-red-400 mt-0.5" />
              )}
              {result.type === "warning" && (
                <AlertCircle className="w-3 h-3 text-yellow-400 mt-0.5" />
              )}
              {result.type === "success" && (
                <CheckCircle2 className="w-3 h-3 text-green-400 mt-0.5" />
              )}
              <div className="flex-1">
                <p className="text-gray-300">{result.message}</p>
                {result.fixed && (
                  <p className="text-green-400 mt-1">✓ Auto-fixed</p>
                )}
              </div>
              <span className="text-gray-500">
                {result.timestamp.toLocaleTimeString()}
              </span>
            </div>
          ))}
          {testResults.length === 0 && (
            <p className="text-gray-500 text-center py-4">
              No test results yet
            </p>
          )}
        </div>
      </div>

      {/* Agent Tasks */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-300">Agent Tasks</span>
          <Button
            size="xs"
            variant="ghost"
            onClick={() => createAgentTask("Visual Test", "npm run test:visual")}
            className="gap-1"
          >
            <Terminal className="w-3 h-3" />
            New Task
          </Button>
        </div>
        <div className="space-y-1">
          {agentTasks.map(task => (
            <div
              key={task.id}
              className="flex items-center justify-between text-xs p-2 bg-neutral-800/30 rounded"
            >
              <div className="flex items-center gap-2">
                <Activity
                  className={`w-3 h-3 ${
                    task.status === "running"
                      ? "text-blue-400 animate-pulse"
                      : task.status === "completed"
                      ? "text-green-400"
                      : task.status === "failed"
                      ? "text-red-400"
                      : "text-gray-400"
                  }`}
                />
                <span className="text-gray-300">{task.name}</span>
              </div>
              <div className="flex items-center gap-2">
                {task.status === "running" && (
                  <div className="w-20 h-1 bg-neutral-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-400 transition-all"
                      style={{ width: `${task.progress}%` }}
                    />
                  </div>
                )}
                <span className="text-gray-500">{task.status}</span>
              </div>
            </div>
          ))}
          {agentTasks.length === 0 && (
            <p className="text-gray-500 text-center py-4">
              No active agent tasks
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// Helper to inject html2canvas if needed
declare global {
  interface Window {
    html2canvas: any;
  }
}

async function html2canvas(element: HTMLElement): Promise<HTMLCanvasElement> {
  if (!window.html2canvas) {
    // Load html2canvas dynamically
    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js";
    document.head.appendChild(script);

    await new Promise(resolve => {
      script.onload = resolve;
    });
  }

  return window.html2canvas(element);
}