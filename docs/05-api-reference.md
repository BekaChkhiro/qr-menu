# API Reference - API დოკუმენტაცია

> 🔌 **Digital Menu REST API სრული დოკუმენტაცია**

---

## 📋 სარჩევი

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Menus](#menus)
4. [Categories](#categories)
5. [Products](#products)
6. [Promotions](#promotions)
7. [Upload](#upload)
8. [QR Code](#qr-code)
9. [Analytics](#analytics)
10. [Error Codes](#error-codes)

---

## Overview

### Base URL

```
Development:  http://localhost:3000/api
Production:   https://digitalmenu.ge/api
```

### Response Format

**Success:**
```json
{
  "success": true,
  "data": { ... }
}
```

**Error:**
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable message",
    "details": [] // Optional validation errors
  }
}
```

### Pagination

```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

---

## Authentication

### NextAuth Session

**All protected routes require authentication via NextAuth session.**

```typescript
// Check authentication
const session = await getServerSession(authOptions)

if (!session?.user) {
  return 401 Unauthorized
}
```

**Session Cookie:** `next-auth.session-token`

---

## Menus

### List Menus

```http
GET /api/menus
```

**Auth:** Required

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "cm1abc123",
      "name": "Main Menu",
      "slug": "main-menu",
      "status": "PUBLISHED",
      "publishedAt": "2024-01-15T10:00:00Z",
      "createdAt": "2024-01-01T10:00:00Z",
      "updatedAt": "2024-01-15T10:00:00Z"
    }
  ]
}
```

---

### Get Menu

```http
GET /api/menus/:id
```

**Auth:** Required

**Parameters:**
- `id` (path) - Menu ID

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "cm1abc123",
    "name": "Main Menu",
    "slug": "main-menu",
    "description": "Our main menu",
    "status": "PUBLISHED",
    "designSettings": {
      "primaryColor": "#FF5733",
      "logo": "https://cdn.digitalmenu.ge/logos/abc.png"
    },
    "categories": [
      {
        "id": "cat1",
        "nameKa": "ცხელი სასმელები",
        "nameEn": "Hot Drinks",
        "sortOrder": 0
      }
    ]
  }
}
```

---

### Create Menu

```http
POST /api/menus
```

**Auth:** Required

**Body:**
```json
{
  "name": "Summer Menu",
  "slug": "summer-menu",
  "description": "Special summer items"
}
```

**Validation:**
- `name`: required, 3-50 characters
- `slug`: required, unique, lowercase alphanumeric + hyphens
- `description`: optional, max 500 characters

**Plan Limits:**
- FREE: 1 menu
- STARTER: 3 menus
- PRO: Unlimited

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "cm1new123",
    "name": "Summer Menu",
    "slug": "summer-menu",
    "status": "DRAFT",
    "createdAt": "2024-01-20T10:00:00Z"
  }
}
```

**Errors:**
- `401 UNAUTHORIZED` - Not authenticated
- `403 PLAN_LIMIT` - Plan limit reached
- `400 VALIDATION_ERROR` - Invalid input
- `409 DUPLICATE_SLUG` - Slug already exists

---

### Update Menu

```http
PUT /api/menus/:id
```

**Auth:** Required (must own menu)

**Body:**
```json
{
  "name": "Updated Menu Name",
  "description": "New description",
  "designSettings": {
    "primaryColor": "#FF5733"
  }
}
```

**Response:** Same as Get Menu

---

### Delete Menu

```http
DELETE /api/menus/:id
```

**Auth:** Required (must own menu)

**Response:**
```json
{
  "success": true,
  "data": { "id": "cm1abc123" }
}
```

**Note:** Cascades delete to categories, products, promotions

---

### Publish/Unpublish Menu

```http
POST /api/menus/:id/publish
```

**Auth:** Required (must own menu)

**Body:**
```json
{
  "publish": true // or false to unpublish
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "cm1abc123",
    "status": "PUBLISHED",
    "publishedAt": "2024-01-20T10:30:00Z"
  }
}
```

---

## Categories

### List Categories

```http
GET /api/menus/:menuId/categories
```

**Auth:** Required (must own menu)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "cat1",
      "menuId": "cm1abc123",
      "nameKa": "ცხელი სასმელები",
      "nameEn": "Hot Drinks",
      "nameRu": "Горячие напитки",
      "sortOrder": 0,
      "isActive": true,
      "productCount": 12
    }
  ]
}
```

