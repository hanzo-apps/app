# 🚀 Quick Docker Setup

Get Hanzo Build running locally with Docker in under 2 minutes!

## Prerequisites

- Docker Desktop installed
- 4GB+ RAM available

## Quick Start

```bash
# 1. Quick start (one command - sets up everything)
make docker-quickstart

# 2. Open your browser
open http://localhost:3000
```

That's it! 🎉

## What's Running?

After `make docker-quickstart`, you'll have:

- **App**: http://localhost:3000 - Hanzo Build application
- **MongoDB**: `localhost:27017` - Database
- **Redis**: `localhost:6379` - Caching layer

## Common Commands

### Daily Development

```bash
# Start services
make docker-dev              # Start in background
make docker-up               # Start in foreground (see logs)

# View logs
make docker-logs             # All services
make docker-logs-app         # App only

# Stop services
make docker-down             # Stop services
make docker-down-clean       # Stop and remove data
```

### With Admin Tools

```bash
# Start with database UI tools
make docker-dev-tools

# Access admin interfaces:
# MongoDB Express: http://localhost:8081 (admin/admin)
# Redis Commander: http://localhost:8082
```

### Database Access

```bash
# MongoDB shell
make docker-db-shell

# Redis CLI
make docker-redis-cli

# Backup database
make docker-db-backup
```

### Troubleshooting

```bash
# Check status
make docker-ps               # List containers
make docker-health           # Health check
make docker-stats            # Resource usage

# Restart services
make docker-restart          # All services
make docker-restart-app      # App only

# Clean start
make docker-clean            # Remove containers/volumes
make docker-build-clean      # Rebuild from scratch
make docker-dev              # Start fresh
```

### Shell Access

```bash
# App container
make docker-shell

# Run commands in container
docker exec -it hanzo-build-app pnpm test
docker exec -it hanzo-build-app pnpm build
```

## Environment Variables

The default setup works out of the box with development credentials:

```env
MONGODB_URI=mongodb://hanzo:hanzo_dev_password@mongodb:27017/hanzo
REDIS_URL=redis://redis:6379
HF_TOKEN=local_dev_token  # Bypasses auth for local dev
```

### Adding API Keys

To use AI features, add your API keys:

```bash
# 1. Create local env file
cp .env.example .env.local

# 2. Edit and add your keys
nano .env.local

# Add these:
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
```

Docker Compose will automatically use `.env.local` if it exists.

## Production Deployment

```bash
# 1. Create production env file
cp .env.example .env.production

# 2. Set production values (IMPORTANT!)
# - Strong database passwords
# - Production API keys
# - Public domain URLs

# 3. Start production stack
make docker-prod

# View production logs
make docker-prod-logs

# Stop production
make docker-prod-down
```

## Architecture

```
┌─────────────────────────────────────┐
│   App Container (Next.js)           │
│   - Port 3000                       │
│   - Hot reload enabled              │
│   - Source code mounted             │
└─────────────┬───────────────────────┘
              │
      ┌───────┴────────┐
      │                │
┌─────▼─────┐    ┌────▼──────┐
│  MongoDB  │    │   Redis   │
│  Port     │    │   Port    │
│  27017    │    │   6379    │
└───────────┘    └───────────┘
```

## Data Persistence

All data is stored in Docker volumes and persists between restarts:

- `mongodb_data` - Database files
- `redis_data` - Cache data

To completely reset:
```bash
make docker-down-clean  # Removes all volumes
```

## Development Workflow

### 1. Daily Workflow
```bash
# Morning - start services
make docker-dev

# Edit code locally - changes reflect immediately
# (Hot reload is enabled)

# View logs if needed
make docker-logs-app

# Evening - stop services
make docker-down
```

### 2. Testing Changes
```bash
# Run tests in container
docker exec -it hanzo-build-app pnpm test

# Or use make command
make test
```

### 3. Database Operations
```bash
# Backup before major changes
make docker-db-backup

# Work with data
make docker-db-shell

# Restore if needed
# Backups are in ./backups/
```

## Performance Tips

1. **BuildKit Cache**: Faster builds with Docker BuildKit (automatically enabled)

2. **Layer Caching**: Reuse unchanged layers
   ```bash
   # Rebuild only changed layers
   make docker-build
   ```

3. **Resource Limits**: Adjust in `docker-compose.yml` if needed
   ```yaml
   deploy:
     resources:
       limits:
         cpus: '2'
         memory: 2G
   ```

## Cleaning Up

```bash
# Regular cleanup (safe)
make docker-clean

# Full cleanup (removes images too)
make docker-clean-all

# Cleanup Docker system
docker system prune -a --volumes
```

## Help

See all available commands:
```bash
make help
```

Docker-specific help:
```bash
# All docker commands start with docker-*
make help | grep docker
```

Full documentation:
- [DOCKER.md](DOCKER.md) - Complete Docker guide
- [README.md](README.md) - General documentation

## Troubleshooting

### Port Already in Use
```bash
# Find and stop the conflicting process
lsof -i :3000
kill -9 <PID>

# Or change ports in docker-compose.yml
```

### Container Won't Start
```bash
# Check logs
make docker-logs

# Rebuild from scratch
make docker-build-clean
make docker-dev
```

### Database Connection Failed
```bash
# Check MongoDB is running
make docker-ps

# Check logs
make docker-logs-db

# Verify connection
make docker-db-shell
```

### Out of Disk Space
```bash
# Clean up Docker resources
make docker-clean-all
docker system df  # Check space
```

## Next Steps

- Read [DOCKER.md](DOCKER.md) for advanced usage
- Check [.env.example](.env.example) for all configuration options
- Join our [Discord](https://discord.gg/hanzo) for support

---

**Questions?** Open an issue or ask in Discord!
