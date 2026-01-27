# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Digital Menu** is a SaaS platform enabling cafes and restaurants to create and manage digital menus via QR codes. The platform consists of three components:
- **Marketing Website** (`/`) - Landing page, pricing, demo
- **Admin Panel** (`/admin/*`) - Menu management for cafe owners
- **Public Menu** (`/m/[slug]`) - Customer-facing menu accessed via QR code

**Tech Stack:** Next.js 14+ (App Router), TypeScript, PostgreSQL (Neon), Prisma, NextAuth.js, Tailwind CSS, shadcn/ui

## Common Commands

```bash
# Installation
pnpm install

# Development
pnpm dev                    # Start dev server
pnpm db:push               # Push schema changes to database
pnpm db:migrate            # Run migrations
pnpm db:studio             # Open Prisma Studio

# Testing
pnpm test                  # Run all tests
pnpm test:watch            # Run tests in watch mode
pnpm test -- path/to/file  # Run specific test file

# Build & Deploy
pnpm build                 # Build for production
pnpm start                 # Start production server
pnpm lint                  # Lint code
pnpm format                # Format code with Prettier
```

## Architecture

### Monorepo Structure (Turborepo)

```
digital-menu/
├── apps/web/              # Main Next.js application
│   ├── app/               # Next.js App Router
│   │   ├── (marketing)/   # Public pages (/, /pricing, /demo)
│   │   ├── (auth)/        # Auth pages (/login, /register)
│   │   ├── admin/         # Admin panel with sidebar layout
│   │   ├── m/[slug]/      # Public menus
│   │   └── api/           # API routes
│   ├── components/
│   │   ├── ui/            # shadcn/ui base components
│   │   ├── admin/         # Admin-specific components
│   │   ├── public/        # Public menu components
│   │   └── marketing/     # Marketing page components
│   ├── lib/
│   │   ├── auth/          # NextAuth.js config & permissions
│   │   ├── db/            # Prisma client
│   │   ├── api/           # API client & React Query setup
│   │   ├── validations/   # Zod schemas
│   │   ├── cache/         # Redis caching utilities
│   │   ├── qr/            # QR code generation
│   │   └── cloudinary/    # Image upload/optimization
│   ├── hooks/             # Custom React hooks (useMenus, useProducts, etc.)
│   └── stores/            # Zustand stores
└── packages/
    ├── database/          # Prisma schema & migrations
    ├── config/            # Shared configs (ESLint, TypeScript)
    └── types/             # Shared TypeScript types
```

### Database Schema (Prisma)

**Core Models:**
- `User` → `Menu` → `Category` → `Product` → `ProductVariation`
- `Menu` → `Promotion`
- `Menu` → `MenuView` (analytics)

**Key Relationships:**
- User has many Menus (with plan-based limits)
- Each Menu has Categories, Promotions
- Categories have Products (with drag-drop `sortOrder`)
- Products can have Variations (e.g., Small/Medium/Large with different prices)

**Multi-language Fields:**
Products and Categories store translations in separate fields:
```prisma
nameKa String      # Georgian (required)
nameEn String?     # English (optional)
nameRu String?     # Russian (optional)
```

**Important Enums:**
- `Plan`: FREE, STARTER, PRO
- `MenuStatus`: DRAFT, PUBLISHED
- `Language`: KA, EN, RU
- `Allergen`: GLUTEN, DAIRY, EGGS, NUTS, SEAFOOD, SOY, PORK

### State Management

**Server State (TanStack Query):**
- All API data fetching (menus, products, analytics)
- Automatic caching, refetching, invalidation
- Query keys: `['menus']`, `['menus', menuId]`, `['menus', menuId, 'products']`

**Client State (Zustand):**
- UI state (sidebar open/closed, active menu selection)
- Transient state not persisted to server

**Form State (React Hook Form + Zod):**
- All forms validated with Zod schemas from `lib/validations/`

### Authentication & Authorization

**NextAuth.js Configuration:**
- Providers: Credentials (email/password), Google OAuth, Apple OAuth
- Session strategy: JWT with database sessions
- Password hashing: bcrypt (cost factor 12)

**Route Protection (middleware.ts):**
- `/admin/*` routes require authentication
- Auth pages redirect authenticated users to `/admin/dashboard`

**Plan-Based Authorization (`lib/auth/permissions.ts`):**
```typescript
PLAN_LIMITS = {
  FREE:    { maxMenus: 1, maxCategories: 3, maxProducts: 15 }
  STARTER: { maxMenus: 3, maxCategories: ∞, maxProducts: ∞ }
  PRO:     { maxMenus: ∞, maxCategories: ∞, maxProducts: ∞ }
}
```

