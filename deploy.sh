#!/bin/bash

# Hanzo AI Build Platform - Deployment Script
# Usage: ./deploy.sh [environment]
# Examples: 
#   ./deploy.sh production
#   ./deploy.sh staging

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Default environment
ENVIRONMENT=${1:-production}

echo -e "${GREEN}🚀 Deploying Hanzo AI Build Platform - ${ENVIRONMENT}${NC}"

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker is not installed${NC}"
    exit 1
fi

# Check if docker-compose is installed
if ! command -v docker compose &> /dev/null; then
    echo -e "${RED}❌ Docker Compose is not installed${NC}"
    exit 1
fi

# Check for environment file
if [ ! -f ".env.${ENVIRONMENT}" ]; then
    echo -e "${RED}❌ Environment file .env.${ENVIRONMENT} not found${NC}"
    echo -e "${YELLOW}💡 Copy .env.${ENVIRONMENT}.example to .env.${ENVIRONMENT} and configure it${NC}"
    exit 1
fi

# Create hanzo-network if it doesn't exist
echo -e "${YELLOW}📦 Creating hanzo-network if needed...${NC}"
docker network create hanzo-network 2>/dev/null || true

# Load environment variables
export $(cat .env.${ENVIRONMENT} | grep -v '^#' | xargs)

# Build the Docker image
echo -e "${YELLOW}🔨 Building Docker image...${NC}"
docker compose build --no-cache

# Pull latest images
echo -e "${YELLOW}📥 Pulling latest images...${NC}"
docker compose pull

# Stop existing containers
echo -e "${YELLOW}🛑 Stopping existing containers...${NC}"
docker compose down

# Run database migrations
echo -e "${YELLOW}🗄️ Running database migrations...${NC}"
docker compose run --rm hanzo-build npm run prisma:migrate

# Start the services
echo -e "${YELLOW}🚀 Starting services...${NC}"
docker compose up -d

# Wait for services to be healthy
echo -e "${YELLOW}⏳ Waiting for services to be healthy...${NC}"
sleep 10

# Check health
echo -e "${YELLOW}🏥 Checking service health...${NC}"
HEALTH_CHECK=$(curl -s http://localhost:3000/api/health || echo '{"status":"error"}')
STATUS=$(echo $HEALTH_CHECK | grep -o '"status":"[^"]*"' | cut -d'"' -f4)

if [ "$STATUS" = "ok" ]; then
    echo -e "${GREEN}✅ Deployment successful!${NC}"
    echo -e "${GREEN}🌐 Application is running at https://hanzo.app${NC}"
    
    # Show running containers
    echo -e "${YELLOW}📊 Running containers:${NC}"
    docker compose ps
    
    # Show logs command
    echo -e "${YELLOW}📋 To view logs, run:${NC}"
    echo "docker compose logs -f hanzo-build"
else
    echo -e "${RED}❌ Health check failed${NC}"
    echo -e "${RED}Response: $HEALTH_CHECK${NC}"
    
    # Show logs
    echo -e "${YELLOW}📋 Recent logs:${NC}"
    docker compose logs --tail=50 hanzo-build
    
    exit 1
fi

echo -e "${GREEN}🎉 Deployment complete!${NC}"