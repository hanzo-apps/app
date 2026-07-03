#!/bin/bash

# Create individual Hugging Face repos for each template
# Usage: ./scripts/create-template-repos.sh

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# HF organization name
ORG="hanzo-community"

# Template list
TEMPLATES=(
  "ai-chat-interface"
  "ecommerce-storefront"
  "analytics-dashboard"
  "saas-landing"
  "social-feed"
  "kanban-board"
  "markdown-editor"
  "crypto-portfolio"
  "blog-platform"
  "video-streaming"
)

echo -e "${BLUE}🚀 Creating individual template repos on Hugging Face${NC}"
echo "Organization: $ORG"
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

# Create temporary directory for template repos
TEMP_DIR="temp_template_repos"
rm -rf $TEMP_DIR
mkdir -p $TEMP_DIR

# Process each template
for template in "${TEMPLATES[@]}"; do
    echo -e "${YELLOW}Processing template: $template${NC}"

    # Create template directory
    TEMPLATE_DIR="$TEMP_DIR/$template"
    mkdir -p "$TEMPLATE_DIR"

    # Copy template files
    cp -r templates/$template/* "$TEMPLATE_DIR/" 2>/dev/null || true

    # Create package.json for standalone template
    cat > "$TEMPLATE_DIR/package.json" << EOF
{
  "name": "@hanzo/template-$template",
  "version": "1.0.0",
  "description": "Hanzo UI Template: $template",
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "@hanzo/ui": "latest",
    "lucide-react": "latest",
    "next": "14.0.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "clsx": "^2.0.0",
    "tailwind-merge": "^2.0.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "autoprefixer": "^10.4.16",
    "postcss": "^8.4.31",
    "tailwindcss": "^3.3.5",
    "typescript": "^5.2.2"
  }
}
EOF

    # Create next.config.js
    cat > "$TEMPLATE_DIR/next.config.js" << 'EOF'
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['api.placeholder.com'],
  },
}

module.exports = nextConfig
EOF

    # Create app directory structure
    mkdir -p "$TEMPLATE_DIR/app"

    # Move page.tsx to app directory
    mv "$TEMPLATE_DIR/page.tsx" "$TEMPLATE_DIR/app/page.tsx" 2>/dev/null || true

    # Create layout.tsx
    cat > "$TEMPLATE_DIR/app/layout.tsx" << 'EOF'
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Hanzo UI Template",
  description: "Built with @hanzo/ui components",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
EOF

    # Create globals.css
    cat > "$TEMPLATE_DIR/app/globals.css" << 'EOF'
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

    # Create tailwind.config.js
    cat > "$TEMPLATE_DIR/tailwind.config.js" << 'EOF'
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
EOF

    # Create postcss.config.js
    cat > "$TEMPLATE_DIR/postcss.config.js" << 'EOF'
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
EOF

    # Create tsconfig.json
    cat > "$TEMPLATE_DIR/tsconfig.json" << 'EOF'
{
  "compilerOptions": {
    "target": "es5",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
EOF

    # Create README.md for the template
    cat > "$TEMPLATE_DIR/README.md" << EOF
---
title: Hanzo UI - ${template//-/ }
emoji: 🎨
colorFrom: purple
colorTo: pink
sdk: docker
pinned: false
license: mit
app_port: 3000
---

# Hanzo UI Template: ${template//-/ }

This template is built exclusively with [@hanzo/ui](https://github.com/hanzoai/ui) components.

## 🚀 Quick Start

### Clone and Run Locally

\`\`\`bash
# Clone this template
git clone https://huggingface.co/spaces/$ORG/$template

# Install dependencies
cd $template
pnpm install

# Run development server
pnpm dev
\`\`\`

### Use as Template

\`\`\`bash
npx create-hanzo-app@latest my-app --template $template
\`\`\`

## 🎨 Features

- Built with @hanzo/ui components
- Next.js 14 with App Router
- TypeScript support
- Tailwind CSS styling
- Fully responsive design
- Dark mode ready

## 📚 Documentation

- [Gallery](https://huggingface.co/spaces/$ORG/gallery)
- [@hanzo/ui Docs](https://hanzo.ai/docs/ui)
- [Component Reference](https://github.com/hanzoai/ui)

## 🤝 Contributing

Feel free to fork this template and customize it for your needs!

## 📄 License

MIT License
EOF

    # Create Dockerfile
    cat > "$TEMPLATE_DIR/Dockerfile" << 'EOF'
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
    cat > "$TEMPLATE_DIR/.gitignore" << 'EOF'
# dependencies
/node_modules
/.pnp
.pnp.js

# testing
/coverage

# next.js
/.next/
/out/

# production
/build

# misc
.DS_Store
*.pem

# debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# local env files
.env*.local

# vercel
.vercel

# typescript
*.tsbuildinfo
next-env.d.ts
EOF

    echo -e "${GREEN}✓ Template files created for $template${NC}"

    # Push to Hugging Face
    echo "Pushing $template to HF..."

    cd "$TEMPLATE_DIR"

    # Initialize git repo
    git init
    git add .
    git commit -m "Initial commit: $template template"

    # Create and push to HF Space
    huggingface-cli repo create "$ORG/$template" --type space --space_sdk docker -y 2>/dev/null || true

    # Add remote and push
    git remote add hf "https://huggingface.co/spaces/$ORG/$template"
    git push hf main --force

    cd ../..

    echo -e "${GREEN}✅ Pushed $template to https://huggingface.co/spaces/$ORG/$template${NC}"
    echo ""
done

# Clean up
rm -rf $TEMP_DIR

echo -e "${BLUE}🎉 All templates have been pushed to Hugging Face!${NC}"
echo ""
echo "Templates are available at:"
for template in "${TEMPLATES[@]}"; do
    echo "  • https://huggingface.co/spaces/$ORG/$template"
done
echo ""
echo "Gallery: https://huggingface.co/spaces/$ORG/gallery"