# Docker Setup Guide

Complete guide for running Hanzo Build with Docker Compose.

## Quick Start (Development)

```bash
# 1. Start all services
docker compose up

# 2. Access the application
# - App: http://localhost:3000
# - MongoDB: localhost:27017
# - Redis: localhost:6379

# 3. Stop services
docker compose down
```

## Table of Contents
- [Prerequisites](#prerequisites)
- [Development Setup](#development-setup)
- [Production Setup](#production-setup)
- [Database Management](#database-management)
- [Troubleshooting](#troubleshooting)
- [Advanced Usage](#advanced-usage)

## Prerequisites

- Docker Engine 24.0+
- Docker Compose 2.20+
- 4GB+ RAM available
- 10GB+ disk space

**Install Docker:**
```bash
# macOS
brew install --cask docker

# Linux (Ubuntu/Debian)
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Verify installation
docker --version
docker compose version
```

## Development Setup

### 1. Basic Development

```bash
# Start all services in foreground
docker compose up

# Start all services in background (detached)
docker compose up -d

# View logs
docker compose logs -f

# View logs for specific service
docker compose logs -f app

# Stop services
docker compose down

# Stop and remove volumes (clean slate)
docker compose down -v
```

### 2. Development with Admin Tools

```bash
# Start with database UI tools
docker compose --profile tools up -d

# Access admin interfaces:
# - MongoDB Express: http://localhost:8081 (admin/admin)
# - Redis Commander: http://localhost:8082
```

### 3. Environment Configuration

Create `.env.local` for local overrides:

```bash
# Copy example
cp .env.example .env.local

# Edit with your values
# Required for full functionality:
HF_CLIENT_ID=your_client_id
HF_CLIENT_SECRET=your_client_secret
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
```

**Note:** For quick local testing, the default config works with `HF_TOKEN=local_dev_token`.

### 4. Hot Reload Development

The development setup includes:
- ✅ Automatic code reload on file changes
- ✅ Source code mounted as volume
- ✅ Node modules preserved in container
- ✅ Fast rebuilds with layer caching

```bash
# Edit files locally - changes reflect immediately
# No need to rebuild container

# If you modify package.json, rebuild:
docker compose up --build
```

## Production Setup

### 1. Environment Variables

Create `.env.production`:

```bash
# Required Production Variables
NODE_ENV=production

# Database
MONGODB_USERNAME=hanzo
MONGODB_PASSWORD=<strong-password-here>

# Redis
REDIS_PASSWORD=<strong-password-here>

# Next.js
NEXT_PUBLIC_API_URL=https://yourdomain.com
NEXTAUTH_URL=https://yourdomain.com
NEXTAUTH_SECRET=<32-char-random-string>

# HuggingFace OAuth
HF_CLIENT_ID=<production-client-id>
HF_CLIENT_SECRET=<production-secret>

# AI Providers (at least one)
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...

# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...

# Monitoring
NEXT_PUBLIC_SENTRY_DSN=https://...
SENTRY_AUTH_TOKEN=...
HEALTH_CHECK_SECRET=<random-secret>
```

### 2. Deploy Production

```bash
# Build and start production stack
docker compose -f docker-compose.prod.yml up -d --build

# Monitor startup
docker compose -f docker-compose.prod.yml logs -f

# Check health
curl http://localhost:3000/api/health

# Stop production
docker compose -f docker-compose.prod.yml down
```

### 3. Production Security

**Important security considerations:**

1. **Change default passwords** in production
2. **Use secrets management** (Docker secrets, AWS Secrets Manager)
3. **Enable SSL/TLS** with reverse proxy (Nginx, Traefik, Caddy)
4. **Restrict network access** with firewall rules
5. **Regular backups** of MongoDB and Redis data

## Database Management

### MongoDB

**Access MongoDB Shell:**
```bash
# Via Docker
docker exec -it hanzo-build-mongodb mongosh -u hanzo -p hanzo_dev_password

# Commands in shell
show dbs
use hanzo
show collections
db.projects.find().pretty()
```

**Backup Database:**
```bash
# Create backup
docker exec hanzo-build-mongodb mongodump \
  --username hanzo \
  --password hanzo_dev_password \
  --authenticationDatabase admin \
  --out /data/backup

# Copy backup to host
docker cp hanzo-build-mongodb:/data/backup ./mongodb-backup
```

**Restore Database:**
```bash
# Copy backup to container
docker cp ./mongodb-backup hanzo-build-mongodb:/data/restore

# Restore
docker exec hanzo-build-mongodb mongorestore \
  --username hanzo \
  --password hanzo_dev_password \
  --authenticationDatabase admin \
  /data/restore
```

### Redis

**Access Redis CLI:**
```bash
# Development (no password)
docker exec -it hanzo-build-redis redis-cli

# Production (with password)
docker exec -it hanzo-build-redis-prod redis-cli -a your_redis_password

# Common commands
PING
KEYS *
GET key_name
FLUSHALL  # Clear all data (careful!)
```

**Redis Backup:**
```bash
# Trigger save
docker exec hanzo-build-redis redis-cli SAVE

# Copy RDB file
docker cp hanzo-build-redis:/data/dump.rdb ./redis-backup.rdb
```

## Troubleshooting

### Common Issues

**1. Port Already in Use**
```bash
# Find what's using the port
lsof -i :3000
lsof -i :27017
lsof -i :6379

# Kill the process or change ports in docker-compose.yml
```

**2. Container Crashes on Startup**
```bash
# View logs
docker compose logs app

# Check health
docker compose ps

# Inspect container
docker inspect hanzo-build-app
```

**3. Database Connection Failed**
```bash
# Check MongoDB is healthy
docker compose ps mongodb

# Test connection
docker exec hanzo-build-mongodb mongosh --eval "db.runCommand({ping: 1})"

# Verify credentials in .env
```

**4. Out of Disk Space**
```bash
# Clean up Docker resources
docker system prune -a --volumes

# Remove unused images
docker image prune -a

# Check disk usage
docker system df
```

**5. Build Fails**
```bash
# Clear build cache
docker builder prune -a

# Rebuild from scratch
docker compose build --no-cache

# Check Dockerfile syntax
docker compose config
```

### Debug Mode

**Enable verbose logging:**
```bash
# Set in docker-compose.yml or .env
DEBUG=*
LOG_LEVEL=debug

# Or run with debug
docker compose --verbose up
```

**Shell into containers:**
```bash
# App container
docker exec -it hanzo-build-app sh

# MongoDB container
docker exec -it hanzo-build-mongodb bash

# Check processes
docker top hanzo-build-app

# Inspect resources
docker stats
```

## Advanced Usage

### Custom Networks

```bash
# Create external network
docker network create hanzo-external

# Update docker-compose.yml to use external network
networks:
  hanzo-network:
    external: true
    name: hanzo-external
```

### Volume Management

```bash
# List volumes
docker volume ls

# Inspect volume
docker volume inspect hanzo-build_mongodb_data

# Backup volume
docker run --rm \
  -v hanzo-build_mongodb_data:/data \
  -v $(pwd):/backup \
  alpine tar czf /backup/mongodb-backup.tar.gz /data

# Restore volume
docker run --rm \
  -v hanzo-build_mongodb_data:/data \
  -v $(pwd):/backup \
  alpine tar xzf /backup/mongodb-backup.tar.gz -C /
```

### Multi-Stage Builds

The production Dockerfile uses multi-stage builds for optimization:

```dockerfile
# Stage 1: Dependencies
FROM node:20-alpine AS deps
# ... install dependencies

# Stage 2: Build
FROM node:20-alpine AS builder
# ... build application

# Stage 3: Production
FROM node:20-alpine AS runner
# ... runtime only
```

### Health Checks

**Configure health checks in docker-compose.yml:**
```yaml
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 40s
```

**Check health status:**
```bash
docker compose ps
docker inspect --format='{{json .State.Health}}' hanzo-build-app
```

### Scaling Services

```bash
# Scale app to 3 instances
docker compose up --scale app=3 -d

# Note: Requires load balancer configuration
```

### Resource Limits

```yaml
services:
  app:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
        reservations:
          cpus: '1'
          memory: 1G
```

## Performance Optimization

### 1. Build Cache
```bash
# Use BuildKit for faster builds
export DOCKER_BUILDKIT=1
export COMPOSE_DOCKER_CLI_BUILD=1

docker compose build
```

### 2. Layer Caching
```bash
# Pull latest image for layer cache
docker compose pull

# Build with cache from registry
docker compose build --pull
```

### 3. Prune Regularly
```bash
# Automated cleanup (weekly cron)
docker system prune -af --volumes --filter "until=168h"
```

## Monitoring

### View Real-time Stats
```bash
# All containers
docker stats

# Specific container
docker stats hanzo-build-app

# Format output
docker stats --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}"
```

### Export Metrics
```bash
# Export to file
docker stats --no-stream > docker-stats.txt

# JSON format
docker inspect hanzo-build-app > app-inspect.json
```

## CI/CD Integration

### GitHub Actions Example
```yaml
name: Build and Push Docker Image

on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Build Docker image
        run: docker compose -f docker-compose.prod.yml build

      - name: Run tests
        run: docker compose -f docker-compose.prod.yml run app pnpm test
```

## Support

For issues or questions:
- GitHub Issues: [github.com/hanzoai/build/issues](https://github.com/hanzoai/build/issues)
- Documentation: [docs.hanzo.ai](https://docs.hanzo.ai)
- Discord: [discord.gg/hanzo](https://discord.gg/hanzo)

## License

See [LICENSE](LICENSE) file for details.
