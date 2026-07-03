import { NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export async function GET() {
  try {
    // Check if hanzo-mcp is available
    const tools = {
      hanzoMcp: false,
      browserAutomation: false,
      codeAnalysis: false,
      visualRegression: false,
      performanceMonitor: false,
    };

    try {
      // Check if hanzo-mcp is installed and available
      const { stdout } = await execAsync("which uvx");
      if (stdout) {
        // Try to check hanzo-mcp availability
        const { stdout: mcpCheck } = await execAsync("uvx hanzo-mcp --version").catch(() => ({ stdout: "" }));
        tools.hanzoMcp = !!mcpCheck;
      }
    } catch (error) {
      console.error("MCP tools check failed:", error);
    }

    // Check for other tools (these would be actual checks in production)
    tools.browserAutomation = true; // Playwright availability
    tools.codeAnalysis = true; // ESLint/TSC availability
    tools.visualRegression = false; // Would check for visual testing tools
    tools.performanceMonitor = true; // Performance API is always available

    return NextResponse.json(tools);
  } catch (error) {
    console.error("Failed to check MCP tools:", error);
    return NextResponse.json(
      { error: "Failed to check MCP tools" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { tool, command, args } = await request.json();

    if (tool === "hanzo-mcp") {
      // Execute hanzo-mcp command in sandboxed environment
      try {
        const { stdout, stderr } = await execAsync(
          `uvx hanzo-mcp ${command} ${args.join(" ")}`,
          {
            timeout: 30000, // 30 second timeout
            env: {
              ...process.env,
              NODE_ENV: "production",
              HANZO_MCP_SANDBOX: "true",
            },
          }
        );

        return NextResponse.json({
          success: true,
          output: stdout,
          error: stderr,
        });
      } catch (error: any) {
        return NextResponse.json({
          success: false,
          error: error.message,
        });
      }
    }

    return NextResponse.json(
      { error: "Unknown tool" },
      { status: 400 }
    );
  } catch (error) {
    console.error("MCP tool execution failed:", error);
    return NextResponse.json(
      { error: "Tool execution failed" },
      { status: 500 }
    );
  }
}