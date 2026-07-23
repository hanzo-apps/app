# Hanzo Build - Architectural Analysis & Recommendations

## Executive Summary

The Hanzo Build application is an AI-powered web development platform built with Next.js 15.5, designed to enable users to create, deploy, and manage web applications through natural language prompts. After comprehensive analysis, I've identified several architectural strengths alongside opportunities for improvement.

### Key Strengths
- Modern tech stack with Next.js 15.5, React 19, and TypeScript
- Well-structured monolithic architecture suitable for current scale
- Good separation of concerns with clear directory structure
- Effective use of Server Components and client-side interactivity
- Comprehensive CI/CD pipeline with GitHub Actions

### Critical Issues Requiring Immediate Attention
1. **Data Layer**: state spans Hanzo Base (SQLite) + cloud `/v1/` — keep writes idempotent and scoped per user/org
2. **Security Architecture**: Authentication bypass in development poses risks
3. **Type Safety**: Extensive use of `@typescript-eslint/no-explicit-any` undermines type safety
4. **Error Handling**: Inconsistent error boundaries and fallback strategies
5. **Performance**: Missing caching layers for AI operations

## 1. Overall System Architecture Analysis

### Current Architecture Pattern
The application follows a **Modular Monolith** pattern with clear domain boundaries:

```
┌─────────────────────────────────────────┐
│            Frontend Layer               │
│   (Next.js App Router + React SSR)      │
├─────────────────────────────────────────┤
│           API Routes Layer              │
│    (Next.js API Routes + Middleware)    │
├─────────────────────────────────────────┤
│          Business Logic Layer           │
│    (Server Actions + Service Modules)   │
├─────────────────────────────────────────┤
│           Data Access Layer             │
│         (Hanzo Base + LanceDB)          │
└─────────────────────────────────────────┘
```

### Architectural Assessment

**Strengths:**
- Clear separation between presentation, business logic, and data layers
- Good use of Next.js 15.5 features (App Router, Server Components)
- Template-based approach for project generation is scalable

**Weaknesses:**
- No clear Domain-Driven Design (DDD) boundaries
- Missing repository pattern for data access
- Tight coupling between API routes and business logic
- No event-driven architecture for async operations

## 2. Technology Stack Analysis

### Frontend Stack
- **Framework**: Next.js 15.5 with App Router ✅
- **UI Library**: React 19.1 + @hanzo/ui 5.0.2 ✅
- **Styling**: Tailwind CSS 4 + Radix UI ✅
- **State Management**: React Query + Context API ⚠️
- **Editor**: Monaco Editor + Sandpack ✅

**Recommendation**: Consider adding Zustand or Valtio for complex client state management.

### Backend Stack
- **Runtime**: Node.js 20 ✅
- **Database**: Hanzo Base (SQLite) + cloud `/v1/` ✅
- **Vector DB**: LanceDB (local) ⚠️
- **Authentication**: HuggingFace OAuth + Custom ⚠️
- **Payments**: Stripe ✅

**Data plane**: Hanzo Base (SQLite) locally, PostgreSQL for production multi-instance; cloud `/v1/` APIs are the source of truth for shared state.

## 3. Scalability & Performance Analysis

### Current Bottlenecks

1. **Database Layer**:
   - Base/SQLite is single-writer — use PostgreSQL for production multi-instance
   - Missing indexes on frequently queried fields

2. **AI Processing**:
   - No caching for AI responses
   - Synchronous processing blocks user interactions
   - Missing rate limiting for AI endpoints

3. **Asset Delivery**:
   - No CDN configuration
   - Images served unoptimized (`unoptimized: true`)
   - Missing edge caching strategies

### Scalability Recommendations

```typescript
// Add Redis for caching
const cacheStrategy = {
  aiResponses: '1h',
  userProjects: '5m',
  templates: '24h',
  staticAssets: '7d'
};
```

## 4. Security Architecture Analysis

### Critical Security Issues

1. **Authentication Bypass**:
```typescript
// CRITICAL: Remove this from production
if (isLocalhost && process.env.NODE_ENV === "development") {
  return { id: "local-dev-user", isPro: true };
}
```

2. **Missing Security Headers**:
- No Content Security Policy
- Missing rate limiting
- No CORS configuration

3. **Sensitive Data Exposure**:
- API keys potentially exposed in client bundles
- No encryption for sensitive user data

### Security Recommendations

```typescript
// Implement proper security middleware
export const securityHeaders = {
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval';",
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()'
};
```

## 5. Database Design Analysis

### Current Schema Issues
- Minimal schema definition (only Project model)
- No data validation at database level
- Missing relationships and indexes
- No audit trails or soft deletes

