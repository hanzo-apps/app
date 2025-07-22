# Migration Guide: React Native to Tauri

## Overview

We're migrating Hanzo from React Native to Tauri for better cross-platform support:
- **Windows**: Native support ✅
- **Linux**: Native support ✅  
- **macOS**: Native support ✅
- **iOS**: Mobile support ✅
- **Android**: Mobile support ✅

## Key Benefits

1. **True Cross-Platform**: Single codebase for all platforms
2. **Smaller Bundle Size**: ~10MB vs ~100MB+ 
3. **Better Performance**: Rust backend, native OS integration
4. **Security**: Sandboxed, secure IPC, no eval()
5. **Native Features**: Direct OS API access

## Migration Steps

### 1. Setup Tauri Environment

```bash
# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Install Tauri CLI
cargo install tauri-cli

# Use new Makefile
mv Makefile.new Makefile
make setup
```

### 2. Frontend Migration

#### React Native Components → Web Components

```javascript
// Before (React Native)
import { View, Text, TouchableOpacity } from 'react-native';

// After (Tauri/React)
import React from 'react';

// View → div
// Text → span/p
// TouchableOpacity → button
```

#### Native Modules → Tauri Commands

```javascript
// Before (React Native)
import { NativeModules } from 'react-native';
const { HanzoNative } = NativeModules;
await HanzoNative.showWindow();

// After (Tauri)
import { invoke } from '@tauri-apps/api/tauri';
await invoke('show_window');
```

### 3. Platform-Specific Features

#### Global Shortcuts

```rust
// src-tauri/src/main.rs
app.global_shortcut().on_shortcut("Tab", |app, shortcut, event| {
    // Handle Tab key
});
```

#### System Tray

```rust
// Built-in Tauri system tray support
let tray = SystemTray::new()
    .with_menu(tray_menu)
    .with_tooltip("Hanzo");
```

### 4. File Structure

```
hanzo/
├── src/                    # Frontend (React + TypeScript)
│   ├── App.tsx
│   ├── components/
│   ├── hooks/
│   └── styles/
├── src-tauri/             # Backend (Rust)
│   ├── src/
│   │   ├── main.rs
│   │   ├── commands.rs
│   │   └── state.rs
│   ├── Cargo.toml
│   └── tauri.conf.json
├── package.json
├── vite.config.ts
└── Makefile
```

### 5. Development Workflow

```bash
# Desktop development
make dev

# Mobile development  
make dev-ios
make dev-android

# Build for all platforms
make build-all
```

### 6. API Migration Examples

#### Storage

```javascript
// Before (React Native)
import AsyncStorage from '@react-native-async-storage/async-storage';
await AsyncStorage.setItem('key', 'value');

// After (Tauri)
import { Store } from '@tauri-apps/plugin-store';
const store = new Store('settings.json');
await store.set('key', 'value');
```

#### File System

```javascript
// Before (React Native)
import RNFS from 'react-native-fs';
await RNFS.writeFile(path, content);

// After (Tauri)
import { writeTextFile } from '@tauri-apps/plugin-fs';
await writeTextFile('file.txt', content);
```

#### HTTP Requests

```javascript
// Before (React Native)
fetch(url);

// After (Tauri)
import { fetch } from '@tauri-apps/plugin-http';
await fetch(url);
```

### 7. Styling

```css
/* Use regular CSS/Tailwind instead of React Native styles */
.container {
  display: flex;
  flex-direction: column;
  padding: 20px;
}

/* Platform-specific styles */
@media (prefers-color-scheme: dark) {
  /* Dark mode styles */
}
```

### 8. Testing

```bash
# Unit tests
make test

# E2E tests with WebDriver
npm run test:e2e
```

## Quick Start

1. Clone the new structure:
```bash
make setup
```

2. Start development:
```bash
make dev
```

3. Build for production:
```bash
make build-all
```

## Platform-Specific Notes

### Windows
- Uses WebView2 (Edge)
- Auto-updates via MSI/NSIS
- Native notifications

### Linux
- Uses WebKitGTK
- AppImage/Deb/RPM packages
- System tray support

### macOS
- Uses WKWebView
- DMG with auto-updates
- Native menu bar

### iOS/Android
- WebView with native plugins
- App store distribution
- Touch-optimized UI

## Need Help?

- [Tauri Docs](https://tauri.app)
- [Migration Examples](https://github.com/tauri-apps/awesome-tauri)
- Run `make migrate-help` for tips