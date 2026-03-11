# Hanzo Neo Architecture

## Overview

Hanzo Neo is a complete rebuild from first principles, focusing on clarity, simplicity, and performance.

## Core Principles

1. **Single Entry Point**: One App component that manages state
2. **Two Primary Modes**: Launcher (quick access) and Assistant (full interface)
3. **Clean Separation**: Each feature is self-contained
4. **No Duplication**: DRY principle throughout
5. **Apple-like Design**: Intuitive, minimal, elegant

## Architecture Decisions

### Why Two Modes?

- **Launcher Mode**: Quick command palette for fast actions (Cmd+Space)
  - Instant search
  - App launching
  - Quick commands
  - Falls back to AI search

- **Assistant Mode**: Full productivity interface
  - AI chat
  - Tool integrations
  - Persistent workspace

### Component Structure

```
App.tsx                    # Root component, manages app state
├── Launcher/             # Quick access mode
│   ├── search logic      # Fuzzy search for commands
│   └── keyboard nav      # Arrow keys + Enter
└── Assistant/            # Full interface mode
    ├── ChatMessage       # Message display
    ├── ToolPanel        # Integrated tools
    └── AI integration   # Backend connection
```

### State Management

- **Minimal State**: Only what's necessary at each level
- **Props Down**: Clear data flow
- **Actions Up**: Event handlers passed as props
- **No Global State**: Keep it simple until needed

### Styling Philosophy

- **CSS Variables**: Consistent theming
- **BEM-lite**: Simple, predictable class names
- **Co-located Styles**: CSS files next to components
- **Dark Mode First**: Designed for low-light environments

## Next Steps

1. **Tauri Integration**: Set up native backend
2. **AI Connection**: Wire up to LLM backend
3. **Tool Implementation**: Build out calculator, notes, etc.
4. **Keyboard Shortcuts**: Global hotkeys
5. **Settings**: Preferences and customization

## Migration Strategy

1. Start fresh with core functionality
2. Port features one by one
3. Test thoroughly
4. Archive old code
5. Ship when ready

## Benefits

- **Fast**: Minimal dependencies, optimized build
- **Clear**: Anyone can understand the codebase
- **Maintainable**: Easy to add features
- **Testable**: Clear boundaries
- **Beautiful**: Consistent, polished UI