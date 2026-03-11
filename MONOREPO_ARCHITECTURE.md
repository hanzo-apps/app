# Hanzo Monorepo Architecture

## Overview
Transform Hanzo into a monorepo supporting web, desktop (macOS, Windows, Linux), and mobile (iOS, Android) platforms with shared code and modular architecture.

## Monorepo Structure
```
hanzo/
├── apps/                      # Applications
│   ├── desktop/              # Desktop app (Tauri)
│   │   ├── src-tauri/        # Rust/Tauri backend
│   │   └── src/              # Frontend specific to desktop
│   ├── web/                  # Web application
│   │   ├── src/
│   │   └── public/
│   ├── mobile/               # React Native app
│   │   ├── ios/
│   │   ├── android/
│   │   └── src/
│   └── mcp-server/           # MCP server (standalone)
│       └── src/
│
├── packages/                  # Shared packages
│   ├── ui/                   # Shared UI components
│   │   ├── src/
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   └── utils/
│   │   └── package.json
│   ├── chat/                 # Chat functionality
│   │   ├── src/
│   │   │   ├── components/
│   │   │   ├── stores/
│   │   │   └── hooks/
│   │   └── package.json
│   ├── launcher/             # Command bar/launcher
│   │   ├── src/
│   │   │   ├── components/
│   │   │   ├── search/
│   │   │   └── hooks/
│   │   └── package.json
│   ├── ai/                   # AI/LLM integration
│   │   ├── src/
│   │   │   ├── llama/
│   │   │   ├── mcp-client/
│   │   │   └── providers/
│   │   └── package.json
│   ├── types/                # Shared TypeScript types
│   │   └── src/
│   ├── config/               # Shared configuration
│   │   ├── eslint/
│   │   ├── tsconfig/
│   │   └── tailwind/
│   └── native-bridge/        # Native platform bridges
│       ├── tauri/
│       ├── react-native/
│       └── capacitor/
│
├── crates/                    # Rust crates
│   ├── hanzo-core/           # Core Rust functionality
│   │   ├── src/
│   │   └── Cargo.toml
│   ├── hanzo-llama/          # llama.cpp bindings
│   │   ├── src/
│   │   └── Cargo.toml
│   ├── hanzo-mcp/            # MCP implementation
│   │   ├── src/
│   │   └── Cargo.toml
│   ├── hanzo-platform/       # Platform-specific code
│   │   ├── src/
│   │   │   ├── macos/
│   │   │   ├── windows/
│   │   │   └── linux/
│   │   └── Cargo.toml
│   └── hanzo-tauri-plugins/  # Tauri plugins
│       ├── src/
│       └── Cargo.toml
│
├── tools/                     # Build tools & scripts
│   ├── scripts/
│   └── ci/
│
├── docs/                      # Documentation
├── .github/                   # GitHub Actions
├── turbo.json                 # Turborepo config
├── pnpm-workspace.yaml        # PNPM workspace
├── Cargo.workspace            # Rust workspace
├── package.json               # Root package.json
└── README.md
```

## Technology Stack

### Build System
- **Turborepo**: For efficient monorepo builds
- **PNPM**: Package management with workspace support
- **Cargo Workspaces**: For Rust crates

### Frontend
- **Shared (packages/)**:
  - React 18
  - TypeScript 5
  - TailwindCSS
  - Zustand (state management)
  - React Query (data fetching)

### Platform-Specific
- **Desktop**: Tauri v2
- **Web**: Vite + React
- **Mobile**: React Native + Expo
- **Cross-platform**: Capacitor (alternative)

### Backend/Native
- **Rust**: Core business logic
- **llama.cpp**: Local AI inference
- **MCP**: Model Context Protocol

## Package Structure

### @hanzo/ui
```typescript
// Shared UI components
export * from './components/Button'
export * from './components/Input'
export * from './components/Card'
export * from './hooks/useTheme'
export * from './utils/cn'
```

