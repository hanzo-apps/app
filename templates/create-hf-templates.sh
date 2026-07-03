#!/bin/bash

# Script to create Hanzo templates on Hugging Face
# Each template uses @hanzo/ui components exclusively

echo "Creating Hanzo templates for Hugging Face..."

# Create base directory structure
mkdir -p hanzo-templates/{ai-chat-interface,saas-landing,analytics-dashboard,ecommerce-storefront,social-feed,kanban-board,markdown-editor,crypto-portfolio,blog-platform,video-streaming}

# Template 1: AI Chat Interface
cat > hanzo-templates/ai-chat-interface/README.md << 'EOF'
# AI Chat Interface Template

A modern chat interface built with @hanzo/ui components featuring streaming responses, markdown support, and conversation history.

## Features
- Streaming AI responses with typing indicators
- Markdown rendering with syntax highlighting
- Conversation history and search
- Dark/light theme support
- Export conversations

## Tech Stack
- Next.js 14
- @hanzo/ui components
- Tailwind CSS
- OpenAI/Anthropic integration

## Components Used
- Card, CardHeader, CardContent from @hanzo/ui
- Button, Input, TextArea from @hanzo/ui/primitives
- ScrollArea for message history
- Badge for status indicators
- Avatar for user profiles

## Quick Start
```bash
npx create-next-app@latest my-chat-app --use-pnpm
cd my-chat-app
pnpm add @hanzo/ui tailwindcss
```

## Preview
Built using the Hanzo UI design system with purple accent colors and dark theme by default.
EOF

# Template 2: SaaS Landing Page
cat > hanzo-templates/saas-landing/README.md << 'EOF'
# SaaS Landing Page Template

High-converting SaaS landing page using @hanzo/ui blocks and components.

## Features
- Hero section with ScreenfulBlock
- Pricing tiers using CardBlock
- Feature comparison grid
- Testimonials carousel
- Newsletter signup with CTABlock

## Tech Stack
- Next.js 14
- @hanzo/ui blocks system
- Framer Motion animations
- React Hook Form

## Components Used
- ScreenfulBlock for hero sections
- CardBlock for pricing and features
- CTABlock for call-to-actions
- EnhHeadingBlock for typography
- Button, Badge, Card components

## Layout Structure
```tsx
<ScreenfulBlock banner={heroVideo} contentColumns={[heading, cta]} />
<GridBlock items={features} />
<CardBlock variant="pricing" items={pricingTiers} />
<AccordionBlock items={faqs} />
<CTABlock variant="newsletter" />
```

## Quick Start
Based on the @hanzo/ui block system for rapid page building.
EOF

# Template 3: Analytics Dashboard
cat > hanzo-templates/analytics-dashboard/README.md << 'EOF'
# Analytics Dashboard Template

Comprehensive analytics dashboard based on @hanzo/ui dashboard example.

## Features
- Real-time metric cards
- Interactive charts
- Date range picker
- Responsive grid layout
- Export functionality

## Tech Stack
- Next.js 14
- @hanzo/ui dashboard components
- Recharts integration
- Tanstack Query

## Components Used
From `/app/app/(app)/examples/dashboard/`:
- MetricCard components
- Overview chart component
- RecentSales activity list
- TeamSwitcher navigation
- DateRangePicker

## Layout
```tsx
<DashboardLayout>
  <DashboardHeader />
  <Tabs defaultValue="overview">
    <TabsList />
    <TabsContent>
      <MetricCards />
      <Charts />
      <RecentActivity />
    </TabsContent>
  </Tabs>
</DashboardLayout>
```

Pre-built with responsive design and dark mode support.
EOF

# Template 4: E-commerce Storefront
cat > hanzo-templates/ecommerce-storefront/README.md << 'EOF'
# E-commerce Storefront Template

Full-featured e-commerce site using @hanzo/ui commerce components.

