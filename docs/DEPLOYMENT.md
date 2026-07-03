# Deployment Guide

## Overview

This project uses GitHub Actions for CI/CD and deploys to Dokploy platform. The deployment pipeline automatically builds, tests, and deploys on every push to the main branch.

## Prerequisites

1. **GitHub Secrets** - Set these in your repository settings:
   - `DOKPLOY_WEBHOOK_URL` - Your Dokploy webhook URL (required)
   - `DISCORD_WEBHOOK_URL` - Discord notifications (optional)
   - `SLACK_WEBHOOK_URL` - Slack notifications (optional)
   - `NEXT_PUBLIC_API_URL` - API URL for the app (optional, defaults to localhost)

2. **Dokploy Configuration**:
   - Ensure your Dokploy project is configured to use `Dockerfile.dev` or `Dockerfile.production`
   - Set environment variables in Dokploy dashboard

## Deployment Process

### Automatic Deployment (Recommended)

1. **Push to main branch** - Triggers the CI/CD pipeline
2. **Pipeline stages**:
   - **Lint & Type Check** - Code quality checks
   - **Build & Test** - Builds Next.js app and runs tests
   - **Docker Build** - Creates and pushes Docker image
   - **Deploy** - Triggers Dokploy webhook
   - **Notify** - Sends success/failure notifications

### Manual Deployment via Webhook

```bash
curl -X POST https://platform.hanzo.ai/api/deploy/compose/u2hXjNaDLWIhMz4nITQOh
```

## Docker Images

We provide three Dockerfile options:

1. **Dockerfile.dev** - Development mode (immediate start, includes hot reload)
   - Best for quick deployments and debugging
   - Currently recommended for production due to stability

2. **Dockerfile** - Simple production build
   - Standard Next.js production build
   - Good balance of size and simplicity

3. **Dockerfile.production** - Optimized multi-stage build
   - Smallest image size
   - Best performance
   - Use when build is fully stable

## Environment Variables

### Required for Production
```env
# Authentication (Hugging Face OAuth)
HF_CLIENT_ID=your_client_id
HF_CLIENT_SECRET=your_client_secret
NEXTAUTH_SECRET=your_secret_key

# App URL
NEXT_PUBLIC_API_URL=https://hanzo.ai
```

### Optional Services
```env
# AI Providers (at least one required)
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
TOGETHER_API_KEY=...

# Payment (Hanzo Commerce — replaces Stripe)
HANZO_COMMERCE_API_URL=https://api.hanzo.ai/v1
HANZO_COMMERCE_API_KEY=...
HANZO_COMMERCE_WEBHOOK_SECRET=...
```

## Troubleshooting

### Build Failures

1. **pnpm lockfile issues**:
   ```bash
   rm -rf node_modules pnpm-lock.yaml
   pnpm install
   git add pnpm-lock.yaml
   git commit -m "fix: Update pnpm lockfile"
   git push
   ```

2. **Docker build cache issues**:
   - In Dokploy: Redeploy with "No Cache" option
   - Or update Dockerfile with a dummy change

### Deployment Failures

1. **Check GitHub Actions logs**:
   - Go to Actions tab in GitHub
   - Find the failed workflow run
   - Check which stage failed

2. **Check Dokploy logs**:
   - Access Dokploy dashboard
   - View deployment logs
   - Check container logs if deployment succeeded but app fails

3. **Health check failures**:
   - Ensure `/api/health` endpoint is accessible
   - Verify environment variables are set

## Monitoring

### Health Endpoints
- `/api/health` - Basic health check
- `/` - Homepage (should return 200)

### Logs
- **GitHub Actions**: Available in Actions tab
- **Dokploy**: Available in platform dashboard
- **Container logs**: `docker logs app-prod-vyohhy_app`

## Rollback

If deployment fails:

1. **Via GitHub**:
   ```bash
   git revert HEAD
   git push origin main
   ```

2. **Via Dokploy**:
   - Use "Rollback" feature in Dokploy dashboard
   - Or redeploy previous successful commit

## Support

For deployment issues:
1. Check this documentation
2. Review GitHub Actions logs
3. Check Dokploy deployment logs
4. Contact platform support if needed