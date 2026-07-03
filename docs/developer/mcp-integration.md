# MCP Integration for Developers

This guide explains how to integrate MCP (Model Context Protocol) functionality into Hanzo App.

## Architecture Overview

```
┌──────────────────┐     ┌─────────────────┐     ┌──────────────────┐
│   Hanzo App UI   │────▶│  Internal MCP   │────▶│  Tauri Commands  │
│   (React/TS)     │     │     Server      │     │    (Rust)        │
└──────────────────┘     └─────────────────┘     └──────────────────┘
         │                        │
         │                        ▼
         │               ┌─────────────────┐
         └──────────────▶│  External MCP   │
                         │     Server      │
                         │  (Standalone)   │
                         └─────────────────┘
```

## Creating MCP Tools

### 1. Define the Tool Interface

```typescript
// src/ts/chat/lib/types/mcp.ts
export interface MCPTool {
  name: string
  description: string
  inputSchema: {
    type: 'object'
    properties: Record<string, any>
    required?: string[]
  }
  handler: (args: any) => Promise<string>
}
```

### 2. Implement the Tool

```typescript
// src/ts/chat/lib/mcp-server/tools/my-tool.ts
import { invoke } from '@tauri-apps/api/core'
import type { MCPTool } from '../types/mcp'

export const myCustomTool: MCPTool = {
  name: 'my_custom_tool',
  description: 'Does something custom',
  inputSchema: {
    type: 'object',
    properties: {
      input: {
        type: 'string',
        description: 'Input parameter'
      }
    },
    required: ['input']
  },
  handler: async (args) => {
    // Call Tauri command
    const result = await invoke('my_custom_command', {
      input: args.input
    })
    
    return JSON.stringify(result)
  }
}
```

### 3. Register the Tool

```typescript
// src/ts/chat/lib/mcp-server/hanzo-app-tools.ts
import { myCustomTool } from './tools/my-tool'

export function createHanzoAppTools(): MCPTool[] {
  return [
    // ... existing tools
    myCustomTool,
  ]
}
```

### 4. Implement Tauri Command

```rust
// src/rs/commands/my_command.rs
use tauri::command;

#[command]
pub async fn my_custom_command(input: String) -> Result<String, String> {
    // Implement your logic
    Ok(format!("Processed: {}", input))
}
```

## Using Tauri Plugins

### File System Plugin

```typescript
import { readTextFile, writeTextFile } from '@tauri-apps/plugin-fs'

const fileTools: MCPTool[] = [
  {
    name: 'fs_read',
    description: 'Read a file',
    inputSchema: {
      type: 'object',
      properties: {
        path: { type: 'string' }
      },
      required: ['path']
    },
    handler: async (args) => {
      const contents = await readTextFile(args.path)
      return contents
    }
  }
]
```

### Shell Plugin

```typescript
import { Command } from '@tauri-apps/plugin-shell'

const shellTool: MCPTool = {
  name: 'shell_execute',
  description: 'Execute a shell command',
  inputSchema: {
    type: 'object',
    properties: {
      command: { type: 'string' },
      args: { type: 'array', items: { type: 'string' } }
    },
    required: ['command']
  },
  handler: async (args) => {
    const cmd = new Command(args.command, args.args || [])
    const output = await cmd.execute()
    
    if (output.code !== 0) {
      throw new Error(output.stderr)
    }
    
    return output.stdout
  }
}
```

## Testing MCP Tools

### Unit Tests

```typescript
// src/ts/__tests__/unit/mcp-tools.test.ts
import { describe, it, expect } from 'vitest'
import { myCustomTool } from '@/chat/lib/mcp-server/tools/my-tool'

describe('MCP Tools', () => {
  it('should execute my custom tool', async () => {
    const result = await myCustomTool.handler({
      input: 'test'
    })
    
    expect(result).toContain('Processed: test')
  })
})
```

### Integration Tests