---

### Create Category

```http
POST /api/menus/:menuId/categories
```

**Auth:** Required (must own menu)

**Body:**
```json
{
  "nameKa": "დესერტები",
  "nameEn": "Desserts",
  "nameRu": "Десерты"
}
```

**Validation:**
- `nameKa`: required, 2-50 characters
- `nameEn`, `nameRu`: optional, max 50 characters

**Plan Limits:**
- FREE: 3 categories per menu

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "cat2",
    "nameKa": "დესერტები",
    "sortOrder": 1
  }
}
```

---

### Update Category

```http
PUT /api/menus/:menuId/categories/:categoryId
```

**Auth:** Required (must own menu)

**Body:**
```json
{
  "nameKa": "გემრიელი დესერტები",
  "nameEn": "Delicious Desserts",
  "isActive": false
}
```

---

### Delete Category

```http
DELETE /api/menus/:menuId/categories/:categoryId
```

**Auth:** Required (must own menu)

**Note:** Cascades delete to all products in category

---

### Reorder Categories

```http
POST /api/menus/:menuId/categories/reorder
```

**Auth:** Required (must own menu)

**Body:**
```json
{
  "order": ["cat3", "cat1", "cat2"]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "updated": 3
  }
}
```

---

## Products

### List Products

```http
GET /api/menus/:menuId/products
```

**Auth:** Required (must own menu)

**Query Params:**
- `categoryId` (optional) - Filter by category
- `search` (optional) - Search by name
- `minPrice`, `maxPrice` (optional) - Price range

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "prod1",
      "categoryId": "cat1",
      "nameKa": "ესპრესო",
      "nameEn": "Espresso",
      "descriptionKa": "ორმაგი შოტი",
      "price": "3.50",
      "currency": "GEL",
      "image": "https://cdn.digitalmenu.ge/products/espresso.jpg",
      "allergens": ["DAIRY"],
      "isAvailable": true,
      "sortOrder": 0,
      "variations": [
        {
          "id": "var1",
          "nameKa": "Single Shot",
          "price": "2.50"
        }
      ]
    }
  ]
}
```

---

### Create Product

```http
POST /api/categories/:categoryId/products
```

**Auth:** Required (must own menu)

**Body:**
```json
{
  "nameKa": "ამერიკანო",
  "nameEn": "Americano",
  "descriptionKa": "ესპრესო წყლით",
  "price": 4.00,
  "image": "https://cdn.digitalmenu.ge/products/americano.jpg",
  "allergens": ["DAIRY"]
}
```

**Validation:**
- `nameKa`: required, 2-100 characters
- `price`: required, positive decimal
- `image`: optional, valid URL
- `allergens`: optional array of enum values

**Plan Limits:**
- FREE: 15 products per menu

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "prod2",
    "nameKa": "ამერიკანო",
    "price": "4.00",
    "sortOrder": 5
  }
}
```

---

### Update Product

```http
PUT /api/products/:id
```

**Auth:** Required (must own menu)

**Body:**
```json
{
  "price": 4.50,
  "isAvailable": false
}
```

**Triggers:**
- Cache invalidation
- Real-time broadcast: `product:updated`

---

### Delete Product

```http
DELETE /api/products/:id
```

**Auth:** Required (must own menu)

---

### Reorder Products

```http
POST /api/menus/:menuId/products/reorder
```

**Auth:** Required (must own menu)

**Body:**
```json
{
  "categoryId": "cat1",
  "order": ["prod3", "prod1", "prod2"]
}
```

---

## Product Variations

### List Variations

```http
GET /api/menus/:menuId/products/:productId/variations
```

**Auth:** Required (must own menu)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "var1",
      "productId": "prod1",
      "nameKa": "პატარა",
      "nameEn": "Small",
      "nameRu": "Маленький",
      "price": "2.50",
      "sortOrder": 0
    },
    {
      "id": "var2",
      "productId": "prod1",
      "nameKa": "დიდი",
      "nameEn": "Large",
      "nameRu": "Большой",
      "price": "4.00",
      "sortOrder": 1
    }
  ]
}
```

---

### Create Variation

```http
POST /api/menus/:menuId/products/:productId/variations
```

**Auth:** Required (must own menu)

