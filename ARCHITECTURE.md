# Hanzo App Architecture

## Overview

Hanzo App is built with Tauri, combining a React frontend with a Rust backend for optimal performance and cross-platform compatibility.

## Technology Stack

### Frontend
- **React 18**: UI framework
- **TypeScript**: Type safety
- **Tailwind CSS**: Styling
- **Zustand/MobX**: State management
- **Vite**: Build tool

### Backend
- **Tauri v2**: Application framework
- **Rust**: Native performance
- **Model Context Protocol (MCP)**: AI integration

### AI Integration
- **LLM Router**: Multi-provider support
- **Hanzo Zen**: Local orchestration model
- **MCP Tools**: Extensible AI capabilities

## Directory Structure

```
app/
├── src/                    # Frontend source
│   ├── ts/                # TypeScript/React
│   │   ├── App.tsx        # Main app
│   │   ├── chat/          # AI chat
│   │   ├── widgets/       # UI components
│   │   └── __tests__/     # Tests
│   ├── lib/               # Shared libraries
│   ├── stores/            # State management
│   └── assets/            # Static assets
├── src-tauri/             # Tauri backend
│   ├── src/               # Rust source
│   ├── Cargo.toml         # Rust deps
│   └── tauri.conf.json    # Tauri config
├── docs/                  # Documentation
│   ├── architecture/      # Technical docs
│   ├── guides/            # User guides
│   └── migration/         # Migration guides
├── scripts/               # Build scripts
├── tests/                 # E2E tests
└── extensions/            # Browser extensions
```

## Key Components

### Command Palette
- Global shortcut (Tab key)
- Fuzzy search
- Action execution
- Plugin system

### AI Chat
- Context awareness
- Multiple providers
- Local models
- Tool integration

### System Integration
- Native OS APIs
- File system access
- Process management
- Window control

## Data Flow

1. User triggers action (keyboard/UI)
2. Frontend dispatches command
3. Tauri bridge processes request
4. Rust backend executes native code
5. Result returned to frontend
6. UI updates reflect changes

## Build Process

1. TypeScript compilation
2. React bundling (Vite)
3. Rust compilation
4. Tauri packaging
5. Platform-specific builds

## Performance Optimizations

- Lazy loading of features
- Virtual scrolling for lists
- Rust-based file operations
- Efficient IPC communication
- Minimal bundle size (~10MB)