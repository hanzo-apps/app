#!/bin/bash

echo -e "\033[0;34m🎨 Pushing Hanzo UI Gallery to Hugging Face (hanzoai/gallery)\033[0m"

# Check if HF CLI is installed
if ! command -v huggingface-cli &> /dev/null; then
    echo "❌ Hugging Face CLI not found. Install with: pip install huggingface-hub"
    exit 1
fi

echo -e "\033[0;32m✓ Hugging Face CLI ready\033[0m"

# Create temp directory for gallery
TEMP_DIR="temp_gallery_hanzoai"
rm -rf $TEMP_DIR
mkdir -p $TEMP_DIR

echo "Preparing gallery files..."

# Copy necessary files
cp -r app/gallery $TEMP_DIR/app/
cp -r app/templates $TEMP_DIR/app/ 2>/dev/null || true
cp -r components/ui $TEMP_DIR/components/
cp app/globals.css $TEMP_DIR/app/
cp app/layout.tsx $TEMP_DIR/app/
cp package.json $TEMP_DIR/
cp next.config.js $TEMP_DIR/
cp tailwind.config.js $TEMP_DIR/
cp tsconfig.json $TEMP_DIR/
cp postcss.config.* $TEMP_DIR/ 2>/dev/null || true
cp -r public $TEMP_DIR/ 2>/dev/null || true

# Create main page that redirects to gallery
cat > $TEMP_DIR/app/page.tsx << 'EOF'
"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    router.push('/gallery');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-2">Hanzo UI Template Gallery</h1>
        <p className="text-muted-foreground">Redirecting to gallery...</p>
      </div>
    </div>
  );
}
EOF

# Create Dockerfile for HF Spaces
cat > $TEMP_DIR/Dockerfile << 'EOF'
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm install

# Copy application files
COPY . .

# Build the application
RUN npm run build

# Expose the port
EXPOSE 3000

# Start the application
CMD ["npm", "start"]
EOF

# Create README for HF Space
cat > $TEMP_DIR/README.md << 'EOF'
---
title: Hanzo UI Template Gallery
emoji: 🎨
colorFrom: purple
colorTo: blue
sdk: docker
app_port: 3000
pinned: true
---

# Hanzo UI Template Gallery

A collection of production-ready templates built with @hanzo/ui components.

## Features

- 🎨 10+ Beautiful Templates
- 🚀 One-click Deploy to Hanzo Cloud
- 💻 Edit in Cloud IDE
- 📱 Fully Responsive
- 🎯 TypeScript + Next.js 14
- 🎨 Tailwind CSS
- ⚡ Optimized Performance

## Templates Include

- AI Chat Interface
- E-commerce Storefront
- Analytics Dashboard
- SaaS Landing Page
- Social Media Feed
- Kanban Board
- Markdown Editor
- Crypto Portfolio
- Blog Platform
- Video Streaming

## Quick Start

Each template features:
- **Deploy to Hanzo** - Instant deployment to cloud
- **Edit on Hanzo** - Open in cloud IDE instantly

Visit [hanzo.app](https://hanzo.app) to learn more!
EOF

echo -e "\033[0;32m✓ Gallery files prepared\033[0m"

# Initialize git and push to HF
cd $TEMP_DIR
echo "Creating gallery Space on Hugging Face..."
git init
git add .
git commit -m "Initial commit: Hanzo UI Templates Gallery"

# Create the HF space (using hanzoai organization)
huggingface-cli repo create hanzoai/gallery --repo-type space --space-sdk docker 2>/dev/null || echo "Space may already exist"

# Add HF remote and push
git remote add hf https://huggingface.co/spaces/hanzoai/gallery
git push -f hf main

cd ..
echo -e "\033[0;32m✅ Gallery pushed to https://huggingface.co/spaces/hanzoai/gallery\033[0m"

# Clean up
rm -rf $TEMP_DIR

echo -e "\033[1;33mNote: The Space may take a few minutes to build and deploy.\033[0m"