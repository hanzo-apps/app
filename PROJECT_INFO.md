# Hanzo App - Project Information

## Overview

Hanzo App is an AI-powered command palette and local AI assistant that has been migrated from React Native to Tauri for better cross-platform support, smaller bundle sizes, and improved performance.

## Architecture

### Frontend (Web Technologies)
- **Framework**: React 18 with TypeScript
- **UI Library**: Tailwind CSS
- **State Management**: Zustand + MobX
- **Build Tool**: Vite
- **Testing**: Vitest + Playwright

### Backend (Rust)
- **Framework**: Tauri v2
- **Native Integration**: Rust-based system integration
- **Performance**: Native Rust for file operations and system calls

### AI Integration
- **Model Context Protocol (MCP)**: Full integration for AI tools
- **LLM Router**: Support for multiple AI providers
- **Local Models**: Support for local AI models
- **Hanzo Zen**: Custom AI orchestration model

## Project Structure

```
app/
├── src/                    # Frontend source code
│   ├── ts/                # TypeScript/React code
│   │   ├── App.tsx        # Main application component
│   │   ├── chat/          # AI chat functionality
│   │   ├── widgets/       # UI widgets
│   │   └── __tests__/     # Tests
│   ├── lib/               # Shared libraries
│   ├── stores/            # State management
│   └── rs/                # Rust modules for web
├── src-tauri/             # Tauri/Rust backend
│   ├── src/               # Rust source code
│   ├── Cargo.toml         # Rust dependencies
│   └── tauri.conf.json    # Tauri configuration
├── docs/                  # Documentation
├── extensions/            # Browser extensions
├── models/                # AI models
├── scripts/               # Build and utility scripts
└── tests/                 # End-to-end tests
```

## Key Features

### AI Assistant
- Tab key to instantly access AI chat
- Context-aware assistance
- Code generation and debugging
- Natural language to action conversion

### Productivity Tools
- App search and launch
- Custom shortcuts
- Google translate
- Calendar integration
- AppleScript commands
- Browser bookmarks
- Window Manager
- Emoji picker
- Clipboard manager
- Notes Scratchpad

### Utilities
- Wi-Fi password retrieval
- IP address display
- Google Meet starter
- OS theme switcher
- Process killer
- Development tools
- Math evaluation

## Development Commands

```bash
# Install dependencies
make install

# Start development
make dev

# Build for production
make build

# Run tests
make test

# Clean build artifacts
make clean
```

## Platform Support

- macOS (primary)
- Windows
- Linux
- iOS (experimental)
- Android (experimental)

## Technologies

- **Frontend**: React, TypeScript, Tailwind CSS, Vite
- **Backend**: Rust, Tauri
- **AI**: MCP, OpenAI, Anthropic, Local models
- **Testing**: Vitest, Playwright
- **Build**: pnpm, Cargo, Make