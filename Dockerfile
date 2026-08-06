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
# The publishable ingest key for @hanzo/event. Without it every beacon is refused
# at api.hanzo.ai — measured as a hard 401 `ingest_key_required`, with and without
# a browser Origin, for pageviews AND exceptions alike. (The "anonymous lane" that
# supposedly still admits those two is not implemented in the deployed cloud; do
# not plan around it.) Next inlines NEXT_PUBLIC_* at BUILD time, so this has to be
# a build arg — setting it on the pod is too late.
#
# The ARG is `PUBLISHABLE_KEY`: ONE name, the name it has in KMS
# (hanzo / env=prod / path=deploy) and the name release.yml passes on --build-arg.
# It was `NEXT_PUBLIC_PUBLISHABLE_KEY` here while CI passed `PUBLISHABLE_KEY`, so
# the value never arrived and the ENV below expanded to empty on every build ever
# made. The NEXT_PUBLIC_ prefix is a property of THIS build tool, so it is applied
# here and the secret store keeps the one plain name.
#
# Safe in the bundle by construction: a publishable key resolves to the ORG, never
# a principal, and is write-only. Mint with POST /v1/keys {"type":"publishable"}.
ARG PUBLISHABLE_KEY

ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_PUBLISHABLE_KEY=$PUBLISHABLE_KEY
ENV NEXT_TELEMETRY_DISABLED=1

RUN corepack enable pnpm && pnpm build && \
    # Did Next actually INLINE it? A key present in the environment and absent
    # from the bundle is indistinguishable from success everywhere except the
    # warehouse, where the traffic simply stops being attributable. The emptiness
    # test is not redundant: `grep -F ""` matches every line, so without it an
    # ABSENT key satisfies the search and this gate passes the exact build it
    # exists to stop — which is the shape this repo shipped in.
    { { [ -n "$PUBLISHABLE_KEY" ] && grep -rqF "$PUBLISHABLE_KEY" .next; } || \
      { echo "ERROR: no ingest key inlined into .next — hanzo.app would ship unattributed" >&2; exit 1; }; }

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
