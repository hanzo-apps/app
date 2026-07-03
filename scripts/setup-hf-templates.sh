#!/bin/bash

# Setup and push all templates to Hugging Face as standalone Next.js apps
# Usage: ./scripts/setup-hf-templates.sh

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# HF organization name
ORG="hanzo-community"

# Template list
TEMPLATES=(
    "ai-chat-interface:Modern chat UI with streaming responses"
    "ecommerce-storefront:Complete online store with cart"
    "analytics-dashboard:Data visualization dashboard"
    "saas-landing:High-converting landing page"
    "social-feed:Twitter/X-like social feed"
    "kanban-board:Trello-like task board"
    "markdown-editor:Live markdown editor"
    "crypto-portfolio:Cryptocurrency tracker"
    "blog-platform:Medium-like blog platform"
    "video-streaming:YouTube-like video platform"
)

echo -e "${CYAN}🚀 Setting up Hanzo UI Templates for Hugging Face${NC}"
echo -e "${BLUE}Organization: $ORG${NC}"
echo ""

# Check prerequisites
if ! command -v huggingface-cli &> /dev/null; then
    echo -e "${RED}❌ huggingface-cli is not installed${NC}"
    echo "Install it with: pip install huggingface-hub"
    exit 1
fi

if ! huggingface-cli whoami &> /dev/null; then
    echo -e "${YELLOW}⚠️  Not logged in to Hugging Face${NC}"
    echo "Run: huggingface-cli login"
    exit 1
fi

echo -e "${GREEN}✓ Prerequisites checked${NC}"
echo ""

# Create build directory
BUILD_DIR="hf-templates"
rm -rf $BUILD_DIR
mkdir -p $BUILD_DIR

# Create shared components directory
SHARED_COMPONENTS="$BUILD_DIR/_shared"
mkdir -p "$SHARED_COMPONENTS/components/ui"
mkdir -p "$SHARED_COMPONENTS/lib"

echo -e "${BLUE}📦 Preparing shared components...${NC}"

# Copy UI components we need
COMPONENTS_NEEDED=(
    "card"
    "button"
    "badge"
    "avatar"
    "input"
    "tabs"
    "select"
    "dialog"
    "progress"
    "scroll-area"
    "textarea"
    "separator"
    "aspect-ratio"
)

for comp in "${COMPONENTS_NEEDED[@]}"; do
    if [ -f "components/ui/$comp.tsx" ]; then
        cp "components/ui/$comp.tsx" "$SHARED_COMPONENTS/components/ui/"
        echo -e "  ${GREEN}✓${NC} Copied $comp component"
    fi
done

# Copy utility functions
cat > "$SHARED_COMPONENTS/lib/utils.ts" << 'EOF'
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
EOF

echo -e "${GREEN}✓ Shared components prepared${NC}"
echo ""

# Process each template
for template_entry in "${TEMPLATES[@]}"; do
    template="${template_entry%%:*}"
    description="${template_entry#*:}"

    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${CYAN}📝 Processing: $template${NC}"
    echo -e "${BLUE}   $description${NC}"
    echo ""

    TEMPLATE_DIR="$BUILD_DIR/$template"
    mkdir -p "$TEMPLATE_DIR"

    # Copy shared components
    cp -r "$SHARED_COMPONENTS/"* "$TEMPLATE_DIR/"

    # Create app directory structure
    mkdir -p "$TEMPLATE_DIR/app"
    mkdir -p "$TEMPLATE_DIR/public"

    # Fix template imports and copy to app/page.tsx
    echo "  Fixing imports and copying template..."

    # Copy and fix the template file
    sed 's|@hanzo/ui/primitives|@/components/ui|g' \
        "templates/$template/page.tsx" | \
    sed 's|@hanzo/ui/util|@/lib/utils|g' > "$TEMPLATE_DIR/app/page.tsx"

    # Create layout.tsx
    cat > "$TEMPLATE_DIR/app/layout.tsx" << 'EOF'
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "TEMPLATE_TITLE",
  description: "TEMPLATE_DESC",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>{children}</body>
    </html>
  );
}
EOF

    # Replace template metadata
    TITLE=$(echo "$template" | sed 's/-/ /g' | sed 's/\b\(.\)/\u\1/g')
    sed -i '' "s|TEMPLATE_TITLE|Hanzo UI - $TITLE|g" "$TEMPLATE_DIR/app/layout.tsx"
    sed -i '' "s|TEMPLATE_DESC|$description|g" "$TEMPLATE_DIR/app/layout.tsx"

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

