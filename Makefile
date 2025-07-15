# Hanzo App Makefile - Tauri Edition
# Cross-platform AI assistant for Windows, Linux, macOS, iOS, and Android
# Copyright (c) 2025 Hanzo Industries Inc

.PHONY: help install dev build release clean test lint format setup setup-rust setup-node setup-mobile

# Colors for output
GREEN := \033[0;32m
YELLOW := \033[0;33m
RED := \033[0;31m
BLUE := \033[0;34m
NC := \033[0m # No Color

# Platform detection
UNAME_S := $(shell uname -s)
ifeq ($(UNAME_S),Linux)
    PLATFORM := linux
endif
ifeq ($(UNAME_S),Darwin)
    PLATFORM := macos
endif
ifeq ($(OS),Windows_NT)
    PLATFORM := windows
endif

help:
	@echo "$(GREEN)Hanzo App - AI-powered assistant for all platforms$(NC)"
	@echo "$(BLUE)Built with Tauri for native performance$(NC)"
	@echo ""
	@echo "$(YELLOW)Setup Commands:$(NC)"
	@echo "  $(GREEN)make setup$(NC)          - Complete setup for all platforms"
	@echo "  $(GREEN)make setup-rust$(NC)     - Install Rust and Tauri CLI"
	@echo "  $(GREEN)make setup-node$(NC)     - Install Node.js dependencies"
	@echo "  $(GREEN)make setup-mobile$(NC)   - Setup iOS and Android development"
	@echo ""
	@echo "$(YELLOW)Development Commands:$(NC)"
	@echo "  $(GREEN)make dev$(NC)            - Run in development mode (desktop)"
	@echo "  $(GREEN)make dev-ios$(NC)        - Run on iOS device/simulator"
	@echo "  $(GREEN)make dev-android$(NC)    - Run on Android device/emulator"
	@echo "  $(GREEN)make dev-all$(NC)        - Run desktop + mobile dev servers"
	@echo ""
	@echo "$(YELLOW)Build Commands:$(NC)"
	@echo "  $(GREEN)make build$(NC)          - Build for current platform"
	@echo "  $(GREEN)make build-all$(NC)      - Build for all desktop platforms"
	@echo "  $(GREEN)make build-windows$(NC)  - Build for Windows"
	@echo "  $(GREEN)make build-linux$(NC)    - Build for Linux"
	@echo "  $(GREEN)make build-macos$(NC)    - Build for macOS"
	@echo "  $(GREEN)make build-ios$(NC)      - Build for iOS"
	@echo "  $(GREEN)make build-android$(NC)  - Build for Android"
	@echo ""
	@echo "$(YELLOW)Release Commands:$(NC)"
	@echo "  $(GREEN)make release$(NC)        - Create release for current platform"
	@echo "  $(GREEN)make release-all$(NC)    - Create releases for all platforms"
	@echo ""
	@echo "$(YELLOW)Utility Commands:$(NC)"
	@echo "  $(GREEN)make clean$(NC)          - Clean build artifacts"
	@echo "  $(GREEN)make test$(NC)           - Run tests"
	@echo "  $(GREEN)make lint$(NC)           - Run linters"
	@echo "  $(GREEN)make format$(NC)         - Format code"
	@echo "  $(GREEN)make update-deps$(NC)    - Update all dependencies"

# Complete setup for development
setup: setup-rust setup-node
	@echo "$(GREEN)✓ Setup complete! Run 'make dev' to start developing$(NC)"

# Install Rust and Tauri toolchain
setup-rust:
	@echo "$(YELLOW)Installing Rust and Tauri CLI...$(NC)"
	@if ! command -v rustc >/dev/null 2>&1; then \
		echo "$(YELLOW)Installing Rust...$(NC)"; \
		curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y; \
		. $$HOME/.cargo/env; \
	fi
	@echo "$(YELLOW)Installing Tauri CLI...$(NC)"
	@cargo install tauri-cli --version "^2.0.0"
	@cargo install cargo-mobile2
	@echo "$(GREEN)✓ Rust and Tauri CLI installed$(NC)"

# Install Node.js dependencies
setup-node:
	@echo "$(YELLOW)Installing Node.js dependencies...$(NC)"
	@if command -v bun >/dev/null 2>&1; then \
		bun install; \
	elif command -v pnpm >/dev/null 2>&1; then \
		pnpm install; \
	elif command -v yarn >/dev/null 2>&1; then \
		yarn install; \
	else \
		npm install; \
	fi
	@echo "$(GREEN)✓ Node.js dependencies installed$(NC)"

# Setup mobile development
setup-mobile: setup-rust setup-node
	@echo "$(YELLOW)Setting up mobile development...$(NC)"
	@rustup target add aarch64-linux-android armv7-linux-androideabi i686-linux-android x86_64-linux-android
	@rustup target add aarch64-apple-ios x86_64-apple-ios aarch64-apple-ios-sim
	@echo "$(YELLOW)Initializing Tauri mobile...$(NC)"
	@cd src-tauri && cargo mobile init
	@echo "$(GREEN)✓ Mobile development setup complete$(NC)"
	@echo "$(YELLOW)Note: Ensure you have Xcode (iOS) and Android Studio installed$(NC)"

# Development mode - Desktop
dev: setup-node
	@echo "$(YELLOW)Starting Hanzo in development mode...$(NC)"
	@if command -v bun >/dev/null 2>&1; then \
		bun tauri dev; \
	else \
		npm run tauri dev; \
	fi

# Development mode - iOS
dev-ios: setup-mobile
	@echo "$(YELLOW)Starting Hanzo for iOS...$(NC)"
	@npm run tauri ios dev

# Development mode - Android
dev-android: setup-mobile
	@echo "$(YELLOW)Starting Hanzo for Android...$(NC)"
	@npm run tauri android dev

# Development mode - All platforms
dev-all:
	@echo "$(YELLOW)Starting development servers for all platforms...$(NC)"
	@make -j3 dev dev-ios dev-android

# Build for current platform
build: setup-node
	@echo "$(YELLOW)Building Hanzo for $(PLATFORM)...$(NC)"
	@npm run tauri build
	@echo "$(GREEN)✓ Build complete for $(PLATFORM)$(NC)"

# Build for all desktop platforms
build-all: build-windows build-linux build-macos
	@echo "$(GREEN)✓ All desktop builds complete$(NC)"

# Build for Windows
build-windows: setup-node
	@echo "$(YELLOW)Building Hanzo for Windows...$(NC)"
	@npm run tauri build -- --target x86_64-pc-windows-msvc
	@npm run tauri build -- --target i686-pc-windows-msvc
	@echo "$(GREEN)✓ Windows build complete$(NC)"

# Build for Linux
build-linux: setup-node
	@echo "$(YELLOW)Building Hanzo for Linux...$(NC)"
	@npm run tauri build -- --target x86_64-unknown-linux-gnu
	@echo "$(GREEN)✓ Linux build complete$(NC)"

# Build for macOS
build-macos: setup-node
	@echo "$(YELLOW)Building Hanzo for macOS...$(NC)"
	@npm run tauri build -- --target x86_64-apple-darwin
	@npm run tauri build -- --target aarch64-apple-darwin
	@echo "$(GREEN)✓ macOS build complete$(NC)"

# Build for iOS
build-ios: setup-mobile
	@echo "$(YELLOW)Building Hanzo for iOS...$(NC)"
	@npm run tauri ios build
	@echo "$(GREEN)✓ iOS build complete$(NC)"

# Build for Android
build-android: setup-mobile
	@echo "$(YELLOW)Building Hanzo for Android...$(NC)"
	@npm run tauri android build
	@echo "$(GREEN)✓ Android build complete$(NC)"

# Create release build
release: setup-node
	@echo "$(YELLOW)Creating release build for $(PLATFORM)...$(NC)"
	@npm run tauri build -- --release
	@echo "$(GREEN)✓ Release build complete$(NC)"

# Create releases for all platforms
release-all:
	@echo "$(YELLOW)Creating releases for all platforms...$(NC)"
	@make release PLATFORM=windows
	@make release PLATFORM=linux
	@make release PLATFORM=macos
	@make release PLATFORM=ios
	@make release PLATFORM=android
	@echo "$(GREEN)✓ All releases complete$(NC)"

# Clean build artifacts
clean:
	@echo "$(YELLOW)Cleaning build artifacts...$(NC)"
	@rm -rf src-tauri/target
	@rm -rf dist
	@rm -rf node_modules
	@rm -rf src-tauri/gen
	@echo "$(GREEN)✓ Clean complete$(NC)"

# Run tests
test:
	@echo "$(YELLOW)Running tests...$(NC)"
	@cargo test --manifest-path=src-tauri/Cargo.toml
	@npm test
	@echo "$(GREEN)✓ All tests passed$(NC)"

# Run linters
lint:
	@echo "$(YELLOW)Running linters...$(NC)"
	@cargo clippy --manifest-path=src-tauri/Cargo.toml -- -D warnings
	@npm run lint
	@echo "$(GREEN)✓ Linting complete$(NC)"

# Format code
format:
	@echo "$(YELLOW)Formatting code...$(NC)"
	@cargo fmt --manifest-path=src-tauri/Cargo.toml
	@npm run format
	@echo "$(GREEN)✓ Code formatted$(NC)"

# Update dependencies
update-deps:
	@echo "$(YELLOW)Updating dependencies...$(NC)"
	@cargo update --manifest-path=src-tauri/Cargo.toml
	@npm update
	@echo "$(GREEN)✓ Dependencies updated$(NC)"

# Platform-specific helpers
ifeq ($(PLATFORM),macos)
install-app: build
	@echo "$(YELLOW)Installing Hanzo.app to /Applications...$(NC)"
	@cp -R src-tauri/target/release/bundle/macos/Hanzo.app /Applications/
	@echo "$(GREEN)✓ Hanzo installed to /Applications$(NC)"
endif

ifeq ($(PLATFORM),linux)
install-app: build
	@echo "$(YELLOW)Installing Hanzo...$(NC)"
	@sudo cp src-tauri/target/release/hanzo /usr/local/bin/
	@echo "$(GREEN)✓ Hanzo installed to /usr/local/bin$(NC)"
endif

# Quick commands
quick-start: setup dev
	@echo "$(GREEN)✓ Hanzo is running!$(NC)"

# CI/CD helpers
ci-test: setup-rust setup-node lint test
	@echo "$(GREEN)✓ CI tests complete$(NC)"

ci-build: setup-rust setup-node build-all
	@echo "$(GREEN)✓ CI builds complete$(NC)"

# Docker support (for Linux builds on other platforms)
docker-build-linux:
	@echo "$(YELLOW)Building Linux version in Docker...$(NC)"
	@docker build -t hanzo-linux-builder -f Dockerfile.linux .
	@docker run --rm -v $(PWD):/app hanzo-linux-builder make build-linux
	@echo "$(GREEN)✓ Linux build complete via Docker$(NC)"

# Development utilities
watch:
	@echo "$(YELLOW)Starting file watcher...$(NC)"
	@cargo watch -x 'run --manifest-path=src-tauri/Cargo.toml'

serve:
	@echo "$(YELLOW)Starting frontend dev server only...$(NC)"
	@npm run dev

# Help for migrating from React Native
migrate-help:
	@echo "$(BLUE)=== Migration Guide from React Native to Tauri ===$(NC)"
	@echo ""
	@echo "$(YELLOW)1. Frontend Changes:$(NC)"
	@echo "   - Move React code to src/ directory"
	@echo "   - Replace React Native components with web equivalents"
	@echo "   - Use Tauri's invoke API instead of native modules"
	@echo ""
	@echo "$(YELLOW)2. Backend Changes:$(NC)"
	@echo "   - Implement native features in Rust (src-tauri/)"
	@echo "   - Use Tauri commands for IPC communication"
	@echo ""
	@echo "$(YELLOW)3. Platform-specific code:$(NC)"
	@echo "   - Use conditional compilation in Rust"
	@echo "   - Use CSS media queries for responsive design"
	@echo ""
	@echo "Run 'make setup' to get started with Tauri!"

.DEFAULT_GOAL := help