# MCP Tools API Reference

Complete reference for all MCP tools exposed by Hanzo AI App.

## File System Tools

### fs_read

Read the contents of a file.

**Input Schema:**
```json
{
  "type": "object",
  "properties": {
    "path": {
      "type": "string",
      "description": "Absolute path to the file"
    }
  },
  "required": ["path"]
}
```

**Example:**
```javascript
await mcpClient.callTool('fs_read', {
  path: '/Users/me/Documents/notes.txt'
})
```

### fs_write

Write content to a file.

**Input Schema:**
```json
{
  "type": "object",
  "properties": {
    "path": {
      "type": "string",
      "description": "Absolute path to the file"
    },
    "contents": {
      "type": "string",
      "description": "Content to write"
    }
  },
  "required": ["path", "contents"]
}
```

### fs_exists

Check if a file or directory exists.

**Input Schema:**
```json
{
  "type": "object",
  "properties": {
    "path": {
      "type": "string",
      "description": "Path to check"
    }
  },
  "required": ["path"]
}
```

## Application Management Tools

### search_apps

Search for installed applications.

**Input Schema:**
```json
{
  "type": "object",
  "properties": {
    "query": {
      "type": "string",
      "description": "Search query"
    }
  },
  "required": ["query"]
}
```

**Returns:**
```json
[
  {
    "name": "Safari",
    "path": "/Applications/Safari.app",
    "bundleId": "com.apple.Safari",
    "icon": "base64..."
  }
]
```

### launch_app

Launch an application.

**Input Schema:**
```json
{
  "type": "object",
  "properties": {
    "name": {
      "type": "string",
      "description": "Application name or bundle ID"
    }
  },
  "required": ["name"]
}
```

## Window Management Tools

### window_list

List all open windows.

**Input Schema:**
```json
{
  "type": "object",
  "properties": {
    "appName": {
      "type": "string",
      "description": "Filter by app name (optional)"
    }
  }
}
```

**Returns:**
```json
[
  {
    "id": 12345,
    "title": "Untitled - TextEdit",
    "app": "TextEdit",
    "bounds": {
      "x": 100,
      "y": 100,
      "width": 800,
      "height": 600
    },
    "visible": true,
    "minimized": false
  }
]
```

### window_focus

Focus a specific window.

**Input Schema:**
```json
{
  "type": "object",
  "properties": {
    "windowId": {
      "type": "number",
      "description": "Window ID from window_list"
    }
  },
  "required": ["windowId"]
}
```

### window_move

Move a window to a new position.

**Input Schema:**
```json
{
  "type": "object",
  "properties": {
    "windowId": {
      "type": "number",
      "description": "Window ID"
    },
    "x": {
      "type": "number",
      "description": "New X position"
    },
    "y": {
      "type": "number",
      "description": "New Y position"
    }
  },
  "required": ["windowId", "x", "y"]
}
```

## System Tools

### clipboard_read

Read the current clipboard contents.

**Input Schema:**
```json
{
  "type": "object",
  "properties": {}
}
```

**Returns:**
```json
{
  "text": "Clipboard text content",
  "html": "<p>HTML content if available</p>",
  "image": "base64... if image"
}
```

### clipboard_write

Write text to the clipboard.

**Input Schema:**
```json
{
  "type": "object",
  "properties": {
    "text": {
      "type": "string",
      "description": "Text to copy"
    }
  },
  "required": ["text"]
}
```

### notification_send

Send a system notification.

**Input Schema:**
```json
{
  "type": "object",
  "properties": {
    "title": {
      "type": "string",
      "description": "Notification title"
    },
    "body": {
      "type": "string",
      "description": "Notification body"
    },
    "icon": {
      "type": "string",
      "description": "Icon path (optional)"
    }
  },
  "required": ["title", "body"]
}
```

## Search Tools

### file_search

Search for files using mdfind (macOS Spotlight).

**Input Schema:**
```json
{
  "type": "object",
  "properties": {
    "query": {
      "type": "string",
      "description": "Search query"
    },
    "path": {
      "type": "string",
      "description": "Limit search to path (optional)"
    },
    "limit": {
      "type": "number",
      "description": "Max results (default: 20)"
    }
  },
  "required": ["query"]
}
```

**Returns:**
```json
[
  {
    "path": "/Users/me/Documents/report.pdf",
    "name": "report.pdf",
    "size": 1048576,
    "modified": "2024-01-15T10:30:00Z"
  }
]
```

## Shell Tools

### shell_execute

Execute a shell command.

**Input Schema:**
```json
{
  "type": "object",
  "properties": {
    "command": {
      "type": "string",
      "description": "Command to execute"
    },
    "args": {
      "type": "array",
      "items": { "type": "string" },
      "description": "Command arguments"
    },
    "cwd": {
      "type": "string",
      "description": "Working directory"
    }
  },
  "required": ["command"]
}
```

**Security Note:** Commands are executed with user permissions. Dangerous operations are blocked.

## HTTP Tools

### http_fetch

Make HTTP requests.

**Input Schema:**
```json
{
  "type": "object",
  "properties": {
    "url": {
      "type": "string",
      "description": "URL to fetch"
    },
    "method": {
      "type": "string",
      "enum": ["GET", "POST", "PUT", "DELETE"],
      "description": "HTTP method"
    },
    "headers": {
      "type": "object",
      "description": "Request headers"
    },
    "body": {
      "type": "string",
      "description": "Request body"
    }
  },
  "required": ["url"]
}
```

## Store Tools

### store_get

Get a value from persistent storage.

**Input Schema:**
```json
{
  "type": "object",
  "properties": {
    "key": {
      "type": "string",
      "description": "Storage key"
    }
  },
  "required": ["key"]
}
```

### store_set

Set a value in persistent storage.

**Input Schema:**
```json
{
  "type": "object",
  "properties": {
    "key": {
      "type": "string",
      "description": "Storage key"
    },
    "value": {
      "description": "Value to store (any JSON type)"
    }
  },
  "required": ["key", "value"]
}
```

## Usage Examples

### With Claude Desktop

```javascript
// In Claude, you can use these tools naturally:
"Please read the file at /Users/me/notes.txt"
"Launch Safari"
"Show me all Chrome windows"
```

### Programmatic Usage

```typescript
// Using the MCP client
import { MCPClient } from '@modelcontextprotocol/sdk'

const client = new MCPClient()
await client.connect(transport)

// Call a tool
const result = await client.callTool('fs_read', {
  path: '/Users/me/Documents/file.txt'
})

console.log(result.content)
```

## Error Handling

All tools return errors in a consistent format:

```json
{
  "error": {
    "code": "FILE_NOT_FOUND",
    "message": "File not found: /path/to/file",
    "details": {}
  }
}
```

Common error codes:
- `FILE_NOT_FOUND` - File or directory doesn't exist
- `PERMISSION_DENIED` - Insufficient permissions
- `INVALID_INPUT` - Invalid input parameters
- `OPERATION_FAILED` - Operation failed
- `NOT_IMPLEMENTED` - Feature not implemented

## Rate Limiting

Tools have built-in rate limiting:
- File operations: 100/minute
- Shell commands: 20/minute
- HTTP requests: 60/minute
- System operations: 50/minute

## Next Steps

- [Custom MCP Tools Guide](../guides/custom-mcp-tools.md) - Create your own tools
- [MCP Configuration](../mcp/configuration.md) - Configure the MCP server
- [Testing MCP Tools](../development/testing.md#mcp-tools) - Test your tools