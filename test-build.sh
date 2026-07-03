#!/bin/bash

# Basic e2e test for the Hanzo AI build platform
set -e

echo "🚀 Starting build test..."

# Clean up any existing containers
echo "🧹 Cleaning up existing containers..."
docker stop hanzo-test 2>/dev/null || true
docker rm hanzo-test 2>/dev/null || true

# Build the Docker image
echo "🔨 Building Docker image..."
docker build -t hanzo-build-test .

# Run the container
echo "🏃 Running container..."
docker run -d --name hanzo-test \
  -p 3001:3000 \
  -e NODE_ENV=production \
  -e NEXTAUTH_SECRET=test-secret-for-e2e-testing \
  -e HF_CLIENT_ID=test \
  -e HF_CLIENT_SECRET=test \
  hanzo-build-test

# Wait for app to start
echo "⏳ Waiting for app to start..."
sleep 10

# Test if the app is responding
echo "🧪 Testing app health..."
HEALTH_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/api/health || echo "000")

if [ "$HEALTH_STATUS" = "200" ]; then
  echo "✅ Health check passed!"
else
  echo "❌ Health check failed with status: $HEALTH_STATUS"
  echo "📝 Container logs:"
  docker logs hanzo-test
  docker stop hanzo-test
  docker rm hanzo-test
  exit 1
fi

# Test if the main page loads
echo "🧪 Testing main page..."
MAIN_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001 || echo "000")

if [ "$MAIN_STATUS" = "200" ]; then
  echo "✅ Main page loads successfully!"
else
  echo "❌ Main page failed with status: $MAIN_STATUS"
  echo "📝 Container logs:"
  docker logs hanzo-test
  docker stop hanzo-test
  docker rm hanzo-test
  exit 1
fi

# Clean up
echo "🧹 Cleaning up..."
docker stop hanzo-test
docker rm hanzo-test

echo "✅ All tests passed! The build is working correctly."