**Body:**
```json
{
  "nameKa": "საშუალო",
  "nameEn": "Medium",
  "nameRu": "Средний",
  "price": 3.50
}
```

**Validation:**
- `nameKa`: required, 2-50 characters
- `price`: required, positive decimal
- `nameEn`, `nameRu`: optional, max 50 characters

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "var3",
    "nameKa": "საშუალო",
    "price": "3.50",
    "sortOrder": 2
  }
}
```

---

### Update Variation

```http
PUT /api/menus/:menuId/products/:productId/variations/:variationId
```

**Auth:** Required (must own menu)

**Body:**
```json
{
  "nameKa": "საშუალო ზომა",
  "price": 3.75
}
```

---

### Delete Variation

```http
DELETE /api/menus/:menuId/products/:productId/variations/:variationId
```

**Auth:** Required (must own menu)

---

### Reorder Variations

```http
POST /api/menus/:menuId/products/:productId/variations/reorder
```

**Auth:** Required (must own menu)

**Body:**
```json
{
  "order": ["var2", "var3", "var1"]
}
```

---

## Promotions

### List Promotions

```http
GET /api/menus/:menuId/promotions
```

**Auth:** Required (must own menu) **Plan:** STARTER+

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "promo1",
      "menuId": "cm1abc123",
      "title": "Happy Hour",
      "description": "30% off all cocktails",
      "discount": 30,
      "validFrom": "2024-01-20T17:00:00Z",
      "validTo": "2024-01-20T20:00:00Z",
      "isActive": true
    }
  ]
}
```

---

### Create Promotion

```http
POST /api/menus/:menuId/promotions
```

**Auth:** Required (must own menu)
**Plan:** STARTER+

**Body:**
```json
{
  "title": "Lunch Special",
  "description": "20% off all main courses",
  "discount": 20,
  "validFrom": "2024-01-21T12:00:00Z",
  "validTo": "2024-01-21T15:00:00Z",
  "image": "https://cdn.digitalmenu.ge/promos/lunch.jpg"
}
```

**Validation:**
- `title`: required, 3-100 characters
- `discount`: required, 1-99 integer (percentage)
- `validFrom`, `validTo`: required, ISO 8601 dates
- `validTo` must be after `validFrom`

---

### Update Promotion

```http
PUT /api/promotions/:id
```

**Auth:** Required (must own menu)
**Plan:** STARTER+

---

### Delete Promotion

```http
DELETE /api/promotions/:id
```

**Auth:** Required (must own menu)
**Plan:** STARTER+

---

## Upload

### Upload Image

```http
POST /api/upload
```

**Auth:** Required

**Content-Type:** `multipart/form-data`

**Form Data:**
- `file`: Image file (JPEG, PNG, WebP)

**Validation:**
- Max size: 5 MB
- Allowed types: `image/jpeg`, `image/png`, `image/webp`

**Response:**
```json
{
  "success": true,
  "data": {
    "url": "https://cdn.digitalmenu.ge/products/abc123.jpg",
    "path": "products/user123/abc123.jpg"
  }
}
```

**Errors:**
- `400 NO_FILE` - No file uploaded
- `400 INVALID_FILE_TYPE` - Unsupported file type
- `400 FILE_TOO_LARGE` - File exceeds 5MB
- `500 UPLOAD_FAILED` - R2 upload failed

---

## QR Code

### Generate QR Code

```http
GET /api/qr/:menuId
```

**Auth:** Required (must own menu)

**Query Params:**
- `format` (optional) - `png` (default)
- `size` (optional) - `small` (200px), `medium` (400px, default), `large` (800px)

**Response:** PNG image (binary)

**Content-Type:** `image/png`

**Example:**
```
GET /api/qr/cm1abc123?format=png&size=large
```

---

## Analytics

### Get Menu Analytics

```http
GET /api/menus/:menuId/analytics
```

**Auth:** Required (must own menu)
**Plan:** PRO only

**Query Params:**
- `from` (optional) - Start date (ISO 8601)
- `to` (optional) - End date (ISO 8601)

**Response:**
```json
{
  "success": true,
  "data": {
    "totalViews": 1542,
    "viewsByDate": [
      { "date": "2024-01-20", "views": 45 },
      { "date": "2024-01-21", "views": 67 }
    ],
    "viewsByLanguage": {
      "KA": 850,
      "EN": 542,
      "RU": 150
    },
    "viewsByCountry": {
      "GE": 1200,
      "US": 250,
      "RU": 92
    },
    "topProducts": [
      { "id": "prod1", "name": "Espresso", "views": 342 }
    ]
  }
}
```

