# Features - ფუნქციონალის დოკუმენტაცია

> 🎯 **Digital Menu პლატფორმის ყველა feature-ის დეტალური აღწერა**

---

## 📋 სარჩევი

1. [Authentication](#authentication)
2. [Menu Management](#menu-management)
3. [Category & Product Management](#category--product-management)
4. [QR Code Generation](#qr-code-generation)
5. [Public Menu](#public-menu)
6. [Real-time Updates](#real-time-updates)
7. [Multi-language](#multi-language)
8. [Promotions](#promotions)
9. [Design Customization](#design-customization)
10. [Analytics](#analytics)
11. [Plan-Based Features](#plan-based-features)

---

## Authentication

### Email/Password Registration

**აღწერა:** მომხმარებლებს შეუძლიათ რეგისტრაცია email და password-ით.

**Implementation:**
- NextAuth.js Credentials Provider
- bcrypt password hashing (cost factor 12)
- Email validation with Zod
- Password requirements: მინიმუმ 8 სიმბოლო

**User Flow:**
1. User fills registration form: email, name, password, businessName
2. System validates input
3. Password hashed with bcrypt
4. User record created in database
5. Automatic login after registration
6. Redirect to `/admin/dashboard`

**Security:**
- Password strength validation
- Rate limiting on registration endpoint
- Email uniqueness check

---

### Google OAuth

**აღწერა:** სწრაფი რეგისტრაცია/ავტორიზაცია Google ანგარიშით.

**Implementation:**
- NextAuth.js Google Provider
- OAuth 2.0 flow
- Automatic user creation on first login

**User Flow:**
1. Click "Continue with Google"
2. Redirect to Google OAuth consent screen
3. User approves permissions
4. Callback to `/api/auth/callback/google`
5. User created if new, logged in if existing
6. Redirect to `/admin/dashboard`

---

### Session Management

**აღწერა:** JWT-based sessions with automatic renewal.

**Features:**
- Session duration: 30 days
- Automatic token refresh
- Secure httpOnly cookies
- Server-side session validation

---

## Menu Management

### Create Menu

**Plan Limits:**
- FREE: 1 menu
- STARTER: 3 menus
- PRO: Unlimited

**Fields:**
- name (სავალდებულო)
- slug (უნიკალური, auto-generated from name)
- description (არასავალდებულო)
- status: DRAFT | PUBLISHED

**Validation:**
- Name: 3-50 characters
- Slug: lowercase, alphanumeric, hyphens only
- Slug uniqueness check

**API:** `POST /api/menus`

---

### Edit Menu

**Features:**
- Update name, slug, description
- Change status (DRAFT ↔ PUBLISHED)
- Design settings (colors, logo)

**API:** `PUT /api/menus/:id`

---

### Delete Menu

**Behavior:**
- Cascade deletes all categories, products, promotions
- Cache invalidation
- Cannot undo

**API:** `DELETE /api/menus/:id`

---

### Publish/Unpublish

**აღწერა:** გააქტიურე ან გაათიშე მენიუ public access-ისთვის.

**DRAFT:**
- მენიუ არ არის ხელმისაწვდომი public URL-ზე
- შეგიძლია რედაქტირება

**PUBLISHED:**
- მენიუ ხელმისაწვდომია `/m/[slug]`
- Sets `publishedAt` timestamp
- Cache invalidation
- Real-time broadcast

**API:** `POST /api/menus/:id/publish`

---

## Category & Product Management

### Categories

**Features:**
- Multi-language names (KA, EN, RU)
- Drag-drop reordering
- Active/inactive toggle
- Belongs to menu

**Limits (FREE tier):**
- Max 3 categories per menu

**API:**
- `GET /api/menus/:id/categories`
- `POST /api/menus/:id/categories`
- `PUT /api/categories/:id`
- `DELETE /api/categories/:id`
- `POST /api/categories/reorder`

---

### Products

**Features:**
- Multi-language content (name, description)
- Price (Decimal)
- Image upload
- Allergens (PRO only)
- Product variations (size, options)
- Available/unavailable toggle
- Drag-drop reordering

**Limits (FREE tier):**
- Max 15 products per menu

**Fields:**
- nameKa, nameEn, nameRu
- descriptionKa, descriptionEn, descriptionRu
- price (GEL)
- image (URL from R2)
- allergens[] (enum)
- isAvailable (boolean)
- sortOrder (int)

**API:**
- `GET /api/menus/:id/products`
- `POST /api/categories/:id/products`
- `PUT /api/products/:id`
- `DELETE /api/products/:id`
- `POST /api/products/reorder`

---

### Product Variations

**აღწერა:** პროდუქტის ვარიაციები (მაგ. Small, Medium, Large).

**Features:**
- Multi-language names
- Different prices per variation
- Sortable

**Example:**
```
Product: Espresso
Variations:
  - Single Shot (2.50 ₾)
  - Double Shot (3.50 ₾)
```

**API:**
- `POST /api/products/:id/variations`
- `PUT /api/variations/:id`
- `DELETE /api/variations/:id`

---

### Image Upload

**აღწერა:** სურათების ატვირთვა Cloudflare R2-ზე.

**Supported Formats:**
- JPEG
- PNG
- WebP

**Size Limit:** 5 MB

**Optimization:**
- Automatic WebP conversion
- Resize to 400x400 (products)
- CDN delivery

**API:** `POST /api/upload`

**Flow:**
1. User selects image
2. Frontend uploads to `/api/upload`
3. Server validates file
4. Upload to R2
5. Return public URL
6. Store URL in product record

---

## QR Code Generation

### Basic QR (All Plans)

**Features:**
- PNG format
- 3 sizes: small (200px), medium (400px), large (800px)
- Points to `/m/[slug]`
- Download button

**API:** `GET /api/qr/:menuId?format=png&size=medium`

**Implementation:**
- Library: `qrcode` npm package
- Dynamic generation
- No storage needed

---

### QR with Logo (PRO only)

**Features:**
- Custom logo in center
- Logo size: 20% of QR size
- Better branding

**Future Enhancement (Phase 3):**
- SVG format
- Color customization
- Error correction level selection

---

## Public Menu

### Public Menu View

**URL:** `/m/[slug]`

**Features:**
- Mobile-first design
- Category navigation (tabs or sidebar)
- Product grid/list
- Image lazy loading
- Language switcher
- Promotions banner

**Caching:**
- Redis cache: 5 minutes TTL
- Cache invalidation on menu updates

**SEO:**
- Dynamic meta tags
- Open Graph tags
- Structured data (JSON-LD)

---

### Search & Filter

**Features:**
- Search by product name
- Filter by category
- Filter by allergens (PRO)
- Filter by price range

**Implementation:**
- Client-side filtering (fast)
- Or API endpoint with query params

---

## Real-time Updates

### Pusher Integration

**აღწერა:** რეალურ დროში სინქრონიზაცია admin და public views შორის.

**Channel Pattern:** `menu-{menuId}`

**Events:**
- `menu:updated` - Menu settings changed
- `category:created` - New category added
- `category:updated` - Category modified
- `category:deleted` - Category removed
- `category:reordered` - Category order changed
- `product:created` - New product added
- `product:updated` - Product modified (price, availability)
- `product:deleted` - Product removed
- `product:reordered` - Product order changed
- `promotion:created` - New promotion
- `promotion:updated` - Promotion modified

**Use Cases:**
1. Admin changes price → Public menu updates instantly
2. Admin marks product unavailable → Grayed out on public menu
3. Admin reorders categories → Order changes on public menu

**Implementation:**
```typescript
// Server broadcasts
await pusherServer.trigger(`menu-${menuId}`, 'product:updated', product)

// Client listens
pusherClient.subscribe(`menu-${menuId}`)
channel.bind('product:updated', (data) => {
  // Update UI
})
```

---

## Multi-language

### Supported Languages

- 🇬🇪 ქართული (KA) - default
- 🇬🇧 English (EN)
- 🇷🇺 Русский (RU)

### Content Storage

**Database fields:**
- nameKa, nameEn, nameRu
- descriptionKa, descriptionEn, descriptionRu

**Fallback logic:**
- If nameEn is null → show nameKa
- If nameRu is null → show nameKa

### Language Switcher

**Location:** Public menu top bar

**Behavior:**
- Cookie-based preference
- Persists across page reloads
- Instant switch (no page reload with proper setup)

### UI Translations

**Files:** `/public/locales/{locale}/{namespace}.json`

**Namespaces:**
- common.json - Buttons, labels
- menu.json - Menu-specific terms
- auth.json - Auth pages

---

## Promotions

### Plan Availability

**STARTER and PRO only**

### Features

**Fields:**
- title (text)
- description (text)
- image (optional)
- discount (percentage)
- validFrom (date)
- validTo (date)
- isActive (boolean)

**Display:**
- Banner on public menu
- Highlighted products
- Auto-expire after validTo

**API:**
- `GET /api/menus/:id/promotions`
- `POST /api/menus/:id/promotions`
- `PUT /api/promotions/:id`
- `DELETE /api/promotions/:id`

**Example:**
```
Title: "Happy Hour"
Description: "30% off all cocktails"
Discount: 30%
Valid: 17:00 - 20:00 daily
```

---

## Design Customization

### Plan Availability

**STARTER and PRO**

### Customization Options

**Color Scheme:**
- Primary color
- Secondary color
- Background color
- Text color

**Logo:**
- Upload custom logo
- Position: top center
- Max size: 200x200px

**Theme:**
- Light / Dark mode
- Preset themes

**Font:**
- Font family selection
- Font size

**Storage:**
- Stored in `Menu.designSettings` (JSON field)

**Preview:**
- Live preview in admin
- Apply instantly on public menu

---

## Analytics

### Plan Availability

**PRO only**

### Tracked Metrics

**MenuView model:**
- timestamp
- language
- userAgent (browser)
- country (from IP)
- referrer

**Dashboard displays:**
- Total views (lifetime)
- Views over time (chart)
- Views by language (pie chart)
- Views by country
- Most viewed products
- Peak hours

**API:**
- `GET /api/menus/:id/analytics`

**Privacy:**
- No personal data stored
- No IP addresses stored
- Aggregate data only

---

## Plan-Based Features

### Feature Matrix

| Feature | FREE | STARTER | PRO |
|---------|------|---------|-----|
| **Menus** | 1 | 3 | ∞ |
| **Categories** | 3 | ∞ | ∞ |
| **Products** | 15 | ∞ | ∞ |
| **QR Basic** | ✅ | ✅ | ✅ |
| **QR Logo** | ❌ | ❌ | ✅ |
| **Promotions** | ❌ | ✅ | ✅ |
| **Custom Colors** | ❌ | ✅ | ✅ |
| **Custom Logo** | ❌ | ✅ | ✅ |
| **Multi-language** | ❌ | ❌ | ✅ |
| **Allergens** | ❌ | ❌ | ✅ |
| **Analytics** | ❌ | ❌ | ✅ |
| **Real-time** | ✅ | ✅ | ✅ |

### Limit Enforcement

**Implementation:**
```typescript
import { canCreateMenu, hasFeature } from "@/lib/auth/permissions"

// Check if user can create menu
const currentMenuCount = await prisma.menu.count({
  where: { userId: session.user.id }
})

if (!canCreateMenu({ plan: session.user.plan }, currentMenuCount)) {
  throw new Error("Plan limit reached")
}

// Check feature access
if (!hasFeature(session.user.plan, "promotions")) {
  throw new Error("Upgrade to STARTER to use promotions")
}
```

### Upgrade Prompts

**UI:**
- Show upgrade button when limit reached
- Feature teaser with "Upgrade to PRO" CTA
- Pricing comparison modal

---

## Future Enhancements (Post-Launch)

### Phase 4+

**Advanced Analytics:**
- Heatmaps
- A/B testing
- Customer behavior tracking

**Inventory Management:**
- Stock levels
- Low stock alerts
- Auto-disable out-of-stock items

**Table Ordering:**
- QR code per table
- Order directly from menu
- Kitchen display system

**Multi-location:**
- Multiple locations per business
- Location-specific menus

**White-label:**
- Custom domain per customer
- Remove Digital Menu branding

---

**ბოლო განახლება:** 2026-01-30