## Features
- Product catalog with ItemSelector
- Shopping cart with AddToCartWidget
- Checkout flow
- Payment integration
- Search and filters

## Tech Stack
- Next.js 14
- @hanzo/ui commerce package
- Stripe integration
- Prisma ORM

## Components Used
From `/pkg/commerce/`:
- AddToCartWidget
- Buy components
- Checkout flow
- ItemSelector for variants
- Cart management UI

## Product Display
```tsx
<Card>
  <CardContent>
    <AspectRatio ratio={1}>
      <img src={product.image} />
    </AspectRatio>
    <ItemSelector variants={product.variants} />
    <AddToCartWidget product={product} />
  </CardContent>
</Card>
```

Includes complete cart and checkout experience.
EOF

# Template 5: Social Feed
cat > hanzo-templates/social-feed/README.md << 'EOF'
# Social Media Feed Template

Twitter/X-like social feed built with @hanzo/ui components.

## Features
- Post creation and threading
- Comments and reactions
- Real-time updates
- User profiles with Avatar
- Media uploads

## Tech Stack
- Next.js 14
- @hanzo/ui primitives
- Socket.io for real-time
- Uploadthing for media

## Components Used
- Card for posts
- Avatar for user profiles
- Button for actions
- TextArea for post creation
- Badge for status
- ScrollArea for infinite scroll
- Dialog for post details

## Post Component
```tsx
<Card>
  <CardHeader>
    <div className="flex items-center gap-2">
      <Avatar />
      <div>
        <p className="font-semibold">{user.name}</p>
        <p className="text-sm text-muted">{timestamp}</p>
      </div>
    </div>
  </CardHeader>
  <CardContent>{post.content}</CardContent>
  <CardFooter>
    <Button variant="ghost" size="sm">Like</Button>
    <Button variant="ghost" size="sm">Comment</Button>
  </CardFooter>
</Card>
```
EOF

# Template 6: Kanban Board
cat > hanzo-templates/kanban-board/README.md << 'EOF'
# Kanban Task Board Template

Trello-like kanban board using @hanzo/ui with drag-and-drop.

## Features
- Drag-and-drop cards
- Multiple boards
- Task details dialog
- Labels and due dates
- Activity feed

## Tech Stack
- Next.js 14
- @hanzo/ui components
- @dnd-kit for drag-drop
- Prisma for data

## Components Used
- Card for task cards
- ScrollArea for columns
- Dialog for task details
- Badge for labels
- Button for actions
- Select for filters

## Board Structure
```tsx
<div className="flex gap-4 overflow-x-auto">
  {columns.map(column => (
    <div className="w-80">
      <Card>
        <CardHeader>{column.title}</CardHeader>
        <ScrollArea>
          <CardContent>
            {column.tasks.map(task => (
              <TaskCard task={task} />
            ))}
          </CardContent>
        </ScrollArea>
      </Card>
    </div>
  ))}
</div>
```

Includes task management and collaboration features.
EOF

# Template 7: Markdown Editor
cat > hanzo-templates/markdown-editor/README.md << 'EOF'
# Markdown Editor Template

Powerful markdown editor built with @hanzo/ui components.

## Features
- Live preview
- Syntax highlighting
- Custom toolbar
- Export options
- File management

## Tech Stack
- Next.js 14
- @hanzo/ui primitives
- Monaco Editor
- Remark/Rehype

## Components Used
- ResizablePanelGroup for split view
- Toolbar with Button groups
- TextArea for input
- Card for preview
- Select for export options

## Editor Layout
```tsx
<ResizablePanelGroup direction="horizontal">
  <ResizablePanel>
    <Toolbar />
    <TextArea className="font-mono" />
  </ResizablePanel>
  <ResizableHandle />
  <ResizablePanel>
    <Card>
      <CardContent>
        <MarkdownPreview content={markdown} />
      </CardContent>
    </Card>
  </ResizablePanel>
</ResizablePanelGroup>
```

Based on the playground example structure.
EOF

