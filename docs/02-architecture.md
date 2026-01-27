# Architecture - სისტემის არქიტექტურა

> 🏗️ **Digital Menu პლატფორმის ტექნიკური არქიტექტურა და დიზაინის გადაწყვეტილებები**

---

## 📋 სარჩევი

1. [System Overview](#system-overview)
2. [Monorepo Structure](#monorepo-structure)
3. [Database Architecture](#database-architecture)
4. [Authentication & Authorization](#authentication--authorization)
5. [State Management](#state-management)
6. [API Architecture](#api-architecture)
7. [Caching Strategy](#caching-strategy)
8. [Real-time Architecture](#real-time-architecture)
9. [File Storage](#file-storage)
10. [Multi-language (i18n)](#multi-language-i18n)

---

## System Overview

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Browser                    Mobile Browser                   │
│    ↓                             ↓                          │
│  Next.js App (SSR/CSR)      Public Menu (SSR)               │
│    │                             │                          │
└────┼─────────────────────────────┼──────────────────────────┘
     │                             │
     ↓                             ↓
┌─────────────────────────────────────────────────────────────┐
│                      APPLICATION LAYER                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Marketing  │  │  Admin Panel │  │ Public Menu  │      │
│  │   Website    │  │  (Protected) │  │   (Public)   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│         │                  │                  │             │
│         └──────────────────┼──────────────────┘             │
│                            ↓                                │
│                    Next.js API Routes                       │
│                            ↓                                │
└────────────────────────────┼────────────────────────────────┘
                             │
     ┌───────────────────────┼───────────────────────┐
     │                       │                       │
     ↓                       ↓                       ↓
┌─────────┐          ┌──────────────┐        ┌──────────┐
│ NextAuth│          │   Prisma ORM │        │  Pusher  │
│  (Auth) │          │              │        │(Real-time│
└─────────┘          └──────────────┘        └──────────┘
     │                       │
     ↓                       ↓
┌─────────────────────────────────────────────────────────────┐
│                       DATA LAYER                             │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │ PostgreSQL  │  │    Redis     │  │ Cloudflare   │       │
│  │   (Neon)    │  │  (Upstash)   │  │  R2 Storage  │       │
│  └─────────────┘  └──────────────┘  └──────────────┘       │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Tech Stack Decision Matrix

| ტექნოლოგია | რატომ ავირჩიეთ | ალტერნატივა |
|------------|---------------|--------------|
| **Next.js 14** | App Router, RSC, Server Actions, SEO | Remix, SvelteKit |
| **Turborepo** | Monorepo management, Caching | Nx, Lerna |
| **PostgreSQL** | Relational data, ACID, Complex queries | MongoDB, MySQL |
| **Neon** | Serverless, Branching, Free tier | Supabase, PlanetScale |
| **Prisma** | Type-safe ORM, Migrations, Studio | Drizzle, TypeORM |
| **Upstash Redis** | Serverless, HTTP API, Free tier | Redis Labs, Vercel KV |
| **Cloudflare R2** | S3-compatible, No egress fees | AWS S3, Cloudinary |
| **Pusher** | WebSocket service, Simple API | Ably, Socket.io |
| **NextAuth.js** | OAuth providers, Session management | Clerk, Auth0 |
| **shadcn/ui** | Copy-paste components, Customizable | Chakra UI, MUI |

---

## Monorepo Structure

### Turborepo Setup

```
qr-menu/
├── apps/
│   └── web/                    # Main Next.js application
│       ├── app/                # Next.js App Router
│       ├── components/         # React components
│       ├── lib/                # Utilities and configs
│       ├── hooks/              # Custom hooks
│       ├── stores/             # Zustand stores
│       ├── styles/             # Global styles
│       ├── public/             # Static assets
│       └── package.json
│
├── packages/
│   ├── database/               # Shared database package
│   │   ├── prisma/
│   │   │   ├── schema.prisma   # Database schema
│   │   │   ├── migrations/     # Migration files
│   │   │   └── seed.ts         # Seed data
│   │   ├── src/
│   │   │   ├── client.ts       # Prisma client export
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   ├── config/                 # Shared configs
│   │   ├── eslint/
│   │   ├── typescript/
│   │   └── tailwind/
│   │
│   └── types/                  # Shared TypeScript types
│       ├── src/
│       │   ├── api.ts          # API types
│       │   ├── models.ts       # Model types
│       │   └── index.ts
│       └── package.json
│
├── turbo.json                  # Turborepo config
├── package.json                # Root package.json
├── pnpm-workspace.yaml         # pnpm workspace config
└── docs/                       # Documentation
```

### Next.js App Router Structure

```
apps/web/app/
├── (marketing)/                # Marketing site (public)
│   ├── page.tsx                # Landing page (/)
│   ├── pricing/
│   │   └── page.tsx            # Pricing page
│   ├── demo/
│   │   └── page.tsx            # Demo menu
│   └── layout.tsx              # Marketing layout
│
├── (auth)/                     # Authentication pages
│   ├── login/
│   │   └── page.tsx            # Login page
│   ├── register/
│   │   └── page.tsx            # Register page
│   ├── forgot-password/
│   │   └── page.tsx            # Password reset
│   └── layout.tsx              # Auth layout (centered)
│
├── admin/                      # Admin panel (protected)
│   ├── dashboard/
│   │   └── page.tsx            # Dashboard
│   ├── menus/
│   │   ├── page.tsx            # Menus list
│   │   ├── [id]/
│   │   │   ├── page.tsx        # Menu editor
│   │   │   ├── categories/     # Category management
│   │   │   ├── products/       # Product management
│   │   │   ├── promotions/     # Promotions management
│   │   │   └── settings/       # Menu settings
│   │   └── new/
│   │       └── page.tsx        # Create menu
│   ├── analytics/
│   │   └── page.tsx            # Analytics dashboard
│   ├── settings/
│   │   └── page.tsx            # Account settings
│   └── layout.tsx              # Admin layout (sidebar)
│
├── m/                          # Public menus
│   └── [slug]/
│       ├── page.tsx            # Public menu view
│       └── layout.tsx          # Minimal layout
│
├── api/                        # API routes
│   ├── auth/
│   │   └── [...nextauth]/
│   │       └── route.ts        # NextAuth handler
│   ├── menus/
│   │   ├── route.ts            # GET, POST /api/menus
│   │   └── [id]/
│   │       ├── route.ts        # GET, PUT, DELETE
│   │       ├── categories/
│   │       ├── products/
│   │       ├── promotions/
│   │       └── publish/
│   ├── upload/
│   │   └── route.ts            # Image upload to R2
│   └── qr/
│       └── [menuId]/
│           └── route.ts        # QR code generation
│
├── layout.tsx                  # Root layout
├── globals.css                 # Global styles
└── providers.tsx               # Context providers
```

---

## Database Architecture

### Entity Relationship Diagram

```
┌─────────────┐
│    User     │
│─────────────│
│ id          │──┐
│ email       │  │
│ name        │  │
│ plan        │  │ 1:N
│ createdAt   │  │
└─────────────┘  │
                 │
                 ↓
┌─────────────────────┐
│       Menu          │
│─────────────────────│
│ id                  │──┐
│ userId (FK)         │  │
│ name                │  │
│ slug                │  │
│ status              │  │ 1:N
│ publishedAt         │  │
│ designSettings JSON │  │
└─────────────────────┘  │
                         │
        ┌────────────────┼────────────────┐
        │                │                │
        ↓                ↓                ↓
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│  Category    │  │  Promotion   │  │  MenuView    │
│──────────────│  │──────────────│  │──────────────│
│ id           │  │ id           │  │ id           │
│ menuId (FK)  │  │ menuId (FK)  │  │ menuId (FK)  │
│ nameKa       │  │ title        │  │ timestamp    │
│ nameEn       │  │ discount     │  │ language     │
│ nameRu       │  │ validFrom    │  │ userAgent    │
│ sortOrder    │  │ validTo      │  │ country      │
└──────────────┘  └──────────────┘  └──────────────┘
        │
        │ 1:N
        ↓
┌─────────────────────┐
│      Product        │
│─────────────────────│
│ id                  │──┐
│ categoryId (FK)     │  │
│ nameKa              │  │
│ nameEn              │  │ 1:N
│ nameRu              │  │
│ descriptionKa       │  │
│ price               │  │
│ image               │  │
│ allergens []        │  │
│ sortOrder           │  │
└─────────────────────┘  │
                         │
                         ↓
               ┌──────────────────┐
               │ ProductVariation │
               │──────────────────│
               │ id               │
               │ productId (FK)   │
               │ nameKa           │
               │ nameEn           │
               │ nameRu           │
               │ price            │
               │ sortOrder        │
               └──────────────────┘
```

### Prisma Schema (Simplified)

```prisma
// packages/database/prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ================== ENUMS ==================

enum Plan {
  FREE
  STARTER
  PRO
}

enum MenuStatus {
  DRAFT
  PUBLISHED
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

// ================== MODELS ==================

model User {
  id            String   @id @default(cuid())
  email         String   @unique
  password      String?
  name          String
  businessName  String?
  plan          Plan     @default(FREE)

  // OAuth
  googleId      String?  @unique

  // Metadata
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  // Relations
  menus         Menu[]
  sessions      Session[]
  accounts      Account[]

  @@index([email])
}

model Menu {
  id              String      @id @default(cuid())
  userId          String

  // Basic info
  name            String
  slug            String      @unique
  description     String?

  // Status
  status          MenuStatus  @default(DRAFT)
  publishedAt     DateTime?

  // Design (JSON)
  designSettings  Json        @default("{}")

  // Metadata
  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt

  // Relations
  user            User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  categories      Category[]
  promotions      Promotion[]
  views           MenuView[]

  @@index([userId])
  @@index([slug])
  @@index([status])
}

model Category {
  id          String    @id @default(cuid())
  menuId      String

  // Multi-language names
  nameKa      String
  nameEn      String?
  nameRu      String?

  // Display
  sortOrder   Int       @default(0)
  isActive    Boolean   @default(true)

  // Metadata
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  // Relations
  menu        Menu      @relation(fields: [menuId], references: [id], onDelete: Cascade)
  products    Product[]

  @@index([menuId])
  @@index([sortOrder])
}

model Product {
  id              String              @id @default(cuid())
  categoryId      String

  // Multi-language content
  nameKa          String
  nameEn          String?
  nameRu          String?
  descriptionKa   String?
  descriptionEn   String?
  descriptionRu   String?

  // Pricing
  price           Decimal             @db.Decimal(10, 2)
  currency        String              @default("GEL")

  // Media
  image           String?

  // Features
  allergens       Allergen[]
  isAvailable     Boolean             @default(true)

  // Display
  sortOrder       Int                 @default(0)

  // Metadata
  createdAt       DateTime            @default(now())
  updatedAt       DateTime            @updatedAt

  // Relations
  category        Category            @relation(fields: [categoryId], references: [id], onDelete: Cascade)
  variations      ProductVariation[]

  @@index([categoryId])
  @@index([sortOrder])
}

model ProductVariation {
  id          String    @id @default(cuid())
  productId   String

  // Multi-language names
  nameKa      String
  nameEn      String?
  nameRu      String?

  // Pricing
  price       Decimal   @db.Decimal(10, 2)

  // Display
  sortOrder   Int       @default(0)

  // Metadata
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  // Relations
  product     Product   @relation(fields: [productId], references: [id], onDelete: Cascade)

  @@index([productId])
}

model Promotion {
  id          String    @id @default(cuid())
  menuId      String

  // Content
  title       String
  description String?
  image       String?

  // Discount
  discount    Int       // Percentage

  // Validity
  validFrom   DateTime
  validTo     DateTime
  isActive    Boolean   @default(true)

  // Metadata
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  // Relations
  menu        Menu      @relation(fields: [menuId], references: [id], onDelete: Cascade)

  @@index([menuId])
  @@index([validFrom, validTo])
}

model MenuView {
  id          String    @id @default(cuid())
  menuId      String

  // Analytics
  language    Language?
  userAgent   String?
  country     String?
  referrer    String?

  // Timestamp
  viewedAt    DateTime  @default(now())

  // Relations
  menu        Menu      @relation(fields: [menuId], references: [id], onDelete: Cascade)

  @@index([menuId])
  @@index([viewedAt])
}

// NextAuth models
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
  @@index([userId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
}
```

### Database Indexes

```sql
-- Performance-critical indexes

-- User lookups
CREATE INDEX idx_user_email ON User(email);
CREATE INDEX idx_user_plan ON User(plan);

-- Menu queries
CREATE INDEX idx_menu_user ON Menu(userId);
CREATE INDEX idx_menu_slug ON Menu(slug);
CREATE INDEX idx_menu_status ON Menu(status);
CREATE INDEX idx_menu_published ON Menu(publishedAt);

-- Category sorting
CREATE INDEX idx_category_menu_order ON Category(menuId, sortOrder);

-- Product queries
CREATE INDEX idx_product_category_order ON Product(categoryId, sortOrder);
CREATE INDEX idx_product_available ON Product(isAvailable);

-- Analytics
CREATE INDEX idx_menuview_menu_date ON MenuView(menuId, viewedAt);
```

---

## Authentication & Authorization

### NextAuth.js Configuration

```typescript
// apps/web/lib/auth/config.ts

import NextAuth from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import CredentialsProvider from "next-auth/providers/credentials"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@repo/database"
import bcrypt from "bcryptjs"

export const authOptions = {
  adapter: PrismaAdapter(prisma),

  providers: [
    // Email/Password
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Invalid credentials")
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email }
        })

        if (!user || !user.password) {
          throw new Error("User not found")
        }

        const isValid = await bcrypt.compare(
          credentials.password,
          user.password
        )

        if (!isValid) {
          throw new Error("Invalid password")
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          plan: user.plan
        }
      }
    }),

    // Google OAuth
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!
    })
  ],

  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60 // 30 days
  },

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.plan = user.plan
      }
      return token
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id
        session.user.plan = token.plan
      }
      return session
    }
  },

  pages: {
    signIn: "/login",
    signOut: "/",
    error: "/login"
  }
}

export default NextAuth(authOptions)
```

### Plan-Based Authorization

```typescript
// apps/web/lib/auth/permissions.ts

import { Plan } from "@prisma/client"

export const PLAN_LIMITS = {
  FREE: {
    maxMenus: 1,
    maxCategories: 3,
    maxProducts: 15,
    maxProductsPerCategory: null
  },
  STARTER: {
    maxMenus: 3,
    maxCategories: Infinity,
    maxProducts: Infinity,
    maxProductsPerCategory: null
  },
  PRO: {
    maxMenus: Infinity,
    maxCategories: Infinity,
    maxProducts: Infinity,
    maxProductsPerCategory: null
  }
} as const

export const PLAN_FEATURES = {
  FREE: [
    "basic_qr",
    "single_menu"
  ],
  STARTER: [
    "basic_qr",
    "multiple_menus",
    "promotions",
    "custom_branding",
    "custom_colors"
  ],
  PRO: [
    "basic_qr",
    "qr_with_logo",
    "multiple_menus",
    "promotions",
    "custom_branding",
    "custom_colors",
    "multilingual",
    "allergens",
    "analytics",
    "priority_support"
  ]
} as const

// Check if user can create menu
export function canCreateMenu(user: { plan: Plan }, currentMenuCount: number): boolean {
  const limit = PLAN_LIMITS[user.plan].maxMenus
  return currentMenuCount < limit
}

// Check if user has feature
export function hasFeature(plan: Plan, feature: string): boolean {
  return PLAN_FEATURES[plan].includes(feature)
}

// Check plan limits
export async function checkPlanLimits(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      menus: {
        include: {
          categories: {
            include: {
              products: true
            }
          }
        }
      }
    }
  })

  if (!user) throw new Error("User not found")

  const limits = PLAN_LIMITS[user.plan]

  return {
    canCreateMenu: user.menus.length < limits.maxMenus,
    menuCount: user.menus.length,
    menuLimit: limits.maxMenus,
    // ... other checks
  }
}
```

### Middleware (Route Protection)

```typescript
// apps/web/middleware.ts

import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getToken } from "next-auth/jwt"

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Protected routes
  if (pathname.startsWith("/admin")) {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET
    })

    if (!token) {
      const url = new URL("/login", request.url)
      url.searchParams.set("callbackUrl", pathname)
      return NextResponse.redirect(url)
    }
  }

  // Auth pages redirect if logged in
  if (pathname.startsWith("/login") || pathname.startsWith("/register")) {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET
    })

    if (token) {
      return NextResponse.redirect(new URL("/admin/dashboard", request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/login",
    "/register"
  ]
}
```

---

## State Management

### Server State (TanStack Query)

```typescript
// apps/web/lib/api/query-client.ts

import { QueryClient } from "@tanstack/react-query"

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 minute
      refetchOnWindowFocus: false,
      retry: 1
    }
  }
})

// Query keys factory
export const queryKeys = {
  menus: {
    all: ["menus"] as const,
    detail: (id: string) => ["menus", id] as const,
    categories: (menuId: string) => ["menus", menuId, "categories"] as const,
    products: (menuId: string) => ["menus", menuId, "products"] as const,
    promotions: (menuId: string) => ["menus", menuId, "promotions"] as const
  },
  analytics: {
    menuViews: (menuId: string) => ["analytics", "views", menuId] as const
  }
}
```

### Client State (Zustand)

```typescript
// apps/web/stores/ui-store.ts

import { create } from "zustand"

interface UIStore {
  sidebarOpen: boolean
  activeMenuId: string | null

  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
  setActiveMenuId: (id: string | null) => void
}

export const useUIStore = create<UIStore>((set) => ({
  sidebarOpen: true,
  activeMenuId: null,

  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setActiveMenuId: (id) => set({ activeMenuId: id })
}))
```

### Form State (React Hook Form + Zod)

```typescript
// apps/web/lib/validations/menu.ts

import { z } from "zod"

export const createMenuSchema = z.object({
  name: z.string().min(3, "სახელი უნდა შეიცავდეს მინ. 3 სიმბოლოს"),
  slug: z.string()
    .min(3)
    .max(50)
    .regex(/^[a-z0-9-]+$/, "მხოლოდ lowercase ასოები, ციფრები და -"),
  description: z.string().optional()
})

export type CreateMenuInput = z.infer<typeof createMenuSchema>

// Usage in component
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"

const form = useForm<CreateMenuInput>({
  resolver: zodResolver(createMenuSchema),
  defaultValues: {
    name: "",
    slug: "",
    description: ""
  }
})
```

---

## API Architecture

### REST Conventions

```
GET    /api/menus           → List user's menus
POST   /api/menus           → Create new menu
GET    /api/menus/:id       → Get menu details
PUT    /api/menus/:id       → Update menu
DELETE /api/menus/:id       → Delete menu
POST   /api/menus/:id/publish → Publish/unpublish menu

GET    /api/menus/:id/categories       → List categories
POST   /api/menus/:id/categories       → Create category
PUT    /api/categories/:id             → Update category
DELETE /api/categories/:id             → Delete category
POST   /api/categories/reorder         → Reorder categories

GET    /api/menus/:id/products         → List products
POST   /api/categories/:id/products    → Create product
PUT    /api/products/:id               → Update product
DELETE /api/products/:id               → Delete product
POST   /api/products/reorder           → Reorder products
```

### Standard Response Format

```typescript
// Success
{
  success: true,
  data: {...} | [...]
}

// Error
{
  success: false,
  error: {
    code: "UNAUTHORIZED",
    message: "შეცდომის აღწერა",
    details: [] // optional validation errors
  }
}

// Paginated
{
  success: true,
  data: [...],
  pagination: {
    page: 1,
    limit: 20,
    total: 150,
    totalPages: 8
  }
}
```

### API Route Pattern

```typescript
// apps/web/app/api/menus/route.ts

import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth/config"
import { prisma } from "@repo/database"
import { createMenuSchema } from "@/lib/validations/menu"
import { canCreateMenu } from "@/lib/auth/permissions"

// GET /api/menus
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
        { status: 401 }
      )
    }

    const menus = await prisma.menu.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" }
    })

    return NextResponse.json({
      success: true,
      data: menus
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: error.message } },
      { status: 500 }
    )
  }
}

// POST /api/menus
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
        { status: 401 }
      )
    }

    // Parse and validate body
    const body = await request.json()
    const validation = createMenuSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid input",
            details: validation.error.errors
          }
        },
        { status: 400 }
      )
    }

    // Check plan limits
    const menuCount = await prisma.menu.count({
      where: { userId: session.user.id }
    })

    if (!canCreateMenu({ plan: session.user.plan }, menuCount)) {
      return NextResponse.json(
        { success: false, error: { code: "PLAN_LIMIT", message: "Plan limit reached" } },
        { status: 403 }
      )
    }

    // Create menu
    const menu = await prisma.menu.create({
      data: {
        ...validation.data,
        userId: session.user.id
      }
    })

    return NextResponse.json(
      { success: true, data: menu },
      { status: 201 }
    )
  } catch (error) {
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: error.message } },
      { status: 500 }
    )
  }
}
```

---

## Caching Strategy

### 3-Layer Caching

```
┌─────────────────────────────────────────┐
│         Browser Cache                    │
│  (Service Worker - 30 days)             │
└─────────────┬───────────────────────────┘
              │ Miss
              ↓
┌─────────────────────────────────────────┐
│      Redis Cache (Upstash)              │
│  (5 minutes TTL for public menus)       │
└─────────────┬───────────────────────────┘
              │ Miss
              ↓
┌─────────────────────────────────────────┐
│    Database (PostgreSQL - Neon)         │
│  (Source of truth)                      │
└─────────────────────────────────────────┘
```

### Redis Caching Implementation

```typescript
// apps/web/lib/cache/redis.ts

import { Redis } from "@upstash/redis"

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!
})

// Cache keys
export const cacheKeys = {
  publicMenu: (slug: string) => `menu:public:${slug}`,
  menuCategories: (menuId: string) => `menu:${menuId}:categories`,
  menuProducts: (menuId: string) => `menu:${menuId}:products`
}

// Cache TTLs (seconds)
export const cacheTTL = {
  publicMenu: 5 * 60,      // 5 minutes
  menuData: 2 * 60,        // 2 minutes
  analytics: 10 * 60       // 10 minutes
}
```

### Cache Pattern Example

```typescript
// apps/web/lib/cache/menu-cache.ts

import { redis, cacheKeys, cacheTTL } from "./redis"
import { prisma } from "@repo/database"

export async function getPublicMenu(slug: string) {
  // Try cache first
  const cacheKey = cacheKeys.publicMenu(slug)
  const cached = await redis.get(cacheKey)

  if (cached) {
    console.log(`[Cache HIT] ${cacheKey}`)
    return cached
  }

  console.log(`[Cache MISS] ${cacheKey}`)

  // Fetch from database
  const menu = await prisma.menu.findUnique({
    where: { slug, status: "PUBLISHED" },
    include: {
      categories: {
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
        include: {
          products: {
            where: { isAvailable: true },
            orderBy: { sortOrder: "asc" },
            include: {
              variations: {
                orderBy: { sortOrder: "asc" }
              }
            }
          }
        }
      },
      promotions: {
        where: {
          isActive: true,
          validFrom: { lte: new Date() },
          validTo: { gte: new Date() }
        }
      }
    }
  })

  if (!menu) return null

  // Cache for 5 minutes
  await redis.setex(cacheKey, cacheTTL.publicMenu, menu)

  return menu
}

export async function invalidateMenuCache(slug: string) {
  const cacheKey = cacheKeys.publicMenu(slug)
  await redis.del(cacheKey)
  console.log(`[Cache INVALIDATED] ${cacheKey}`)
}
```

### TanStack Query (Client-Side)

```typescript
// apps/web/hooks/use-menus.ts

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { queryKeys } from "@/lib/api/query-client"

export function useMenus() {
  return useQuery({
    queryKey: queryKeys.menus.all,
    queryFn: async () => {
      const res = await fetch("/api/menus")
      if (!res.ok) throw new Error("Failed to fetch menus")
      const data = await res.json()
      return data.data
    }
  })
}

export function useCreateMenu() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateMenuInput) => {
      const res = await fetch("/api/menus", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      })
      if (!res.ok) throw new Error("Failed to create menu")
      const result = await res.json()
      return result.data
    },
    onSuccess: () => {
      // Invalidate menus list
      queryClient.invalidateQueries({ queryKey: queryKeys.menus.all })
    }
  })
}
```

---

## Real-time Architecture

### Pusher Integration

```typescript
// apps/web/lib/pusher/server.ts (Server-side)

import Pusher from "pusher"

export const pusherServer = new Pusher({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.NEXT_PUBLIC_PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.PUSHER_CLUSTER!,
  useTLS: true
})

// Broadcast menu update
export async function broadcastMenuUpdate(menuId: string, data: any) {
  await pusherServer.trigger(`menu-${menuId}`, "menu:updated", data)
}

// Broadcast product update
export async function broadcastProductUpdate(menuId: string, product: any) {
  await pusherServer.trigger(`menu-${menuId}`, "product:updated", product)
}
```

```typescript
// apps/web/lib/pusher/client.ts (Client-side)

import PusherClient from "pusher-js"

export const pusherClient = new PusherClient(
  process.env.NEXT_PUBLIC_PUSHER_KEY!,
  {
    cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!
  }
)
```

### Real-time Sync Pattern

```typescript
// apps/web/components/admin/menu-editor.tsx

"use client"

import { useEffect } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { pusherClient } from "@/lib/pusher/client"
import { queryKeys } from "@/lib/api/query-client"

export function MenuEditor({ menuId }: { menuId: string }) {
  const queryClient = useQueryClient()

  useEffect(() => {
    // Subscribe to menu channel
    const channel = pusherClient.subscribe(`menu-${menuId}`)

    // Listen for product updates
    channel.bind("product:updated", (data: any) => {
      console.log("Product updated via Pusher:", data)

      // Update React Query cache
      queryClient.setQueryData(
        queryKeys.menus.products(menuId),
        (old: any) => {
          if (!old) return old
          return old.map((p: any) =>
            p.id === data.id ? { ...p, ...data } : p
          )
        }
      )
    })

    // Listen for menu updates
    channel.bind("menu:updated", (data: any) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.menus.detail(menuId)
      })
    })

    // Cleanup
    return () => {
      channel.unbind_all()
      channel.unsubscribe()
    }
  }, [menuId, queryClient])

  return <div>...</div>
}
```

---

## File Storage

### Cloudflare R2 Configuration

```typescript
// apps/web/lib/storage/r2.ts

import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3"

// R2 is S3-compatible
export const r2Client = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!
  }
})

export const R2_BUCKET = process.env.R2_BUCKET_NAME!
export const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL! // e.g. https://cdn.digitalmenu.ge

// Upload file
export async function uploadToR2(
  file: File,
  path: string // e.g. "products/abc123.jpg"
): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer())

  await r2Client.send(
    new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: path,
      Body: buffer,
      ContentType: file.type
    })
  )

  return `${R2_PUBLIC_URL}/${path}`
}

// Delete file
export async function deleteFromR2(path: string): Promise<void> {
  await r2Client.send(
    new DeleteObjectCommand({
      Bucket: R2_BUCKET,
      Key: path
    })
  )
}
```

### Upload API Route

```typescript
// apps/web/app/api/upload/route.ts

import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth/config"
import { uploadToR2 } from "@/lib/storage/r2"
import { nanoid } from "nanoid"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED" } },
        { status: 401 }
      )
    }

    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json(
        { success: false, error: { code: "NO_FILE" } },
        { status: 400 }
      )
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"]
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: { code: "INVALID_FILE_TYPE" } },
        { status: 400 }
      )
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: { code: "FILE_TOO_LARGE" } },
        { status: 400 }
      )
    }

    // Generate unique filename
    const ext = file.name.split(".").pop()
    const filename = `${nanoid()}.${ext}`
    const path = `products/${session.user.id}/${filename}`

    // Upload to R2
    const url = await uploadToR2(file, path)

    return NextResponse.json({
      success: true,
      data: { url, path }
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: { code: "UPLOAD_FAILED", message: error.message } },
      { status: 500 }
    )
  }
}
```

---

## Multi-language (i18n)

### next-intl Configuration

```typescript
// apps/web/i18n/config.ts

export const locales = ["ka", "en", "ru"] as const
export type Locale = (typeof locales)[number]

export const defaultLocale: Locale = "ka"

export const localeNames: Record<Locale, string> = {
  ka: "ქართული",
  en: "English",
  ru: "Русский"
}
```

### Content Storage Strategy

```
UI Strings (Buttons, Labels):
→ Stored in JSON files: /public/locales/{locale}/{namespace}.json
→ Managed with next-intl

Menu Content (Product names, descriptions):
→ Stored in database: nameKa, nameEn, nameRu fields
→ Fallback: if nameEn is null, show nameKa
```

### Translation Hook

```typescript
// apps/web/hooks/use-translation.ts

import { useLocale } from "next-intl"
import type { Locale } from "@/i18n/config"

export function useMenuTranslation() {
  const locale = useLocale() as Locale

  // Get translated field
  function getField<T extends Record<string, any>>(
    obj: T,
    field: string
  ): string {
    const localizedField = `${field}${locale.charAt(0).toUpperCase()}${locale.slice(1)}`
    return obj[localizedField] || obj[`${field}Ka`] || ""
  }

  return { getField, locale }
}

// Usage
const { getField } = useMenuTranslation()
const productName = getField(product, "name") // Returns nameEn or nameKa (fallback)
```

### Language Switcher

```typescript
// apps/web/components/public/language-switcher.tsx

"use client"

import { usePathname, useRouter } from "next/navigation"
import { locales, localeNames, type Locale } from "@/i18n/config"

export function LanguageSwitcher() {
  const pathname = usePathname()
  const router = useRouter()

  const changeLanguage = (newLocale: Locale) => {
    // Store preference
    document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000`

    // Reload page to apply
    router.refresh()
  }

  return (
    <div className="flex gap-2">
      {locales.map((locale) => (
        <button
          key={locale}
          onClick={() => changeLanguage(locale)}
          className="px-3 py-1 rounded hover:bg-gray-100"
        >
          {localeNames[locale]}
        </button>
      ))}
    </div>
  )
}
```

---

## Performance Considerations

### Database Query Optimization

```typescript
// ❌ Bad - N+1 query problem
const menus = await prisma.menu.findMany()
for (const menu of menus) {
  const categories = await prisma.category.findMany({ where: { menuId: menu.id } })
}

// ✅ Good - Single query with include
const menus = await prisma.menu.findMany({
  include: {
    categories: {
      include: {
        products: true
      }
    }
  }
})
```

### Image Optimization

```typescript
// Use Next.js Image component
import Image from "next/image"

<Image
  src={product.image}
  alt={product.nameKa}
  width={400}
  height={400}
  loading="lazy"
  quality={85}
/>
```

### Route Optimization

```typescript
// Mark routes as static when possible
export const dynamic = "force-static"
export const revalidate = 3600 // 1 hour

// Or use ISR for public menus
export const revalidate = 300 // 5 minutes
```

---

## Security Best Practices

### Input Validation

```typescript
// Always validate with Zod
import { z } from "zod"

const schema = z.object({
  email: z.string().email(),
  name: z.string().min(2).max(50)
})

const result = schema.safeParse(input)
if (!result.success) {
  throw new Error("Invalid input")
}
```

### SQL Injection Protection

```typescript
// ✅ Prisma prevents SQL injection automatically
const user = await prisma.user.findUnique({
  where: { email: userInput } // Safe - Prisma uses parameterized queries
})

// ❌ Never use raw SQL with user input
await prisma.$executeRaw`SELECT * FROM users WHERE email = ${userInput}` // Dangerous!
```

### Authorization Checks

```typescript
// Always check ownership
const menu = await prisma.menu.findUnique({
  where: { id: menuId, userId: session.user.id } // Important!
})

if (!menu) {
  throw new Error("Not found or unauthorized")
}
```

---

**ბოლო განახლება:** 2026-01-26
