# Hanzo App Makefile
.PHONY: help install dev build test clean

# Default target
.DEFAULT_GOAL := help

# Colors for output
BLUE := \033[0;34m
GREEN := \033[0;32m
YELLOW := \033[0;33m
RED := \033[0;31m
NC := \033[0m # No Color

# Platform detection
UNAME_S := $(shell uname -s)
UNAME_M := $(shell uname -m)

ifeq ($(UNAME_S),Darwin)
    PLATFORM := macos
    ifeq ($(UNAME_M),arm64)
        TARGET := aarch64-apple-darwin
    else
        TARGET := x86_64-apple-darwin
    endif
else ifeq ($(UNAME_S),Linux)
    PLATFORM := linux
    ifeq ($(UNAME_M),x86_64)
        TARGET := x86_64-unknown-linux-gnu
    else
        TARGET := aarch64-unknown-linux-gnu
    endif
else
    PLATFORM := windows
    TARGET := x86_64-pc-windows-msvc
endif

## Help
help:
	@echo "$(BLUE)Hanzo App Build System$(NC)"
	@echo ""
	@echo "$(GREEN)Available targets:$(NC)"
	@echo "  $(YELLOW)install$(NC)         Install all dependencies"
	@echo "  $(YELLOW)dev$(NC)             Start development server"
	@echo "  $(YELLOW)build$(NC)           Build for current platform"
	@echo "  $(YELLOW)build-all$(NC)       Build for all platforms"
	@echo "  $(YELLOW)build-macos$(NC)     Build for macOS"
	@echo "  $(YELLOW)build-linux$(NC)     Build for Linux"
	@echo "  $(YELLOW)build-windows$(NC)   Build for Windows"
	@echo "  $(YELLOW)test$(NC)            Run all tests"
	@echo "  $(YELLOW)test-unit$(NC)       Run unit tests"
	@echo "  $(YELLOW)test-e2e$(NC)        Run E2E tests"
	@echo "  $(YELLOW)test-backend$(NC)    Run backend tests"
	@echo "  $(YELLOW)coverage$(NC)        Generate test coverage"
	@echo "  $(YELLOW)lint$(NC)            Run linters"
	@echo "  $(YELLOW)format$(NC)          Format code"
	@echo "  $(YELLOW)clean$(NC)           Clean build artifacts"
	@echo ""
	@echo "$(BLUE)Platform: $(PLATFORM) ($(TARGET))$(NC)"

## Install dependencies
install:
	@echo "$(BLUE)Installing dependencies...$(NC)"
	@command -v pnpm >/dev/null 2>&1 || { echo "$(RED)pnpm is required but not installed. Installing...$(NC)"; npm install -g pnpm; }
	@command -v rustc >/dev/null 2>&1 || { echo "$(RED)Rust is required but not installed. Please install from https://rustup.rs/$(NC)"; exit 1; }
	pnpm install
	cd src-tauri && cargo fetch
	@echo "$(GREEN)Dependencies installed successfully!$(NC)"

## Development
dev:
	@echo "$(BLUE)Starting development server...$(NC)"
	pnpm tauri dev

dev-web:
	@echo "$(BLUE)Starting web development server only...$(NC)"
	pnpm vite

## Building
build: build-web build-tauri
	@echo "$(GREEN)Build complete for $(PLATFORM)!$(NC)"

build-web:
	@echo "$(BLUE)Building web assets...$(NC)"
	pnpm vite build

build-tauri:
	@echo "$(BLUE)Building Tauri app for $(TARGET)...$(NC)"
	cd src-tauri && pnpm tauri build --target $(TARGET)

build-all: build-macos build-linux build-windows
	@echo "$(GREEN)All platform builds complete!$(NC)"

build-macos:
	@echo "$(BLUE)Building for macOS...$(NC)"
	pnpm tauri build --target universal-apple-darwin

build-linux:
	@echo "$(BLUE)Building for Linux...$(NC)"
	pnpm tauri build --target x86_64-unknown-linux-gnu
	pnpm tauri build --target aarch64-unknown-linux-gnu

build-windows:
	@echo "$(BLUE)Building for Windows...$(NC)"
	@if [ "$(PLATFORM)" = "windows" ]; then \
		pnpm tauri build --target x86_64-pc-windows-msvc; \
	else \
		echo "$(YELLOW)Cross-compilation to Windows requires additional setup$(NC)"; \
	fi

## Testing
test: test-unit test-backend
	@echo "$(GREEN)All tests passed!$(NC)"

test-unit:
	@echo "$(BLUE)Running unit tests...$(NC)"
	pnpm vitest run

test-unit-watch:
	@echo "$(BLUE)Running unit tests in watch mode...$(NC)"
	pnpm vitest

test-unit-ui:
	@echo "$(BLUE)Opening Vitest UI...$(NC)"
	pnpm vitest --ui

test-e2e:
	@echo "$(BLUE)Running E2E tests...$(NC)"
	@if [ "$(CI)" = "true" ]; then \
		echo "Running in CI mode (headless)"; \
		pnpm wdio run wdio.conf.ts; \
	else \
		echo "$(YELLOW)E2E tests are configured to run in CI only (Linux)$(NC)"; \
		echo "To run locally, use: CI=true make test-e2e"; \
	fi

test-backend:
	@echo "$(BLUE)Running backend tests...$(NC)"
	cd src-tauri && cargo test

test-backend-verbose:
	@echo "$(BLUE)Running backend tests (verbose)...$(NC)"
	cd src-tauri && cargo test -- --nocapture

coverage:
	@echo "$(BLUE)Generating test coverage...$(NC)"
	pnpm vitest run --coverage
	cd src-tauri && cargo tarpaulin --out Html

## Code Quality
lint: lint-frontend lint-backend
	@echo "$(GREEN)Linting complete!$(NC)"

lint-frontend:
	@echo "$(BLUE)Linting frontend code...$(NC)"
	pnpm eslint src --ext ts,tsx --max-warnings 0

lint-backend:
	@echo "$(BLUE)Linting backend code...$(NC)"
	cd src-tauri && cargo clippy -- -D warnings

format: format-frontend format-backend
	@echo "$(GREEN)Formatting complete!$(NC)"

format-frontend:
	@echo "$(BLUE)Formatting frontend code...$(NC)"
	pnpm prettier --write "src/**/*.{ts,tsx,css}"

format-backend:
	@echo "$(BLUE)Formatting backend code...$(NC)"
	cd src-tauri && cargo fmt

## Cleaning
clean:
	@echo "$(BLUE)Cleaning build artifacts...$(NC)"
	rm -rf dist
	rm -rf src-tauri/target
	rm -rf node_modules/.vite
	rm -rf coverage
	@echo "$(GREEN)Clean complete!$(NC)"

clean-all: clean
	@echo "$(BLUE)Cleaning all dependencies...$(NC)"
	rm -rf node_modules
	rm -rf src-tauri/target
	@echo "$(GREEN)Deep clean complete!$(NC)"

## CI/CD Helpers
ci-setup:
	@echo "$(BLUE)Setting up CI environment...$(NC)"
	sudo apt-get update
	sudo apt-get install -y webkit2gtk-4.1 libappindicator3-dev librsvg2-dev patchelf

ci-test: install lint test
	@echo "$(GREEN)CI tests complete!$(NC)"

## Release
release-patch:
	@echo "$(BLUE)Creating patch release...$(NC)"
	npm version patch
	git push && git push --tags

release-minor:
	@echo "$(BLUE)Creating minor release...$(NC)"
	npm version minor
	git push && git push --tags

release-major:
	@echo "$(BLUE)Creating major release...$(NC)"
	npm version major
	git push && git push --tags

## Development Tools
check-deps:
	@echo "$(BLUE)Checking dependencies...$(NC)"
	@command -v pnpm >/dev/null 2>&1 && echo "$(GREEN)✓ pnpm$(NC)" || echo "$(RED)✗ pnpm$(NC)"
	@command -v rustc >/dev/null 2>&1 && echo "$(GREEN)✓ rust$(NC)" || echo "$(RED)✗ rust$(NC)"
	@command -v cargo >/dev/null 2>&1 && echo "$(GREEN)✓ cargo$(NC)" || echo "$(RED)✗ cargo$(NC)"
	@command -v node >/dev/null 2>&1 && echo "$(GREEN)✓ node$(NC)" || echo "$(RED)✗ node$(NC)"

update-deps:
	@echo "$(BLUE)Updating dependencies...$(NC)"
	pnpm update
	cd src-tauri && cargo update

## Docker (for Linux CI)
docker-build:
	@echo "$(BLUE)Building Docker image for CI...$(NC)"
	docker build -t hanzo-app-ci -f Dockerfile.ci .

docker-test:
	@echo "$(BLUE)Running tests in Docker...$(NC)"
	docker run --rm hanzo-app-ci make ci-test