#!/bin/bash

# Token counter monitoring script
# Runs count_tokens.js every 30 seconds in an infinite loop

echo "Starting token counter monitoring..."
echo "Press Ctrl+C to stop"

while true; do
    echo "----------------------------------------"
    echo "Token count at $(date '+%Y-%m-%d %H:%M:%S')"
    echo "----------------------------------------"

    # Run the token counter script
    node /Users/z/.claude/count_tokens.js

    echo ""
    echo "Waiting 30 seconds for next update..."

    # Sleep for 30 seconds
    sleep 30
done