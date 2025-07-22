# Tauri Commands API Reference

This document lists all Tauri commands exposed by the Hanzo App backend.

## Platform Commands

### get_apps

Get list of installed applications.

```rust
#[tauri::command]
async fn get_apps() -> Result<Vec<AppInfo>, String>
```

**Returns:**
```typescript
interface AppInfo {
  name: string
  identifier: string
  path: string
  icon?: string  // Base64 encoded
}
```

**Example:**
```javascript
import { invoke } from '@tauri-apps/api/core'

const apps = await invoke('get_apps')
// Returns: [{ name: "Safari", identifier: "com.apple.Safari", ... }]
```

### launch_app

Launch an application by name or bundle ID.

```rust
#[tauri::command]
async fn launch_app(name: String) -> Result<(), String>
```

**Parameters:**
- `name`: Application name or bundle identifier

**Example:**
```javascript
await invoke('launch_app', { name: 'Safari' })
// or
await invoke('launch_app', { name: 'com.apple.Safari' })
```

### search_apps

Search for applications by query.

```rust
#[tauri::command]
async fn search_apps(query: String) -> Result<Vec<AppInfo>, String>
```

**Parameters:**
- `query`: Search query (fuzzy matching)

**Returns:** Filtered list of `AppInfo`

### quit_app

Quit a running application.

```rust
#[tauri::command]
async fn quit_app(name: String) -> Result<(), String>
```

### hide_app

Hide an application.

```rust
#[tauri::command]
async fn hide_app(name: String) -> Result<(), String>
```

### search_files_with_mdfind

Search files using macOS Spotlight (mdfind).

```rust
#[tauri::command]
async fn search_files_with_mdfind(
    query: String, 
    limit: Option<usize>
) -> Result<Vec<String>, String>
```

**Parameters:**
- `query`: Search query
- `limit`: Maximum results (default: 20)

**Example:**
```javascript
const files = await invoke('search_files_with_mdfind', {
  query: 'meeting notes',
  limit: 10
})
```

## Window Management Commands

### get_all_windows

Get list of all open windows.

```rust
#[tauri::command]
async fn get_all_windows() -> Result<Vec<WindowInfo>, String>
```

**Returns:**
```typescript
interface WindowInfo {
  id: number
  title: string
  app: string
  bounds: {
    x: number
    y: number
    width: number
    height: number
  }
  visible: boolean
  minimized: boolean
}
```

### focus_window

Focus a specific window.

```rust
#[tauri::command]
async fn focus_window(window_id: u32) -> Result<(), String>
```

### minimize_window

Minimize a window.

```rust
#[tauri::command]
async fn minimize_window(window_id: u32) -> Result<(), String>
```

### maximize_window

Maximize a window.

```rust
#[tauri::command]
async fn maximize_window(window_id: u32) -> Result<(), String>
```

### move_window

Move a window to new position.

```rust
#[tauri::command]
async fn move_window(
    window_id: u32, 
    x: f64, 
    y: f64
) -> Result<(), String>
```

### resize_window

Resize a window.

```rust
#[tauri::command]
async fn resize_window(
    window_id: u32, 
    width: f64, 
    height: f64
) -> Result<(), String>
```

## System Commands

### get_system_info

Get system information.

```rust
#[tauri::command]
async fn get_system_info() -> Result<SystemInfo, String>
```

**Returns:**
```typescript
interface SystemInfo {
  os: string
  version: string
  arch: string
  hostname: string
  cores: number
  memory: {
    total: number
    free: number
    used: number
  }
}
```

### execute_command

Execute a shell command (with restrictions).

```rust
#[tauri::command]
async fn execute_command(
    command: String,
    args: Vec<String>
) -> Result<CommandOutput, String>
```

**Security:** Only whitelisted commands allowed.

**Returns:**
```typescript
interface CommandOutput {
  stdout: string
  stderr: string
  status: number
}
```

## Model Management Commands

### get_installed_models

Get list of installed AI models.

```rust
#[tauri::command]
async fn get_installed_models() -> Result<Vec<ModelInfo>, String>
```

**Returns:**
```typescript
interface ModelInfo {
  id: string
  name: string
  path: string
  size: number
  quantization?: string
  format: 'gguf' | 'ggml'
}
```

### ensure_llama_server

Ensure llama.cpp server is running.

```rust
#[tauri::command]
async fn ensure_llama_server(
    model_path: Option<String>
) -> Result<ServerInfo, String>
```

**Returns:**
```typescript
interface ServerInfo {
  running: boolean
  port: number
  model?: string
  pid?: number
}
```

### stop_llama_server

Stop the llama.cpp server.

```rust
#[tauri::command]
async fn stop_llama_server() -> Result<(), String>
```

## Clipboard Commands

### clipboard_read_text

Read text from clipboard.

```rust
#[tauri::command]
async fn clipboard_read_text() -> Result<String, String>
```

### clipboard_write_text

Write text to clipboard.

```rust
#[tauri::command]
async fn clipboard_write_text(text: String) -> Result<(), String>
```

### get_clipboard_history

Get clipboard history.

```rust
#[tauri::command]
async fn get_clipboard_history() -> Result<Vec<ClipboardEntry>, String>
```

**Returns:**
```typescript
interface ClipboardEntry {
  id: string
  content: string
  timestamp: number
  type: 'text' | 'image' | 'file'
}
```

## Calendar Commands

### get_calendar_events

Get calendar events.

```rust
#[tauri::command]
async fn get_calendar_events(
    start_date: String,
    end_date: String
) -> Result<Vec<CalendarEvent>, String>
```

**Returns:**
```typescript
interface CalendarEvent {
  id: string
  title: string
  start: string  // ISO 8601
  end: string    // ISO 8601
  location?: string
  attendees?: string[]
}
```

## Error Handling

All commands return `Result<T, String>` where:
- `Ok(T)` - Success with data
- `Err(String)` - Error with message

**JavaScript handling:**
```javascript
try {
  const result = await invoke('command_name', { param: value })
  // Handle success
} catch (error) {
  console.error('Command failed:', error)
  // Handle error
}
```

## Permissions

Commands respect system permissions:
- File access limited to user directories
- System commands restricted to safe operations
- Network access controlled
- Calendar/contacts require user consent

## Usage with MCP

These commands are wrapped as MCP tools:

```typescript
// Tauri command
await invoke('launch_app', { name: 'Safari' })

// Becomes MCP tool
await mcpServer.executeTool('launch_app', { name: 'Safari' })
```

## Performance Considerations

- Commands are async and non-blocking
- Large results are paginated
- File operations are streamed
- Resource cleanup is automatic

## Platform Support

| Command | macOS | Windows | Linux |
|---------|-------|---------|-------|
| get_apps | ✅ | 🚧 | 🚧 |
| launch_app | ✅ | 🚧 | 🚧 |
| search_files_with_mdfind | ✅ | ❌ | ❌ |
| window_management | ✅ | 🚧 | 🚧 |
| clipboard | ✅ | ✅ | ✅ |
| calendar | ✅ | ❌ | ❌ |

Legend:
- ✅ Fully supported
- 🚧 In development
- ❌ Not available

## Next Steps

- [MCP Tools Reference](./mcp-tools) - How commands become tools
- [Frontend Integration](../developer/frontend-integration) - Using commands in UI
- [Testing Commands](../developer/testing#tauri-commands) - Test strategies