### @hanzo/chat
```typescript
// Chat functionality
export * from './components/ChatInput'
export * from './components/MessageList'
export * from './stores/chatStore'
export * from './hooks/useChat'
```

### @hanzo/launcher
```typescript
// Command bar/launcher
export * from './components/CommandBar'
export * from './components/SearchResults'
export * from './search/fuzzySearch'
export * from './hooks/useCommands'
```

### @hanzo/ai
```typescript
// AI integration
export * from './llama/LlamaClient'
export * from './mcp-client/MCPClient'
export * from './providers/AIProvider'
```

## Workspace Configuration

### pnpm-workspace.yaml
```yaml
packages:
  - 'apps/*'
  - 'packages/*'
  - 'crates/*'
```

### turbo.json
```json
{
  "$schema": "https://turbo.build/schema.json",
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", "build/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {
      "outputs": []
    },
    "test": {
      "outputs": ["coverage/**"],
      "dependsOn": ["build"]
    },
    "typecheck": {
      "outputs": []
    }
  }
}
```

### Root package.json
```json
{
  "name": "hanzo",
  "private": true,
  "scripts": {
    "dev": "turbo run dev",
    "build": "turbo run build",
    "lint": "turbo run lint",
    "test": "turbo run test",
    "typecheck": "turbo run typecheck",
    "desktop:dev": "pnpm --filter @hanzo/desktop dev",
    "web:dev": "pnpm --filter @hanzo/web dev",
    "mobile:dev": "pnpm --filter @hanzo/mobile dev"
  },
  "devDependencies": {
    "turbo": "latest",
    "@changesets/cli": "^2.27.0",
    "prettier": "^3.0.0"
  }
}
```

### Cargo.toml (workspace root)
```toml
[workspace]
members = [
  "apps/desktop/src-tauri",
  "apps/mcp-server",
  "crates/hanzo-core",
  "crates/hanzo-llama",
  "crates/hanzo-mcp",
  "crates/hanzo-platform",
  "crates/hanzo-tauri-plugins"
]

[workspace.dependencies]
tokio = { version = "1.35", features = ["full"] }
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"
anyhow = "1.0"
tracing = "0.1"
```

## Platform-Specific Apps

### Desktop App (apps/desktop)
- Tauri v2 with all platforms
- Shared UI from packages
- Native functionality via Rust crates

### Web App (apps/web)
- Progressive Web App
- Same UI components
- WebAssembly for AI features
- Service Worker for offline

### Mobile App (apps/mobile)
- React Native + Expo
- Shared business logic
- Native modules for platform features
- Over-the-air updates

### MCP Server (apps/mcp-server)
- Standalone Rust server
- Exposes Hanzo capabilities
- WebSocket/HTTP API

## Benefits

1. **Code Reuse**: Share 80%+ code across platforms
2. **Type Safety**: Shared types across entire codebase
3. **Parallel Development**: Teams can work independently
4. **Incremental Builds**: Only rebuild what changed
5. **Consistent UX**: Same components everywhere
6. **Easy Testing**: Test packages in isolation

## Migration Plan

1. **Phase 1**: Set up monorepo structure
2. **Phase 2**: Extract shared packages
3. **Phase 3**: Create platform apps
4. **Phase 4**: Implement Rust crates
5. **Phase 5**: Add mobile support
6. **Phase 6**: Deploy & distribute

## Commands

```bash
# Install dependencies
pnpm install

# Development
pnpm dev                 # All apps
pnpm desktop:dev         # Desktop only
pnpm web:dev            # Web only
pnpm mobile:dev         # Mobile only

# Build
pnpm build              # All apps
pnpm desktop:build      # Desktop only
pnpm web:build         # Web only

# Testing
pnpm test              # All tests
pnpm test:ui          # UI package tests
pnpm test:integration  # Integration tests

# Release
pnpm changeset         # Create changeset
pnpm version-packages  # Version packages
pnpm release          # Publish packages
```