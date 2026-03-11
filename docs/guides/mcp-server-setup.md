# MCP Server Setup Guide

This guide walks through setting up and using the MCP (Model Context Protocol) server built into Hanzo App.

## What is MCP?

Model Context Protocol (MCP) is a standard for exposing tools and resources to AI models. Hanzo App includes a comprehensive MCP server that makes system functionality available to AI assistants like Claude.

## Built-in MCP Server

Hanzo App runs as a massive MCP server exposing:

- **50+ System Tools**: File operations, app launching, window management
- **Tauri Plugin Integration**: All Tauri plugins exposed as MCP tools
- **App Launcher Features**: Fast app search and launch capabilities
- **Custom Tools**: Extensible framework for adding new tools

## Quick Start

### 1. Start Hanzo App

The MCP server starts automatically when you launch Hanzo App:

```bash
make dev  # Development mode
# or
make build && open src-tauri/target/release/Hanzo.app  # Production
```

### 2. Verify MCP Server

Check that the MCP server is running:

```bash
# In the app console, you should see:
# "Registered 50+ MCP tools"
# "MCP server ready for embedding"
```

## Using with Claude Desktop

### 1. Build Standalone MCP Server

```bash
make build-mcp
```

This creates `dist/mcp-server.js` that can be used with Claude Desktop.

### 2. Configure Claude Desktop

Add to Claude Desktop's MCP configuration:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "hanzo-app": {
      "command": "node",
      "args": ["/absolute/path/to/hanzo/app/dist/mcp-server.js"],
      "env": {
        "HANZO_APP_PATH": "/Applications/Hanzo.app"
      }
    }
  }
}
```

### 3. Restart Claude Desktop

After adding the configuration, restart Claude Desktop. You should see "hanzo-app" in the MCP servers list.

### 4. Test the Integration

In Claude, try these commands:

- "List all applications on my computer"
- "Read the file at ~/Documents/notes.txt"
- "Show me what's in my clipboard"
- "Launch Safari"

## Available Tool Categories

### File System Operations
- `fs_read` - Read file contents
- `fs_write` - Write to files
- `fs_exists` - Check file/directory existence
- `fs_create_dir` - Create directories
- `fs_remove` - Delete files/directories
- `fs_copy` - Copy files
- `fs_rename` - Move/rename files

### Application Management
- `search_apps` - Search installed apps
- `launch_app` - Launch applications
- `app_list` - List running apps
- `app_activate` - Focus an app

### Window Management
- `window_list` - List all windows
- `window_focus` - Focus a window
- `window_minimize` - Minimize windows
- `window_move` - Move windows
- `window_resize` - Resize windows

### System Tools
- `clipboard_read` - Read clipboard
- `clipboard_write` - Write to clipboard
- `notification_send` - Send notifications
- `shell_execute` - Run commands
- `os_info` - Get system info

### Search Tools
- `file_search` - Search files (mdfind)
- `content_search` - Search file contents
- `app_search` - Search applications

## Configuration Options

### Environment Variables

Configure the MCP server behavior:

```bash
# Enable debug logging
DEBUG=MCP:* make dev

# Use stdio transport (for standalone mode)
MCP_TRANSPORT=stdio node dist/mcp-server.js

# Custom configuration path
MCP_CONFIG_PATH=/path/to/config.yaml
```

### Configuration File

Create `mcp-config.yaml`:

```yaml
tools:
  # Enable/disable specific tools
  fs_write:
    enabled: false  # Disable for read-only mode
  
  shell_execute:
    enabled: true
    allowed_commands:
      - ls
      - cat
      - grep
    
security:
  # Restrict file access
  allowed_paths:
    - /Users/me/Documents
    - /Users/me/Downloads
  
  # Block dangerous operations
  blocked_patterns:
    - /etc/
    - /System/
    - ~/.ssh/

logging:
  level: info  # debug, info, warn, error
  file: mcp-server.log
```

## Security Considerations

### Default Security

- Tools run with user permissions only
- System directories are protected
- Dangerous commands are blocked
- All operations are logged

### Custom Security Rules

Add custom security checks:

```typescript
// In hanzo-app-tools.ts
handler: async (args) => {
  // Check custom rules
  if (isRestricted(args.path)) {
    throw new Error('Access denied by security policy')
  }
  
  // Proceed with operation
  return await operation(args)
}
```

## Troubleshooting

### MCP Server Not Starting

1. Check console for errors
2. Verify Node.js version (18+)
3. Check port conflicts
4. Review logs

### Tools Not Available in Claude

1. Verify configuration path is absolute
2. Check Claude Desktop logs
3. Restart Claude Desktop
4. Test with simple tool first

### Permission Errors

1. Check file permissions
2. Verify security configuration
3. Run with appropriate user rights

## Advanced Usage

### Custom Tool Development

See [MCP Integration for Developers](../developer/mcp-integration.md) for creating custom tools.

### Batch Operations

Use multiple tools together:

```typescript
// In Claude
"Please organize my Downloads folder by:
1. List all PDF files
2. Create a 'PDFs' folder
3. Move all PDFs to that folder
4. Report how many files were moved"
```

### Integration with LLM Router

The MCP server works seamlessly with the LLM router:

```typescript
// Tools can use AI capabilities
handler: async (args) => {
  const analysis = await aiService.chat({
    messages: [{
      role: 'user',
      content: `Analyze this file: ${args.content}`
    }]
  })
  
  return analysis
}
```

## Performance Tips

1. **Cache Results**: Frequently accessed data is cached
2. **Batch Operations**: Group related operations
3. **Async Processing**: Long operations run in background
4. **Resource Limits**: Automatic throttling for heavy operations

## Next Steps

- [MCP Tools Reference](../api-reference/mcp-tools) - Complete tool documentation
- [Custom MCP Tools](./custom-mcp-tools) - Build your own tools
- [LLM Router Setup](./llm-router-setup) - Set up AI capabilities
- [Security Best Practices](../developer/security) - Secure your setup