**Feature Flags by Plan:**
- FREE: Basic QR code only
- STARTER: + Promotions, Custom branding, Custom colors
- PRO: + Multilingual, Allergens, Analytics, QR with logo

Always check plan limits before allowing menu/product creation:
```typescript
import { canCreateMenu, hasFeature } from '@/lib/auth/permissions';
if (!canCreateMenu(user)) throw new Error('Plan limit reached');
if (!hasFeature(user.plan, 'multilingual')) // disable feature
```

### API Architecture

**REST Conventions:**
- `GET /api/menus` - List user's menus
- `POST /api/menus` - Create menu
- `GET /api/menus/:id` - Get menu details
- `PUT /api/menus/:id` - Update menu
- `DELETE /api/menus/:id` - Delete menu
- `POST /api/menus/:id/publish` - Publish menu

**Nested Resources:**
- `/api/menus/:id/categories` - Category CRUD
- `/api/menus/:id/products` - Product CRUD
- `/api/menus/:id/promotions` - Promotion CRUD

**Response Format:**
```typescript
// Success
{ success: true, data: {...} }

// Error
{ success: false, error: { code: "...", message: "...", details: [...] } }

// Paginated
{ success: true, data: [...], pagination: { page, limit, total, totalPages } }
```

**Validation:**
All API routes validate input with Zod schemas. Use schemas from `lib/validations/`:
- `createMenuSchema`, `updateMenuSchema`
- `createProductSchema`, `updateProductSchema`
- etc.

**Error Handling:**
Use `handleApiError()` from `lib/api/error-handler.ts` to catch and format errors consistently.

### Caching Strategy

**Redis (Upstash):**
- Public menus cached for 5 minutes: `menu:public:{slug}`
- Cache invalidation on menu updates via `invalidateMenuCache(slug)`

**TanStack Query:**
- Client-side query cache (1 minute stale time)
- Automatic invalidation after mutations

**Service Worker (PWA):**
- Cloudinary images cached for 30 days
- Menu API responses cached for 5 minutes (network-first strategy)

### Real-time Updates (Pusher)

**Channel Pattern:** `menu-{menuId}`

**Events:**
- `menu:updated` - Menu settings changed
- `category:created/updated/deleted/reordered`
- `product:created/updated/deleted/reordered`
- `promotion:created/updated/deleted`

**Usage Pattern:**
```typescript
// Subscribe in component
useEffect(() => {
  const channel = pusherClient.subscribe(`menu-${menuId}`);
  channel.bind('product:updated', (data) => {
    queryClient.setQueryData(['menus', menuId, 'products'], ...);
  });
  return () => channel.unbind_all();
}, [menuId]);

// Publish from API route
await pusherServer.trigger(`menu-${menuId}`, 'product:updated', product);
```

After Pusher events, invalidate Redis cache for the menu.

### Image Management (Cloudinary)

**Upload Flow:**
1. Client uploads to `/api/upload` (multipart/form-data)
2. Server uploads to Cloudinary with transformations
3. Returns `{ url, publicId }`
4. Store URL in database

**Transformations:**
- Products: 400x400 fill, auto-quality, auto-format (WebP/AVIF)
- Promotions: 1200x600 fill
- Logos: 200x200 limit

**Optimization:**
Images automatically converted to WebP/AVIF based on browser support.

### QR Code Generation

**API:** `GET /api/qr/:menuId?format=png&size=medium`

**Formats:** PNG, SVG
**Sizes:** small (200px), medium (400px), large (800px)

**Pro Feature:** Logo overlay in center (20% of QR size)

Generate QR pointing to: `{APP_URL}/m/{menu.slug}`

### Multi-language (i18n)

**next-intl Configuration:**
- Supported locales: `ka` (default), `en`, `ru`
- Translation files: `public/locales/{locale}/{namespace}.json`
- Namespaces: `common`, `auth`, `admin`, `menu`, `marketing`

**Content Storage:**
Product/Category names stored in separate database fields (nameKa, nameEn, nameRu), not in translation files. Only UI strings go in translation files.

**Language Switching:**
Public menus have language switcher. Menu content adapts based on selected language (falls back to Georgian if translation missing).

### Menu Publishing Workflow

1. Menu starts as `DRAFT` status
2. Admin edits categories, products, settings
3. Click "Publish" → status changes to `PUBLISHED`, sets `publishedAt` timestamp
4. Only `PUBLISHED` menus visible at `/m/{slug}`
5. Unpublish returns to `DRAFT`, hides from public
6. Cache invalidated on publish/unpublish

