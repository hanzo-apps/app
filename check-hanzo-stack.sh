#!/bin/bash

echo "🚀 Checking Hanzo Stack Components..."
echo "========================================"

# Check if MCP server is running (stdio-based, part of Hanzo app)
MCP_PID=$(pgrep -f "hanzo-mcp" | head -1)
if [ -n "$MCP_PID" ]; then
    echo "✅ MCP Server is running (PID: $MCP_PID)"
else
    echo "❌ MCP Server is NOT running"
fi

# Check if LLM router is running
LLM_PID=$(lsof -ti:4000 2>/dev/null)
if [ -n "$LLM_PID" ]; then
    echo "✅ LLM Router is running on port 4000 (PID: $LLM_PID)"
else
    echo "❌ LLM Router is NOT running on port 4000"
fi

# Check if llama-server is running
LLAMA_PID=$(pgrep -f llama-server)
if [ -n "$LLAMA_PID" ]; then
    echo "✅ Llama Server is running (PID: $LLAMA_PID)"
else
    echo "⚠️  Llama Server is NOT running (starts when model is available)"
fi

# Check if Tauri app is running (either debug or release)
TAURI_PID=$(pgrep -f "hanzo.app/Contents/MacOS/app" | head -1)
if [ -z "$TAURI_PID" ]; then
    TAURI_PID=$(pgrep -f "target/debug/app" | head -1)
fi
if [ -n "$TAURI_PID" ]; then
    echo "✅ Hanzo App is running (PID: $TAURI_PID)"
else
    echo "❌ Hanzo App is NOT running"
fi

echo "========================================"

# MCP servers use stdio, not HTTP, so we just check if they're running

# Test LLM router health
if [ -n "$LLM_PID" ]; then
    echo "Testing LLM Router health..."
    curl -s http://localhost:4000/health > /dev/null 2>&1
    if [ $? -eq 0 ]; then
        echo "✅ LLM Router is healthy"
    else
        echo "⚠️  LLM Router is running but not responding to health checks"
    fi
fi