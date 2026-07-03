import { WebSocketServer, WebSocket } from "ws";
import { exec } from "child_process";
import { promisify } from "util";
import puppeteer from "puppeteer";

const execAsync = promisify(exec);

interface SupervisorClient {
  ws: WebSocket;
  id: string;
  sandboxId?: string;
  browser?: any;
  page?: any;
}

class AISupervisorServer {
  private wss: WebSocketServer;
  private clients: Map<string, SupervisorClient> = new Map();
  private supervisionIntervals: Map<string, NodeJS.Timeout> = new Map();

  constructor(port: number = 8080) {
    this.wss = new WebSocketServer({ port, path: "/supervisor" });
    this.setupServer();
    console.log(`AI Supervisor Server running on port ${port}`);
  }

  private setupServer() {
    this.wss.on("connection", (ws: WebSocket) => {
      const clientId = this.generateClientId();
      const client: SupervisorClient = { ws, id: clientId };
      this.clients.set(clientId, client);

      console.log(`Client connected: ${clientId}`);

      ws.on("message", async (data: Buffer) => {
        try {
          const message = JSON.parse(data.toString());
          await this.handleMessage(clientId, message);
        } catch (error) {
          console.error("Failed to process message:", error);
          ws.send(JSON.stringify({ type: "error", error: String(error) }));
        }
      });

      ws.on("close", () => {
        this.cleanupClient(clientId);
        console.log(`Client disconnected: ${clientId}`);
      });

      ws.on("error", (error) => {
        console.error(`Client ${clientId} error:`, error);
      });

      // Send initial connection confirmation
      ws.send(JSON.stringify({ type: "connected", clientId }));
    });
  }

  private async handleMessage(clientId: string, message: any) {
    const client = this.clients.get(clientId);
    if (!client) return;

    switch (message.type) {
      case "start-supervision":
        await this.startSupervision(client, message.pages);
        break;

      case "stop-supervision":
        this.stopSupervision(clientId);
        break;

      case "execute-task":
        await this.executeTask(client, message.task);
        break;

      case "analyze-visual":
        await this.analyzeVisual(client, message.screenshot);
        break;

      case "run-mcp-tool":
        await this.runMCPTool(client, message.tool, message.args);
        break;
    }
  }

  private async startSupervision(client: SupervisorClient, pages: any[]) {
    // Launch headless browser for visual inspection
    try {
      const browser = await puppeteer.launch({
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
      });

      const page = await browser.newPage();
      client.browser = browser;
      client.page = page;

      // Set up page monitoring
      page.on("console", (msg) => {
        client.ws.send(
          JSON.stringify({
            type: "test-result",
            result: {
              id: `console-${Date.now()}`,
              type: msg.type() === "error" ? "error" : "warning",
              message: `Console ${msg.type()}: ${msg.text()}`,
              timestamp: new Date(),
            },
          })
        );
      });

      page.on("pageerror", (error) => {
        client.ws.send(
          JSON.stringify({
            type: "test-result",
            result: {
              id: `page-error-${Date.now()}`,
              type: "error",
              message: `Page error: ${error.message}`,
              timestamp: new Date(),
            },
          })
        );
      });

      // Start continuous monitoring
      const interval = setInterval(async () => {
        await this.performSupervisionCycle(client, pages);
      }, 5000);

      this.supervisionIntervals.set(client.id, interval);

      client.ws.send(
        JSON.stringify({
          type: "supervision-started",
          sandboxId: client.sandboxId,
        })
      );
    } catch (error) {
      console.error("Failed to start supervision:", error);
      client.ws.send(
        JSON.stringify({
          type: "error",
          message: "Failed to start supervision",
          error: String(error),
        })
      );
    }
  }

