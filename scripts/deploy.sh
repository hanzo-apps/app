#!/bin/bash
# Deploy script for Hanzo Build production

set -e

echo "🚀 Starting Hanzo Build deployment..."

# Ensure the external network exists
echo "📡 Checking Docker network..."
if ! docker network ls | grep -q hanzo-network; then
    echo "Creating hanzo-network..."
    docker network create hanzo-network
else
    echo "✅ hanzo-network already exists"
fi

# Validate compose file
echo "🔍 Validating docker-compose file..."
docker compose -f compose.prod.yml config > /dev/null
echo "✅ Compose file is valid"

# Pull latest changes
echo "📦 Pulling latest images..."
docker compose -f compose.prod.yml pull || true

# Build and deploy
echo "🏗️ Building and starting services..."
docker compose -f compose.prod.yml up -d --build

# Wait for services to be healthy
echo "⏳ Waiting for services to be healthy..."
sleep 10

# Check service status
echo "📊 Service status:"
docker compose -f compose.prod.yml ps

# Check health
echo "🏥 Health check:"
docker inspect --format='{{.Name}}: {{json .State.Health}}' $(docker compose -f compose.prod.yml ps -q) 2>/dev/null || true

# Show logs tail
echo "📝 Recent logs:"
docker compose -f compose.prod.yml logs --tail=20

echo "✨ Deployment complete!"
echo "🌐 Application should be available at https://hanzo.app"