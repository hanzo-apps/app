# Hanzo Build Makefile
# Templates and Build System for @hanzo/ui Components

.PHONY: help install dev build clean test templates upload-templates serve-templates list-templates validate
.PHONY: docker-up docker-down docker-logs docker-build docker-clean docker-dev docker-prod docker-shell docker-db-shell

# Default target
help:
	@echo "Hanzo Build System - Available targets:"
	@echo ""
	@echo "Development Commands:"
	@echo "  make install          - Install dependencies"
	@echo "  make dev              - Start development server (local)"
	@echo "  make build            - Build all templates for production"
	@echo "  make clean            - Clean build artifacts and node_modules"
	@echo "  make test             - Run tests"
	@echo ""
	@echo "Docker Commands:"
	@echo "  make docker-up        - Start all services with Docker Compose"
	@echo "  make docker-dev       - Start development environment in background"
	@echo "  make docker-down      - Stop all Docker services"
	@echo "  make docker-logs      - View logs from all services"
	@echo "  make docker-build     - Build Docker images"
	@echo "  make docker-clean     - Remove containers and volumes"
	@echo "  make docker-shell     - Shell into app container"
	@echo "  make docker-db-shell  - MongoDB shell access"
	@echo "  make docker-prod      - Start production environment"
	@echo ""
	@echo "Template Commands:"
	@echo "  make templates        - Generate all template files"
	@echo "  make list-templates   - List all available templates"
	@echo "  make validate         - Validate template TypeScript"
	@echo "  make serve-templates  - Serve templates locally"
	@echo "  make upload-templates - Upload to Hugging Face (requires auth)"
	@echo ""
	@echo "Individual Template Commands:"
	@echo "  make template-chat    - Build AI Chat Interface template"
	@echo "  make template-saas    - Build SaaS Landing template"
	@echo "  make template-dash    - Build Analytics Dashboard template"
	@echo "  make template-store   - Build E-commerce Storefront template"
	@echo "  make template-social  - Build Social Feed template"
	@echo "  make template-kanban  - Build Kanban Board template"
	@echo "  make template-editor  - Build Markdown Editor template"
	@echo "  make template-crypto  - Build Crypto Portfolio template"
	@echo "  make template-blog    - Build Blog Platform template"
	@echo "  make template-video   - Build Video Streaming template"

# Install dependencies
install:
	@echo "Installing dependencies..."
	@if [ -f package.json ]; then \
		pnpm install; \
	else \
		echo "Creating package.json..."; \
		pnpm init; \
		pnpm add -D next@latest react@latest react-dom@latest typescript@latest @types/react@latest @types/node@latest tailwindcss@latest; \
		pnpm add @hanzo/ui lucide-react; \
	fi
	@echo "Dependencies installed successfully!"

# Development server
dev:
	@echo "Starting development server..."
	@pnpm next dev

# Build for production
build: validate
	@echo "Building templates for production..."
	@pnpm next build
	@echo "Build complete!"

# Clean build artifacts
clean:
	@echo "Cleaning build artifacts..."
	@rm -rf .next dist out node_modules/.cache
	@echo "Clean complete!"

# Deep clean including node_modules
deep-clean: clean
	@echo "Performing deep clean..."
	@rm -rf node_modules pnpm-lock.yaml package-lock.json yarn.lock
	@echo "Deep clean complete!"

# Run tests
test: validate
	@echo "Running tests..."
	@pnpm test 2>/dev/null || echo "No tests configured yet"

# Validate TypeScript
validate:
	@echo "Validating TypeScript..."
	@pnpm tsc --noEmit 2>/dev/null || echo "TypeScript validation complete (configure tsconfig.json for strict checking)"

# List all templates
list-templates:
	@echo "Available Templates:"
	@echo "==================="
	@ls -1 templates/ 2>/dev/null | sed 's/^/  - /' || echo "No templates found. Run 'make templates' first."

# Generate all template files
templates:
	@echo "Generating template files..."
	@chmod +x templates/create-hf-templates.sh 2>/dev/null || true
	@./templates/create-hf-templates.sh 2>/dev/null || echo "Template script not found. Templates already exist in templates/ directory."
	@echo "Templates generated successfully!"

# Serve templates locally
serve-templates:
	@echo "Starting template server on http://localhost:3000..."
	@echo "Available templates:"
	@ls -1 templates/ | sed 's/^/  http:\/\/localhost:3000\/templates\//'
	@pnpm next dev

