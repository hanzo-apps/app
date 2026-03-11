# Feature Verification Checklist

This checklist verifies all integrated features are working correctly.

## Pre-flight Checks

- [ ] Node.js 18+ installed
- [ ] Python 3.9+ installed
- [ ] Rust/Cargo installed
- [ ] pnpm installed
- [ ] LLM project available at `../llm`

## Build & Installation

### 1. Install Dependencies
```bash
make install
```
- [ ] Node modules installed
- [ ] Rust dependencies fetched
- [ ] No installation errors

### 2. Build MCP Server
```bash
make build-mcp
```
- [ ] Creates `dist/mcp-server.js`
- [ ] No build errors

### 3. Install Test Model (Optional)
```bash
make install-test-model
```
- [ ] Downloads Qwen model
- [ ] Places in `~/Library/Application Support/Hanzo/data/models/`

## Development Mode Startup

### 1. Start Development Server
```bash
make dev
```

### 2. Verify Console Output
- [ ] "Starting development server..."
- [ ] "Registered X MCP tools" (should be 50+)
- [ ] "MCP server ready for embedding"
- [ ] "Starting LLM router..."
- [ ] "LLM Router started successfully on http://0.0.0.0:4000"
- [ ] No error messages

### 3. Check Services
```bash
# In another terminal
curl http://localhost:4000/health  # LLM router
```
- [ ] Returns healthy status

## Command Bar Features

### 1. Open Command Bar
- [ ] Press ⌘+Space
- [ ] Command bar window appears
- [ ] Input field is focused

### 2. App Search
- [ ] Type "safari"
- [ ] Safari appears in results with icon
- [ ] Press Enter launches Safari

### 3. File Search
- [ ] Type "/documents"
- [ ] File results appear
- [ ] Results show file paths

### 4. Calculator
- [ ] Type "25 * 4"
- [ ] Shows result: 100
- [ ] Press Enter copies to clipboard

### 5. System Commands
- [ ] Type "quit finder"
- [ ] Shows quit command
- [ ] Executes on Enter

## AI Chat Features

### 1. Open Chat
- [ ] Press ⌘+Shift+Space or click menu bar icon
- [ ] Chat window opens
- [ ] Input field is ready

### 2. Send Message
- [ ] Type "Hello, how are you?"
- [ ] Press Enter
- [ ] Receives AI response

### 3. Check Model Fallback
Watch console during chat:
- [ ] First tries LLM router (port 4000)
- [ ] Falls back to Zen (1337) if needed
- [ ] Falls back to LM Studio (1234) if needed
- [ ] Uses mock response as last resort

### 4. Streaming Response
- [ ] Send longer prompt
- [ ] Response streams in real-time
- [ ] No UI freezing

## MCP Server Integration

### 1. Internal MCP Tools
In developer console:
```javascript
// Test tool execution
const server = getMCPServer()
const result = await server.executeTool('fs_exists', { 
  path: '/Users' 
})
console.log(result)  // Should return "true"
```
- [ ] Tool executes successfully
- [ ] Returns expected result

### 2. Tool Categories Test

**File System**:
```javascript
await server.executeTool('fs_read', {
  path: '/Users/me/Documents/test.txt'
})
```
- [ ] Reads file content (or error if not exists)

**App Management**:
```javascript
await server.executeTool('search_apps', {
  query: 'safari'
})
```
- [ ] Returns Safari app info

**System Tools**:
```javascript
await server.executeTool('clipboard_read', {})
```
- [ ] Returns clipboard content

### 3. Claude Desktop Integration
- [ ] MCP server config added to Claude
- [ ] Claude Desktop restarted
- [ ] "hanzo-app" appears in MCP servers
- [ ] Can execute commands in Claude

## LLM Router Features

### 1. Model Listing
```bash
curl http://localhost:4000/v1/models
```
- [ ] Returns list of available models
- [ ] Includes configured models from config.yaml

### 2. Chat Completion
```bash
curl -X POST http://localhost:4000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-3.5-turbo",
    "messages": [{"role": "user", "content": "Hi"}]
  }'
```
- [ ] Returns completion response
- [ ] No authentication errors

### 3. Local Model (if installed)
- [ ] Local model appears in model list
- [ ] Can complete requests with local model
- [ ] llama-server running on port 8080

## Integration Tests

### 1. MCP + LLM Router
In AI chat, ask:
"What files are in my Documents folder?"

Expected behavior:
- [ ] AI understands the request
- [ ] MCP tool executes (fs_read or file_search)
- [ ] Results returned in chat

### 2. Command Bar + MCP
- [ ] Launch app via command bar
- [ ] Verify app launch logged in MCP

### 3. Full Stack Test
Ask in chat:
"Launch Safari and tell me what version it is"

Expected:
- [ ] Safari launches (MCP tool)
- [ ] AI responds with version info

## Performance Checks

### 1. Memory Usage
- [ ] App uses < 200MB at idle
- [ ] No memory leaks after extended use

### 2. CPU Usage
- [ ] < 5% CPU at idle
- [ ] Responsive during operations

### 3. Startup Time
- [ ] App launches in < 3 seconds
- [ ] Services ready in < 5 seconds

## Error Handling

### 1. Missing LLM Router
- [ ] Stop LLM router
- [ ] Chat still works (fallback)
- [ ] Console shows fallback messages

### 2. Invalid MCP Tool
```javascript
await server.executeTool('invalid_tool', {})
```
- [ ] Returns error message
- [ ] Doesn't crash app

### 3. Network Issues
- [ ] Disconnect internet
- [ ] Local features still work
- [ ] Graceful degradation

## Production Build

### 1. Build App
```bash
make build
```
- [ ] Build completes successfully
- [ ] Creates .app bundle

### 2. Run Production App
```bash
open src-tauri/target/release/Hanzo.app
```
- [ ] App launches
- [ ] All features work
- [ ] No debug console

## Documentation Verification

### 1. Docs Build
```bash
make docs-build
```
- [ ] Documentation builds
- [ ] No broken links

### 2. API Docs
```bash
make docs-api
```
- [ ] TypeDoc generates docs
- [ ] API reference complete

## Cleanup & Shutdown

### 1. Graceful Shutdown
- [ ] Quit app normally
- [ ] LLM router stops
- [ ] MCP server stops
- [ ] No orphan processes

### 2. Check Logs
- [ ] No error messages
- [ ] Clean shutdown logged

## Known Issues to Check

1. **Extension Loading Errors**
   - Mock extensions prevent crashes
   - Real extensions can be added later

2. **Model Download UI**
   - Currently bypassed
   - Models installed manually

3. **Menu Bar Icon**
   - Should show AI icon
   - Click opens chat

## Summary Checklist

- [ ] Command Bar: All features working
- [ ] AI Chat: Connects and responds
- [ ] MCP Server: Tools execute
- [ ] LLM Router: Models available
- [ ] Integrations: Components work together
- [ ] Performance: Acceptable resource usage
- [ ] Error Handling: Graceful failures
- [ ] Documentation: Accurate and complete

## Next Steps

If any checks fail:
1. Check console logs for errors
2. Verify dependencies installed
3. Check configuration files
4. See troubleshooting guides

All checks passing means the integration is working correctly!