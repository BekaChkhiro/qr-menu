# Development Guide - დეველოპმენტის გაიდი

> 🛠️ **პრაქტიკული გაიდი ყოველდღიური დეველოპმენტისთვის**

---

## 📋 სარჩევი

1. [Development Workflow](#development-workflow)
2. [Adding New Features](#adding-new-features)
3. [Database Changes](#database-changes)
4. [API Development](#api-development)
5. [Component Development](#component-development)
6. [Testing](#testing)
7. [Git Workflow](#git-workflow)
8. [Common Tasks](#common-tasks)

---

## Development Workflow

### Daily Development Cycle

```bash
# 1. დილით - Pull latest changes
git checkout develop
git pull origin develop

# 2. შექმენი feature branch
git checkout -b feature/menu-filtering

# 3. Start dev server
pnpm dev

# 4. Development...
# - Write code
# - Test locally
# - Commit often

# 5. Before pushing
pnpm lint          # Check linting
pnpm type-check    # Check TypeScript
pnpm test          # Run tests

# 6. Push and create PR
git push origin feature/menu-filtering
# Create Pull Request on GitHub
```

### Code Quality Checks

```bash
# Linting
pnpm lint          # ESLint check
pnpm lint:fix      # Auto-fix issues

# Type Checking
pnpm type-check    # TypeScript check

# Formatting
pnpm format        # Prettier format
pnpm format:check  # Check formatting

# All checks at once
pnpm validate      # Runs: lint, type-check, format:check
```

---

## Adding New Features

### Feature Development Checklist

```markdown
□ შექმენი feature branch
□ განახლე/შექმენი Zod validation schemas
□ განახლე Prisma schema (თუ საჭიროა)
□ შექმენი/განახლე API routes
□ შექმენი React hooks
□ შექმენი UI components
□ დაამატე error handling
□ დაწერე tests
□ განახლე documentation
□ შექმენი Pull Request
```

### Example: Adding Product Filtering

#### 1. შექმენი Feature Branch

```bash
git checkout -b feature/product-filtering
```

#### 2. განახლე Validation Schema

```typescript
// apps/web/lib/validations/product.ts

export const productFilterSchema = z.object({
  categoryId: z.string().optional(),
  search: z.string().optional(),
  minPrice: z.number().optional(),
  maxPrice: z.number().optional(),
  allergens: z.array(z.nativeEnum(Allergen)).optional()
})

export type ProductFilterInput = z.infer<typeof productFilterSchema>
```

#### 3. შექმენი API Route

```typescript
// apps/web/app/api/menus/[id]/products/route.ts

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json(
      { success: false, error: { code: "UNAUTHORIZED" } },
      { status: 401 }
    )
  }

  // Parse query params
  const searchParams = request.nextUrl.searchParams
  const filters = productFilterSchema.parse({
    categoryId: searchParams.get("categoryId"),
    search: searchParams.get("search"),
    minPrice: searchParams.get("minPrice")
      ? Number(searchParams.get("minPrice"))
      : undefined,
    maxPrice: searchParams.get("maxPrice")
      ? Number(searchParams.get("maxPrice"))
      : undefined
  })

  // Build where clause
  const where: any = {
    category: { menuId: params.id }
  }

  if (filters.categoryId) {
    where.categoryId = filters.categoryId
  }

  if (filters.search) {
    where.OR = [
      { nameKa: { contains: filters.search, mode: "insensitive" } },
      { nameEn: { contains: filters.search, mode: "insensitive" } },
      { nameRu: { contains: filters.search, mode: "insensitive" } }
    ]
  }

  if (filters.minPrice || filters.maxPrice) {
    where.price = {}
    if (filters.minPrice) where.price.gte = filters.minPrice
    if (filters.maxPrice) where.price.lte = filters.maxPrice
  }

  const products = await prisma.product.findMany({
    where,
    include: {
      category: true,
      variations: true
    },
    orderBy: { sortOrder: "asc" }
  })

  return NextResponse.json({
    success: true,
    data: products
  })
}
```

#### 4. შექმენი React Hook

```typescript
// apps/web/hooks/use-product-filter.ts

import { useQuery } from "@tanstack/react-query"
import { queryKeys } from "@/lib/api/query-client"
import type { ProductFilterInput } from "@/lib/validations/product"

export function useFilteredProducts(
  menuId: string,
  filters: ProductFilterInput
) {
  return useQuery({
    queryKey: [...queryKeys.menus.products(menuId), filters],
    queryFn: async () => {
      const params = new URLSearchParams()

      if (filters.categoryId) params.set("categoryId", filters.categoryId)
      if (filters.search) params.set("search", filters.search)
      if (filters.minPrice) params.set("minPrice", filters.minPrice.toString())
      if (filters.maxPrice) params.set("maxPrice", filters.maxPrice.toString())

      const res = await fetch(
        `/api/menus/${menuId}/products?${params.toString()}`
      )

      if (!res.ok) throw new Error("Failed to fetch products")

      const data = await res.json()
      return data.data
    },
    enabled: !!menuId
  })
}
```

#### 5. შექმენი UI Component

```typescript
// apps/web/components/admin/product-filter.tsx

"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import type { ProductFilterInput } from "@/lib/validations/product"

interface ProductFilterProps {
  onFilterChange: (filters: ProductFilterInput) => void
  categories: Array<{ id: string; nameKa: string }>
}

export function ProductFilter({ onFilterChange, categories }: ProductFilterProps) {
  const [filters, setFilters] = useState<ProductFilterInput>({})

  const handleSearchChange = (search: string) => {
    const newFilters = { ...filters, search }
    setFilters(newFilters)
    onFilterChange(newFilters)
  }

  const handleCategoryChange = (categoryId: string) => {
    const newFilters = { ...filters, categoryId }
    setFilters(newFilters)
    onFilterChange(newFilters)
  }

  const handleReset = () => {
    setFilters({})
    onFilterChange({})
  }

  return (
    <div className="flex gap-4 p-4 bg-white rounded-lg shadow">
      <Input
        placeholder="ძებნა..."
        value={filters.search || ""}
        onChange={(e) => handleSearchChange(e.target.value)}
        className="max-w-xs"
      />

      <Select
        value={filters.categoryId}
        onValueChange={handleCategoryChange}
      >
        <option value="">ყველა კატეგორია</option>
        {categories.map((cat) => (
          <option key={cat.id} value={cat.id}>
            {cat.nameKa}
          </option>
        ))}
      </Select>

      <Button variant="outline" onClick={handleReset}>
        გასუფთავება
      </Button>
    </div>
  )
}
```

#### 6. Integration

```typescript
// apps/web/app/admin/menus/[id]/products/page.tsx

export default function ProductsPage({ params }: { params: { id: string } }) {
  const [filters, setFilters] = useState<ProductFilterInput>({})

  const { data: products, isLoading } = useFilteredProducts(params.id, filters)
  const { data: categories } = useCategories(params.id)

  return (
    <div>
      <ProductFilter
        categories={categories || []}
        onFilterChange={setFilters}
      />

      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <ProductList products={products || []} />
      )}
    </div>
  )
}
```

---

## Database Changes

### Prisma Workflow

#### 1. Schema-ის შეცვლა

```prisma
// packages/database/prisma/schema.prisma

model Product {
  // ახალი ველის დამატება
  isVegetarian Boolean @default(false)
  isFeatured   Boolean @default(false)

  // ახალი index
  @@index([isFeatured])
}
```

#### 2. Migration-ის შექმნა (Production)

```bash
# Production-ისთვის - შექმენი migration
pnpm db:migrate

# ან დეტალურად
cd packages/database
pnpm prisma migrate dev --name add_product_flags
```

#### 3. Schema Push (Development)

```bash
# Development-ისთვის - სწრაფი პუში
pnpm db:push

# ან
cd packages/database
pnpm prisma db push
```

#### 4. Prisma Client-ის Regeneration

```bash
# Auto-regenerates after migrate/push
# Manual regeneration:
pnpm prisma generate
```

#### 5. Seed Data Update (Optional)

```typescript
// packages/database/prisma/seed.ts

import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  // Create test user
  const user = await prisma.user.upsert({
    where: { email: "test@digitalmenu.ge" },
    update: {},
    create: {
      email: "test@digitalmenu.ge",
      name: "Test User",
      password: await bcrypt.hash("Test1234!", 12),
      plan: "FREE"
    }
  })

  // Create test menu
  const menu = await prisma.menu.upsert({
    where: { slug: "demo-menu" },
    update: {},
    create: {
      userId: user.id,
      name: "Demo Menu",
      slug: "demo-menu",
      status: "PUBLISHED"
    }
  })

  console.log({ user, menu })
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
```

```bash
# Run seed
pnpm db:seed
```

---

## API Development

### Creating New API Endpoint

#### Template

```typescript
// apps/web/app/api/[resource]/route.ts

import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth/config"
import { prisma } from "@repo/database"
import { z } from "zod"

// Validation schema
const createSchema = z.object({
  name: z.string().min(3),
  // ... other fields
})

// GET /api/[resource]
export async function GET(request: NextRequest) {
  try {
    // 1. Authentication
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED" } },
        { status: 401 }
      )
    }

    // 2. Parse query params
    const searchParams = request.nextUrl.searchParams
    const page = Number(searchParams.get("page") || "1")
    const limit = Number(searchParams.get("limit") || "20")

    // 3. Fetch data
    const items = await prisma.resource.findMany({
      where: { userId: session.user.id },
      take: limit,
      skip: (page - 1) * limit,
      orderBy: { createdAt: "desc" }
    })

    const total = await prisma.resource.count({
      where: { userId: session.user.id }
    })

    // 4. Return response
    return NextResponse.json({
      success: true,
      data: items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error("[API ERROR]", error)
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR" } },
      { status: 500 }
    )
  }
}

// POST /api/[resource]
export async function POST(request: NextRequest) {
  try {
    // 1. Authentication
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED" } },
        { status: 401 }
      )
    }

    // 2. Parse and validate body
    const body = await request.json()
    const validation = createSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            details: validation.error.errors
          }
        },
        { status: 400 }
      )
    }

    // 3. Authorization checks (plan limits, etc.)
    // ... check limits ...

    // 4. Create resource
    const item = await prisma.resource.create({
      data: {
        ...validation.data,
        userId: session.user.id
      }
    })

    // 5. Cache invalidation (if needed)
    // await invalidateCache(...)

    // 6. Real-time broadcast (if needed)
    // await pusherServer.trigger(...)

    // 7. Return response
    return NextResponse.json(
      { success: true, data: item },
      { status: 201 }
    )
  } catch (error) {
    console.error("[API ERROR]", error)
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR" } },
      { status: 500 }
    )
  }
}
```

### API Testing with curl

```bash
# GET request
curl http://localhost:3000/api/menus \
  -H "Cookie: next-auth.session-token=YOUR_TOKEN"

# POST request
curl -X POST http://localhost:3000/api/menus \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=YOUR_TOKEN" \
  -d '{
    "name": "My Menu",
    "slug": "my-menu"
  }'

# PUT request
curl -X PUT http://localhost:3000/api/menus/abc123 \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=YOUR_TOKEN" \
  -d '{
    "name": "Updated Menu"
  }'

# DELETE request
curl -X DELETE http://localhost:3000/api/menus/abc123 \
  -H "Cookie: next-auth.session-token=YOUR_TOKEN"
```

---

## Component Development

### shadcn/ui Component Addition

```bash
# Add new shadcn/ui component
npx shadcn@latest add button
npx shadcn@latest add input
npx shadcn@latest add dialog
npx shadcn@latest add dropdown-menu

# კომპონენტები ემატება: apps/web/components/ui/
```

### Custom Component Structure

```typescript
// apps/web/components/admin/menu-card.tsx

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Menu } from "@prisma/client"
import Link from "next/link"

interface MenuCardProps {
  menu: Menu
  onDelete?: (id: string) => void
}

export function MenuCard({ menu, onDelete }: MenuCardProps) {
  return (
    <Card className="p-6">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold">{menu.name}</h3>
          <p className="text-sm text-muted-foreground">/{menu.slug}</p>
        </div>

        <Badge variant={menu.status === "PUBLISHED" ? "success" : "secondary"}>
          {menu.status}
        </Badge>
      </div>

      <div className="mt-4 flex gap-2">
        <Button asChild>
          <Link href={`/admin/menus/${menu.id}`}>რედაქტირება</Link>
        </Button>

        <Button
          variant="destructive"
          onClick={() => onDelete?.(menu.id)}
        >
          წაშლა
        </Button>
      </div>
    </Card>
  )
}
```

### Component Best Practices

```typescript
// ✅ Good Practices

// 1. Use TypeScript interfaces
interface Props {
  title: string
  onSubmit: (data: FormData) => void
}

// 2. Extract reusable logic to hooks
const { data, isLoading } = useMenus()

// 3. Use composition
<Card>
  <CardHeader>...</CardHeader>
  <CardContent>...</CardContent>
</Card>

// 4. Handle loading and error states
if (isLoading) return <Skeleton />
if (error) return <ErrorMessage error={error} />

// 5. Use proper accessibility
<button aria-label="Close dialog" onClick={onClose}>
  <X />
</button>

// 6. Optimize images
<Image
  src={product.image}
  alt={product.name}
  width={400}
  height={400}
  loading="lazy"
/>
```

---

## Testing

### Unit Tests (Vitest)

```typescript
// apps/web/__tests__/lib/permissions.test.ts

import { describe, it, expect } from "vitest"
import { canCreateMenu, hasFeature } from "@/lib/auth/permissions"

describe("Plan Permissions", () => {
  it("should allow FREE plan to create 1 menu", () => {
    expect(canCreateMenu({ plan: "FREE" }, 0)).toBe(true)
    expect(canCreateMenu({ plan: "FREE" }, 1)).toBe(false)
  })

  it("should check feature availability", () => {
    expect(hasFeature("FREE", "basic_qr")).toBe(true)
    expect(hasFeature("FREE", "multilingual")).toBe(false)
    expect(hasFeature("PRO", "multilingual")).toBe(true)
  })
})
```

### Component Tests

```typescript
// apps/web/__tests__/components/menu-card.test.tsx

import { render, screen, fireEvent } from "@testing-library/react"
import { describe, it, expect, vi } from "vitest"
import { MenuCard } from "@/components/admin/menu-card"

describe("MenuCard", () => {
  const mockMenu = {
    id: "1",
    name: "Test Menu",
    slug: "test-menu",
    status: "PUBLISHED",
    userId: "user1",
    createdAt: new Date(),
    updatedAt: new Date()
  }

  it("should render menu information", () => {
    render(<MenuCard menu={mockMenu} />)

    expect(screen.getByText("Test Menu")).toBeInTheDocument()
    expect(screen.getByText("/test-menu")).toBeInTheDocument()
    expect(screen.getByText("PUBLISHED")).toBeInTheDocument()
  })

  it("should call onDelete when delete button clicked", () => {
    const onDelete = vi.fn()
    render(<MenuCard menu={mockMenu} onDelete={onDelete} />)

    fireEvent.click(screen.getByText("წაშლა"))

    expect(onDelete).toHaveBeenCalledWith("1")
  })
})
```

### Run Tests

```bash
# Run all tests
pnpm test

# Watch mode
pnpm test:watch

# Coverage
pnpm test:coverage

# Specific file
pnpm test menu-card.test.tsx
```

---

## Git Workflow

### Branch Naming

```
feature/menu-filtering        # ახალი ფუნქცია
fix/menu-slug-validation      # bug fix
refactor/api-error-handling   # refactoring
docs/api-documentation        # documentation
chore/update-dependencies     # maintenance
```

### Commit Messages (Conventional Commits)

```bash
# Format: <type>: <description>

feat: add product filtering
fix: correct menu slug validation
refactor: improve error handling in API routes
docs: update API documentation
chore: update dependencies
test: add tests for permissions
style: format code with prettier
perf: optimize database queries
```

### Pull Request Process

```markdown
## PR Title
feat: Add product filtering

## Description
Adds filtering functionality for products by category, price range, and search.

## Changes
- Added `ProductFilterInput` schema
- Created `/api/menus/[id]/products` with filtering
- Added `useFilteredProducts` hook
- Created `ProductFilter` component

## Testing
- [ ] Tested filtering by category
- [ ] Tested price range filtering
- [ ] Tested search functionality
- [ ] Added unit tests for filter logic

## Screenshots
[Add screenshots if UI changes]

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Tests added/updated
- [ ] Documentation updated
```

---

## Common Tasks

### Task: Adding New shadcn/ui Component

```bash
# 1. Add component
npx shadcn@latest add select

# 2. Use in your code
import { Select } from "@/components/ui/select"
```

### Task: Debugging Prisma Queries

```typescript
// Enable query logging
const prisma = new PrismaClient({
  log: ["query", "info", "warn", "error"]
})

// Or use Prisma Studio
pnpm db:studio
```

### Task: Clearing Cache

```typescript
// Redis cache
import { redis } from "@/lib/cache/redis"

// Clear specific key
await redis.del("menu:public:my-menu")

// Clear pattern
const keys = await redis.keys("menu:*")
for (const key of keys) {
  await redis.del(key)
}
```

### Task: Testing Authentication Locally

```bash
# 1. Register new user
http://localhost:3000/admin/register

# 2. Get session token from browser
# DevTools → Application → Cookies → next-auth.session-token

# 3. Use in API requests
curl -H "Cookie: next-auth.session-token=TOKEN" \
  http://localhost:3000/api/menus
```

---

## Troubleshooting

### Common Issues

#### Issue: "Module not found"

```bash
# Fix: Clear cache and reinstall
rm -rf node_modules
rm -rf .next
rm pnpm-lock.yaml
pnpm install
```

#### Issue: Prisma Client out of sync

```bash
# Fix: Regenerate client
pnpm prisma generate
```

#### Issue: TypeScript errors after schema change

```bash
# Fix: Restart TypeScript server
# VS Code: Cmd+Shift+P → "TypeScript: Restart TS Server"
```

#### Issue: Port already in use

```bash
# Find and kill process
lsof -ti:3000 | xargs kill -9
```

---

## Next Steps

✅ **Development Environment Ready!**

### რა შემდეგ?

- 📖 იხილე [Features Documentation](./04-features.md)
- 🔌 იხილე [API Reference](./05-api-reference.md)
- ✅ იხილე [Best Practices](./08-best-practices.md)
- 📅 იხილე [Timeline & Roadmap](./07-timeline-roadmap.md)

---

**ბოლო განახლება:** 2026-01-26
