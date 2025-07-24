# Hanzo App Integration Plan

## Overview
This document outlines the plan to integrate Sol's command bar/launcher UI and Jan's chat interface into the Hanzo Tauri v2 app.

## Current Status
- ✅ Basic Tauri v2 app structure with simple views
- ✅ Native macOS functionality ported as Tauri plugins
- ✅ System tray implementation (needs icon fix)
- 🚧 View switching functionality
- ❌ Advanced UI components from Sol/Jan

## Integration Tasks

### 1. Port Sol's Command Bar/Launcher (Priority: High)
**Components to Port:**
- `MainInput.tsx` - The main search input with auto-complete
- `search.widget.tsx` - The search results and command palette
- `ItemRow` component - For displaying search results
- Fuzzy search logic using `fzf` library
- App launching functionality
- File search capabilities
- Keyboard navigation

**Implementation Steps:**
1. Extract the UI components (remove React Native specific code)
2. Replace React Native components with React/HTML equivalents
3. Port the MobX stores to Zustand or Context API
4. Connect to our existing Tauri commands for app launching
5. Implement fuzzy search using the same `fzf` library

### 2. Integrate Jan's Chat Interface (Priority: High)
**Components to Port:**
- `ChatInput.tsx` - The main chat input with file uploads
- Chat message display components
- MCP (Model Context Protocol) integration
- Streaming response handling
- Markdown rendering with syntax highlighting

**Implementation Steps:**
1. Copy Jan's chat UI components
2. Remove Cortex-specific code
3. Integrate with llama.cpp via Tauri commands
4. Set up MCP server connections
5. Implement streaming responses

### 3. Replace Cortex with llama.cpp (Priority: High)
**Tasks:**
1. Add llama.cpp as a dependency in Rust
2. Create Tauri commands for:
   - Model loading
   - Text generation
   - Streaming responses
   - Model management
3. Port Jan's model management UI
4. Implement model downloading and storage

### 4. Implement MCP Server (Priority: Medium)
**Tasks:**
1. Create MCP server implementation in Rust
2. Expose Hanzo app capabilities as MCP tools:
   - File operations
   - App launching
   - System commands
   - Clipboard access
3. Support for connecting to other MCP servers
4. UI for managing MCP connections

## Technical Stack
- **Frontend**: React 18, TypeScript, Tailwind CSS
- **State Management**: Zustand (simpler than MobX)
- **Build Tool**: Vite
- **Backend**: Tauri v2, Rust
- **AI Engine**: llama.cpp
- **Protocol**: MCP (Model Context Protocol)

## File Structure
```
src/
├── components/
│   ├── CommandBar/
│   │   ├── CommandInput.tsx
│   │   ├── SearchResults.tsx
│   │   └── index.tsx
│   ├── Chat/
│   │   ├── ChatInput.tsx
│   │   ├── MessageList.tsx
│   │   ├── Message.tsx
│   │   └── index.tsx
│   └── common/
├── stores/
│   ├── app.store.ts
│   ├── chat.store.ts
│   └── mcp.store.ts
├── lib/
│   ├── fuzzy-search.ts
│   ├── llama.ts
│   └── mcp-client.ts
└── App.tsx

src-tauri/
├── src/
│   ├── commands/
│   │   ├── llama.rs
│   │   ├── mcp.rs
│   │   └── ...
│   ├── mcp_server/
│   │   ├── mod.rs
│   │   └── handlers.rs
│   └── lib.rs
```

## Dependencies to Add
```json
{
  "dependencies": {
    "fzf": "^0.5.2",
    "zustand": "^4.5.0",
    "react-markdown": "^9.0.0",
    "react-syntax-highlighter": "^15.5.0",
    "@tabler/icons-react": "^3.33.0",
    "react-textarea-autosize": "^8.5.0"
  }
}
```

## Rust Dependencies
```toml
[dependencies]
llama-cpp = "0.1"
tokio = { version = "1", features = ["full"] }
serde_json = "1.0"
```

## Next Steps
1. Set up the new file structure
2. Install required dependencies
3. Port Sol's command bar UI
4. Port Jan's chat interface
5. Implement llama.cpp integration
6. Set up MCP server
7. Test and refine the integration