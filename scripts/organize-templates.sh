#!/bin/bash

# Organize all templates into ~/work/hanzo/templates as complete repos
# Each template will be ready to edit on Hanzo.App

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Target directory
TARGET_DIR="$HOME/work/hanzo/templates"
SOURCE_DIR="$(pwd)/templates"
COMPONENTS_DIR="$(pwd)/components/ui"

# Template information
declare -a TEMPLATES=(
    "ai-chat-interface:Modern chat UI with streaming responses:violet"
    "ecommerce-storefront:Complete online store with cart:orange"
    "analytics-dashboard:Data visualization dashboard:indigo"
    "saas-landing:High-converting landing page:emerald"
    "social-feed:Twitter/X-like social feed:cyan"
    "kanban-board:Trello-like task board:amber"
    "markdown-editor:Live markdown editor:blue"
    "crypto-portfolio:Cryptocurrency tracker:yellow"
    "blog-platform:Medium-like blog platform:rose"
    "video-streaming:YouTube-like video platform:red"
)

echo -e "${CYAN}🚀 Organizing Hanzo UI Templates${NC}"
echo -e "${BLUE}Target: $TARGET_DIR${NC}"
echo ""

# Create target directory if it doesn't exist
mkdir -p "$TARGET_DIR"

# Process each template
for template_info in "${TEMPLATES[@]}"; do
    IFS=':' read -r template description color <<< "$template_info"

    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${CYAN}📦 Setting up: $template${NC}"
    echo -e "${BLUE}   $description${NC}"
    echo ""

    TEMPLATE_DIR="$TARGET_DIR/$template"

    # Remove existing if present
    rm -rf "$TEMPLATE_DIR"
    mkdir -p "$TEMPLATE_DIR"

    # Create standard Next.js/React project structure
    mkdir -p "$TEMPLATE_DIR"/{src,components/ui,lib,public,app}

    # Copy and fix the template component
    if [ -f "$SOURCE_DIR/$template/page.tsx" ]; then
        # Fix imports and copy to src/App.tsx for standalone use
        sed 's|@hanzo/ui/primitives|@/components/ui|g' \
            "$SOURCE_DIR/$template/page.tsx" | \
        sed 's|@hanzo/ui/util|@/lib/utils|g' > "$TEMPLATE_DIR/src/App.tsx"

        # Also copy as app/page.tsx for Next.js
        cp "$TEMPLATE_DIR/src/App.tsx" "$TEMPLATE_DIR/app/page.tsx"
    fi

    # Copy necessary UI components
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
        if [ -f "$COMPONENTS_DIR/$comp.tsx" ]; then
            cp "$COMPONENTS_DIR/$comp.tsx" "$TEMPLATE_DIR/components/ui/" 2>/dev/null || true
        fi
    done

    # Create utility functions
    cat > "$TEMPLATE_DIR/lib/utils.ts" << 'EOF'
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
EOF

    # Create package.json
    cat > "$TEMPLATE_DIR/package.json" << EOF
{
  "name": "@hanzo/template-$template",
  "version": "1.0.0",
  "description": "$description",
  "repository": {
    "type": "git",
    "url": "https://github.com/hanzoai/template-$template"
  },
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "preview": "vite preview"
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
    "typescript": "^5",
    "vite": "^5.0.0"
  }
}
EOF

    # Create README.md with Hanzo.App edit link
    TITLE=$(echo "$template" | sed 's/-/ /g' | awk '{for(i=1;i<=NF;i++) $i=toupper(substr($i,1,1)) substr($i,2)}1')

    cat > "$TEMPLATE_DIR/README.md" << EOF
# $TITLE

$description