---

## Error Codes

### Standard Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `UNAUTHORIZED` | 401 | Not authenticated |
| `FORBIDDEN` | 403 | Not authorized (wrong user) |
| `NOT_FOUND` | 404 | Resource not found |
| `VALIDATION_ERROR` | 400 | Input validation failed |
| `DUPLICATE_SLUG` | 409 | Slug already exists |
| `PLAN_LIMIT` | 403 | Plan limit reached |
| `FEATURE_NOT_AVAILABLE` | 403 | Feature requires upgrade |
| `FILE_TOO_LARGE` | 400 | Upload file too large |
| `INVALID_FILE_TYPE` | 400 | Unsupported file type |
| `INTERNAL_ERROR` | 500 | Server error |

### Error Response Example

```json
{
  "success": false,
  "error": {
    "code": "PLAN_LIMIT",
    "message": "You've reached the maximum number of menus for your plan. Upgrade to create more.",
    "details": {
      "currentPlan": "FREE",
      "currentCount": 1,
      "limit": 1
    }
  }
}
```

---

## Rate Limiting

**Not yet implemented in MVP.**

**Future (Phase 2+):**
- 100 requests / minute per user
- 1000 requests / hour per user
- Public menu: unlimited (cached)

---

## Webhooks (Future)

**Not available in MVP.**

**Planned events:**
- `menu.published`
- `menu.unpublished`
- `product.created`
- `product.updated`
- `order.created` (when ordering feature added)

---

## Testing APIs

### Using curl

```bash
# Get session token from browser cookies

# List menus
curl http://localhost:3000/api/menus \
  -H "Cookie: next-auth.session-token=YOUR_TOKEN"

# Create menu
curl -X POST http://localhost:3000/api/menus \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=YOUR_TOKEN" \
  -d '{"name":"Test Menu","slug":"test-menu"}'
```

### Using Postman/Insomnia

1. Login via browser
2. Get session cookie
3. Import collection
4. Add session cookie to requests

---

## Health Check

### Check System Health

```http
GET /api/health
```

**Auth:** Not required

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2026-01-30T10:00:00Z",
  "services": {
    "database": "ok",
    "redis": "ok"
  }
}
```

**Error Response (503):**
```json
{
  "status": "unhealthy",
  "error": "Database connection failed"
}
```

---

## Menu Views

### Track Menu View

```http
POST /api/menus/:menuId/views
```

**Auth:** Not required (public endpoint)

**Body:**
```json
{
  "language": "KA"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "viewed": true
  }
}
```

**Note:** Views are debounced to prevent duplicate tracking from the same session.

---

## Public Menu

### Get Public Menu

```http
GET /api/menus/public/:slug
```

**Auth:** Not required

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "cm1abc123",
    "name": "Main Menu",
    "slug": "main-menu",
    "description": "Our main menu",
    "categories": [
      {
        "id": "cat1",
        "nameKa": "ცხელი სასმელები",
        "nameEn": "Hot Drinks",
        "sortOrder": 0,
        "products": [
          {
            "id": "prod1",
            "nameKa": "ესპრესო",
            "nameEn": "Espresso",
            "price": "3.50",
            "image": "https://...",
            "variations": []
          }
        ]
      }
    ],
    "promotions": [
      {
        "id": "promo1",
        "title": "Happy Hour",
        "description": "30% off drinks",
        "validFrom": "2026-01-30T17:00:00Z",
        "validTo": "2026-01-30T20:00:00Z"
      }
    ]
  }
}
```

**Errors:**
- `404 NOT_FOUND` - Menu not found or not published

**Note:** Response is cached in Redis for 5 minutes.

---

## API Changelog

### v1.0.0 (MVP - 2026-01-30)
- Initial release
- All core endpoints
- Menu, Category, Product CRUD
- Product Variations
- Promotions
- QR Code Generation
- Analytics
- Public Menu with caching
- Health check endpoint

### Future
- v1.1.0: Rate limiting
- v1.2.0: Webhooks
- v2.0.0: GraphQL API (optional)

---

**ბოლო განახლება:** 2026-01-30
