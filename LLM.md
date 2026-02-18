# Hanzo Build

AI-powered web app builder. Users describe what they want in natural language, AI generates a full website with live preview and code editing. Deployed at hanzo.app.

## Stack

- Next.js 15.5 (App Router, Turbopack), React 19, TypeScript
- @hanzo/ui, Radix UI, Tailwind CSS 4
- Monaco Editor (code editing), Sandpack (live preview)
- MongoDB + Mongoose (project persistence)
- HuggingFace OAuth (auth), Stripe (payments)
- Sentry (error tracking), Redis (caching)
- React Query, Zod, Lucide icons

## Structure

```
app/                    # Next.js App Router pages
  api/                  # API routes (ai, auth, stripe, projects, health, mcp)
  dashboard/            # User dashboard
  chat/                 # AI chat interface
  playground/           # Code playground
  templates/            # Template gallery
  pricing/              # Billing pages
components/
  editor/               # Monaco code editor components
  preview/              # Live preview (Sandpack)
  layout/               # App shell, nav, sidebar
  ui/                   # Shared UI primitives
  space/                # Workspace/project UI
hooks/                  # useAuth, useCallAi, useEditor, useUser
lib/
  llm/                  # LLM provider integration
  auth.ts               # Auth helpers
  api-client.ts         # API client with retry/circuit breaker
  mongodb.ts            # DB connection
  security/             # Rate limiting, input validation, CSP
  cache/                # Redis caching layer
models/
  Project.ts            # Mongoose project schema (only model)
templates/              # Starter templates (ecommerce, blog, saas, etc.)
```

## Commands

```bash
pnpm install
pnpm dev                # Dev server (Turbopack)
pnpm build              # Production build
pnpm start              # Start production server
pnpm test               # Jest unit tests
pnpm test:e2e           # Playwright e2e tests
pnpm analyze            # Bundle analyzer
```

## Architecture

- Modular monolith: Next.js handles frontend + API in one deployment
- AI flow: user prompt -> /api/ai or /api/ask-ai -> LLM provider -> generated HTML/code -> Sandpack preview
- Auth: HuggingFace OAuth with session cookies; dev bypass for localhost
- Projects stored in MongoDB with single Project model
- Templates are full starter apps in /templates/ (blog, ecommerce, saas, etc.)
- Docker deployment via multi-stage Dockerfile, CI with GitHub Actions
- Sentry for error tracking (client, server, edge configs)
- LLM.md is symlinked as CLAUDE.md, QWEN.md, GEMINI.md, .AGENTS.md

## Environment

```
MONGODB_URI, REDIS_URL
HF_CLIENT_ID, HF_CLIENT_SECRET
OPENAI_API_KEY (or other LLM provider keys)
STRIPE_SECRET_KEY, NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
NEXT_PUBLIC_SENTRY_DSN
```

## Rules

- Keep LLM.md concise -- no "executive summaries" or bloated audit reports
- Never create random summary files
- Never commit symlinked files (.AGENTS.md, CLAUDE.md, etc.)
- Update LLM.md with significant discoveries only
