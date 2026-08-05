# Hanzo App - AI-powered App Builder
FROM node:22-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies
COPY package.json pnpm-lock.yaml* ./
RUN corepack enable pnpm && pnpm i --no-frozen-lockfile

# Build the application
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build arguments for environment
ARG NEXT_PUBLIC_APP_URL=https://hanzo.app
ARG NEXT_PUBLIC_IAM_CLIENT_ID
ARG IAM_ENDPOINT=https://hanzo.id
ARG IAM_ORGANIZATION=hanzo
ARG IAM_APPLICATION=app-hanzo
# Publishable ingest key (pk_…) for @hanzo/event. WITHOUT it, api.hanzo.ai answers
# every LOGGED-OUT pageview with 403 "valid bearer or a resolvable ingest key
# required" — verified from a real browser against the live site — so anonymous
# traffic, which is most of it, is silently dropped. NEXT_PUBLIC_* is inlined by
# Next at BUILD time, so this has to be a build arg; setting it on the pod is too
# late. Write-only and safe to ship in the bundle: pk_ is ingest-only by
# construction and cannot read. Mint per org with POST /v1/ingest/keys.
ARG NEXT_PUBLIC_PUBLISHABLE_KEY

ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_PUBLISHABLE_KEY=$NEXT_PUBLIC_PUBLISHABLE_KEY
ENV NEXT_TELEMETRY_DISABLED=1

RUN corepack enable pnpm && pnpm build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