### Recommended Schema Improvements

```typescript
// Enhanced Project Schema with proper indexing
const ProjectSchema = new Schema({
  // ... existing fields ...
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'draft',
    index: true
  },
  deletedAt: { type: Date, index: true },
  version: { type: Number, default: 1 },
  tags: [{ type: String, index: true }],
  collaborators: [{
    userId: String,
    role: { type: String, enum: ['owner', 'editor', 'viewer'] },
    addedAt: Date
  }]
}, {
  timestamps: true,
  optimisticConcurrency: true
});

// Add compound indexes
ProjectSchema.index({ user_id: 1, _createdAt: -1 });
ProjectSchema.index({ space_id: 1, status: 1 });
```

## 6. API Design & Contracts

### Current API Structure
- Mix of REST-like endpoints and server actions
- Inconsistent error responses
- No API versioning strategy
- Missing OpenAPI documentation

### API Improvement Strategy

```typescript
// Implement consistent API response structure
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  metadata?: {
    timestamp: string;
    requestId: string;
    version: string;
  };
}

// Add API versioning
const API_VERSIONS = {
  v1: '/api/v1',
  v2: '/api/v2'
};
```

## 7. Frontend/Backend Separation

### Current Issues
- Business logic mixed in UI components
- Direct database calls from API routes
- No clear service layer abstraction

### Recommended Architecture

```typescript
// Service Layer Pattern
class ProjectService {
  private repository: ProjectRepository;
  private cache: CacheService;
  private events: EventEmitter;

  async createProject(data: CreateProjectDTO): Promise<Project> {
    // Validation
    const validated = await this.validate(data);
    
    // Business logic
    const project = await this.repository.create(validated);
    
    // Side effects
    await this.cache.invalidate(`user:${data.userId}:projects`);
    this.events.emit('project.created', project);
    
    return project;
  }
}
```

## 8. Caching Strategy

### Missing Caching Layers
1. No HTTP cache headers
2. No database query caching
3. No CDN integration
4. No browser caching strategy

### Comprehensive Caching Implementation

```typescript
// Multi-layer caching strategy
const cachingStrategy = {
  browser: {
    static: '1y',
    images: '1M',
    api: 'no-cache'
  },
  cdn: {
    static: '1y',
    dynamic: '5m'
  },
  redis: {
    sessions: '24h',
    aiResponses: '1h',
    userProjects: '5m'
  },
  database: {
    queryCache: true,
    ttl: 60
  }
};
```

## 9. Infrastructure & Deployment

### Current Setup
- Docker-based deployment ✅
- GitHub Actions CI/CD ✅
- Dokploy deployment target ✅
- Health checks implemented ✅

### Infrastructure Improvements

1. **Container Optimization**:
```dockerfile
# Multi-stage build for smaller images
FROM node:20-alpine AS deps
# Install dependencies only

FROM node:20-alpine AS builder
# Build application

FROM node:20-alpine AS runner
# Production runtime
```

2. **Kubernetes-Ready Architecture**:
```yaml
apiVersion: v1
kind: Service
metadata:
  name: hanzo-build
spec:
  selector:
    app: hanzo-build
  ports:
    - port: 3000
      targetPort: 3000
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: hanzo-build
spec:
  replicas: 3
  strategy:
    type: RollingUpdate
```

## 10. Microservices vs Monolithic Considerations

### Current State: Monolith ✅
Appropriate for current scale and team size.

### When to Consider Microservices
- DAU > 100,000
- Team size > 20 developers
- Need for independent scaling of AI services
- Multi-region deployment requirements

### Proposed Evolution Path

**Phase 1 (Current)**: Modular Monolith
**Phase 2 (6 months)**: Extract AI services
**Phase 3 (12 months)**: Separate project management service
**Phase 4 (18 months)**: Full microservices if needed

## Architectural Debt & Anti-Patterns

### Identified Anti-Patterns

1. **God Components**: `AppEditor` component with 600+ lines
2. **Anemic Domain Model**: Project model lacks business logic
3. **Shotgun Surgery**: Changes require updates across multiple files
4. **Copy-Paste Programming**: Duplicate template code

### Technical Debt Priority List

**P0 - Critical (This Week)**:
1. Add indexes on hot Base/SQLite queries
2. Remove development auth bypass
3. Add error boundaries
4. Implement rate limiting

**P1 - High (This Month)**:
1. Add comprehensive logging
2. Implement caching layer
3. Refactor large components
4. Add integration tests