/* Custom animations */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.animate-fadeIn {
  animation: fadeIn 0.5s ease-in-out;
}
EOF

    # Create package.json
    cat > "$TEMPLATE_DIR/package.json" << EOF
{
  "name": "@hanzo/template-$template",
  "version": "1.0.0",
  "description": "${TEMPLATES[$template]}",
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "next": "14.2.5",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "lucide-react": "^0.400.0",
    "clsx": "^2.1.1",
    "tailwind-merge": "^2.3.0",
    "class-variance-authority": "^0.7.0",
    "@radix-ui/react-accordion": "^1.1.2",
    "@radix-ui/react-alert-dialog": "^1.0.5",
    "@radix-ui/react-aspect-ratio": "^1.0.3",
    "@radix-ui/react-avatar": "^1.0.4",
    "@radix-ui/react-checkbox": "^1.0.4",
    "@radix-ui/react-collapsible": "^1.0.3",
    "@radix-ui/react-dialog": "^1.0.5",
    "@radix-ui/react-dropdown-menu": "^2.0.6",
    "@radix-ui/react-label": "^2.0.2",
    "@radix-ui/react-popover": "^1.0.7",
    "@radix-ui/react-progress": "^1.0.3",
    "@radix-ui/react-scroll-area": "^1.0.5",
    "@radix-ui/react-select": "^2.0.0",
    "@radix-ui/react-separator": "^1.0.3",
    "@radix-ui/react-slot": "^1.0.2",
    "@radix-ui/react-switch": "^1.0.3",
    "@radix-ui/react-tabs": "^1.0.4",
    "@radix-ui/react-toast": "^1.1.5",
    "@radix-ui/react-toggle": "^1.0.3",
    "@radix-ui/react-toggle-group": "^1.0.4",
    "@radix-ui/react-tooltip": "^1.0.7"
  },
  "devDependencies": {
    "@types/node": "^20",
    "@types/react": "^18",
    "@types/react-dom": "^18",
    "autoprefixer": "^10.4.19",
    "eslint": "^8",
    "eslint-config-next": "14.2.5",
    "postcss": "^8.4.39",
    "tailwindcss": "^3.4.4",
    "typescript": "^5"
  }
}
EOF

    # Create next.config.js
    cat > "$TEMPLATE_DIR/next.config.js" << 'EOF'
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: {
    domains: ['api.placeholder.com'],
  },
}

module.exports = nextConfig
EOF

    # Create tailwind.config.js
    cat > "$TEMPLATE_DIR/tailwind.config.js" << 'EOF'
/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: 0 },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: 0 },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
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
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
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

    # Create README.md for HF
    cat > "$TEMPLATE_DIR/README.md" << EOF
---
title: Hanzo UI - $TITLE
emoji: 🎨
colorFrom: purple
colorTo: pink
sdk: docker
pinned: false
license: mit
app_port: 3000
---

# $TITLE Template

$description

Built with Hanzo UI components - a modern React component library.

## 🚀 Quick Start

### Run Locally

\`\`\`bash
# Clone this Space
git clone https://huggingface.co/spaces/$ORG/$template
cd $template

# Install dependencies
npm install

# Run development server
npm run dev
\`\`\`

### Fork on Hugging Face

Click the "Duplicate this Space" button above to create your own copy.

### Use as Template

\`\`\`bash
npx create-hanzo-app@latest my-app --template $template
\`\`\`

## 🎨 Features

- Modern, responsive design
- Built with Next.js 14
- TypeScript support
- Tailwind CSS styling
- Dark mode ready
- Production optimized

## 📚 Resources

- [View Gallery](https://huggingface.co/spaces/$ORG/gallery)
- [Hanzo UI Docs](https://hanzo.ai/docs)
- [Component Library](https://github.com/hanzoai/ui)

## 📄 License

MIT License - Free to use in your projects!
EOF

    # Create Dockerfile
    cat > "$TEMPLATE_DIR/Dockerfile" << 'EOF'
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build the application
RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000

CMD ["node", "server.js"]
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

    echo -e "  ${GREEN}✓${NC} Template files created"

    # Initialize git and push to HF
    cd "$TEMPLATE_DIR"

    # Initialize git repo
    git init -q
    git add .
    git commit -q -m "Initial commit: $template template"

    echo "  Pushing to Hugging Face..."

    # Create HF repo using new CLI format
    huggingface-cli repo create "$ORG/$template" --repo-type space --space-sdk docker 2>/dev/null || true

    # Configure git for HF
    git remote add origin "https://huggingface.co/spaces/$ORG/$template" 2>/dev/null || \
        git remote set-url origin "https://huggingface.co/spaces/$ORG/$template"

    # Push to HF (force push to overwrite if exists)
    git push -f origin main || echo "  ⚠️  Push failed - may need manual intervention"

    cd - > /dev/null

    echo -e "  ${GREEN}✅ Pushed to https://huggingface.co/spaces/$ORG/$template${NC}"
    echo ""
done

# Clean up
rm -rf "$SHARED_COMPONENTS"

echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}🎉 All templates have been pushed to Hugging Face!${NC}"
echo ""
echo -e "${CYAN}📦 Templates are available at:${NC}"
for template_entry in "${TEMPLATES[@]}"; do
    template="${template_entry%%:*}"
    echo -e "  ${BLUE}•${NC} https://huggingface.co/spaces/$ORG/$template"
done
echo ""
echo -e "${CYAN}🎨 Gallery:${NC} https://huggingface.co/spaces/$ORG/gallery"
echo ""
echo -e "${YELLOW}Note: Spaces may take a few minutes to build and deploy.${NC}"