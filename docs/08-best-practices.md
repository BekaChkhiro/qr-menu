# Best Practices - საუკეთესო პრაქტიკები

> ✨ **წარმატებული პროექტისთვის აუცილებელი პრაქტიკები და რეკომენდაციები**

---

## 📋 სარჩევი

1. [Code Quality](#code-quality)
2. [Security](#security)
3. [Performance](#performance)
4. [Database](#database)
5. [API Design](#api-design)
6. [Error Handling](#error-handling)
7. [Testing](#testing)
8. [Git & Collaboration](#git--collaboration)

---

## Code Quality

### TypeScript Best Practices

```typescript
// ✅ GOOD: Use explicit types
interface CreateMenuInput {
  name: string
  slug: string
  description?: string
}

function createMenu(data: CreateMenuInput): Promise<Menu> {
  // ...
}

// ❌ BAD: Avoid 'any'
function createMenu(data: any): any {
  // ...
}
```

```typescript
// ✅ GOOD: Use type guards
function isPublishedMenu(menu: Menu): menu is PublishedMenu {
  return menu.status === "PUBLISHED" && menu.publishedAt !== null
}

// ✅ GOOD: Use discriminated unions
type Result<T> =
  | { success: true; data: T }
  | { success: false; error: string }
```

### Component Organization

```typescript
// ✅ GOOD: Single Responsibility Principle
// components/admin/menu-card.tsx - only menu card
// components/admin/menu-list.tsx - only list of cards
// components/admin/menu-filters.tsx - only filtering

// ❌ BAD: One huge component doing everything
// components/admin/menus.tsx - 1000 lines, everything
```

### Function Design

```typescript
// ✅ GOOD: Small, focused functions
async function getPublishedMenu(slug: string) {
  const cached = await getCachedMenu(slug)
  if (cached) return cached

  const menu = await fetchMenuFromDB(slug)
  if (!menu) return null

  await cacheMenu(slug, menu)
  return menu
}

// ❌ BAD: Large, multi-purpose functions
async function handleMenu(slug: string, action: string, data: any) {
  // 200 lines of mixed logic
}
```

### Naming Conventions

```typescript
// ✅ GOOD: Clear, descriptive names
const isMenuPublished = menu.status === "PUBLISHED"
const activeProducts = products.filter(p => p.isAvailable)

// ❌ BAD: Unclear abbreviations
const isPub = menu.status === "PUBLISHED"
const actProds = products.filter(p => p.isAvailable)
```

---

## Security

### Authentication & Authorization

```typescript
// ✅ GOOD: Always check authentication
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    return NextResponse.json(
      { success: false, error: { code: "UNAUTHORIZED" } },
      { status: 401 }
    )
  }

  // ... proceed
}
```

```typescript
// ✅ GOOD: Always check ownership
const menu = await prisma.menu.findUnique({
  where: {
    id: menuId,
    userId: session.user.id // Critical!
  }
})

if (!menu) {
  return NextResponse.json(
    { success: false, error: { code: "NOT_FOUND" } },
    { status: 404 }
  )
}
```

### Input Validation

```typescript
// ✅ GOOD: Validate all inputs with Zod
const createMenuSchema = z.object({
  name: z.string().min(3).max(50),
  slug: z.string().regex(/^[a-z0-9-]+$/),
  description: z.string().max(500).optional()
})

const validation = createMenuSchema.safeParse(body)
if (!validation.success) {
  return NextResponse.json(
    { success: false, error: { code: "VALIDATION_ERROR", details: validation.error } },
    { status: 400 }
  )
}
```

### Password Security

```typescript
// ✅ GOOD: Use bcrypt with proper cost factor
import bcrypt from "bcryptjs"

const SALT_ROUNDS = 12

async function hashPassword(password: string) {
  return bcrypt.hash(password, SALT_ROUNDS)
}

async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash)
}

// ❌ BAD: Never store plain passwords
// ❌ BAD: Never use weak hashing (MD5, SHA1)
```

### SQL Injection Prevention

```typescript
// ✅ GOOD: Prisma prevents SQL injection
const user = await prisma.user.findUnique({
  where: { email: userInput } // Safe - parameterized
})

// ❌ BAD: Raw SQL with interpolation
await prisma.$executeRaw`SELECT * FROM users WHERE email = ${userInput}` // Dangerous!

// ✅ GOOD: If you must use raw SQL, use Prisma.sql
import { Prisma } from "@prisma/client"
await prisma.$executeRaw(
  Prisma.sql`SELECT * FROM users WHERE email = ${userInput}` // Safe - parameterized
)
```

### Environment Variables

```typescript
// ✅ GOOD: Validate env vars on startup
import { z } from "zod"

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  NEXTAUTH_SECRET: z.string().min(32),
  NEXT_PUBLIC_APP_URL: z.string().url()
})

const env = envSchema.parse(process.env)
export { env }

// ❌ BAD: Direct access without validation
const dbUrl = process.env.DATABASE_URL // might be undefined!
```

---

## Performance

### Database Queries

```typescript
// ✅ GOOD: Use includes to avoid N+1 queries
const menus = await prisma.menu.findMany({
  include: {
    categories: {
      include: {
        products: true
      }
    }
  }
})

// ❌ BAD: N+1 query problem
const menus = await prisma.menu.findMany()
for (const menu of menus) {
  menu.categories = await prisma.category.findMany({
    where: { menuId: menu.id }
  })
}
```

```typescript
// ✅ GOOD: Select only needed fields
const menus = await prisma.menu.findMany({
  select: {
    id: true,
    name: true,
    slug: true
    // Only what we need
  }
})

// ❌ BAD: Fetching unnecessary data
const menus = await prisma.menu.findMany() // Gets all fields
```

### Caching Strategy

```typescript
// ✅ GOOD: Cache expensive queries
async function getPublicMenu(slug: string) {
  const cacheKey = `menu:public:${slug}`

  // Try cache first
  const cached = await redis.get(cacheKey)
  if (cached) return cached

  // Fetch from DB
  const menu = await prisma.menu.findUnique({
    where: { slug, status: "PUBLISHED" },
    include: { categories: { include: { products: true } } }
  })

  // Cache for 5 minutes
  if (menu) {
    await redis.setex(cacheKey, 300, menu)
  }

  return menu
}
```

```typescript
// ✅ GOOD: Invalidate cache on updates
async function updateProduct(id: string, data: UpdateProductInput) {
  const product = await prisma.product.update({
    where: { id },
    data,
    include: { category: { include: { menu: true } } }
  })

  // Invalidate menu cache
  await redis.del(`menu:public:${product.category.menu.slug}`)

  return product
}
```

### Image Optimization

```typescript
// ✅ GOOD: Use Next.js Image component
import Image from "next/image"

<Image
  src={product.image}
  alt={product.nameKa}
  width={400}
  height={400}
  loading="lazy"
  quality={85}
  placeholder="blur"
  blurDataURL="/placeholder.jpg"
/>

// ❌ BAD: Regular img tag
<img src={product.image} alt={product.nameKa} />
```

### React Query Configuration

```typescript
// ✅ GOOD: Appropriate stale times
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 minute
      cacheTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
      retry: 1
    }
  }
})
```

---

## Database

### Indexes

```prisma
// ✅ GOOD: Index foreign keys and frequently queried fields
model Product {
  id         String   @id
  categoryId String

  category Category @relation(fields: [categoryId], references: [id])

  @@index([categoryId])          // Foreign key
  @@index([sortOrder])            // Ordering
  @@index([isAvailable])          // Filtering
  @@index([categoryId, sortOrder]) // Composite for common query
}
```

### Transactions

```typescript
// ✅ GOOD: Use transactions for multi-step operations
await prisma.$transaction(async (tx) => {
  // Delete all products
  await tx.product.deleteMany({
    where: { categoryId }
  })

  // Delete category
  await tx.category.delete({
    where: { id: categoryId }
  })
})

// ❌ BAD: Separate operations (race conditions)
await prisma.product.deleteMany({ where: { categoryId } })
await prisma.category.delete({ where: { id: categoryId } })
```

### Cascade Deletes

```prisma
// ✅ GOOD: Set up cascade deletes
model Menu {
  id         String     @id
  categories Category[]

  // When menu is deleted, categories are auto-deleted
}

model Category {
  id       String    @id
  menuId   String
  menu     Menu      @relation(fields: [menuId], references: [id], onDelete: Cascade)
  products Product[]
}
```

---

## API Design

### Consistent Response Format

```typescript
// ✅ GOOD: Standardized responses
type APIResponse<T> =
  | { success: true; data: T }
  | { success: false; error: { code: string; message: string; details?: any } }

// Success
return NextResponse.json({
  success: true,
  data: menu
})

// Error
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
```

### HTTP Status Codes

```typescript
// ✅ GOOD: Use appropriate status codes
200 // OK - Successful GET
201 // Created - Successful POST
204 // No Content - Successful DELETE
400 // Bad Request - Validation error
401 // Unauthorized - Not authenticated
403 // Forbidden - Not authorized (plan limits)
404 // Not Found - Resource doesn't exist
409 // Conflict - Duplicate slug
500 // Internal Server Error - Unexpected error
```

### Pagination

```typescript
// ✅ GOOD: Consistent pagination
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const page = Number(searchParams.get("page") || "1")
  const limit = Number(searchParams.get("limit") || "20")

  const items = await prisma.product.findMany({
    skip: (page - 1) * limit,
    take: limit
  })

  const total = await prisma.product.count()

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
}
```

---

## Error Handling

### Try-Catch Blocks

```typescript
// ✅ GOOD: Catch and handle errors
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED" } },
        { status: 401 }
      )
    }

    // ... logic ...

    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    console.error("[API ERROR]", error)

    // Specific error handling
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        return NextResponse.json(
          { success: false, error: { code: "DUPLICATE_SLUG" } },
          { status: 409 }
        )
      }
    }

    // Generic error
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR" } },
      { status: 500 }
    )
  }
}
```

### Client-Side Error Handling

```typescript
// ✅ GOOD: Handle API errors gracefully
import { toast } from "sonner"

async function handleCreateMenu(data: CreateMenuInput) {
  try {
    const response = await fetch("/api/menus", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    })

    const result = await response.json()

    if (!result.success) {
      // Handle specific errors
      if (result.error.code === "PLAN_LIMIT") {
        toast.error("გეგმის ლიმიტი შევსებულია. გადადი პრემიუმზე!")
        return
      }

      toast.error(result.error.message || "შეცდომა")
      return
    }

    toast.success("მენიუ შეიქმნა!")
    return result.data
  } catch (error) {
    toast.error("კავშირის შეცდომა")
  }
}
```

---

## Testing

### Unit Tests

```typescript
// ✅ GOOD: Test business logic
import { describe, it, expect } from "vitest"
import { canCreateMenu, hasFeature } from "@/lib/auth/permissions"

describe("Plan Permissions", () => {
  describe("canCreateMenu", () => {
    it("should allow FREE plan to create 1 menu", () => {
      expect(canCreateMenu({ plan: "FREE" }, 0)).toBe(true)
      expect(canCreateMenu({ plan: "FREE" }, 1)).toBe(false)
    })

    it("should allow STARTER plan to create up to 3 menus", () => {
      expect(canCreateMenu({ plan: "STARTER" }, 0)).toBe(true)
      expect(canCreateMenu({ plan: "STARTER" }, 2)).toBe(true)
      expect(canCreateMenu({ plan: "STARTER" }, 3)).toBe(false)
    })
  })
})
```

### Component Tests

```typescript
// ✅ GOOD: Test user interactions
import { render, screen, fireEvent } from "@testing-library/react"
import { describe, it, expect, vi } from "vitest"
import { MenuCard } from "@/components/admin/menu-card"

describe("MenuCard", () => {
  const mockMenu = {
    id: "1",
    name: "Test Menu",
    slug: "test-menu",
    status: "PUBLISHED"
  }

  it("should call onDelete when delete button clicked", () => {
    const onDelete = vi.fn()
    render(<MenuCard menu={mockMenu} onDelete={onDelete} />)

    fireEvent.click(screen.getByText("წაშლა"))

    expect(onDelete).toHaveBeenCalledWith("1")
  })
})
```

### Test Coverage Goals

```
Target Coverage:
- Critical business logic: 80%+
- API routes: 70%+
- Utility functions: 90%+
- Components: 60%+
```

---

## Git & Collaboration

### Commit Messages

```bash
# ✅ GOOD: Clear, descriptive commits
feat: add product filtering by category
fix: correct menu slug validation
refactor: extract auth logic to separate file
docs: update API documentation
test: add tests for product CRUD

# ❌ BAD: Vague commits
update
fix bug
changes
wip
```

### Branch Strategy

```
main          # Production
  └─ develop  # Development
      ├─ feature/product-filtering
      ├─ feature/menu-analytics
      ├─ fix/slug-validation
      └─ refactor/api-error-handling
```

### Code Reviews

```markdown
Code Review Checklist:

□ Code follows TypeScript best practices
□ No security vulnerabilities
□ Input validation present
□ Error handling comprehensive
□ Tests added/updated
□ Documentation updated
□ No console.logs left
□ Performance considerations addressed
□ Follows project conventions
```

### Pull Request Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing complete

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Tests added
- [ ] Documentation updated
```

---

## Conclusion

### Key Takeaways

1. ✅ **Type Safety** - TypeScript everywhere, no `any`
2. ✅ **Security** - Validate inputs, check auth, prevent SQL injection
3. ✅ **Performance** - Cache aggressively, optimize queries, use indexes
4. ✅ **Error Handling** - Catch errors, log properly, inform users
5. ✅ **Testing** - Write tests for critical logic
6. ✅ **Code Quality** - Small functions, clear names, consistent style
7. ✅ **Collaboration** - Clear commits, good PRs, code reviews

### Resources

- [TypeScript Best Practices](https://typescript-eslint.io/rules/)
- [Next.js Best Practices](https://nextjs.org/docs/pages/building-your-application/deploying/production-checklist)
- [Prisma Best Practices](https://www.prisma.io/docs/guides/performance-and-optimization)
- [React Query Best Practices](https://tkdodo.eu/blog/practical-react-query)

---

**დაიცავი ეს პრაქტიკები და შენი კოდი იქნება:**
- 🔒 უსაფრთხო
- ⚡ სწრაფი
- 🧪 ტესტირებული
- 📖 კითხვადი
- 🛠️ მოვლა-შენახვადი

**ბოლო განახლება:** 2026-01-26