Built with [@hanzo/ui](https://github.com/hanzoai/ui) components - a modern React component library based on Radix UI and Tailwind CSS.

## 🚀 Quick Start

### Edit on Hanzo.App

[![Edit on Hanzo.App](https://img.shields.io/badge/Edit%20on-Hanzo.App-purple?style=for-the-badge&logo=react)](https://hanzo.app/edit/github/hanzoai/template-$template)

Click the button above to instantly edit this template in Hanzo.App's cloud IDE.

### Local Development

\`\`\`bash
# Clone this template
git clone https://github.com/hanzoai/template-$template.git
cd $template

# Install dependencies
npm install
# or
pnpm install

# Start development server
npm run dev
# or
pnpm dev

# Open http://localhost:3000
\`\`\`

### Deploy to Production

#### Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/hanzoai/template-$template)

#### Deploy to Hugging Face

\`\`\`bash
# Clone and push to HF Spaces
git clone https://github.com/hanzoai/template-$template.git
cd $template
git remote add hf https://huggingface.co/spaces/YOUR_USERNAME/$template
git push hf main
\`\`\`

## 🎨 Features

- **Modern Design**: Clean, responsive UI with $color theme
- **Dark Mode**: Built-in dark mode support
- **TypeScript**: Full type safety
- **Tailwind CSS**: Utility-first styling
- **Component Library**: Built with @hanzo/ui components
- **Production Ready**: Optimized for performance

## 📦 What's Included

- Next.js 14 with App Router
- React 18 with Server Components
- TypeScript configuration
- Tailwind CSS with custom theme
- ESLint and Prettier configs
- @hanzo/ui component library
- Lucide React icons

## 🛠️ Customization

### Theme Colors

Edit \`tailwind.config.js\` to customize the color scheme:

\`\`\`js
theme: {
  extend: {
    colors: {
      primary: {
        DEFAULT: "hsl(var(--primary))",
        foreground: "hsl(var(--primary-foreground))",
      },
      // Add your custom colors
    }
  }
}
\`\`\`

### Components

All UI components are in \`components/ui/\`. They're built with:
- Radix UI primitives for accessibility
- Tailwind CSS for styling
- Full TypeScript support

## 📚 Documentation

- [Hanzo.App Documentation](https://hanzo.app/docs)
- [@hanzo/ui Components](https://github.com/hanzoai/ui)
- [Template Gallery](https://huggingface.co/spaces/hanzo-community/gallery)

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

---

Built with ❤️ by [Hanzo AI](https://hanzo.ai)
EOF

    # Create app/layout.tsx
    cat > "$TEMPLATE_DIR/app/layout.tsx" << EOF
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "$TITLE - Hanzo UI Template",
  description: "$description",
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

    # Create app/globals.css
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

* {
  @apply border-border;
}

body {
  @apply bg-background text-foreground;
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

    # Create LICENSE
    cat > "$TEMPLATE_DIR/LICENSE" << EOF
MIT License

Copyright (c) 2024 Hanzo AI

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
EOF

    # Initialize git repository
    cd "$TEMPLATE_DIR"
    git init -q
    git add .
    git commit -q -m "Initial commit: $TITLE template"

    cd - > /dev/null

    echo -e "  ${GREEN}✅ Template ready at: $TEMPLATE_DIR${NC}"
    echo -e "  ${BLUE}📝 Edit on Hanzo.App: https://hanzo.app/edit/github/hanzoai/template-$template${NC}"
    echo ""
done

echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}🎉 All templates organized in: $TARGET_DIR${NC}"
echo ""
echo -e "${CYAN}📦 Templates created:${NC}"
for template_info in "${TEMPLATES[@]}"; do
    IFS=':' read -r template description color <<< "$template_info"
    echo -e "  ${BLUE}•${NC} $TARGET_DIR/$template"
done
echo ""
echo -e "${YELLOW}Each template is a complete repo with:${NC}"
echo "  • README with Hanzo.App edit link"
echo "  • Full Next.js/React setup"
echo "  • All necessary components"
echo "  • Ready to push to GitHub/HF"
echo ""
echo -e "${GREEN}Next steps:${NC}"
echo "  1. Push each template to GitHub"
echo "  2. Templates can be edited on https://hanzo.app"
echo "  3. Deploy to Vercel/HF Spaces"