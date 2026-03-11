# Complete Feature Guide

This guide covers all features in Hanzo App, including the app launcher, AI chat, MCP server, and LLM router integration.

## Core Features Overview

Hanzo App combines powerful systems:

1. **Command Bar** - Lightning-fast command palette for your computer (⌘+K)
2. **AI Chat** - Multi-model AI assistant with streaming support
3. **MCP Server** - Exposes 50+ system tools to AI agents
4. **LLM Router** - Unified access to 100+ AI providers

## Command Bar (⌘+Space)

### Quick App Launch
- Type app name to search and launch
- Fuzzy matching for fast results
- Shows app icons and paths

### File Search
- Start with `/` to search files
- Uses macOS Spotlight (mdfind)
- Example: `/meeting notes`

### Window Management
- Prefix with `>` for window commands
- `>minimize all` - Minimize all windows
- `>focus safari` - Focus Safari windows
- `>tile` - Tile windows

### System Commands
- `quit <app>` - Quit application
- `sleep` - Sleep computer
- `lock` - Lock screen
- `empty trash` - Empty trash

### Calculator
- Type math expressions directly
- `25 * 4` → 100
- `sqrt(16)` → 4

## AI Chat (⌘+Shift+Space)

### Multi-Model Support

The app automatically connects to:
1. **LLM Router** (port 4000) - Primary
2. **Zen** (port 1337) - Fallback
3. **LM Studio** (port 1234) - Fallback
4. **Mock responses** - When offline

### Features
- **Streaming responses** - Real-time AI output
- **Thread management** - Save conversations
- **Model switching** - Change models on the fly
- **Context preservation** - Maintains conversation history

### Available Models

**Local Models** (Privacy-first):
- Models in `~/Library/Application Support/Hanzo/data/models/`
- Automatic llama.cpp server management
- No internet required

**Cloud Models** (via API keys):
- GPT-4, GPT-3.5 (OpenAI)
- Claude 3.5 Sonnet (Anthropic)
- Open models (Together AI)
- 100+ more providers

## MCP Server Integration

### What It Does

The MCP server makes Hanzo App a powerful automation platform:
- **50+ built-in tools** for system control
- **Claude Desktop compatible**
- **Extensible framework** for custom tools

### Tool Categories

**File Operations**:
- Read, write, copy, move files
- Create/delete directories
- Check file existence

**App Control**:
- Launch applications
- List running apps
- Focus/hide apps

**Window Management**:
- List all windows
- Move, resize, minimize
- Focus specific windows

**System Tools**:
- Clipboard read/write
- Send notifications
- Execute shell commands
- Get system info

### Using with Claude Desktop

1. Build MCP server:
   ```bash
   make build-mcp
   ```

2. Add to Claude config:
   ```json
   {
     "mcpServers": {
       "hanzo-app": {
         "command": "node",
         "args": ["/path/to/hanzo/app/dist/mcp-server.js"]
       }
     }
   }
   ```

3. Use in Claude:
   - "Launch Safari and open my bookmarks"
   - "Organize my Downloads folder by file type"
   - "Show me what's running on my system"

## LLM Router Features

### Automatic Management

The LLM router:
- Starts with the app
- Manages 100+ providers
- Handles failover automatically
- Tracks usage and costs

### Key Features

**Provider Unification**:
- Single API for all providers
- OpenAI-compatible format
- Automatic format translation

**Smart Routing**:
- Cost-based routing
- Load balancing
- Automatic failover
- Local-first options

**Performance**:
- Response caching
- Parallel requests
- Streaming support
- Rate limiting

## Complete Integration Example

Here's how all features work together:

### Scenario: AI-Powered File Organization

1. **User Request** (in chat):
   "Help me organize my Downloads folder"

2. **MCP Tools Activate**:
   - `fs_read` lists Downloads contents
   - AI analyzes file types
   - `fs_create_dir` makes folders
   - `fs_move` organizes files

