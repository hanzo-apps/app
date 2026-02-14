export interface Template {
  id: string;
  name: string;
  description: string;
  category: "landing" | "saas" | "ecommerce" | "dashboard" | "ai" | "social" | "tool" | "game";
  thumbnail?: string;
  demoUrl?: string;
  features: string[];
  techStack: string[];
  difficulty: "beginner" | "intermediate" | "advanced";
  estimatedTime: string;
  popular?: boolean;
}

// Template definitions for the Hanzo gallery
export const templates: Template[] = [
  {
    id: "ai-chat-interface",
    name: "AI Chat Interface",
    description: "A modern chat interface with streaming responses, markdown support, and conversation history. Features real-time AI responses with typing indicators, code syntax highlighting, and a responsive design. Built with @hanzo/ui components for a polished, professional look.",
    category: "ai",
    demoUrl: "https://hanzo.ai/templates/ai-chat-interface",
    features: [
      "Streaming AI responses",
      "Markdown rendering",
      "Code syntax highlighting",
      "Conversation history",
      "Dark/light theme",
      "Export conversations"
    ],
    techStack: ["Next.js 14", "React 18", "@hanzo/ui", "Tailwind CSS", "OpenAI API"],
    difficulty: "intermediate",
    estimatedTime: "2-3 hours",
    popular: true
  },
  {
    id: "saas-landing",
    name: "SaaS Landing Page",
    description: "A high-converting SaaS landing page with pricing tiers, feature comparison, testimonials, and CTAs. Includes hero section with animated graphics, benefits grid, pricing calculator, and integration showcase. Optimized for conversions with A/B testing ready components.",
    category: "landing",
    demoUrl: "https://hanzo.ai/templates/saas-landing",
    features: [
      "Hero with animations",
      "Pricing table",
      "Feature comparison",
      "Testimonials carousel",
      "Newsletter signup",
      "SEO optimized"
    ],
    techStack: ["Next.js 14", "@hanzo/ui", "Framer Motion", "React Hook Form"],
    difficulty: "beginner",
    estimatedTime: "1-2 hours",
    popular: true
  },
  {
    id: "analytics-dashboard",
    name: "Analytics Dashboard",
    description: "A comprehensive analytics dashboard with real-time data visualization, charts, metrics cards, and filters. Features interactive charts using Recharts, date range selectors, export functionality, and responsive grid layouts. Perfect for data-driven applications.",
    category: "dashboard",
    demoUrl: "https://hanzo.ai/templates/analytics-dashboard",
    features: [
      "Real-time charts",
      "Metrics cards",
      "Data filters",
      "Export reports",
      "Responsive grid",
      "Dark mode"
    ],
    techStack: ["Next.js 14", "@hanzo/ui", "Recharts", "Tanstack Query", "Zustand"],
    difficulty: "intermediate",
    estimatedTime: "3-4 hours"
  },
  {
    id: "ecommerce-storefront",
    name: "E-commerce Storefront",
    description: "A full-featured e-commerce storefront with product catalog, shopping cart, checkout flow, and payment integration. Includes product search and filtering, image galleries, reviews system, and inventory management. Stripe integration ready.",
    category: "ecommerce",
    demoUrl: "https://hanzo.ai/templates/ecommerce-storefront",
    features: [
      "Product catalog",
      "Shopping cart",
      "Checkout flow",
      "Payment integration",
      "Search & filters",
      "User accounts"
    ],
    techStack: ["Next.js 14", "@hanzo/ui", "Stripe", "Prisma", "PostgreSQL"],
    difficulty: "advanced",
    estimatedTime: "4-5 hours",
    popular: true
  },
  {
    id: "social-feed",
    name: "Social Media Feed",
    description: "A Twitter/X-like social feed with posts, comments, likes, and real-time updates. Features infinite scroll, media uploads, user profiles, and notifications. Includes WebSocket integration for real-time updates.",
    category: "social",
    demoUrl: "https://hanzo.ai/templates/social-feed",
    features: [
      "Post creation",
      "Comments & likes",
      "Real-time updates",
      "User profiles",
      "Media uploads",
      "Notifications"
    ],
    techStack: ["Next.js 14", "@hanzo/ui", "Socket.io", "Uploadthing", "Clerk"],
    difficulty: "advanced",
    estimatedTime: "4-5 hours"
  },
  {
    id: "ai-image-generator",
    name: "AI Image Generator",
    description: "An AI-powered image generation tool with prompt engineering, style presets, and gallery. Features DALL-E or Stable Diffusion integration, prompt templates, image history, and download options. Includes rate limiting and usage tracking.",
    category: "ai",
    demoUrl: "https://hanzo.ai/templates/ai-image-generator",
    features: [
      "Text-to-image generation",
      "Style presets",
      "Prompt templates",
      "Image history",
      "Download & share",
      "Usage tracking"
    ],
    techStack: ["Next.js 14", "@hanzo/ui", "OpenAI DALL-E", "Cloudinary", "Redis"],
    difficulty: "intermediate",
    estimatedTime: "2-3 hours"
  },
  {
    id: "kanban-board",
    name: "Kanban Task Board",
    description: "A Trello-like kanban board with drag-and-drop, task management, and team collaboration. Features board creation, card details with comments, labels and due dates, and real-time collaboration. Perfect for project management tools.",
    category: "tool",
    demoUrl: "https://hanzo.ai/templates/kanban-board",
    features: [
      "Drag-and-drop cards",
      "Multiple boards",
      "Task details",
      "Labels & due dates",
      "Team collaboration",
      "Activity feed"
    ],
    techStack: ["Next.js 14", "@hanzo/ui", "@dnd-kit", "Prisma", "Pusher"],
    difficulty: "intermediate",
    estimatedTime: "3-4 hours"
  },
  {
    id: "video-streaming",
    name: "Video Streaming Platform",
    description: "A YouTube-like video streaming platform with upload, playback, and engagement features. Includes video player with quality selection, comments and likes, channel subscriptions, and recommendation algorithm. Uses HLS for adaptive streaming.",
    category: "social",
    demoUrl: "https://hanzo.ai/templates/video-streaming",
    features: [
      "Video upload & processing",
      "Adaptive streaming",
      "Comments & likes",
      "Channel subscriptions",
      "Recommendations",
      "Search & discovery"
    ],
    techStack: ["Next.js 14", "@hanzo/ui", "Video.js", "FFmpeg", "AWS S3"],
    difficulty: "advanced",
    estimatedTime: "5-6 hours"
  },
  {
    id: "markdown-editor",
    name: "Markdown Editor",
    description: "A powerful markdown editor with live preview, syntax highlighting, and export options. Features split-pane editing, custom toolbar, table editor, and diagram support with Mermaid. Includes file management and collaboration features.",
    category: "tool",
    demoUrl: "https://hanzo.ai/templates/markdown-editor",
    features: [
      "Live preview",
      "Syntax highlighting",
      "Custom toolbar",
      "Export to PDF/HTML",
      "File management",
      "Collaboration"
    ],
    techStack: ["Next.js 14", "@hanzo/ui", "Monaco Editor", "Remark", "Mermaid"],
    difficulty: "intermediate",
    estimatedTime: "2-3 hours"
  },
  {
    id: "crypto-portfolio",
    name: "Crypto Portfolio Tracker",
    description: "A cryptocurrency portfolio tracker with real-time prices, charts, and P&L tracking. Features portfolio analytics, price alerts, transaction history, and tax reporting. Integrates with major exchanges via APIs.",
    category: "dashboard",
    demoUrl: "https://hanzo.ai/templates/crypto-portfolio",
    features: [
      "Real-time prices",
      "Portfolio analytics",
      "Price alerts",
      "Transaction history",
      "Tax reporting",
      "Exchange integration"
    ],
    techStack: ["Next.js 14", "@hanzo/ui", "CoinGecko API", "Recharts", "WebSocket"],
    difficulty: "intermediate",
    estimatedTime: "3-4 hours"
  },
  {
    id: "blog-platform",
    name: "Blog Publishing Platform",
    description: "A Medium-like blog platform with writing tools, publications, and monetization. Features rich text editor, draft management, publication system, and reader engagement analytics. Includes SEO optimization and social sharing.",
    category: "social",
    demoUrl: "https://hanzo.ai/templates/blog-platform",
    features: [
      "Rich text editor",
      "Draft management",
      "Publications",
      "Reader analytics",
      "Monetization",
      "SEO tools"
    ],
    techStack: ["Next.js 14", "@hanzo/ui", "TipTap", "Prisma", "Algolia"],
    difficulty: "intermediate",
    estimatedTime: "3-4 hours"
  },
  {
    id: "multiplayer-game",
    name: "Multiplayer Game Lobby",
    description: "A real-time multiplayer game lobby with matchmaking, chat, and game rooms. Features player profiles, leaderboards, tournament system, and spectator mode. WebRTC for P2P connections and low latency gameplay.",
    category: "game",
    demoUrl: "https://hanzo.ai/templates/multiplayer-game",
    features: [
      "Matchmaking",
      "Game rooms",
      "Voice/text chat",
      "Leaderboards",
      "Tournaments",
      "Spectator mode"
    ],
    techStack: ["Next.js 14", "@hanzo/ui", "Socket.io", "WebRTC", "Redis"],
    difficulty: "advanced",
    estimatedTime: "5-6 hours"
  }
];

