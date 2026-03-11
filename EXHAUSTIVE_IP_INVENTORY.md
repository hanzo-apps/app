# Exhaustive Intellectual Property Inventory for Neo Porting

This document catalogs ALL valuable IP from the Hanzo app that should be ported to Neo.

## 1. Core Application Architecture

### A. State Management System (MobX)
**Location**: `/apps/desktop/src/stores/`
- **calendar.store.tsx** - Calendar integration and event management
- **chat.store.ts** - AI chat state, conversation history, model management
- **clipboard.store.tsx** - Clipboard history and management
- **emoji.store.tsx** - Emoji picker and recent emojis
- **keystroke.store.ts** - Global keyboard shortcut management
- **processes.store.tsx** - System process monitoring
- **systemPreferences.store.tsx** - User preferences and settings
- **ui.store.ts** - UI state (themes, layouts, window states)
- **unified.store.ts** - Cross-store state coordination

### B. Widget System (16 Widgets)
**Location**: `/apps/desktop/src/widgets/`
1. **ChatWidget** - AI chat interface with streaming
2. **ClipboardWidget** - Clipboard history viewer
3. **ContactsWidget** - Contact management system
4. **EmailWidget** - Email client integration
5. **FileBufferWidget** - File management buffer
6. **FileSearchWidget** - Advanced file search
7. **LargeTypeWidget** - Large text display
8. **MusicControlWidget** - Music player controls
9. **RecentDocumentsWidget** - Recent files tracker
10. **SearchWidget** - Universal search
11. **SettingsWidget** - Settings interface
12. **SettingsSyncWidget** - Settings synchronization
13. **ShellWidget** - Terminal integration
14. **SnippetsWidget** - Text snippet manager
15. **UsageStatsWidget** - Usage analytics
16. **WorkflowsWidget** - Workflow automation

