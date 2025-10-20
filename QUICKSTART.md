# ⚡ Hanzo Build - Quick Start

Choose your preferred method to run the application:

## Option 1: Docker (Recommended) 🐳

**Fastest way to get started - everything configured automatically!**

```bash
# One command to rule them all
make docker-quickstart

# Open http://localhost:3000
```

✅ **What you get:**
- Next.js app on port 3000
- MongoDB database (with data persistence)
- Redis caching layer
- Hot reload enabled
- No local setup needed

📚 **Learn more:** [README.docker.md](README.docker.md)

---

## Option 2: Local Development 💻

**For when you want full control:**

```bash
# 1. Install dependencies
pnpm install

# 2. Set up environment
cp .env.example .env.local
# Edit .env.local with your values

# 3. Start MongoDB and Redis (choose one)
# Option A: Docker for databases only
docker run -d -p 27017:27017 mongo:7
docker run -d -p 6379:6379 redis:alpine

# Option B: Install locally
brew install mongodb-community redis  # macOS
brew services start mongodb-community redis

# 4. Start the app
pnpm dev

# Open http://localhost:3000
```

---

## What's Next?

### Development Workflow

**With Docker:**
```bash
make docker-dev        # Start
make docker-logs       # View logs
make docker-down       # Stop
```

**Local:**
```bash
pnpm dev              # Start
pnpm test             # Run tests
pnpm build            # Build for production
```

### Admin Tools

```bash
# With Docker - database UI tools
make docker-dev-tools

# Access:
# MongoDB Express: http://localhost:8081 (admin/admin)
# Redis Commander: http://localhost:8082
```

### Adding AI Providers

Edit `.env.local` and add at least one:

```env
# OpenAI
OPENAI_API_KEY=sk-...

# Anthropic Claude
ANTHROPIC_API_KEY=sk-ant-...

# Together AI
TOGETHER_API_KEY=...
```

### Database Access

```bash
# Docker
make docker-db-shell     # MongoDB
make docker-redis-cli    # Redis

# Local
mongosh                  # MongoDB
redis-cli                # Redis
```

---

## Troubleshooting

### Port Conflicts

```bash
# Find what's using ports
lsof -i :3000   # App
lsof -i :27017  # MongoDB
lsof -i :6379   # Redis

# Kill process
kill -9 <PID>
```

### Docker Issues

```bash
# Restart fresh
make docker-clean
make docker-build-clean
make docker-dev

# View all commands
make help
```

### Local Issues

```bash
# Clean reinstall
rm -rf node_modules pnpm-lock.yaml
pnpm install

# Clear Next.js cache
rm -rf .next
pnpm dev
```

---

## File Structure

```
hanzo-build/
├── app/              # Next.js App Router
├── components/       # React components
├── lib/              # Utilities & helpers
├── templates/        # Project templates
├── docker/           # Docker configurations
│   ├── Dockerfile
│   └── Dockerfile.dev
├── docker-compose.yml      # Development
├── docker-compose.prod.yml # Production
├── Makefile         # Convenient commands
└── README.docker.md # Detailed Docker docs
```

---

## Available Commands

### Docker Commands
```bash
make docker-quickstart  # Quick start
make docker-dev         # Start in background
make docker-logs        # View logs
make docker-down        # Stop services
make docker-shell       # Shell into container
make docker-db-backup   # Backup database
```

### Local Commands
```bash
make dev               # Start local dev server
make build             # Production build
make test              # Run tests
make templates         # Generate templates
make help              # Show all commands
```

---

## Documentation

- 📖 [README.docker.md](README.docker.md) - Quick Docker guide
- 📘 [DOCKER.md](DOCKER.md) - Complete Docker documentation
- 📕 [CLAUDE.md](CLAUDE.md) - Architecture & analysis
- 🏗️ [Makefile](Makefile) - All available commands

---

## Support

- **Issues**: [GitHub Issues](https://github.com/hanzoai/build/issues)
- **Docs**: [docs.hanzo.ai](https://docs.hanzo.ai)
- **Discord**: [discord.gg/hanzo](https://discord.gg/hanzo)

---

## Pro Tips 💡

1. **Use Docker for quickest start** - Everything configured
2. **Enable admin tools** - `make docker-dev-tools` for database UIs
3. **Check health** - `make docker-health` to verify everything works
4. **Backup regularly** - `make docker-db-backup` before major changes
5. **View help** - `make help` to see all commands

---

**Ready to build?** Start with `make docker-quickstart` and you'll be coding in 2 minutes! 🚀