// Function to fetch template by ID
export async function fetchTemplate(templateId: string): Promise<Template | null> {
  try {
    return templates.find(t => t.id === templateId) || null;
  } catch (error) {
    console.error('Error fetching template:', error);
    return null;
  }
}

// Function to generate plan from template description
export function generatePlanFromTemplate(template: Template): string[] {
  const plan = [
    `🚀 Building: ${template.name}`,
    "",
    "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
    "PROJECT OVERVIEW",
    "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
    "",
    template.description,
    "",
    "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
    "FEATURES TO IMPLEMENT",
    "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
    "",
    ...template.features.map(f => `  ✓ ${f}`),
    "",
    "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
    "TECHNOLOGY STACK",
    "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
    "",
    ...template.techStack.map(t => `  • ${t}`),
    "",
    "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
    "BUILD PHASES",
    "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
    "",
    "Phase 1: Setup & Configuration",
    "  → Initialize Next.js project",
    "  → Install @hanzo/ui components",
    "  → Configure Tailwind CSS",
    "  → Set up project structure",
    "",
    "Phase 2: Core Components",
    "  → Create layout components",
    "  → Build reusable UI elements",
    "  → Implement navigation",
    "  → Add responsive design",
    "",
    "Phase 3: Features",
    ...template.features.slice(0, 3).map(f => `  → ${f}`),
    "",
    "Phase 4: Integration",
    "  → Connect APIs",
    "  → Add state management",
    "  → Implement data flow",
    "",
    "Phase 5: Polish",
    "  → Performance optimization",
    "  → Error handling",
    "  → Testing & debugging",
    "  → Deploy to production",
    "",
    `Estimated time: ${template.estimatedTime}`,
    `Difficulty: ${template.difficulty}`,
    "",
    "Ready to start! 🎯"
  ];

  return plan;
}

// Implementation comments that stream during building
export function generateImplementationComments(template: Template): string[] {
  return [
    "📦 Installing dependencies...",
    "  npm install @hanzo/ui tailwindcss framer-motion",
    "✅ Dependencies installed",
    "",
    "🏗️ Setting up project structure...",
    "  Creating /components directory",
    "  Creating /lib directory",
    "  Creating /hooks directory",
    "✅ Project structure ready",
    "",
    "🎨 Configuring @hanzo/ui components...",
    "  Importing Button, Card, Input components",
    "  Setting up dark theme variables",
    "  Configuring Tailwind CSS",
    "✅ UI components configured",
    "",
    "⚡ Building core features...",
    ...template.features.slice(0, 3).map(f => `  → Implementing ${f.toLowerCase()}`),
    "✅ Core features implemented",
    "",
    "🔧 Adding finishing touches...",
    "  Optimizing bundle size",
    "  Setting up error boundaries",
    "  Adding loading states",
    "✅ Application optimized",
    "",
    "🚀 Project ready!",
    "  Development server running on http://localhost:3000",
    "  Hot reload enabled",
    "  Ready for customization"
  ];
}