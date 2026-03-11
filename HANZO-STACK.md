# Hanzo Stack Integration

## ✅ Complete Stack Running

The Hanzo app successfully builds, runs, and ships with the complete Hanzo stack:

### Core Components

1. **Hanzo App** (✅ Running)
   - AI Command Menu powered by Tauri
   - Black monochromatic theme with Inter font
   - Native macOS application
   - Built and packaged at: `/src-tauri/target/release/bundle/macos/hanzo.app`

2. **MCP Server** (✅ Running)
   - Model Context Protocol server
   - Exposes 50+ Tauri-based tools to AI
   - Integrated with @hanzo/mcp framework
   - Runs as stdio-based server within the app

3. **LLM Router** (✅ Running)
   - Unified gateway to 100+ LLM providers
   - Running on port 4000
   - Auto-starts with the app
   - Health check endpoint: http://localhost:4000/health

4. **Llama Server** (⚠️ Ready when needed)
   - Local model inference
   - Starts automatically when a model is available
   - Configured to not start unnecessarily

## Theme & Branding

- **Default Theme**: Black background (#000) with white text
- **Font**: Inter (loaded from Google Fonts)
- **Monochromatic Design**: All UI elements use black/white palette
- **Fully Themeable**: Light mode available as override

## Quick Check

Run `./check-hanzo-stack.sh` to verify all components are running:

```bash
🚀 Checking Hanzo Stack Components...
========================================
✅ MCP Server is running (PID: 49812)
✅ LLM Router is running on port 4000 (PID: 36518)
⚠️  Llama Server is NOT running (starts when model is available)
✅ Hanzo App is running (PID: 71223)
========================================
Testing LLM Router health...
✅ LLM Router is healthy
```

## Build & Run

### Development
```bash
pnpm install
pnpm dev          # Frontend
pnpm tauri dev    # Full app
```

### Production Build
```bash
pnpm build
# App bundle created at: src-tauri/target/release/bundle/macos/hanzo.app
```

### Open Built App
```bash
open /Users/z/work/hanzo/app/src-tauri/target/release/bundle/macos/hanzo.app
```

## Documentation

Full documentation with black monochromatic theme available at:
```bash
cd docs && pnpm dev
# Opens at http://localhost:3001
```

## Next Steps

- [ ] Test model inference with pre-installed Qwen model
- [ ] Implement Quick AI floating window
- [ ] Add AI Extensions system
- [ ] Implement AI Commands with hotkeys
- [ ] Add cloud sync for chats
- [ ] Implement chat presets
- [ ] Add model comparison feature