# Template 8: Crypto Portfolio
cat > hanzo-templates/crypto-portfolio/README.md << 'EOF'
# Crypto Portfolio Tracker Template

Cryptocurrency portfolio dashboard using @hanzo/ui dashboard components.

## Features
- Real-time price updates
- Portfolio analytics
- Price alerts
- Transaction history
- Tax reporting

## Tech Stack
- Next.js 14
- @hanzo/ui dashboard
- CoinGecko API
- Recharts

## Components Used
From dashboard example:
- MetricCard for portfolio value
- Overview chart for history
- DataTable for holdings
- Badge for price changes
- Progress for allocations

## Dashboard Layout
```tsx
<DashboardLayout>
  <MetricCards>
    <MetricCard title="Portfolio Value" value="$125,231" change="+12.5%" />
    <MetricCard title="24h Change" value="+$2,451" change="+2.1%" />
  </MetricCards>
  <Tabs>
    <TabsContent value="portfolio">
      <DataTable columns={coinColumns} data={holdings} />
    </TabsContent>
    <TabsContent value="charts">
      <Overview data={priceHistory} />
    </TabsContent>
  </Tabs>
</DashboardLayout>
```
EOF

# Template 9: Blog Platform
cat > hanzo-templates/blog-platform/README.md << 'EOF'
# Blog Publishing Platform Template

Medium-like blog platform using @hanzo/ui components.

## Features
- Rich text editor
- Draft management
- Publications
- Reader analytics
- SEO tools

## Tech Stack
- Next.js 14
- @hanzo/ui forms
- TipTap editor
- Prisma

## Components Used
From forms example:
- Form components for post editor
- Card for article cards
- Avatar for author profiles
- Badge for categories
- Tabs for navigation

## Article Layout
```tsx
<article>
  <ScreenfulBlock
    banner={featuredImage}
    contentColumns={[
      <EnhHeadingBlock title={article.title} />,
      <div className="flex items-center gap-4">
        <Avatar />
        <div>
          <p>{author.name}</p>
          <p className="text-sm text-muted">{publishDate}</p>
        </div>
      </div>
    ]}
  />
  <CardBlock>
    <ApplyTypography>
      {article.content}
    </ApplyTypography>
  </CardBlock>
</article>
```
EOF

# Template 10: Video Streaming
cat > hanzo-templates/video-streaming/README.md << 'EOF'
# Video Streaming Platform Template

YouTube-like platform using @hanzo/ui media components.

## Features
- Video player with controls
- Adaptive streaming
- Comments section
- Channel subscriptions
- Recommendations

## Tech Stack
- Next.js 14
- @hanzo/ui media blocks
- Video.js player
- AWS S3

## Components Used
- VideoBlock for player
- Card for video thumbnails
- ScrollArea for comments
- Avatar for channels
- Button for interactions

## Video Page Layout
```tsx
<div className="grid grid-cols-12 gap-6">
  <div className="col-span-8">
    <VideoBlock src={video.url} aspectRatio={16/9} />
    <Card>
      <CardHeader>
        <CardTitle>{video.title}</CardTitle>
        <div className="flex justify-between">
          <div className="flex items-center gap-2">
            <Avatar />
            <div>
              <p>{channel.name}</p>
              <p className="text-sm">{subscribers} subscribers</p>
            </div>
            <Button>Subscribe</Button>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost">Like</Button>
            <Button variant="ghost">Share</Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ApplyTypography>{video.description}</ApplyTypography>
      </CardContent>
    </Card>
    <CommentsSection videoId={video.id} />
  </div>
  <div className="col-span-4">
    <RecommendedVideos />
  </div>
</div>
```
EOF

echo "Templates created successfully!"
echo "Next steps:"
echo "1. Upload to huggingface.co/spaces/hanzoai/templates"
echo "2. Each template can be forked/cloned by users"
echo "3. All use @hanzo/ui components exclusively"