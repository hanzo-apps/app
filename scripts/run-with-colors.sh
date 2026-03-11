#!/bin/bash
# Script to run commands with proper color support in screen/tmux

# Force color output for common tools
export FORCE_COLOR=1
export COLORTERM=truecolor

# Set proper TERM for screen
if [ -n "$STY" ] || [ -n "$TMUX" ]; then
    # We're in screen or tmux
    if [[ "$TERM" == "screen" ]]; then
        export TERM=screen-256color
    fi
fi

# Run the command with arguments
exec "$@"