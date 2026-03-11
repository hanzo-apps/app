# Migration from Zen Architecture

This guide explains the architectural improvements and migrations from the original Zen-based codebase to the current Hanzo App architecture.

## Architecture Evolution

### Original Zen Architecture

```
┌─────────────────┐
│   Electron App   │
│   (React UI)     │
├─────────────────┤
│  Extension API   │
├─────────────────┤
│   Extensions     │
│ - Model Loader   │
│ - Inference      │
│ - Assistant      │
└─────────────────┘
```

### New Hanzo Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Tauri App     │────▶│   MCP Server    │────▶│   LLM Router    │
│  (React + Sol)  │     │  (50+ tools)    │     │ (100+ providers)│
└─────────────────┘     └─────────────────┘     └─────────────────┘
         │                       │                        │
         └───────────────────────┴────────────────────────┘
                              Unified AI Platform
```

## Key Improvements

### 1. From Electron to Tauri

**Before (Zen/Electron):**
- Large bundle size (100MB+)
- High memory usage
- Node.js security concerns
- Complex IPC communication

**After (Hanzo/Tauri):**
- Small bundle (<20MB)
- Native performance
- Rust security model
- Direct system access

### 2. Extension System → MCP Protocol

**Before (Zen Extensions):**
```typescript
// Complex extension API
export interface Extension {
  name: string
  install(): Promise<void>
  activate(): Promise<void>
  deactivate(): Promise<void>
}
```

**After (MCP Tools):**
```typescript
// Simple, standardized tools
export interface MCPTool {
  name: string
  description: string
  inputSchema: object
  handler: (args: any) => Promise<string>
}
```

Benefits:
- Industry-standard protocol
- Works with Claude Desktop
- Simpler to implement
- Better tool discovery

### 3. Local Models → LLM Router

**Before (Zen):**
- Single model at a time
- Manual model management
- Limited to local models

**After (Hanzo):**
- 100+ providers supported
- Automatic failover
- Local + cloud models
- Unified API

### 4. Command Bar Integration

**New in Hanzo:**
- Command palette for your computer (⌘+Space)
- System-wide shortcuts
- Window management
- App control
- Quick actions and search

Not available in Zen.

## Migration Steps

### 1. Model Migration

**Zen models location:**
```
~/zen/models/
├── model1.gguf
└── model2.gguf
```

**Move to Hanzo:**
```bash
# Copy models to Hanzo directory
cp ~/zen/models/*.gguf ~/Library/Application\ Support/Hanzo/data/models/
```

### 2. Thread/Chat Migration

**Export from Zen:**
1. Open Zen
2. Export conversations as JSON
3. Save to file

**Import to Hanzo:**
```javascript
// Convert Zen format to Hanzo format
const convertThread = (zenThread) => ({
  id: zenThread.id,
  title: zenThread.name,
  messages: zenThread.messages.map(msg => ({
    role: msg.role,
    content: msg.content.text,
    timestamp: new Date(msg.timestamp)
  })),
  createdAt: new Date(zenThread.created),
  updatedAt: new Date(zenThread.updated)
})
```

### 3. Extension Migration

**Zen Extension → MCP Tool:**

```javascript
// Before (Zen extension)
class MyExtension extends BaseExtension {
  async onLoad() {
    this.registerCommand('myCommand', this.handler)
  }
  
  async handler(args) {
    return this.doSomething(args)
  }
}

// After (MCP tool)
export const myTool: MCPTool = {
  name: 'my_command',
  description: 'Does something',
  inputSchema: {
    type: 'object',
    properties: {
      input: { type: 'string' }
    }
  },
  handler: async (args) => {
    return doSomething(args)
  }
}
```

### 4. API Migration

**Zen API calls:**
```javascript
// Before
const response = await window.zenApi.chat({
  model: 'model-name',
  messages: messages
})

// After
const response = await fetch('http://localhost:4000/v1/chat/completions', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    model: 'model-name',
    messages: messages
  })
})
```

## Feature Comparison

| Feature | Zen | Hanzo App |
|---------|-----|-----------|
| **Platform** | Electron | Tauri |
| **Bundle Size** | ~100MB | ~20MB |
| **Memory Usage** | ~500MB | ~200MB |
| **Model Support** | Local only | Local + Cloud |
| **Providers** | 1 | 100+ |
| **System Integration** | Limited | Full (via MCP) |
| **Command Bar** | No | Yes (⌘+Space) |
| **Window Management** | No | Yes |
| **Claude Compatible** | No | Yes |
| **API Standard** | Custom | OpenAI-compatible |

## Configuration Migration

### Zen Settings

```json
// ~/zen/settings.json
{
  "modelPath": "~/zen/models",
  "dataPath": "~/zen/data",
  "theme": "dark",
  "apiKey": "..."
}
```

### Hanzo Settings

```yaml
# Multiple config files for different components

# LLM Router config
model_list:
  - model_name: "local-model"
    litellm_params:
      model: "openai/model-name"
      api_base: "http://localhost:8080/v1"

# App config (auto-managed)
~/Library/Application Support/Hanzo/config.json
```

## Troubleshooting Migration

### Models Not Loading

1. Check file permissions
2. Verify GGUF format
3. Ensure correct path
4. Check available memory

### Performance Issues

1. Close Zen before running Hanzo
2. Check for port conflicts (1337)
3. Verify model compatibility

### Missing Features

Some Zen features have equivalents:
- **Model downloading** → Manual download + copy
- **Extension marketplace** → MCP tools
- **Prompt templates** → Coming soon

## Benefits After Migration

1. **Better Performance**
   - Faster startup
   - Lower memory usage
   - Native OS integration

2. **More Models**
   - Access to 100+ providers
   - Automatic failover
   - Cost optimization

3. **System Integration**
   - Control entire system
   - Automate workflows
   - Claude Desktop compatible

4. **Developer Experience**
   - Simpler tool creation
   - Standard protocols
   - Better debugging

## Rollback Plan

If you need to go back to Zen:
1. Models remain compatible
2. Export threads from Hanzo
3. Uninstall Hanzo App
4. Reinstall Zen

Both can coexist during transition.

## Next Steps

- [Getting Started](../guides/getting-started) - Set up Hanzo App
- [Complete Feature Guide](../guides/complete-feature-guide) - Learn all features
- [MCP Development](../developer/mcp-integration) - Build new tools
- [Local Models Guide](../guides/local-ai-models) - Optimize model setup