  private async performSupervisionCycle(client: SupervisorClient, pages: any[]) {
    if (!client.page) return;

    for (const pageData of pages) {
      try {
        // Load page content
        await client.page.setContent(pageData.content);

        // Run automated tests
        const testResults = await client.page.evaluate(() => {
          const results: any[] = [];

          // Check for broken images
          document.querySelectorAll("img").forEach((img) => {
            if (!img.complete || img.naturalHeight === 0) {
              results.push({
                type: "error",
                message: `Broken image: ${img.src}`,
              });
            }
          });

          // Check for accessibility issues
          const imagesWithoutAlt = document.querySelectorAll("img:not([alt])");
          if (imagesWithoutAlt.length > 0) {
            results.push({
              type: "warning",
              message: `${imagesWithoutAlt.length} images missing alt text`,
            });
          }

          // Check form inputs
          const inputsWithoutLabel = document.querySelectorAll(
            "input:not([aria-label]):not([aria-labelledby])"
          );
          if (inputsWithoutLabel.length > 0) {
            results.push({
              type: "warning",
              message: `${inputsWithoutLabel.length} form inputs without labels`,
            });
          }

          return results;
        });

        // Send test results
        testResults.forEach((result: any) => {
          client.ws.send(
            JSON.stringify({
              type: "test-result",
              result: {
                id: `auto-test-${Date.now()}-${Math.random()}`,
                ...result,
                file: pageData.path,
                timestamp: new Date(),
              },
            })
          );
        });

        // Capture screenshot for visual analysis
        const screenshot = await client.page.screenshot({
          encoding: "base64",
          fullPage: true,
        });

        // Perform visual analysis (simplified)
        const visualAnalysis = await this.performVisualAnalysis(screenshot);

        if (visualAnalysis.issues.length > 0) {
          client.ws.send(
            JSON.stringify({
              type: "visual-inspection",
              screenshot: `data:image/png;base64,${screenshot}`,
              analysis: visualAnalysis,
            })
          );
        }
      } catch (error) {
        console.error("Supervision cycle error:", error);
      }
    }
  }

  private async performVisualAnalysis(screenshot: string): Promise<any> {
    // In production, this would use AI vision models for analysis
    // For now, return mock analysis
    return {
      issues: [],
      suggestions: [],
    };
  }

  private stopSupervision(clientId: string) {
    const interval = this.supervisionIntervals.get(clientId);
    if (interval) {
      clearInterval(interval);
      this.supervisionIntervals.delete(clientId);
    }

    const client = this.clients.get(clientId);
    if (client) {
      if (client.browser) {
        client.browser.close();
        client.browser = undefined;
        client.page = undefined;
      }

      client.ws.send(JSON.stringify({ type: "supervision-stopped" }));
    }
  }

  private async executeTask(client: SupervisorClient, task: any) {
    try {
      // Update task status
      client.ws.send(
        JSON.stringify({
          type: "agent-update",
          task: { ...task, status: "running", progress: 10 },
        })
      );

      // Execute command in sandboxed environment
      const { stdout, stderr } = await execAsync(task.command, {
        timeout: 60000, // 1 minute timeout
        env: {
          ...process.env,
          SANDBOX_MODE: "true",
        },
      });

      // Send completion
      client.ws.send(
        JSON.stringify({
          type: "agent-update",
          task: {
            ...task,
            status: "completed",
            progress: 100,
            output: stdout,
            error: stderr,
            endTime: new Date(),
          },
        })
      );
    } catch (error: any) {
      client.ws.send(
        JSON.stringify({
          type: "agent-update",
          task: {
            ...task,
            status: "failed",
            error: error.message,
            endTime: new Date(),
          },
        })
      );
    }
  }

  private async analyzeVisual(client: SupervisorClient, screenshot: string) {
    // Process screenshot and perform visual analysis
    const analysis = await this.performVisualAnalysis(screenshot);

    client.ws.send(
      JSON.stringify({
        type: "visual-analysis-complete",
        analysis,
        timestamp: new Date(),
      })
    );
  }

  private async runMCPTool(client: SupervisorClient, tool: string, args: string[]) {
    try {
      // Execute MCP tool
      const command = `uvx hanzo-mcp ${tool} ${args.join(" ")}`;
      const { stdout, stderr } = await execAsync(command, {
        timeout: 30000,
        env: {
          ...process.env,
          HANZO_MCP_SANDBOX: "true",
        },
      });

      client.ws.send(
        JSON.stringify({
          type: "mcp-tool-result",
          tool,
          output: stdout,
          error: stderr,
          success: !stderr,
        })
      );

      // Track tool usage
      client.ws.send(
        JSON.stringify({
          type: "mcp-tool-used",
          toolName: tool,
        })
      );
    } catch (error: any) {
      client.ws.send(
        JSON.stringify({
          type: "mcp-tool-error",
          tool,
          error: error.message,
        })
      );
    }
  }

  private cleanupClient(clientId: string) {
    this.stopSupervision(clientId);
    this.clients.delete(clientId);
  }

  private generateClientId(): string {
    return `client-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Export for use in server initialization
export default AISupervisorServer;