# Production Dockerfile - Optimized single-stage build
FROM node:20-alpine

# Enable pnpm via corepack
RUN corepack enable && corepack prepare pnpm@10.17.1 --activate

# Install system dependencies
RUN apk add --no-cache libc6-compat

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml* ./

# Install all dependencies (including dev for build)
RUN pnpm install --frozen-lockfile

# Copy application source
COPY . .

# Build Next.js application
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
ENV NODE_OPTIONS="--max-old-space-size=4096"
ENV CI=true

RUN pnpm run build && \
    # Verify build artifacts exist
    if [ ! -d ".next" ]; then \
      echo "ERROR: Build failed - .next directory not created" && exit 1; \
    fi && \
    echo "Build successful - .next directory created"

# Prune dev dependencies after build
RUN pnpm prune --prod

# Runtime configuration
EXPOSE 3000
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/api/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1); }).on('error', () => { process.exit(1); })" || exit 1

# Start production server
CMD ["pnpm", "start"]