```typescript
// src/ts/__tests__/integration/mcp-server.test.ts
import { getMCPServer } from '@/chat/lib/mcp-server'

describe('MCP Server Integration', () => {
  it('should register all tools', () => {
    const server = getMCPServer()
    const tools = server.getTools()
    
    expect(tools).toHaveLength(50) // or expected count
    expect(tools.some(t => t.name === 'my_custom_tool')).toBe(true)
  })
})
```

## Security Considerations

### Input Validation

Always validate inputs:

```typescript
handler: async (args) => {
  // Validate path is within allowed directories
  if (!args.path.startsWith('/Users/')) {
    throw new Error('Access denied: path outside user directory')
  }
  
  // Sanitize inputs
  const safePath = args.path.replace(/[^\w\s\/.:-]/g, '')
  
  return await readTextFile(safePath)
}
```

### Permission Checks

```rust
#[command]
pub async fn dangerous_operation(path: String) -> Result<(), String> {
    // Check permissions
    if !is_user_accessible(&path) {
        return Err("Permission denied".to_string());
    }
    
    // Require confirmation for dangerous operations
    if is_dangerous_path(&path) {
        let confirmed = confirm_dialog("Are you sure?").await?;
        if !confirmed {
            return Err("Operation cancelled".to_string());
        }
    }
    
    // Proceed with operation
    Ok(())
}
```

## Best Practices

### 1. Error Handling

```typescript
handler: async (args) => {
  try {
    const result = await riskyOperation(args)
    return JSON.stringify({ success: true, data: result })
  } catch (error) {
    logger.error('Tool failed', { tool: 'my_tool', error })
    return JSON.stringify({ 
      success: false, 
      error: error.message || 'Unknown error' 
    })
  }
}
```

### 2. Logging

```typescript
import { createLogger } from '@/lib/logger'

const logger = createLogger('MCP:MyTool')

handler: async (args) => {
  logger.info('Executing tool', { args })
  const result = await operation(args)
  logger.info('Tool completed', { result: result.slice(0, 100) })
  return result
}
```

### 3. Performance

```typescript
// Cache expensive operations
const cache = new Map<string, any>()

handler: async (args) => {
  const cacheKey = JSON.stringify(args)
  
  if (cache.has(cacheKey)) {
    return cache.get(cacheKey)
  }
  
  const result = await expensiveOperation(args)
  cache.set(cacheKey, result)
  
  return result
}
```

## Debugging

### Enable Debug Logging

```bash
DEBUG=MCP:* make dev
```

### Test Individual Tools

```typescript
// Debug script
import { getMCPServer } from './lib/mcp-server'

async function testTool() {
  const server = getMCPServer()
  
  const result = await server.executeTool('my_custom_tool', {
    input: 'test'
  })
  
  console.log('Result:', result)
}

testTool()
```

## Advanced Topics

### Streaming Responses

For tools that produce large outputs:

```typescript
handler: async (args) => {
  const stream = await createStream(args)
  const chunks: string[] = []
  
  for await (const chunk of stream) {
    chunks.push(chunk)
    
    // Optional: yield intermediate results
    if (chunks.length % 10 === 0) {
      await updateProgress(chunks.length)
    }
  }
  
  return chunks.join('')
}
```

### Parallel Execution

```typescript
handler: async (args) => {
  const tasks = args.files.map(file => 
    processFile(file)
  )
  
  const results = await Promise.all(tasks)
  
  return JSON.stringify(results)
}
```

### Resource Management

```typescript
handler: async (args) => {
  const resource = await acquireResource()
  
  try {
    return await useResource(resource, args)
  } finally {
    await releaseResource(resource)
  }
}
```

## Next Steps

- [MCP Tools Reference](../api/mcp-tools.md) - Complete tool reference
- [Custom Tauri Plugins](./tauri-plugins.md) - Build native plugins
- [Testing Guide](./testing.md) - Test your integrations
- [Security Guide](./security.md) - Security best practices