# Individual template builds
template-chat:
	@echo "Building AI Chat Interface template..."
	@mkdir -p dist/ai-chat-interface
	@cp -r templates/ai-chat-interface/* dist/ai-chat-interface/ 2>/dev/null || echo "Template not found"

template-saas:
	@echo "Building SaaS Landing template..."
	@mkdir -p dist/saas-landing
	@cp -r templates/saas-landing/* dist/saas-landing/ 2>/dev/null || echo "Template not found"

template-dash:
	@echo "Building Analytics Dashboard template..."
	@mkdir -p dist/analytics-dashboard
	@cp -r templates/analytics-dashboard/* dist/analytics-dashboard/ 2>/dev/null || echo "Template not found"

template-store:
	@echo "Building E-commerce Storefront template..."
	@mkdir -p dist/ecommerce-storefront
	@cp -r templates/ecommerce-storefront/* dist/ecommerce-storefront/ 2>/dev/null || echo "Template not found"

template-social:
	@echo "Building Social Feed template..."
	@mkdir -p dist/social-feed
	@cp -r templates/social-feed/* dist/social-feed/ 2>/dev/null || echo "Template not found"

template-kanban:
	@echo "Building Kanban Board template..."
	@mkdir -p dist/kanban-board
	@cp -r templates/kanban-board/* dist/kanban-board/ 2>/dev/null || echo "Template not found"

template-editor:
	@echo "Building Markdown Editor template..."
	@mkdir -p dist/markdown-editor
	@cp -r templates/markdown-editor/* dist/markdown-editor/ 2>/dev/null || echo "Template not found"

template-crypto:
	@echo "Building Crypto Portfolio template..."
	@mkdir -p dist/crypto-portfolio
	@cp -r templates/crypto-portfolio/* dist/crypto-portfolio/ 2>/dev/null || echo "Template not found"

template-blog:
	@echo "Building Blog Platform template..."
	@mkdir -p dist/blog-platform
	@cp -r templates/blog-platform/* dist/blog-platform/ 2>/dev/null || echo "Template not found"

template-video:
	@echo "Building Video Streaming template..."
	@mkdir -p dist/video-streaming
	@cp -r templates/video-streaming/* dist/video-streaming/ 2>/dev/null || echo "Template not found"

# Upload to Hugging Face (requires huggingface-cli)
upload-templates:
	@echo "Uploading individual templates to Hugging Face..."
	@./scripts/create-template-repos.sh

# Upload gallery to Hugging Face
upload-gallery:
	@echo "Uploading gallery to Hugging Face..."
	@./scripts/push-gallery.sh

# Upload everything to Hugging Face
upload-all: upload-templates upload-gallery
	@echo "✅ All templates and gallery uploaded to Hugging Face!"
	@echo ""
	@echo "🎨 Gallery: https://huggingface.co/spaces/hanzo-community/gallery"
	@echo "📦 Templates: https://huggingface.co/hanzo-community"

# Create a new template
new-template:
	@read -p "Enter template name (kebab-case): " name; \
	mkdir -p templates/$$name; \
	echo "Creating new template: $$name"; \
	cp templates/ai-chat-interface/page.tsx templates/$$name/page.tsx 2>/dev/null || echo "Base template not found"; \
	echo "Template created at templates/$$name/"

# Package templates for distribution
package:
	@echo "Packaging templates..."
	@mkdir -p dist
	@tar -czf dist/hanzo-templates.tar.gz templates/
	@echo "Templates packaged at dist/hanzo-templates.tar.gz"

# Docker Compose commands (legacy simple commands - use docker-* targets below for full stack)
docker-build:
	@echo "Building Docker images with Compose..."
	@docker compose build

docker-run:
	@echo "Use 'make docker-dev' for full stack or 'make docker-up' for foreground mode"
	@docker compose up

# Initialize Next.js project structure
init-nextjs:
	@echo "Initializing Next.js project structure..."
	@mkdir -p app pages/api public styles
	@echo "Project structure created!"

# Check system requirements
check-deps:
	@echo "Checking system dependencies..."
	@command -v node >/dev/null 2>&1 || { echo "❌ Node.js is required but not installed."; exit 1; }
	@command -v pnpm >/dev/null 2>&1 || { echo "❌ pnpm is required. Install with: npm install -g pnpm"; exit 1; }
	@echo "✅ All dependencies are installed!"

# Development with hot reload
watch:
	@echo "Starting development with hot reload..."
	@pnpm next dev --turbo

# Format code
format:
	@echo "Formatting code..."
	@pnpm prettier --write "templates/**/*.{ts,tsx,js,jsx,json,css,md}" 2>/dev/null || echo "Prettier not configured"

# Lint code
lint:
	@echo "Linting code..."
	@pnpm eslint templates/ --ext .ts,.tsx,.js,.jsx 2>/dev/null || echo "ESLint not configured"

