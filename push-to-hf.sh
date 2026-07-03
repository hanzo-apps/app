#!/bin/bash

# Push Hanzo UI Templates to Hugging Face Space
# Usage: ./push-to-hf.sh

echo "🚀 Pushing Hanzo UI Templates to Hugging Face..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if huggingface-cli is installed
if ! command -v huggingface-cli &> /dev/null; then
    echo -e "${RED}❌ huggingface-cli is not installed${NC}"
    echo "Install it with: pip install huggingface-hub"
    exit 1
fi

# Check if logged in
if ! huggingface-cli whoami &> /dev/null; then
    echo -e "${YELLOW}⚠️  Not logged in to Hugging Face${NC}"
    echo "Run: huggingface-cli login"
    exit 1
fi

echo -e "${GREEN}✓ Hugging Face CLI ready${NC}"

# Create Space if it doesn't exist
echo "Creating/updating Space: hanzoai/gallery..."

# Prepare files for upload
echo "Preparing files..."

# Copy HF-specific files
cp README_HF.md README.md 2>/dev/null || true
cp Dockerfile.hf Dockerfile 2>/dev/null || true

# Create .huggingface directory
mkdir -p .huggingface

# Create space config
cat > .huggingface/space.yaml << 'EOF'
sdk: docker
sdk_version: latest
app_port: 3000
title: Hanzo UI Templates Gallery
emoji: 🎨
colorFrom: purple
colorTo: pink
pinned: true
license: mit
models: []
datasets: []
tags:
  - ui
  - templates
  - react
  - nextjs
  - tailwindcss
  - hanzo
EOF

echo -e "${GREEN}✓ Configuration files created${NC}"

# Upload to Hugging Face
echo "Uploading to Hugging Face Space..."

huggingface-cli upload hanzoai/gallery . \
    --repo-type=space \
    --commit-message="Update Hanzo UI Templates Gallery" \
    --include="*" \
    --exclude=".git" \
    --exclude="node_modules" \
    --exclude=".next" \
    --exclude=".env*" \
    --exclude="*.log"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Successfully pushed to Hugging Face!${NC}"
    echo ""
    echo "🎉 Your gallery is live at:"
    echo "   https://huggingface.co/spaces/hanzoai/gallery"
    echo ""
    echo "📦 Templates can be cloned with:"
    echo "   npx create-hanzo-app@latest my-app --template [template-name]"
else
    echo -e "${RED}❌ Failed to push to Hugging Face${NC}"
    exit 1
fi

# Restore original files
rm README.md 2>/dev/null || true
rm Dockerfile 2>/dev/null || true

echo ""
echo "📚 Next steps:"
echo "1. Visit https://huggingface.co/spaces/hanzoai/gallery"
echo "2. Check the build logs in the Space settings"
echo "3. Share your templates with the community!"