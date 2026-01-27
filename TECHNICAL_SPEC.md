# Digital Menu - ტექნიკური სპეციფიკაცია
**ვერსია 2.0** | SandStudios

---

## 📋 სარჩევი

1. [პროექტის მიმოხილვა](#1-პროექტის-მიმოხილვა)
2. [ტექნოლოგიური სტეკი](#2-ტექნოლოგიური-სტეკი)
3. [პროექტის სტრუქტურა](#3-პროექტის-სტრუქტურა)
4. [მონაცემთა ბაზის სქემა](#4-მონაცემთა-ბაზის-სქემა)
5. [API არქიტექტურა](#5-api-არქიტექტურა)
6. [ავთენტიფიკაცია და ავტორიზაცია](#6-ავთენტიფიკაცია-და-ავტორიზაცია)
7. [Frontend არქიტექტურა](#7-frontend-არქიტექტურა)
8. [კომპონენტების ბიბლიოთეკა](#8-კომპონენტების-ბიბლიოთეკა)
9. [მრავალენოვნება (i18n)](#9-მრავალენოვნება-i18n)
10. [Real-time ფუნქციონალი](#10-real-time-ფუნქციონალი)
11. [File Storage და Media](#11-file-storage-და-media)
12. [QR კოდის გენერაცია](#12-qr-კოდის-გენერაცია)
13. [Analytics სისტემა](#13-analytics-სისტემა)
14. [SEO სტრატეგია](#14-seo-სტრატეგია)
15. [PWA კონფიგურაცია](#15-pwa-კონფიგურაცია)
16. [Caching სტრატეგია](#16-caching-სტრატეგია)
17. [Error Handling და Monitoring](#17-error-handling-და-monitoring)
18. [Testing სტრატეგია](#18-testing-სტრატეგია)
19. [CI/CD Pipeline](#19-cicd-pipeline)
20. [Deployment](#20-deployment)
21. [Security](#21-security)
22. [Performance](#22-performance)
23. [MVP Scope და Phases](#23-mvp-scope-და-phases)

---

## 1. პროექტის მიმოხილვა

### 1.1 აღწერა
Digital Menu არის SaaS პლატფორმა, რომელიც კაფეებს და რესტორნებს საშუალებას აძლევს შექმნან და მართონ ციფრული მენიუები QR კოდის საშუალებით.

### 1.2 პლატფორმის კომპონენტები

| კომპონენტი | მომხმარებელი | URL Pattern |
|------------|--------------|-------------|
| Marketing Website | კაფეს მფლობელები | `/` |
| Admin Panel | კაფეს მფლობელები | `/admin/*` |
| Public Menu | კაფეს სტუმრები | `/m/[slug]` |

### 1.3 Pricing Tiers

| გეგმა | ფასი | ლიმიტები |
|-------|------|----------|
| **Free** | 0 ₾ | 1 მენიუ, 3 კატეგორია, 15 პროდუქტი |
| **Starter** | 29 ₾/თვე | 3 მენიუ, ულიმიტო კატეგორია/პროდუქტი, აქციები, ბრენდინგი |
| **Pro** | 59 ₾/თვე | ულიმიტო მენიუ, მრავალენოვნება, ალერგენები, ანალიტიკა |

---

## 2. ტექნოლოგიური სტეკი

### 2.1 Core Technologies

```
Frontend Framework:    Next.js 14+ (App Router)
UI Library:           Tailwind CSS + shadcn/ui
Language:             TypeScript 5+
Runtime:              Node.js 20+
Package Manager:      pnpm
```

### 2.2 Backend & Database

```
Database:             PostgreSQL (Neon - Serverless)
ORM:                  Prisma
Caching:              Redis (Upstash/Railway)
API:                  Next.js API Routes (REST)
API Documentation:    Swagger/OpenAPI
```

### 2.3 Authentication

```
Auth Provider:        NextAuth.js (Auth.js v5)
Social Providers:     Google, Apple
Session Strategy:     JWT + Database sessions
```

### 2.4 Infrastructure

```
Hosting:              Railway
CI/CD:                GitHub Actions + Railway Auto-deploy
Domain:               TBD (digitalmenu.ge recommended)
SSL:                  Automatic via Railway
```

### 2.5 Third-Party Services

```
Image Storage:        Cloudinary
Email Service:        Resend
Real-time:            Pusher
Error Tracking:       Sentry
Analytics:            Custom + Google Analytics 4
```

### 2.6 Development Tools

```
State Management:     TanStack Query + Zustand
Forms:                React Hook Form + Zod
Drag & Drop:          dnd-kit
Testing:              Vitest + React Testing Library
Linting:              ESLint + Prettier
Git Hooks:            Husky + lint-staged
```

---

## 3. პროექტის სტრუქტურა

### 3.1 Monorepo Structure

```
digital-menu/
├── apps/
│   └── web/                    # Next.js Application
│       ├── app/
│       │   ├── (marketing)/    # Marketing pages (/, /pricing, /demo)
│       │   ├── (auth)/         # Auth pages (/login, /register)
│       │   ├── admin/          # Admin panel
│       │   ├── m/              # Public menus
│       │   └── api/            # API routes
│       ├── components/
│       │   ├── ui/             # shadcn/ui components
│       │   ├── admin/          # Admin-specific components
│       │   ├── public/         # Public menu components
│       │   └── marketing/      # Marketing components
│       ├── lib/
│       │   ├── auth/           # Auth configuration
│       │   ├── db/             # Database utilities
│       │   ├── api/            # API client
│       │   ├── utils/          # Helper functions
│       │   └── validations/    # Zod schemas
│       ├── hooks/              # Custom React hooks
│       ├── stores/             # Zustand stores
│       ├── types/              # TypeScript types
│       ├── styles/             # Global styles
│       └── public/
│           ├── locales/        # i18n translations
│           └── assets/         # Static assets
├── packages/
│   ├── database/               # Prisma schema & migrations
│   ├── config/                 # Shared configurations
│   └── types/                  # Shared TypeScript types
├── docker-compose.yml          # Local development
├── turbo.json                  # Turborepo config
└── pnpm-workspace.yaml
```

### 3.2 App Router Structure

```
app/
├── (marketing)/
│   ├── page.tsx                # Landing page (/)
│   ├── pricing/
│   │   └── page.tsx            # /pricing
│   ├── demo/
│   │   └── page.tsx            # /demo
│   └── layout.tsx              # Marketing layout
│
├── (auth)/
│   ├── login/
│   │   └── page.tsx            # /login
│   ├── register/
│   │   └── page.tsx            # /register
│   ├── forgot-password/
│   │   └── page.tsx            # /forgot-password
│   └── layout.tsx              # Auth layout
│
├── admin/
│   ├── page.tsx                # Redirect to dashboard
│   ├── dashboard/
│   │   └── page.tsx            # /admin/dashboard
│   ├── menus/
│   │   ├── page.tsx            # /admin/menus
│   │   └── [menuId]/
│   │       ├── page.tsx        # /admin/menus/[menuId]
│   │       ├── categories/
│   │       ├── promotions/
│   │       ├── design/
│   │       ├── settings/
│   │       └── qr/
│   ├── settings/
│   │   └── page.tsx            # /admin/settings
│   ├── help/
│   │   └── page.tsx            # /admin/help
│   └── layout.tsx              # Admin layout with sidebar
│
├── m/
│   └── [slug]/
│       ├── page.tsx            # Public menu
│       └── layout.tsx          # Public menu layout
│
├── api/
│   ├── auth/
│   │   └── [...nextauth]/
│   │       └── route.ts        # NextAuth.js
│   ├── menus/
│   │   ├── route.ts            # GET /api/menus, POST /api/menus
│   │   └── [menuId]/
│   │       ├── route.ts        # GET, PUT, DELETE /api/menus/[menuId]
│   │       ├── categories/
│   │       ├── products/
│   │       ├── promotions/
│   │       └── publish/
│   ├── upload/
│   │   └── route.ts            # Image upload
│   ├── qr/
│   │   └── route.ts            # QR generation
│   ├── analytics/
│   │   └── route.ts            # Analytics tracking
│   └── webhooks/
│       └── route.ts            # External webhooks
│
├── layout.tsx                  # Root layout
├── not-found.tsx               # 404 page
├── error.tsx                   # Error boundary
└── loading.tsx                 # Loading state
```

---

## 4. მონაცემთა ბაზის სქემა

### 4.1 Prisma Schema

```prisma
// packages/database/prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ==================== AUTH ====================

model User {
  id            String    @id @default(cuid())
  email         String    @unique
  emailVerified DateTime?
  passwordHash  String?

  // Profile
  businessName  String
  phone         String?
  avatar        String?

  // Subscription
  plan          Plan      @default(FREE)
  planExpiresAt DateTime?

  // Relations
  accounts      Account[]
  sessions      Session[]
  menus         Menu[]

  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  @@map("users")
}

model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String? @db.Text
  access_token      String? @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String? @db.Text
  session_state     String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
  @@map("accounts")
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("sessions")
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
  @@map("verification_tokens")
}

// ==================== CORE ====================

model Menu {
  id          String   @id @default(cuid())
  userId      String

  // Basic Info
  name        String
  slug        String   @unique
  description String?

  // Status
  status      MenuStatus @default(DRAFT)
  publishedAt DateTime?

  // Design
  logo        String?
  primaryColor   String   @default("#000000")
  backgroundColor String  @default("#FFFFFF")
  theme       MenuTheme  @default(LIGHT)

  // Settings
  currency    Currency   @default(GEL)
  currencyPosition CurrencyPosition @default(AFTER)
  defaultLanguage Language @default(KA)
  enabledLanguages Language[] @default([KA])

  // Cafe Info
  address     String?
  phone       String?
  wifiPassword String?
  workingHours Json?    // { mon: { open: "09:00", close: "22:00" }, ... }
  facebookUrl String?
  instagramUrl String?

  // Relations
  user        User       @relation(fields: [userId], references: [id], onDelete: Cascade)
  categories  Category[]
  promotions  Promotion[]
  analytics   MenuView[]

  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt

  @@index([userId])
  @@index([slug])
  @@map("menus")
}

model Category {
  id          String   @id @default(cuid())
  menuId      String

  // Translations
  nameKa      String
  nameEn      String?
  nameRu      String?
  descriptionKa String?
  descriptionEn String?
  descriptionRu String?

  // Display
  icon        String?  // emoji or icon name
  sortOrder   Int      @default(0)
  isVisible   Boolean  @default(true)

  // Relations
  menu        Menu     @relation(fields: [menuId], references: [id], onDelete: Cascade)
  products    Product[]

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([menuId])
  @@map("categories")
}

model Product {
  id          String   @id @default(cuid())
  categoryId  String

  // Translations
  nameKa      String
  nameEn      String?
  nameRu      String?
  descriptionKa String?
  descriptionEn String?
  descriptionRu String?

  // Pricing
  price       Decimal  @db.Decimal(10, 2)

  // Media
  image       String?

  // Attributes
  isChefRecommended Boolean @default(false)
  isAvailable Boolean @default(true)
  allergens   Allergen[] @default([])

  // Display
  sortOrder   Int      @default(0)

  // Relations
  category    Category @relation(fields: [categoryId], references: [id], onDelete: Cascade)
  variations  ProductVariation[]

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([categoryId])
  @@map("products")
}

model ProductVariation {
  id        String   @id @default(cuid())
  productId String

  // Translations
  nameKa    String
  nameEn    String?
  nameRu    String?

  // Pricing
  price     Decimal  @db.Decimal(10, 2)

  // Display
  sortOrder Int      @default(0)

  // Relations
  product   Product  @relation(fields: [productId], references: [id], onDelete: Cascade)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([productId])
  @@map("product_variations")
}

model Promotion {
  id          String   @id @default(cuid())
  menuId      String

  // Content
  title       String
  description String?
  image       String?

  // Schedule
  startDate   DateTime?
  endDate     DateTime?
  isActive    Boolean  @default(true)

  // Display
  sortOrder   Int      @default(0)

  // Relations
  menu        Menu     @relation(fields: [menuId], references: [id], onDelete: Cascade)

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([menuId])
  @@map("promotions")
}

// ==================== ANALYTICS ====================

model MenuView {
  id        String   @id @default(cuid())
  menuId    String

  // Tracking
  sessionId String
  userAgent String?
  language  Language?
  referrer  String?

  // Location (optional)
  country   String?
  city      String?

  // Relations
  menu      Menu     @relation(fields: [menuId], references: [id], onDelete: Cascade)

  createdAt DateTime @default(now())

  @@index([menuId])
  @@index([createdAt])
  @@map("menu_views")
}

// ==================== ENUMS ====================

enum Plan {
  FREE
  STARTER
  PRO
}

enum MenuStatus {
  DRAFT
  PUBLISHED
}

enum MenuTheme {
  LIGHT
  DARK
  COFFEE
  OCEAN
}

enum Currency {
  GEL
  USD
  EUR
}

enum CurrencyPosition {
  BEFORE
  AFTER
}

enum Language {
  KA
  EN
  RU
}

enum Allergen {
  GLUTEN
  DAIRY
  EGGS
  NUTS
  SEAFOOD
  SOY
  PORK
}
```

### 4.2 Database Indexes

```sql
-- Performance indexes
CREATE INDEX idx_menus_user_status ON menus(user_id, status);
CREATE INDEX idx_products_category_available ON products(category_id, is_available);
CREATE INDEX idx_menu_views_menu_date ON menu_views(menu_id, created_at DESC);
CREATE INDEX idx_promotions_menu_active ON promotions(menu_id, is_active);
```

---

## 5. API არქიტექტურა

### 5.1 API Design Principles

- RESTful conventions
- JSON request/response format
- Zod validation for all inputs
- Consistent error responses
- Rate limiting per user/IP

### 5.2 API Endpoints

#### Authentication
```
POST   /api/auth/register         # Register new user
POST   /api/auth/callback/*       # NextAuth.js callbacks
GET    /api/auth/session          # Get current session
POST   /api/auth/signout          # Sign out
```

#### Menus
```
GET    /api/menus                 # List user's menus
POST   /api/menus                 # Create menu
GET    /api/menus/:id             # Get menu details
PUT    /api/menus/:id             # Update menu
DELETE /api/menus/:id             # Delete menu
POST   /api/menus/:id/publish     # Publish menu
POST   /api/menus/:id/unpublish   # Unpublish menu
POST   /api/menus/:id/duplicate   # Duplicate menu
```

#### Categories
```
GET    /api/menus/:id/categories          # List categories
POST   /api/menus/:id/categories          # Create category
PUT    /api/menus/:id/categories/:catId   # Update category
DELETE /api/menus/:id/categories/:catId   # Delete category
PUT    /api/menus/:id/categories/reorder  # Reorder categories
```

#### Products
```
GET    /api/menus/:id/products            # List products (filterable by category)
POST   /api/menus/:id/products            # Create product
PUT    /api/menus/:id/products/:prodId    # Update product
DELETE /api/menus/:id/products/:prodId    # Delete product
POST   /api/menus/:id/products/:prodId/duplicate  # Duplicate product
PUT    /api/menus/:id/products/reorder    # Reorder products
```

#### Promotions
```
GET    /api/menus/:id/promotions          # List promotions
POST   /api/menus/:id/promotions          # Create promotion
PUT    /api/menus/:id/promotions/:promoId # Update promotion
DELETE /api/menus/:id/promotions/:promoId # Delete promotion
PUT    /api/menus/:id/promotions/reorder  # Reorder promotions
```

#### Media
```
POST   /api/upload                 # Upload image (returns Cloudinary URL)
DELETE /api/upload/:publicId       # Delete image from Cloudinary
```

#### QR Code
```
GET    /api/qr/:menuId             # Generate QR code (PNG/SVG/PDF)
```

#### Analytics
```
POST   /api/analytics/view         # Track menu view
GET    /api/analytics/menus/:id    # Get menu analytics (admin)
```

#### Public Menu (No Auth Required)
```
GET    /api/public/menus/:slug     # Get published menu by slug
```

#### User/Settings
```
GET    /api/user                   # Get current user profile
PUT    /api/user                   # Update profile
PUT    /api/user/password          # Change password
GET    /api/user/subscription      # Get subscription details
```

### 5.3 API Response Format

```typescript
// Success Response
{
  "success": true,
  "data": { ... }
}

// Error Response
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input",
    "details": [
      { "field": "email", "message": "Invalid email format" }
    ]
  }
}

// Paginated Response
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

### 5.4 Validation Schemas (Zod)

```typescript
// lib/validations/menu.ts
import { z } from 'zod';

export const createMenuSchema = z.object({
  name: z.string().min(1).max(100),
  slug: z.string()
    .min(3)
    .max(50)
    .regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens'),
  description: z.string().max(500).optional(),
});

export const updateMenuSchema = createMenuSchema.partial();

export const createProductSchema = z.object({
  categoryId: z.string().cuid(),
  nameKa: z.string().min(1).max(100),
  nameEn: z.string().max(100).optional(),
  nameRu: z.string().max(100).optional(),
  descriptionKa: z.string().max(500).optional(),
  descriptionEn: z.string().max(500).optional(),
  descriptionRu: z.string().max(500).optional(),
  price: z.number().positive().max(99999.99),
  image: z.string().url().optional(),
  isChefRecommended: z.boolean().default(false),
  isAvailable: z.boolean().default(true),
  allergens: z.array(z.nativeEnum(Allergen)).default([]),
  variations: z.array(z.object({
    nameKa: z.string().min(1),
    nameEn: z.string().optional(),
    nameRu: z.string().optional(),
    price: z.number().positive(),
  })).optional(),
});
```

---

## 6. ავთენტიფიკაცია და ავტორიზაცია

### 6.1 NextAuth.js Configuration

```typescript
// lib/auth/auth.config.ts
import { NextAuthConfig } from 'next-auth';
import Google from 'next-auth/providers/google';
import Apple from 'next-auth/providers/apple';
import Credentials from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';

export const authConfig: NextAuthConfig = {
  adapter: PrismaAdapter(prisma),
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    Apple({
      clientId: process.env.APPLE_CLIENT_ID!,
      clientSecret: process.env.APPLE_CLIENT_SECRET!,
    }),
    Credentials({
      credentials: {
        email: { type: 'email' },
        password: { type: 'password' },
      },
      authorize: async (credentials) => {
        // Validate and authenticate user
        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        });

        if (!user?.passwordHash) return null;

        const isValid = await bcrypt.compare(
          credentials.password as string,
          user.passwordHash
        );

        if (!isValid) return null;

        return user;
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: '/login',
    signUp: '/register',
    error: '/login',
  },
  callbacks: {
    jwt: async ({ token, user }) => {
      if (user) {
        token.id = user.id;
        token.plan = user.plan;
      }
      return token;
    },
    session: async ({ session, token }) => {
      if (token) {
        session.user.id = token.id as string;
        session.user.plan = token.plan as Plan;
      }
      return session;
    },
  },
};
```

### 6.2 Authorization Middleware

```typescript
// middleware.ts
import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';

export default auth((req) => {
  const isAuthenticated = !!req.auth;
  const isAdminRoute = req.nextUrl.pathname.startsWith('/admin');
  const isAuthRoute = ['/login', '/register', '/forgot-password'].includes(req.nextUrl.pathname);

  // Redirect authenticated users away from auth pages
  if (isAuthRoute && isAuthenticated) {
    return NextResponse.redirect(new URL('/admin/dashboard', req.url));
  }

  // Protect admin routes
  if (isAdminRoute && !isAuthenticated) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/admin/:path*', '/login', '/register', '/forgot-password'],
};
```

### 6.3 Plan-based Authorization

```typescript
// lib/auth/permissions.ts
import { Plan } from '@prisma/client';

export const PLAN_LIMITS = {
  [Plan.FREE]: {
    maxMenus: 1,
    maxCategories: 3,
    maxProducts: 15,
    features: ['basic_qr'],
  },
  [Plan.STARTER]: {
    maxMenus: 3,
    maxCategories: Infinity,
    maxProducts: Infinity,
    features: ['basic_qr', 'promotions', 'branding', 'custom_colors'],
  },
  [Plan.PRO]: {
    maxMenus: Infinity,
    maxCategories: Infinity,
    maxProducts: Infinity,
    features: ['basic_qr', 'promotions', 'branding', 'custom_colors', 'multilingual', 'allergens', 'analytics', 'qr_logo'],
  },
} as const;

export function canCreateMenu(user: { plan: Plan; _count: { menus: number } }): boolean {
  return user._count.menus < PLAN_LIMITS[user.plan].maxMenus;
}

export function hasFeature(plan: Plan, feature: string): boolean {
  return PLAN_LIMITS[plan].features.includes(feature);
}
```

---

## 7. Frontend არქიტექტურა

### 7.1 State Management

#### TanStack Query Setup
```typescript
// lib/api/query-client.ts
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 minute
      gcTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});
```

#### Zustand Store
```typescript
// stores/ui-store.ts
import { create } from 'zustand';

interface UIState {
  sidebarOpen: boolean;
  activeMenuId: string | null;
  selectedCategoryId: string | null;

  // Actions
  toggleSidebar: () => void;
  setActiveMenu: (id: string | null) => void;
  setSelectedCategory: (id: string | null) => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  activeMenuId: null,
  selectedCategoryId: null,

  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setActiveMenu: (id) => set({ activeMenuId: id }),
  setSelectedCategory: (id) => set({ selectedCategoryId: id }),
}));
```

### 7.2 API Hooks

```typescript
// hooks/use-menus.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import type { Menu, CreateMenuInput } from '@/types';

export function useMenus() {
  return useQuery({
    queryKey: ['menus'],
    queryFn: () => api.get<Menu[]>('/menus'),
  });
}

export function useMenu(id: string) {
  return useQuery({
    queryKey: ['menus', id],
    queryFn: () => api.get<Menu>(`/menus/${id}`),
    enabled: !!id,
  });
}

export function useCreateMenu() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateMenuInput) => api.post<Menu>('/menus', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menus'] });
    },
  });
}

export function useUpdateMenu(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<Menu>) => api.put<Menu>(`/menus/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menus', id] });
      queryClient.invalidateQueries({ queryKey: ['menus'] });
    },
  });
}
```

### 7.3 Form Handling

```typescript
// components/admin/product-form.tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createProductSchema } from '@/lib/validations/product';

export function ProductForm({ onSubmit, defaultValues }) {
  const form = useForm({
    resolver: zodResolver(createProductSchema),
    defaultValues: {
      nameKa: '',
      price: 0,
      isAvailable: true,
      allergens: [],
      ...defaultValues,
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        {/* Form fields */}
      </form>
    </Form>
  );
}
```

---

## 8. კომპონენტების ბიბლიოთეკა

### 8.1 shadcn/ui Components (to install)

```bash
# Core components
npx shadcn@latest add button input label select textarea checkbox
npx shadcn@latest add switch toggle toggle-group
npx shadcn@latest add card dialog sheet drawer
npx shadcn@latest add dropdown-menu context-menu
npx shadcn@latest add tabs accordion
npx shadcn@latest add badge avatar
npx shadcn@latest add toast sonner
npx shadcn@latest add form
npx shadcn@latest add table
npx shadcn@latest add skeleton
npx shadcn@latest add separator
npx shadcn@latest add scroll-area
npx shadcn@latest add popover tooltip
npx shadcn@latest add command # for search/command palette
npx shadcn@latest add alert alert-dialog
npx shadcn@latest add aspect-ratio
npx shadcn@latest add carousel
```

### 8.2 Custom Domain Components

```
components/
├── admin/
│   ├── menu-card.tsx           # Menu card in list
│   ├── category-item.tsx       # Category in sidebar
│   ├── product-card.tsx        # Product card (admin view)
│   ├── product-form.tsx        # Product add/edit form
│   ├── category-form.tsx       # Category add/edit form
│   ├── promotion-card.tsx      # Promotion card
│   ├── promotion-form.tsx      # Promotion form
│   ├── qr-generator.tsx        # QR code preview & download
│   ├── allergen-selector.tsx   # Multi-select allergens
│   ├── variation-editor.tsx    # Product variations
│   ├── menu-preview.tsx        # Mobile mockup preview
│   ├── color-picker.tsx        # Theme color picker
│   ├── image-uploader.tsx      # Cloudinary upload
│   ├── draggable-list.tsx      # dnd-kit wrapper
│   ├── stats-card.tsx          # Dashboard stat card
│   └── sidebar.tsx             # Admin sidebar
│
├── public/
│   ├── menu-header.tsx         # Logo, name, language
│   ├── promotion-carousel.tsx  # Embla carousel for promos
│   ├── category-nav.tsx        # Sticky category tabs
│   ├── product-card.tsx        # Public product card
│   ├── product-modal.tsx       # Product detail bottom sheet
│   ├── search-bar.tsx          # Search input
│   ├── menu-footer.tsx         # Contact, WiFi
│   ├── language-switcher.tsx   # KA/EN/RU toggle
│   └── allergen-icons.tsx      # Allergen icon display
│
├── marketing/
│   ├── hero-section.tsx        # Landing hero
│   ├── features-section.tsx    # Features grid
│   ├── how-it-works.tsx        # 3-step process
│   ├── testimonials.tsx        # Customer quotes
│   ├── pricing-card.tsx        # Pricing tier card
│   ├── cta-section.tsx         # Call to action
│   └── footer.tsx              # Site footer
│
└── shared/
    ├── logo.tsx                # Digital Menu logo
    ├── loading-spinner.tsx     # Loading indicator
    ├── empty-state.tsx         # No data placeholder
    ├── error-message.tsx       # Error display
    └── confirm-dialog.tsx      # Confirmation modal
```

---

## 9. მრავალენოვნება (i18n)

### 9.1 Setup with next-intl

```typescript
// i18n.ts
import { getRequestConfig } from 'next-intl/server';

export const locales = ['ka', 'en', 'ru'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'ka';

export default getRequestConfig(async ({ locale }) => ({
  messages: (await import(`./messages/${locale}.json`)).default,
}));
```

### 9.2 Translation Files Structure

```
public/locales/
├── ka/
│   ├── common.json      # Common UI strings
│   ├── auth.json        # Auth pages
│   ├── admin.json       # Admin panel
│   ├── menu.json        # Menu-related
│   └── marketing.json   # Landing page
├── en/
│   └── ... (same structure)
└── ru/
    └── ... (same structure)
```

### 9.3 Sample Translations

```json
// public/locales/ka/admin.json
{
  "dashboard": {
    "title": "მთავარი პანელი",
    "viewsToday": "ნახვები დღეს",
    "viewsMonth": "ნახვები ამ თვეში",
    "activeMenus": "აქტიური მენიუები",
    "totalProducts": "სულ პროდუქტები"
  },
  "menus": {
    "title": "მენიუები",
    "create": "შექმენი ახალი მენიუ",
    "empty": "ჯერ არ გაქვთ მენიუ",
    "status": {
      "draft": "დრაფტი",
      "published": "გამოქვეყნებული"
    }
  }
}
```

---

## 10. Real-time ფუნქციონალი

### 10.1 Pusher Setup

```typescript
// lib/pusher/client.ts
import Pusher from 'pusher-js';

export const pusherClient = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
});

// lib/pusher/server.ts
import Pusher from 'pusher';

export const pusherServer = new Pusher({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.PUSHER_CLUSTER!,
  useTLS: true,
});
```

### 10.2 Real-time Events

```typescript
// Channel: menu-{menuId}
// Events:
// - menu:updated        # Menu settings changed
// - category:created    # New category added
// - category:updated    # Category modified
// - category:deleted    # Category removed
// - category:reordered  # Categories reordered
// - product:created     # New product added
// - product:updated     # Product modified
// - product:deleted     # Product removed
// - product:reordered   # Products reordered

// Usage in component
useEffect(() => {
  const channel = pusherClient.subscribe(`menu-${menuId}`);

  channel.bind('product:updated', (data: Product) => {
    queryClient.setQueryData(['menus', menuId, 'products'], (old) =>
      old?.map((p) => (p.id === data.id ? data : p))
    );
  });

  return () => {
    channel.unbind_all();
    pusherClient.unsubscribe(`menu-${menuId}`);
  };
}, [menuId]);
```

---

## 11. File Storage და Media

### 11.1 Cloudinary Configuration

```typescript
// lib/cloudinary/config.ts
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export { cloudinary };
```

### 11.2 Upload API Route

```typescript
// app/api/upload/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { cloudinary } from '@/lib/cloudinary/config';

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get('file') as File;
  const folder = formData.get('folder') as string || 'menu-images';

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const result = await new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      {
        folder: `digital-menu/${session.user.id}/${folder}`,
        transformation: [
          { width: 800, height: 800, crop: 'limit' },
          { quality: 'auto:good' },
          { fetch_format: 'auto' },
        ],
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    ).end(buffer);
  });

  return NextResponse.json({
    url: result.secure_url,
    publicId: result.public_id,
  });
}
```

### 11.3 Image Optimization Presets

```typescript
// lib/cloudinary/transformations.ts
export const imagePresets = {
  thumbnail: 'w_150,h_150,c_fill,q_auto,f_auto',
  productCard: 'w_400,h_400,c_fill,q_auto,f_auto',
  productFull: 'w_800,h_800,c_limit,q_auto,f_auto',
  promotionBanner: 'w_1200,h_600,c_fill,q_auto,f_auto',
  logo: 'w_200,h_200,c_limit,q_auto,f_auto',
};

export function getOptimizedUrl(url: string, preset: keyof typeof imagePresets): string {
  if (!url.includes('cloudinary')) return url;
  return url.replace('/upload/', `/upload/${imagePresets[preset]}/`);
}
```

---

## 12. QR კოდის გენერაცია

### 12.1 Server-side QR Generation

```typescript
// lib/qr/generator.ts
import QRCode from 'qrcode';
import sharp from 'sharp';

interface QROptions {
  format: 'png' | 'svg';
  size: 'small' | 'medium' | 'large';
  logo?: string; // Pro feature
}

const SIZES = {
  small: 200,
  medium: 400,
  large: 800,
};

export async function generateQR(
  menuUrl: string,
  options: QROptions
): Promise<Buffer> {
  const size = SIZES[options.size];

  if (options.format === 'svg') {
    const svg = await QRCode.toString(menuUrl, {
      type: 'svg',
      width: size,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    });
    return Buffer.from(svg);
  }

  // PNG generation
  let qrBuffer = await QRCode.toBuffer(menuUrl, {
    width: size,
    margin: 2,
    color: {
      dark: '#000000',
      light: '#FFFFFF',
    },
  });

  // Add logo in center (Pro feature)
  if (options.logo) {
    const logoSize = Math.floor(size * 0.2);
    const logoPosition = Math.floor((size - logoSize) / 2);

    const logoBuffer = await fetch(options.logo).then(r => r.arrayBuffer());
    const resizedLogo = await sharp(Buffer.from(logoBuffer))
      .resize(logoSize, logoSize)
      .toBuffer();

    qrBuffer = await sharp(qrBuffer)
      .composite([{
        input: resizedLogo,
        top: logoPosition,
        left: logoPosition,
      }])
      .toBuffer();
  }

  return qrBuffer;
}
```

### 12.2 QR API Route

```typescript
// app/api/qr/[menuId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { generateQR } from '@/lib/qr/generator';
import { prisma } from '@/lib/db';

export async function GET(
  req: NextRequest,
  { params }: { params: { menuId: string } }
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const menu = await prisma.menu.findUnique({
    where: { id: params.menuId, userId: session.user.id },
  });

  if (!menu) {
    return NextResponse.json({ error: 'Menu not found' }, { status: 404 });
  }

  const { searchParams } = new URL(req.url);
  const format = (searchParams.get('format') || 'png') as 'png' | 'svg';
  const size = (searchParams.get('size') || 'medium') as 'small' | 'medium' | 'large';

  const menuUrl = `${process.env.NEXT_PUBLIC_APP_URL}/m/${menu.slug}`;

  const qrBuffer = await generateQR(menuUrl, {
    format,
    size,
    logo: session.user.plan === 'PRO' ? menu.logo : undefined,
  });

  const contentType = format === 'svg' ? 'image/svg+xml' : 'image/png';

  return new NextResponse(qrBuffer, {
    headers: {
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename="${menu.slug}-qr.${format}"`,
    },
  });
}
```

---

## 13. Analytics სისტემა

### 13.1 Internal Analytics

```typescript
// lib/analytics/track.ts
import { prisma } from '@/lib/db';
import { headers } from 'next/headers';

interface TrackViewOptions {
  menuId: string;
  sessionId: string;
  language?: Language;
}

export async function trackMenuView(options: TrackViewOptions) {
  const headersList = headers();
  const userAgent = headersList.get('user-agent');
  const referer = headersList.get('referer');

  await prisma.menuView.create({
    data: {
      menuId: options.menuId,
      sessionId: options.sessionId,
      userAgent,
      language: options.language,
      referrer: referer,
    },
  });
}

// API route
// app/api/analytics/view/route.ts
export async function POST(req: NextRequest) {
  const { menuId, sessionId, language } = await req.json();

  await trackMenuView({ menuId, sessionId, language });

  return NextResponse.json({ success: true });
}
```

### 13.2 Analytics Dashboard Queries

```typescript
// lib/analytics/queries.ts
import { prisma } from '@/lib/db';
import { startOfDay, startOfMonth, subDays } from 'date-fns';

export async function getMenuAnalytics(menuId: string, userId: string) {
  const today = startOfDay(new Date());
  const monthStart = startOfMonth(new Date());
  const thirtyDaysAgo = subDays(new Date(), 30);

  const [viewsToday, viewsMonth, viewsByDay, viewsByLanguage] = await Promise.all([
    // Views today
    prisma.menuView.count({
      where: {
        menuId,
        menu: { userId },
        createdAt: { gte: today },
      },
    }),

    // Views this month
    prisma.menuView.count({
      where: {
        menuId,
        menu: { userId },
        createdAt: { gte: monthStart },
      },
    }),

    // Views by day (last 30 days)
    prisma.$queryRaw`
      SELECT DATE(created_at) as date, COUNT(*) as views
      FROM menu_views
      WHERE menu_id = ${menuId} AND created_at >= ${thirtyDaysAgo}
      GROUP BY DATE(created_at)
      ORDER BY date
    `,

    // Views by language
    prisma.menuView.groupBy({
      by: ['language'],
      where: {
        menuId,
        menu: { userId },
        createdAt: { gte: thirtyDaysAgo },
      },
      _count: true,
    }),
  ]);

  return {
    viewsToday,
    viewsMonth,
    viewsByDay,
    viewsByLanguage,
  };
}
```

### 13.3 Google Analytics Integration

```typescript
// components/analytics/google-analytics.tsx
'use client';

import Script from 'next/script';

const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

export function GoogleAnalytics() {
  if (!GA_MEASUREMENT_ID) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_MEASUREMENT_ID}');
        `}
      </Script>
    </>
  );
}

// Track custom events
export function trackEvent(action: string, category: string, label?: string) {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
    });
  }
}
```

---

## 14. SEO სტრატეგია

### 14.1 Metadata Configuration

```typescript
// app/(marketing)/layout.tsx
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    default: 'Digital Menu | შექმენი ციფრული მენიუ წუთებში',
    template: '%s | Digital Menu',
  },
  description: 'QR კოდიანი ციფრული მენიუ კაფეებისა და რესტორნებისთვის. მარტივი მართვა, რეალურ დროში განახლება, უფასოდ დაწყება.',
  keywords: ['ციფრული მენიუ', 'QR მენიუ', 'რესტორანი', 'კაფე', 'მენიუ'],
  authors: [{ name: 'SandStudios' }],
  openGraph: {
    type: 'website',
    locale: 'ka_GE',
    url: 'https://digitalmenu.ge',
    siteName: 'Digital Menu',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Digital Menu',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
  },
  robots: {
    index: true,
    follow: true,
  },
};
```

### 14.2 Dynamic Metadata for Public Menus

```typescript
// app/m/[slug]/page.tsx
import { Metadata } from 'next';
import { prisma } from '@/lib/db';

interface Props {
  params: { slug: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const menu = await prisma.menu.findUnique({
    where: { slug: params.slug, status: 'PUBLISHED' },
    include: { user: { select: { businessName: true } } },
  });

  if (!menu) {
    return { title: 'Menu Not Found' };
  }

  return {
    title: `${menu.name} | ${menu.user.businessName}`,
    description: menu.description || `${menu.name} მენიუ - ${menu.user.businessName}`,
    openGraph: {
      title: menu.name,
      description: menu.description || undefined,
      images: menu.logo ? [{ url: menu.logo }] : undefined,
    },
  };
}
```

### 14.3 Sitemap Generation

```typescript
// app/sitemap.ts
import { MetadataRoute } from 'next';
import { prisma } from '@/lib/db';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL!;

  // Static pages
  const staticPages = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: 'weekly' as const, priority: 1 },
    { url: `${baseUrl}/pricing`, lastModified: new Date(), changeFrequency: 'monthly' as const, priority: 0.8 },
    { url: `${baseUrl}/demo`, lastModified: new Date(), changeFrequency: 'monthly' as const, priority: 0.7 },
  ];

  // Public menus
  const publishedMenus = await prisma.menu.findMany({
    where: { status: 'PUBLISHED' },
    select: { slug: true, updatedAt: true },
  });

  const menuPages = publishedMenus.map((menu) => ({
    url: `${baseUrl}/m/${menu.slug}`,
    lastModified: menu.updatedAt,
    changeFrequency: 'daily' as const,
    priority: 0.6,
  }));

  return [...staticPages, ...menuPages];
}
```

### 14.4 Structured Data (JSON-LD)

```typescript
// components/seo/menu-structured-data.tsx
interface Props {
  menu: Menu & { user: { businessName: string } };
  categories: (Category & { products: Product[] })[];
}

export function MenuStructuredData({ menu, categories }: Props) {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Menu',
    name: menu.name,
    description: menu.description,
    provider: {
      '@type': 'Restaurant',
      name: menu.user.businessName,
      address: menu.address,
      telephone: menu.phone,
    },
    hasMenuSection: categories.map((cat) => ({
      '@type': 'MenuSection',
      name: cat.nameKa,
      hasMenuItem: cat.products.map((product) => ({
        '@type': 'MenuItem',
        name: product.nameKa,
        description: product.descriptionKa,
        offers: {
          '@type': 'Offer',
          price: product.price.toString(),
          priceCurrency: menu.currency,
        },
      })),
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}
```

---

## 15. PWA კონფიგურაცია

### 15.1 Web App Manifest

```json
// public/manifest.json
{
  "name": "Digital Menu",
  "short_name": "DigiMenu",
  "description": "QR კოდიანი ციფრული მენიუ",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#000000",
  "orientation": "portrait",
  "icons": [
    {
      "src": "/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ]
}
```

### 15.2 Service Worker (next-pwa)

```typescript
// next.config.js
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/res\.cloudinary\.com\/.*/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'cloudinary-images',
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
        },
      },
    },
    {
      urlPattern: /^\/api\/public\/menus\/.*/i,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'menu-data',
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 60 * 5, // 5 minutes
        },
      },
    },
  ],
});

module.exports = withPWA({
  // Next.js config
});
```

---

## 16. Caching სტრატეგია

### 16.1 Redis Setup (Upstash)

```typescript
// lib/redis/client.ts
import { Redis } from '@upstash/redis';

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_URL!,
  token: process.env.UPSTASH_REDIS_TOKEN!,
});
```

### 16.2 Caching Patterns

```typescript
// lib/cache/menu-cache.ts
import { redis } from '@/lib/redis/client';
import { prisma } from '@/lib/db';

const CACHE_TTL = 60 * 5; // 5 minutes

export async function getPublicMenu(slug: string) {
  const cacheKey = `menu:public:${slug}`;

  // Try cache first
  const cached = await redis.get(cacheKey);
  if (cached) {
    return JSON.parse(cached as string);
  }

  // Fetch from database
  const menu = await prisma.menu.findUnique({
    where: { slug, status: 'PUBLISHED' },
    include: {
      categories: {
        where: { isVisible: true },
        orderBy: { sortOrder: 'asc' },
        include: {
          products: {
            where: { isAvailable: true },
            orderBy: { sortOrder: 'asc' },
            include: { variations: { orderBy: { sortOrder: 'asc' } } },
          },
        },
      },
      promotions: {
        where: { isActive: true },
        orderBy: { sortOrder: 'asc' },
      },
    },
  });

  if (menu) {
    await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(menu));
  }

  return menu;
}

export async function invalidateMenuCache(slug: string) {
  await redis.del(`menu:public:${slug}`);
}
```

### 16.3 Cache Invalidation on Updates

```typescript
// lib/api/menus/update.ts
export async function updateMenu(id: string, data: UpdateMenuInput) {
  const menu = await prisma.menu.update({
    where: { id },
    data,
  });

  // Invalidate cache
  await invalidateMenuCache(menu.slug);

  // Notify real-time subscribers
  await pusherServer.trigger(`menu-${id}`, 'menu:updated', menu);

  return menu;
}
```

---

## 17. Error Handling და Monitoring

### 17.1 Sentry Configuration

```typescript
// sentry.client.config.ts
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 1.0,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  integrations: [
    new Sentry.Replay(),
  ],
  environment: process.env.NODE_ENV,
});
```

### 17.2 Error Boundary

```typescript
// app/error.tsx
'use client';

import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <h2 className="text-2xl font-bold">დაფიქსირდა შეცდომა</h2>
      <p className="text-muted-foreground mt-2">
        გთხოვთ სცადოთ თავიდან ან დაგვიკავშირდეთ
      </p>
      <Button onClick={reset} className="mt-4">
        სცადე თავიდან
      </Button>
    </div>
  );
}
```

### 17.3 API Error Handling

```typescript
// lib/api/error-handler.ts
import { NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';

export function handleApiError(error: unknown) {
  console.error(error);

  // Validation errors
  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input',
          details: error.errors.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        },
      },
      { status: 400 }
    );
  }

  // Prisma errors
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'DUPLICATE_ENTRY',
            message: 'This value already exists',
          },
        },
        { status: 409 }
      );
    }
    if (error.code === 'P2025') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Resource not found',
          },
        },
        { status: 404 }
      );
    }
  }

  // Report to Sentry
  Sentry.captureException(error);

  // Generic error
  return NextResponse.json(
    {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      },
    },
    { status: 500 }
  );
}
```

---

## 18. Testing სტრატეგია

### 18.1 Vitest Configuration

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    include: ['**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      exclude: ['node_modules/', 'tests/'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
});
```

### 18.2 Test Examples

```typescript
// tests/components/product-card.test.tsx
import { render, screen } from '@testing-library/react';
import { ProductCard } from '@/components/admin/product-card';

const mockProduct = {
  id: '1',
  nameKa: 'ესპრესო',
  price: 3.5,
  isAvailable: true,
  isChefRecommended: false,
  image: null,
};

describe('ProductCard', () => {
  it('renders product name and price', () => {
    render(<ProductCard product={mockProduct} />);

    expect(screen.getByText('ესპრესო')).toBeInTheDocument();
    expect(screen.getByText('3.50 ₾')).toBeInTheDocument();
  });

  it('shows unavailable badge when product is not available', () => {
    render(<ProductCard product={{ ...mockProduct, isAvailable: false }} />);

    expect(screen.getByText('მიუწვდომელია')).toBeInTheDocument();
  });
});
```

```typescript
// tests/api/menus.test.ts
import { describe, it, expect, vi } from 'vitest';
import { createMenu } from '@/lib/api/menus/create';
import { prisma } from '@/lib/db';

vi.mock('@/lib/db', () => ({
  prisma: {
    menu: {
      create: vi.fn(),
      count: vi.fn(),
    },
  },
}));

describe('createMenu', () => {
  it('creates a menu with valid input', async () => {
    const mockMenu = { id: '1', name: 'Test Menu', slug: 'test-menu' };
    vi.mocked(prisma.menu.count).mockResolvedValue(0);
    vi.mocked(prisma.menu.create).mockResolvedValue(mockMenu);

    const result = await createMenu({
      userId: 'user-1',
      name: 'Test Menu',
      slug: 'test-menu',
    });

    expect(result).toEqual(mockMenu);
    expect(prisma.menu.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        name: 'Test Menu',
        slug: 'test-menu',
      }),
    });
  });
});
```

---

## 19. CI/CD Pipeline

### 19.1 GitHub Actions Workflow

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
        with:
          version: 8
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile
      - run: pnpm lint

  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
        with:
          version: 8
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile
      - run: pnpm test

  build:
    runs-on: ubuntu-latest
    needs: [lint, test]
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
        with:
          version: 8
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile
      - run: pnpm build
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
          # ... other env vars
```

### 19.2 Railway Deployment

Railway auto-deploys on push to main branch. Configuration via `railway.toml`:

```toml
# railway.toml
[build]
builder = "nixpacks"
buildCommand = "pnpm install && pnpm build"

[deploy]
startCommand = "pnpm start"
healthcheckPath = "/api/health"
healthcheckTimeout = 30
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 3
```

---

## 20. Deployment

### 20.1 Environment Variables

```env
# Database
DATABASE_URL=postgresql://...@neon.tech/digital_menu?sslmode=require

# NextAuth
NEXTAUTH_URL=https://digitalmenu.ge
NEXTAUTH_SECRET=your-secret-key

# OAuth
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
APPLE_CLIENT_ID=...
APPLE_CLIENT_SECRET=...

# Cloudinary
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...

# Pusher
PUSHER_APP_ID=...
PUSHER_KEY=...
PUSHER_SECRET=...
PUSHER_CLUSTER=eu
NEXT_PUBLIC_PUSHER_KEY=...
NEXT_PUBLIC_PUSHER_CLUSTER=eu

# Redis
UPSTASH_REDIS_URL=...
UPSTASH_REDIS_TOKEN=...

# Email
RESEND_API_KEY=...

# Sentry
SENTRY_DSN=...
NEXT_PUBLIC_SENTRY_DSN=...

# Analytics
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-...

# App
NEXT_PUBLIC_APP_URL=https://digitalmenu.ge
```

### 20.2 Infrastructure Diagram

```
                    ┌─────────────────┐
                    │   Cloudflare    │
                    │   (DNS + CDN)   │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │    Railway      │
                    │  (Next.js App)  │
                    └────────┬────────┘
                             │
         ┌───────────────────┼───────────────────┐
         │                   │                   │
┌────────▼────────┐ ┌────────▼────────┐ ┌────────▼────────┐
│      Neon       │ │    Upstash      │ │   Cloudinary    │
│   (PostgreSQL)  │ │    (Redis)      │ │   (Images)      │
└─────────────────┘ └─────────────────┘ └─────────────────┘
                             │
         ┌───────────────────┼───────────────────┐
         │                   │                   │
┌────────▼────────┐ ┌────────▼────────┐ ┌────────▼────────┐
│     Pusher      │ │     Resend      │ │     Sentry      │
│   (Real-time)   │ │    (Email)      │ │   (Monitoring)  │
└─────────────────┘ └─────────────────┘ └─────────────────┘
```

---

## 21. Security

### 21.1 Security Checklist

- [x] HTTPS everywhere (Railway automatic SSL)
- [x] JWT tokens with secure settings
- [x] Password hashing with bcrypt (cost factor 12)
- [x] Input validation with Zod on all endpoints
- [x] SQL injection prevention via Prisma ORM
- [x] XSS prevention via React's automatic escaping
- [x] CSRF protection via NextAuth.js
- [x] Rate limiting on auth endpoints
- [x] Secure session cookies (httpOnly, secure, sameSite)
- [x] Environment variables for secrets
- [x] Content Security Policy headers
- [x] Cloudinary signed uploads

### 21.2 Rate Limiting

```typescript
// middleware.ts (rate limiting section)
import { Ratelimit } from '@upstash/ratelimit';
import { redis } from '@/lib/redis/client';

const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '10 s'), // 10 requests per 10 seconds
});

// Apply to auth routes
if (req.nextUrl.pathname.startsWith('/api/auth')) {
  const ip = req.ip ?? '127.0.0.1';
  const { success } = await ratelimit.limit(ip);

  if (!success) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429 }
    );
  }
}
```

### 21.3 Security Headers

```typescript
// next.config.js
const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on',
  },
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN',
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    key: 'Referrer-Policy',
    value: 'origin-when-cross-origin',
  },
  {
    key: 'Content-Security-Policy',
    value: `
      default-src 'self';
      script-src 'self' 'unsafe-eval' 'unsafe-inline' *.googletagmanager.com;
      style-src 'self' 'unsafe-inline';
      img-src 'self' blob: data: res.cloudinary.com;
      font-src 'self';
      connect-src 'self' *.pusher.com wss://*.pusher.com *.sentry.io;
    `.replace(/\n/g, ''),
  },
];
```

---

## 22. Performance

### 22.1 Performance Targets

| Metric | Target |
|--------|--------|
| First Contentful Paint (FCP) | < 1.5s |
| Largest Contentful Paint (LCP) | < 2.5s |
| Cumulative Layout Shift (CLS) | < 0.1 |
| Time to Interactive (TTI) | < 3s |
| Core Web Vitals | All "Good" |

### 22.2 Optimization Strategies

1. **Image Optimization**
   - Cloudinary auto-format (WebP/AVIF)
   - Responsive images with srcset
   - Lazy loading with blur placeholder

2. **Code Splitting**
   - Dynamic imports for heavy components
   - Route-based code splitting (automatic in App Router)

3. **Caching**
   - Redis for frequently accessed data
   - Service Worker for static assets
   - ISR for public menu pages

4. **Database**
   - Proper indexes on all foreign keys
   - Query optimization with Prisma
   - Connection pooling via Neon

---

## 23. MVP Scope და Phases

### 23.1 Phase 1: MVP (სრული პლატფორმა)

**ვადა:** TBD

**შემადგენლობა:**
- [x] Marketing Website (Landing, Pricing, Demo)
- [x] Auth (Register, Login, Forgot Password, Google, Apple)
- [x] Admin Dashboard
- [x] Menu CRUD with Categories & Products
- [x] Promotions Management
- [x] Design Customization (Colors, Logo, Themes)
- [x] Multi-language support (KA, EN, RU)
- [x] QR Code Generation (PNG, SVG)
- [x] Public Menu with Search
- [x] Real-time updates
- [x] Basic Analytics
- [x] PWA Support
- [x] All 3 pricing tiers (Free, Starter, Pro)

**არ შედის MVP-ში:**
- Payment integration
- Automatic subscription billing
- PDF export for QR
- Advanced analytics dashboards
- White-label solution

### 23.2 Phase 2: Payment & Subscriptions

- BOG iPay / TBC Pay integration
- Recurring billing
- Invoice generation
- Subscription management UI

### 23.3 Phase 3: Advanced Features

- AI-powered menu suggestions
- Inventory management
- Table ordering integration
- Multi-location support
- API for third-party integrations

---

## 📝 დოკუმენტის ვერსიები

| ვერსია | თარიღი | ცვლილებები |
|--------|--------|------------|
| 2.0 | 2024-XX-XX | დეტალური ტექნიკური სპეციფიკაცია |
| 1.0 | 2024-XX-XX | საწყისი ფუნქციონალური სპეციფიკაცია |

---

**შემდგომი ნაბიჯები:**
1. Repository და Monorepo setup
2. Database schema და migrations
3. Auth implementation
4. Admin panel skeleton
5. კომპონენტების ბიბლიოთეკა
6. Marketing website
7. Public menu
8. QR generation
9. Real-time integration
10. Testing და QA
11. Deployment

---

*დოკუმენტი მომზადებულია SandStudios-ის მიერ*