3. **LLM Router Handles**:
   - Routes to best model
   - Manages API calls
   - Handles errors gracefully

4. **Command Bar Integration**:
   - Quick access to organized folders
   - Launch apps for specific files

## Keyboard Shortcuts

### Global Shortcuts
| Shortcut | Action |
|----------|--------|
| ⌘+Space | Open Command Bar |
| ⌘+Shift+Space | Open AI Chat |
| Esc | Close current window |

### Command Bar
| Shortcut | Action |
|----------|--------|
| ↑/↓ | Navigate results |
| Enter | Launch/execute |
| ⌘+Enter | Launch and hide |
| Tab | Autocomplete |

### AI Chat
| Shortcut | Action |
|----------|--------|
| ⌘+N | New thread |
| ⌘+K | Quick search |
| ⌘+/ | Focus input |
| ⌘+, | Settings |

## Configuration Files

### App Configuration
```
~/Library/Application Support/Hanzo/
├── data/
│   ├── models/          # Local AI models
│   ├── threads/         # Chat history
│   └── cache/           # App cache
├── config.json          # App settings
└── mcp-config.yaml      # MCP configuration
```

### LLM Router Config
`src/ts/chat/lib/llm-router/config.yaml`:
- Model definitions
- Provider settings
- Routing rules

### Environment Variables
`.env` file:
```bash
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
DEBUG=MCP:*,LLM:*
```

## Performance Tips

### 1. Use Local Models
- Install models in data/models/
- Faster responses
- Complete privacy

### 2. Enable Caching
- Reduces API costs
- Faster repeated queries
- Automatic management

### 3. Optimize MCP Tools
- Batch operations
- Use specific tools
- Avoid expensive operations

## Troubleshooting

### App Issues

**Command Bar not opening**:
- Check keyboard shortcuts in System Preferences
- Restart the app
- Check permissions

**AI Chat not responding**:
- Verify LLM router is running (port 4000)
- Check API keys in .env
- Try local model fallback

### MCP Server Issues

**Tools not working**:
- Check console for errors
- Verify permissions
- Test individual tools

**Claude Desktop integration**:
- Use absolute paths in config
- Restart Claude Desktop
- Check MCP server logs

### LLM Router Issues

**Models not available**:
- Check config.yaml syntax
- Verify API keys
- Test health endpoint

**Slow responses**:
- Use local models
- Check rate limits
- Enable caching

## Advanced Usage

### Custom Workflows

Create powerful automations:

```javascript
// Example: Daily summary workflow
1. Search for today's files (MCP)
2. Analyze with AI (LLM Router)
3. Create summary document (MCP)
4. Send notification (MCP)
```

### API Integration

Use Hanzo App as an API:

```bash
# Use MCP tools via API
curl -X POST http://localhost:4000/v1/tools/execute \
  -d '{"tool": "fs_read", "args": {"path": "/path/to/file"}}'

# Chat completion
curl -X POST http://localhost:4000/v1/chat/completions \
  -d '{"model": "gpt-3.5-turbo", "messages": [...]}'
```

### Extending Functionality

1. **Add MCP Tools**: See [MCP Development Guide](../developer/mcp-integration)
2. **Add LLM Providers**: Configure in config.yaml
3. **Create Plugins**: Build Tauri plugins
4. **Customize UI**: Modify React components

## Security & Privacy

### Local-First Design
- MCP tools run locally
- Local models available
- No telemetry by default

### Permission Model
- Tools respect system permissions
- Dangerous operations blocked
- All actions logged

### Data Protection
- API keys encrypted
- Chat history stored locally
- No cloud sync without consent

## Next Steps

- [MCP Tools Reference](../api-reference/mcp-tools) - All available tools
- [Local AI Setup](./local-ai-models) - Configure local models
- [Developer Guide](../developer/) - Extend Hanzo App
- [Keyboard Shortcuts](./keyboard-shortcuts) - Master the app