#!/bin/bash

# Push Gallery to Hugging Face Space
# Usage: ./scripts/push-gallery.sh

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# HF organization name
ORG="hanzo-community"

echo -e "${BLUE}🎨 Pushing Hanzo UI Gallery to Hugging Face${NC}"
echo ""

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
echo ""

# Create temporary directory for gallery
TEMP_DIR="temp_gallery"
rm -rf $TEMP_DIR
mkdir -p $TEMP_DIR

echo "Preparing gallery files..."

# Copy necessary files
cp -r app/gallery $TEMP_DIR/app/ 2>/dev/null || mkdir -p $TEMP_DIR/app && cp -r app/gallery $TEMP_DIR/app/
cp -r components $TEMP_DIR/ 2>/dev/null || true
cp -r lib $TEMP_DIR/ 2>/dev/null || true
cp -r public $TEMP_DIR/ 2>/dev/null || true
cp package.json $TEMP_DIR/
cp next.config.js $TEMP_DIR/ 2>/dev/null || cp next.config.ts $TEMP_DIR/next.config.js 2>/dev/null || true
cp tsconfig.json $TEMP_DIR/
cp tailwind.config.* $TEMP_DIR/ 2>/dev/null || true
cp postcss.config.* $TEMP_DIR/ 2>/dev/null || true

# Create app structure if needed
mkdir -p $TEMP_DIR/app

# Create layout.tsx if it doesn't exist
if [ ! -f "$TEMP_DIR/app/layout.tsx" ]; then
    cat > "$TEMP_DIR/app/layout.tsx" << 'EOF'
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Hanzo UI Templates Gallery",
  description: "Production-ready templates built with @hanzo/ui components",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
EOF
fi

# Create globals.css if it doesn't exist
if [ ! -f "$TEMP_DIR/app/globals.css" ]; then
    cat > "$TEMP_DIR/app/globals.css" << 'EOF'
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;
    --primary: 222.2 47.4% 11.2%;
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 96.1%;
    --secondary-foreground: 222.2 47.4% 11.2%;
    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 210 40% 96.1%;
    --accent-foreground: 222.2 47.4% 11.2%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 222.2 84% 4.9%;
    --radius: 0.5rem;
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    --card: 222.2 84% 4.9%;
    --card-foreground: 210 40% 98%;
    --popover: 222.2 84% 4.9%;
    --popover-foreground: 210 40% 98%;
    --primary: 210 40% 98%;
    --primary-foreground: 222.2 47.4% 11.2%;
    --secondary: 217.2 32.6% 17.5%;
    --secondary-foreground: 210 40% 98%;
    --muted: 217.2 32.6% 17.5%;
    --muted-foreground: 215 20.2% 65.1%;
    --accent: 217.2 32.6% 17.5%;
    --accent-foreground: 210 40% 98%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 210 40% 98%;
    --border: 217.2 32.6% 17.5%;
    --input: 217.2 32.6% 17.5%;
    --ring: 212.7 26.8% 83.9%;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
  }
}
EOF
fi

# Create root page.tsx that redirects to gallery
cat > "$TEMP_DIR/app/page.tsx" << 'EOF'
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    router.push('/gallery');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-2">Redirecting to Gallery...</h1>
        <p className="text-muted-foreground">Loading templates...</p>
      </div>
    </div>
  );
}
EOF

# Create README for HF Space
cat > "$TEMP_DIR/README.md" << 'EOF'
---
title: Hanzo UI Templates Gallery
emoji: 🎨
colorFrom: purple
colorTo: pink
sdk: docker
pinned: true
license: mit
app_port: 3000
---

# Hanzo UI Templates Gallery

A comprehensive collection of production-ready templates built exclusively with [@hanzo/ui](https://github.com/hanzoai/ui) components.

## 🚀 Live Gallery

Visit the [live gallery](https://huggingface.co/spaces/hanzo-community/gallery) to explore all templates.

## 📦 Available Templates

Each template is available as an individual Hugging Face Space that you can fork and customize:

- [AI Chat Interface](https://huggingface.co/spaces/hanzo-community/ai-chat-interface)
- [E-commerce Storefront](https://huggingface.co/spaces/hanzo-community/ecommerce-storefront)
- [Analytics Dashboard](https://huggingface.co/spaces/hanzo-community/analytics-dashboard)
- [SaaS Landing Page](https://huggingface.co/spaces/hanzo-community/saas-landing)
- [Social Media Feed](https://huggingface.co/spaces/hanzo-community/social-feed)
- [Kanban Board](https://huggingface.co/spaces/hanzo-community/kanban-board)
- [Markdown Editor](https://huggingface.co/spaces/hanzo-community/markdown-editor)
- [Crypto Portfolio](https://huggingface.co/spaces/hanzo-community/crypto-portfolio)
- [Blog Platform](https://huggingface.co/spaces/hanzo-community/blog-platform)
- [Video Streaming](https://huggingface.co/spaces/hanzo-community/video-streaming)

## 🎨 Features

- ✅ **100% @hanzo/ui Components**
- 🎨 **Unique Color Schemes** for each template
- 📱 **Fully Responsive** design
- 🌙 **Dark Mode Support**
- ⚡ **Next.js 14** with App Router
- 🔧 **TypeScript** for type safety

## 🚀 Quick Start

Clone any template directly:

```bash
npx create-hanzo-app@latest my-app --template [template-name]
```

Or fork from Hugging Face by clicking the "Fork" button on any template.

## 📚 Documentation

- [@hanzo/ui Documentation](https://hanzo.ai/docs/ui)
- [Component Reference](https://github.com/hanzoai/ui)
- [Template Guide](https://hanzo.ai/templates)

## 🤝 Contributing

We welcome contributions! Each template is maintained individually in the hanzo-community organization.

## 📄 License

MIT License

## 🌟 Credits

Built with ❤️ by [Hanzo AI](https://hanzo.ai)
EOF

# Create Dockerfile
cat > "$TEMP_DIR/Dockerfile" << 'EOF'
FROM node:20-slim

WORKDIR /app

RUN npm install -g pnpm

COPY package*.json ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm build

EXPOSE 3000

CMD ["pnpm", "start"]
EOF

# Create .gitignore
cat > "$TEMP_DIR/.gitignore" << 'EOF'
node_modules
.next
.env*
*.log
.DS_Store
EOF

echo -e "${GREEN}✓ Gallery files prepared${NC}"

# Push to Hugging Face
echo "Creating gallery Space on Hugging Face..."

cd $TEMP_DIR

# Initialize git repo
git init
git add .
git commit -m "Initial commit: Hanzo UI Templates Gallery"

# Create and push to HF Space
huggingface-cli repo create "$ORG/gallery" --type space --space_sdk docker -y 2>/dev/null || true

# Add remote and push
git remote add hf "https://huggingface.co/spaces/$ORG/gallery"
git push hf main --force

cd ..

# Clean up
rm -rf $TEMP_DIR

echo ""
echo -e "${GREEN}✅ Gallery successfully pushed to Hugging Face!${NC}"
echo ""
echo -e "${BLUE}🎉 Gallery is live at:${NC}"
echo "   https://huggingface.co/spaces/$ORG/gallery"
echo ""
echo -e "${BLUE}📦 Individual templates:${NC}"
echo "   https://huggingface.co/hanzo-community"
echo ""
echo -e "${YELLOW}Note: It may take a few minutes for the Space to build and deploy.${NC}"