### C. Component Library
**Location**: `/apps/desktop/src/components/`
- **CommandBar/** - Fuzzy search command palette
- **Chat/** - AI chat components (messages, input, model selector)
- **Launcher/** - App launcher interface
- **Settings/** - Settings panels and forms
- **Onboarding/** - First-run experience
- **Common/** - Shared UI components

## 2. Native Platform Integration

### A. macOS Native Code (Swift)
**Location**: `/macos/hanzo-macOS/`
- **WindowManager.swift** - Window manipulation (resize, position, fullscreen)
- **ApplicationSearcher.swift** - App discovery and launching
- **ClipboardHelper.swift** - Clipboard monitoring and manipulation
- **HotKeyManager.swift** - Global keyboard shortcuts
- **PanelManager.swift** - Floating panel windows
- **DarkMode.swift** - Dark mode toggle
- **DoNotDisturb.swift** - DND mode control
- **MediaKeyForwarder.m** - Media key handling
- **BookmarkHelper.swift** - File bookmark management
- **FileSearch.mm** - Spotlight integration
- **CalendarHelper.mm** - Calendar access
- **AppleScriptHelper.swift** - AppleScript execution
- **NotchHelper.swift** - Notch detection for MacBooks
- **ScreenDetector.swift** - Multi-monitor support

### B. Rust Backend (Tauri)
**Location**: `/apps/desktop/src-tauri/src/`

#### Commands Module
- **apps.rs** - Application management commands
- **bookmarks.rs** - File bookmark operations
- **clipboard.rs** - Clipboard operations
- **computer.rs** - System control commands
- **dev_tools.rs** - Developer utilities
- **dnd.rs** - Do Not Disturb control
- **files.rs** - File system operations
- **keychain.rs** - Secure credential storage
- **launch.rs** - App launching logic
- **llama.rs** - LLM integration commands
- **media.rs** - Media control commands
- **shortcuts.rs** - Keyboard shortcut management
- **status_bar.rs** - Menu bar integration
- **system.rs** - System information
- **toast.rs** - Notification system
- **voice.rs** - Voice input/output
- **wifi.rs** - Network management
- **window.rs** - Window management
- **window_controller.rs** - Advanced window control

#### Platform Module
- Platform-specific implementations for macOS, Windows, Linux

#### Native Plugins
- Swift bridge for macOS native features
- Custom Tauri plugin implementations

## 3. AI/LLM Infrastructure

### A. llama.cpp Integration
**Expected Features** (from documentation):
- Local model loading (GGUF format)
- Streaming inference
- Model management
- GPU acceleration support
- Multiple runtime variants:
  - CUDA (NVIDIA)
  - Metal (Apple Silicon)
  - Vulkan (AMD/Intel)
  - CPU variants (AVX2, AVX, NoAVX)

### B. LLM Router
**Location**: `/apps/desktop/src/chat/lib/llm-router/`
- 100+ provider support
- Cost-based routing
- Automatic failover
- Rate limiting
- Usage tracking

### C. Model Context Protocol (MCP)
**Expected Implementation**:
- 50+ system tools exposed
- File operations
- Code analysis
- Browser automation
- Recursive agent calling
- Permission management

### D. Extension System
**Location**: `/extensions/`
1. **assistant-extension** - AI assistant capabilities
2. **conversational-extension** - Conversation management
3. **download-extension** - Download management
4. **engine-management-extension** - Inference engine control
5. **hardware-management-extension** - GPU/hardware detection
6. **inference-cortex-extension** - Cortex inference integration
7. **model-extension** - Model management

## 4. Shared Packages (Monorepo)

### A. @hanzo/ai
**Location**: `/packages/ai/`
- LLM provider interfaces
- Model management utilities
- Streaming response handlers
- Token counting

### B. @hanzo/chat
**Location**: `/packages/chat/`
- Chat UI components
- Message formatting
- Conversation state management
- Markdown rendering

### C. @hanzo/launcher
**Location**: `/packages/launcher/`
- Launcher UI components
- Search algorithms
- App integration

### D. @hanzo/ui
**Location**: `/packages/ui/`
- Design system components
- Theme definitions
- Animation utilities
- Icon library

### E. @hanzo/types
**Location**: `/packages/types/`
- TypeScript type definitions
- Shared interfaces
- API contracts

### F. @hanzo/config
**Location**: `/packages/config/`
- ESLint configuration
- TypeScript configuration
- Tailwind configuration

### G. @hanzo/native-bridge
**Location**: `/packages/native-bridge/`
- Platform abstraction layer
- Tauri/Capacitor/React Native adapters

## 5. Build & Development Infrastructure

### A. Build Scripts
**Location**: `/scripts/`
- **build-mcp-server.js** - MCP server builder
- **bump-version.sh** - Version management
- **create_icns.py** - Icon generation
- **generate-hanzo-logo.js** - Logo generation
- **appcast.sh** - Update feed generator

### B. Testing Infrastructure
**Location**: `/test/`, `/tests/`
- E2E tests (Playwright)
- Unit tests (Vitest)
- Integration tests
- AI-specific tests
- Visual regression tests

### C. CI/CD Configuration
- GitHub Actions workflows
- Fastlane configuration
- Release automation

## 6. Configuration & Assets

### A. Application Configuration
- **tauri.conf.json** - Tauri configuration
- **package.json** files - Dependencies
- **tsconfig.json** - TypeScript config
- **vite.config.ts** - Build configuration
- **tailwind.config.js** - Styling config

### B. Assets
- Application icons (multiple formats)
- Font files (Inter)
- Image assets
- Sound files

### C. Platform-Specific Configs
- **Info.plist** - macOS metadata
- **entitlements** - macOS permissions
- **Package.appxmanifest** - Windows config

## 7. Unique Hanzo Innovations

### A. Unified Architecture
- Tab key for instant AI access
- Merged launcher + AI chat
- Context-aware assistance
- Widget-based extensibility

### B. Black Monochromatic Theme
- Custom CSS variables
- Consistent design language
- Minimal UI approach
- Focus on content

### C. Hanzo Zen Model
- Local orchestration
- Cost optimization
- Peer agent networks
- Recursive MCP calling

## 8. Documentation & Knowledge Base

### A. Technical Documentation
**Location**: `/docs/`
- Architecture guides
- API documentation
- Platform setup guides
- Migration documentation

### B. Feature Documentation
- Complete feature guide
- User workflows
- Developer guides
- MCP tool documentation

## Implementation Priority for Neo

### Phase 1: Core Foundation (Critical)
1. Tauri setup with all plugins
2. State management (MobX stores)
3. Basic widget system framework
4. Command palette (launcher)
5. AI chat interface

### Phase 2: Platform Integration
1. macOS native features (Swift)
2. Global shortcuts
3. System tray
4. Window management
5. Clipboard integration

### Phase 3: AI Infrastructure
1. llama.cpp integration
2. LLM router
3. MCP server
4. Extension system
5. Model management

### Phase 4: Complete Widget Set
1. All 16 widgets
2. Widget framework
3. Widget persistence
4. Widget interactions

### Phase 5: Polish & Distribution
1. Auto-update system
2. Settings sync
3. Onboarding flow
4. App store preparation
5. Documentation

## Estimated Development Time
- **Total Components**: ~200 major pieces
- **Lines of Code**: ~50,000+ (excluding generated)
- **Time Estimate**: 4-6 weeks for full port
- **Team Size**: 2-3 developers recommended

## Notes
- The app represents a complete merger of Jan (AI) + Sol (launcher)
- Significant custom Swift code for macOS integration
- Complex widget system requires careful architecture
- MCP integration appears planned but not fully implemented
- llama.cpp integration exists but may need updates