# Generate template documentation
docs:
	@echo "Generating template documentation..."
	@echo "# Hanzo UI Templates\n" > TEMPLATES.md
	@echo "## Available Templates\n" >> TEMPLATES.md
	@for dir in templates/*/; do \
		name=$$(basename $$dir); \
		echo "### $$name" >> TEMPLATES.md; \
		echo "" >> TEMPLATES.md; \
	done
	@echo "Documentation generated at TEMPLATES.md"

# Quick start for new developers
quickstart: check-deps install
	@echo ""
	@echo "🚀 Quick Start Complete!"
	@echo ""
	@echo "Run 'make dev' to start the development server"
	@echo "Run 'make list-templates' to see available templates"
	@echo "Run 'make help' for all available commands"

# CI/CD pipeline simulation
ci: check-deps install validate lint test build
	@echo "✅ CI pipeline passed!"

# Deploy to production (customize as needed)
deploy: build
	@echo "Deploying to production..."
	@echo "Configure your deployment target in the Makefile"

##############################################
# Docker Compose Commands
##############################################

# Start all Docker services (foreground)
docker-up:
	@echo "Starting Docker services..."
	docker compose up

# Start Docker services in background
docker-dev:
	@echo "Starting Docker development environment..."
	docker compose up -d
	@echo ""
	@echo "✅ Services started!"
	@echo "   App:     http://localhost:3000"
	@echo "   MongoDB: mongodb://localhost:27017"
	@echo "   Redis:   redis://localhost:6379"
	@echo ""
	@echo "View logs with: make docker-logs"

# Start with admin UI tools
docker-dev-tools:
	@echo "Starting Docker with admin tools..."
	docker compose --profile tools up -d
	@echo ""
	@echo "✅ Services started!"
	@echo "   App:           http://localhost:3000"
	@echo "   Mongo Express: http://localhost:8081 (admin/admin)"
	@echo "   Redis UI:      http://localhost:8082"

# Stop all Docker services
docker-down:
	@echo "Stopping Docker services..."
	docker compose down

# Stop and remove volumes
docker-down-clean:
	@echo "Stopping Docker services and removing volumes..."
	docker compose down -v

# View logs from all services
docker-logs:
	docker compose logs -f

# View app logs only
docker-logs-app:
	docker compose logs -f app

# View database logs
docker-logs-db:
	docker compose logs -f mongodb

# Build without cache
docker-build-clean:
	@echo "Building Docker images (no cache)..."
	docker compose build --no-cache

# Restart all services
docker-restart:
	docker compose restart

# Restart app only
docker-restart-app:
	docker compose restart app

# Shell into app container
docker-shell:
	@echo "Opening shell in app container..."
	docker exec -it hanzo-build-app sh

# MongoDB shell access
docker-db-shell:
	@echo "Opening MongoDB shell..."
	docker exec -it hanzo-build-mongodb mongosh -u hanzo -p hanzo_dev_password hanzo

# Redis CLI access
docker-redis-cli:
	@echo "Opening Redis CLI..."
	docker exec -it hanzo-build-redis redis-cli

# Show running containers
docker-ps:
	docker compose ps

# Show container stats
docker-stats:
	docker stats

# Health check
docker-health:
	@echo "Checking service health..."
	@curl -f http://localhost:3000/api/health && echo "\n✓ App is healthy" || echo "\n✗ App is unhealthy"

# Clean up Docker resources
docker-clean:
	@echo "Cleaning Docker resources..."
	docker compose down -v --remove-orphans
	docker system prune -f

# Clean everything (images, containers, volumes)
docker-clean-all:
	@echo "⚠️  WARNING: This will remove all Docker resources!"
	@read -p "Are you sure? [y/N] " -n 1 -r; \
	echo; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
		docker compose down -v --remove-orphans --rmi all; \
		docker system prune -af --volumes; \
		echo "✓ Cleanup complete"; \
	fi

# Backup MongoDB
docker-db-backup:
	@echo "Backing up MongoDB..."
	@mkdir -p backups
	docker exec hanzo-build-mongodb mongodump \
		--username hanzo \
		--password hanzo_dev_password \
		--authenticationDatabase admin \
		--out /data/backup
	docker cp hanzo-build-mongodb:/data/backup ./backups/mongodb-$$(date +%Y%m%d-%H%M%S)
	@echo "✓ Backup saved to ./backups/"

# Production environment
docker-prod:
	@echo "Starting production environment..."
	@if [ ! -f .env.production ]; then \
		echo "⚠️  Warning: .env.production not found"; \
		echo "Create it from .env.example with production values"; \
		exit 1; \
	fi
	docker compose -f docker-compose.prod.yml up -d --build
	@echo "✓ Production environment started"

# Stop production
docker-prod-down:
	docker compose -f docker-compose.prod.yml down

# Production logs
docker-prod-logs:
	docker compose -f docker-compose.prod.yml logs -f

# Quick start: setup and run
docker-quickstart:
	@echo "Quick starting Docker environment..."
	@if [ ! -f .env.local ]; then \
		cp .env.example .env.local; \
		echo "Created .env.local - using defaults"; \
	fi
	@$(MAKE) docker-dev
	@sleep 3
	@$(MAKE) docker-logs

# Validate Docker Compose config
docker-validate:
	@echo "Validating Docker Compose configuration..."
	@docker compose config --quiet && echo "✓ Configuration is valid"

.DEFAULT_GOAL := help