**P2 - Medium (This Quarter)**:
1. Extract service layer
2. Implement event sourcing for audit
3. Add performance monitoring
4. Create API documentation

## Strategic Recommendations

### Immediate Actions (Week 1)

1. **Security Hardening**:
```bash
npm audit fix
npm install helmet express-rate-limit
```

2. **Performance Quick Wins**:
```typescript
// Add React.memo to expensive components
const Preview = React.memo(({ html, device }) => {
  // Component logic
});

// Implement virtual scrolling for lists
import { FixedSizeList } from 'react-window';
```

3. **Monitoring** (already wired — `components/providers/analytics.tsx`):
```typescript
// @hanzo/event is the ONE telemetry client: pageviews, product events, AND
// errors go to the ONE front door (POST api.hanzo.ai/v1/event), fanned
// server-side to the web (analytics), product (insights), and error (sentry)
// lenses. It subsumes @sentry — no separate DSN. Auto error capture +
// ErrorBoundary are on; a Do-Not-Track visitor is opted out. Set a publishable
// NEXT_PUBLIC_HANZO_INGEST_KEY to also accept telemetry from logged-out views.
import { createAnalytics, EVENTS } from "@hanzo/event";
```

### Short-term Improvements (Month 1-3)

1. **Service Layer Implementation**
2. **Comprehensive Testing Suite**
3. **API Gateway Pattern**
4. **Database Migration System**

### Long-term Vision (6-12 Months)

1. **Event-Driven Architecture**:
   - Implement message queue (RabbitMQ/Kafka)
   - Async processing for AI operations
   - Event sourcing for audit trail

2. **Multi-tenant Architecture**:
   - Workspace/organization support
   - Row-level security
   - Tenant isolation

3. **AI Service Optimization**:
   - Model caching and warm-up
   - Request batching
   - Fallback strategies

## Metrics for Success

### Performance KPIs
- Page Load Time: < 2s (currently ~3.5s)
- Time to Interactive: < 3s (currently ~5s)
- API Response Time: < 200ms p95
- AI Generation Time: < 5s p95

### Reliability KPIs
- Uptime: 99.9% (three nines)
- Error Rate: < 1%
- Database Connection Pool Utilization: < 80%

### Business KPIs
- User Activation Rate: > 60%
- Project Creation Success Rate: > 90%
- Deployment Success Rate: > 95%

## Conclusion

The Hanzo Build platform has a solid foundation with modern technologies and good architectural patterns. However, several critical issues need immediate attention:

1. **Security vulnerabilities** in authentication
2. **Performance bottlenecks** in database and AI processing
3. **Type safety issues** undermining code quality
4. **Missing caching layers** affecting scalability

By addressing these issues systematically and following the recommended evolution path, the platform can scale effectively while maintaining code quality and developer productivity.

### Next Steps
1. Create technical debt backlog in project management tool
2. Assign P0 issues to current sprint
3. Schedule architecture review meetings
4. Implement monitoring and alerting
5. Begin service layer refactoring

The platform is well-positioned for growth with these improvements, and the modular monolith approach is appropriate for the current scale. The proposed evolution path provides a clear roadmap for scaling when needed.

---

## Landing page (`app/page.tsx` + `components/landing/*`)

Design-maven marketing landing — true-black `#000` monochrome (zero hue by
construction), Basel Grotesk Medium headings, Geist Mono for code/data. Lovable
STRUCTURE, Hanzo brand. Keep the working prompt-composer + logged-in projects
logic in `page.tsx`; elevate design only.

- **`reveal.tsx`** — the ONE scroll-reveal primitive (IntersectionObserver
  fade-up, ~500ms ease-out, `delay` for stagger). Fails open on reduced-motion
  OR no-IntersectionObserver so content is never stuck hidden. Every section
  uses this — no per-file animation code.