### Testing Patterns

**Component Tests (Vitest + React Testing Library):**
```typescript
// tests/components/product-card.test.tsx
import { render, screen } from '@testing-library/react';
import { ProductCard } from '@/components/admin/product-card';
```

**API Tests:**
```typescript
// Mock Prisma in tests
vi.mock('@/lib/db', () => ({
  prisma: { menu: { create: vi.fn(), ... } }
}));
```

**Coverage Target:** Focus on critical business logic (auth, permissions, API validation)

## Development Guidelines

### Drag & Drop Reordering

Categories and Products use `sortOrder` field. Use `dnd-kit` library for drag-drop UI:
1. User drags items in admin panel
2. Frontend calculates new `sortOrder` values
3. Call `/api/menus/:id/{categories|products}/reorder` with new order
4. Backend updates `sortOrder` in transaction
5. Broadcast real-time event

### Adding a New API Endpoint

1. Create route handler in `app/api/.../ route.ts`
2. Define Zod schema in `lib/validations/`
3. Validate request body with schema
4. Check authentication with `await auth()`
5. Check authorization (plan limits, ownership)
6. Perform database operation
7. Invalidate relevant caches
8. Broadcast Pusher event if needed
9. Return standardized response
10. Wrap in try-catch with `handleApiError()`

### Adding a New Component

**UI Component (shadcn/ui):**
```bash
npx shadcn@latest add <component-name>
```

**Domain Component:**
1. Create in appropriate folder (`components/admin/`, `components/public/`, etc.)
2. Use existing shadcn/ui primitives
3. Extract reusable logic to custom hooks (`hooks/`)
4. Use Zod for form validation
5. Use TanStack Query for data fetching

### Working with Prisma

**Schema Changes:**
1. Edit `packages/database/prisma/schema.prisma`
2. Run `pnpm db:push` (dev) or `pnpm db:migrate` (production)
3. Prisma Client auto-regenerates

**Common Queries:**
```typescript
// Get menu with nested data
const menu = await prisma.menu.findUnique({
  where: { id, userId }, // Always filter by userId for security
  include: {
    categories: {
      orderBy: { sortOrder: 'asc' },
      include: { products: true }
    }
  }
});

// Pagination
const products = await prisma.product.findMany({
  skip: (page - 1) * limit,
  take: limit,
  orderBy: { createdAt: 'desc' }
});
```

**Always:**
- Filter by `userId` for menu ownership checks
- Use transactions for multi-step operations
- Include `orderBy: { sortOrder: 'asc' }` for ordered lists

## Important Constraints

**Security:**
- Never expose other users' data (always filter by session.user.id)
- Validate all inputs with Zod
- Check plan limits before allowing resource creation
- Rate limit auth endpoints (10 req/10s via Upstash Ratelimit)

**Performance:**
- Use Redis cache for public menus (5 min TTL)
- Optimize Cloudinary images (auto-quality, auto-format)
- Add database indexes on foreign keys and frequently queried fields
- Use `include` selectively to avoid over-fetching

**Data Integrity:**
- Use Prisma transactions for operations affecting multiple records
- Set up `onDelete: Cascade` for parent-child relationships
- Always invalidate cache after mutations

## Environment Setup

Required environment variables (see `TECHNICAL_SPEC.md` section 20.1 for complete list):
- `DATABASE_URL` - Neon PostgreSQL connection string
- `NEXTAUTH_URL`, `NEXTAUTH_SECRET`
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` (OAuth)
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
- `PUSHER_APP_ID`, `PUSHER_KEY`, `PUSHER_SECRET`, `PUSHER_CLUSTER`
- `UPSTASH_REDIS_URL`, `UPSTASH_REDIS_TOKEN`
- `RESEND_API_KEY` (email)
- `SENTRY_DSN` (error tracking)
- `NEXT_PUBLIC_GA_MEASUREMENT_ID` (analytics)

## Pricing Tiers Summary

| Tier | Price | Menus | Categories | Products | Features |
|------|-------|-------|------------|----------|----------|
| FREE | 0₾ | 1 | 3 | 15 | Basic QR |
| STARTER | 29₾/mo | 3 | ∞ | ∞ | + Promotions, Branding |
| PRO | 59₾/mo | ∞ | ∞ | ∞ | + Multilingual, Allergens, Analytics, QR Logo |

Always enforce these limits in API routes and UI.

## Additional Resources

- Full technical specification: `TECHNICAL_SPEC.md`
- Functional specification (Georgian): `technical.md`
- Prisma schema: `packages/database/prisma/schema.prisma`
- API error codes: `lib/api/error-handler.ts`
