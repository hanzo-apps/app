#!/bin/bash

# Test llama-server with the pre-downloaded model

MODEL_PATH="$HOME/Library/Application Support/Hanzo/data/models/qwen-0.5b.gguf"
LLAMA_SERVER="./src-tauri/target/release/llama-server"

# Check if model exists
if [ ! -f "$MODEL_PATH" ]; then
    echo "❌ Model not found at: $MODEL_PATH"
    echo "Run 'make install-test-model' first"
    exit 1
fi

echo "✅ Model found at: $MODEL_PATH"

# Check if llama-server exists
if [ ! -f "$LLAMA_SERVER" ]; then
    echo "❌ llama-server not found. Looking for it..."
    
    # Try to find it in resources
    LLAMA_SERVER=$(find . -name "llama-server" -type f | head -n 1)
    
    if [ -z "$LLAMA_SERVER" ]; then
        echo "❌ Could not find llama-server binary"
        exit 1
    fi
fi

echo "✅ llama-server found at: $LLAMA_SERVER"

# Start llama-server
echo "🚀 Starting llama-server..."
"$LLAMA_SERVER" \
    --host 0.0.0.0 \
    --port 39291 \
    --model "$MODEL_PATH" \
    --ctx-size 4096 \
    --threads 4 \
    --n-gpu-layers 0 \
    --parallel 2 &

SERVER_PID=$!
echo "✅ llama-server started with PID: $SERVER_PID"

# Wait for server to start
sleep 5

# Test the server
echo "🧪 Testing server..."
curl -X POST http://localhost:39291/v1/chat/completions \
    -H "Content-Type: application/json" \
    -d '{
        "model": "qwen",
        "messages": [{"role": "user", "content": "Say hello!"}],
        "temperature": 0.7,
        "max_tokens": 50
    }'

echo ""
echo "✅ Test complete. Stopping server..."
kill $SERVER_PID