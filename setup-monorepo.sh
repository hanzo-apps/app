#!/bin/bash

# Hanzo Monorepo Setup Script

echo "🚀 Setting up Hanzo monorepo structure..."

# Create directory structure
echo "📁 Creating directory structure..."

# Apps
mkdir -p apps/desktop/src-tauri/src
mkdir -p apps/desktop/src
mkdir -p apps/web/src
mkdir -p apps/web/public
mkdir -p apps/mobile/src
mkdir -p apps/mobile/ios
mkdir -p apps/mobile/android
mkdir -p apps/mcp-server/src

# Packages
mkdir -p packages/ui/src/components
mkdir -p packages/ui/src/hooks
mkdir -p packages/ui/src/utils
mkdir -p packages/chat/src/components
mkdir -p packages/chat/src/stores
mkdir -p packages/chat/src/hooks
mkdir -p packages/launcher/src/components
mkdir -p packages/launcher/src/search
mkdir -p packages/launcher/src/hooks
mkdir -p packages/ai/src/llama
mkdir -p packages/ai/src/mcp-client
mkdir -p packages/ai/src/providers
mkdir -p packages/types/src
mkdir -p packages/config/eslint
mkdir -p packages/config/tsconfig
mkdir -p packages/config/tailwind
mkdir -p packages/native-bridge/tauri
mkdir -p packages/native-bridge/react-native
mkdir -p packages/native-bridge/capacitor

# Rust crates
mkdir -p crates/hanzo-core/src
mkdir -p crates/hanzo-llama/src
mkdir -p crates/hanzo-mcp/src
mkdir -p crates/hanzo-platform/src/macos
mkdir -p crates/hanzo-platform/src/windows
mkdir -p crates/hanzo-platform/src/linux
mkdir -p crates/hanzo-tauri-plugins/src

# Tools and docs
mkdir -p tools/scripts
mkdir -p tools/ci
mkdir -p docs

# Move existing code to appropriate locations
echo "📦 Moving existing code..."

# Move current src-tauri to desktop app
if [ -d "src-tauri" ]; then
  cp -r src-tauri/* apps/desktop/src-tauri/ 2>/dev/null || true
fi

# Move current src to temporary location for reorganization
if [ -d "src" ]; then
  cp -r src apps/desktop/ 2>/dev/null || true
fi

# Create workspace files
echo "📝 Creating workspace configuration files..."

# PNPM workspace
cat > pnpm-workspace.yaml << EOF
packages:
  - 'apps/*'
  - 'packages/*'
EOF

# Turborepo config
cat > turbo.json << EOF
{
  "\$schema": "https://turbo.build/schema.json",
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", "build/**", "target/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {
      "outputs": []
    },
    "test": {
      "outputs": ["coverage/**"],
      "dependsOn": ["build"]
    },
    "typecheck": {
      "dependsOn": ["^build"],
      "outputs": []
    },
    "clean": {
      "cache": false
    }
  }
}
EOF

# Root Cargo.toml for Rust workspace
cat > Cargo.toml << EOF
[workspace]
resolver = "2"
members = [
  "apps/desktop/src-tauri",
  "apps/mcp-server",
  "crates/hanzo-core",
  "crates/hanzo-llama",
  "crates/hanzo-mcp",
  "crates/hanzo-platform",
  "crates/hanzo-tauri-plugins"
]

[workspace.dependencies]
tokio = { version = "1.40", features = ["full"] }
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"
anyhow = "1.0"
tracing = "0.1"
tracing-subscriber = "0.3"
tauri = { version = "2.6" }
EOF

# Root package.json for monorepo
cat > package.json.new << EOF
{
  "name": "hanzo",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "packageManager": "pnpm@9.0.0",
  "scripts": {
    "dev": "turbo run dev",
    "build": "turbo run build",
    "lint": "turbo run lint",
    "test": "turbo run test",
    "typecheck": "turbo run typecheck",
    "clean": "turbo run clean",
    "desktop:dev": "pnpm --filter @hanzo/desktop dev",
    "desktop:build": "pnpm --filter @hanzo/desktop build",
    "web:dev": "pnpm --filter @hanzo/web dev",
    "web:build": "pnpm --filter @hanzo/web build",
    "mobile:dev": "pnpm --filter @hanzo/mobile dev",
    "mobile:ios": "pnpm --filter @hanzo/mobile ios",
    "mobile:android": "pnpm --filter @hanzo/mobile android"
  },
  "devDependencies": {
    "turbo": "^2.0.0",
    "@changesets/cli": "^2.27.0",
    "prettier": "^3.3.0",
    "typescript": "^5.5.0"
  }
}
EOF

# Create initial package files
echo "📦 Creating package configurations..."

# UI package
cat > packages/ui/package.json << EOF
{
  "name": "@hanzo/ui",
  "version": "0.1.0",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "exports": {
    ".": "./src/index.ts",
    "./styles": "./src/styles/index.css"
  },
  "scripts": {
    "typecheck": "tsc --noEmit",
    "lint": "eslint src"
  },
  "dependencies": {
    "@tabler/icons-react": "^3.33.0",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.1.0",
    "react": "^18.2.0",
    "tailwindcss": "^3.4.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "typescript": "^5.5.0"
  }
}
EOF

# Chat package
cat > packages/chat/package.json << EOF
{
  "name": "@hanzo/chat",
  "version": "0.1.0",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": {
    "typecheck": "tsc --noEmit",
    "lint": "eslint src"
  },
  "dependencies": {
    "@hanzo/ui": "workspace:*",
    "@hanzo/ai": "workspace:*",
    "react": "^18.2.0",
    "react-markdown": "^9.0.0",
    "react-syntax-highlighter": "^15.5.0",
    "zustand": "^4.5.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@types/react-syntax-highlighter": "^15.5.0",
    "typescript": "^5.5.0"
  }
}
EOF

# Create .gitignore for monorepo
cat > .gitignore.new << EOF
# Dependencies
node_modules/
.pnpm-store/

# Build outputs
dist/
build/
target/
*.app
*.dmg
*.exe
*.deb
*.AppImage

# IDE
.vscode/
.idea/
*.swp
*.swo
.DS_Store

# Logs
*.log
npm-debug.log*
pnpm-debug.log*

# Environment
.env
.env.local
.env.*.local

# Turbo
.turbo/

# Test coverage
coverage/

# Mobile
*.ipa
*.apk
*.aab
ios/Pods/
android/.gradle/
android/app/build/

# Rust
Cargo.lock
target/
**/*.rs.bk

# Misc
.cache/
tmp/
EOF

echo "✅ Monorepo structure created!"
echo ""
echo "Next steps:"
echo "1. Review and backup existing code"
echo "2. Run: mv package.json.new package.json"
echo "3. Run: mv .gitignore.new .gitignore"
echo "4. Run: pnpm install"
echo "5. Install Turborepo: pnpm add -D turbo"
echo "6. Start migrating code to packages"
echo ""
echo "🎉 Happy coding!"