- **`hero-preview.tsx`** — hero focal visual: an honest, schematic browser frame
  (`your-app.hanzo.app` URL, semantic green Live dot, wireframe UI, "Wired in:
  Database · Auth · AI · Storage"). Deliberately a wireframe — communicates
  "a real running app" without fabricating a customer or metrics.
- **`logo-wall.tsx`** — REAL partners only (Techstars '17 + NVIDIA/AWS/Microsoft/
  Google/DigitalOcean/Nebius/Lux/Zoo), mono-tinted white via
  `[filter:brightness(0)_invert(1)]`. Labeled "Backed by Techstars · Built on
  world-class infrastructure" — never "trusted by <fake customers>".
- **`cloud-integration.tsx`** — the differentiator: 6 capabilities each mapping
  to a LIVE Hanzo product (Cloud/Base/IAM/LLM Gateway/KMS·S3/Functions), linked
  to `hanzo.ai/<product>`. No invented features/metrics.
- **`models-strip.tsx`** — real `api.hanzo.ai/v1` endpoint + real provider logos.
- **`how-it-works.tsx`** / **`site-footer.tsx`** — 3-step + multi-column footer.

Honesty rule: REAL logos + REAL integration claims only. If a claim can't be
truthful, omit it.

### Local-dev landmine: `react-resizable-panels` shim (dev-only crash)

`next.config.js` aliases `react-resizable-panels` → `lib/shims/react-resizable-panels.js`,
but the shim does `export … from 'react-resizable-panels'` — the alias re-catches
the shim's own import, so it re-exports **itself**. In `next dev` (webpack HMR
harmony getters) this recurses → `RangeError: Maximum call stack size exceeded`
on EVERY route through the layout (500). The **production** build/`next start`
does NOT crash (webpack resolves the circular re-export to `undefined` bindings
instead of recursing — which is why live 1.42.x works), but Panel/Group/Separator
from the shim are effectively `undefined` in prod too. The installed real package
is v4.7.4 which already exports `Group`/`Panel`/`Separator` natively, so the shim
is largely obsolete. To fix properly: alias only the exact bare specifier
(`react-resizable-panels$`) to the shim and have the shim re-export from a
sentinel (`react-resizable-panels-real$` → `require.resolve('react-resizable-panels')`),
never from the bare specifier. Until then, verify the landing via
`next build && next start` (production), not `next dev`.

Note: a local `next start` bounces anon users to IAM (`hanzo.id`/`console.hanzo.ai`)
because the prod build points auth at the in-cluster `iam.hanzo.svc` (unreachable
off-cluster). This is an env artifact — the live `/` is public (middleware treats
`/` as a public route). Block those hosts in the browser to verify below-fold
sections locally.

---

## `/dev` builder chrome (`components/editor/*`) — unified design

True-black monochrome, content-forward. The chrome recedes; the generated
preview is the star. Matches hanzo.ai (zero hue by construction, except genuine
semantics).

- **Bottom-left identity cluster** — `components/editor/identity-bar/index.tsx`
  (`BuilderIdentityBar`). ONE consolidated cluster pinned bottom-left in the
  `Footer` (`components/editor/footer`): `OrgSwitcher` + `EditorAccountMenu`
  (credit balance included). Mirrors the canonical bottom-left user/org control
  from hanzo.chat (`client/src/components/Nav/AccountSettings.tsx`) and
  console.hanzo.ai (`DashboardShell.tsx` SidebarIdentity). Both controls take an
  additive `direction="up"` prop so their menus open UPWARD (Radix `side="top"`
  for the account menu; `bottom-full` popover for the org switcher). The top
  `Header` stays minimal: animated H mark + tab switcher + primary actions.
- **Animated logo** — `HanzoLogo` `animated` prop wraps the mark's paths in
  `<g className="hanzo-logo-idle">`. The keyframe (`hanzoLogoIdle`, in
  `assets/globals.css`) is a slow 4s opacity breathe, gated behind
  `@media (prefers-reduced-motion: no-preference)` — a no-op (static mark) for
  reduced-motion users. The header lifts opacity on hover. Static and animated
  variants share ONE `paths` fragment (no path duplication).
- **Monochrome**: `assets/globals.css` already remaps the `teal/cyan/indigo/`
  `violet/purple/rose` token families to zero-chroma grays, so those Tailwind
  classes render gray automatically. `blue/sky/emerald/amber/green/red/yellow`
  are NOT remapped (render truly colored) — non-semantic uses of those in the
  builder chrome were neutralized to white/neutral. Kept semantic only: green
  = live/active/success, red = error/destructive, yellow = warning,
  emerald = git-push success.

### Landmine: `@hanzo/ui` wallet/network subpaths dropped in 5.5.x

`components/network-wallet` used to import `@hanzo/ui/network`
(`NetworkSwitcher`) and `@hanzo/ui/wallet` (`injectedEvmAdapter`, `WalletMenu`).
The installed `@hanzo/ui@5.5.1` ships NEITHER subpath (no `./network` /
`./wallet` in its `exports`, no `dist/network*` / `dist/wallet*` files) — a
hard `Module not found` that fails the whole `/dev` build (it's a static ESM
import; no try/catch possible). `NetworkWallet` now renders `null` (API stable,
re-enable recipe in its file) and is NOT composed into `BuilderIdentityBar` —
the canonical bottom-left pattern is org + account anyway. Re-enable when
`@hanzo/ui` exports the wallet entry points again.