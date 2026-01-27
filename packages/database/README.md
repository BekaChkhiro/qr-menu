# Database Package

This package contains the Prisma schema and database client for the Digital Menu application.

## Setup Instructions

### 1. Create a Neon PostgreSQL Database

1. Go to [Neon](https://neon.tech) and sign up for a free account
2. Create a new project
3. Copy the connection string (it will look like: `postgresql://user:password@host.neon.tech/neondb`)
4. Create a `.env` file in the root of the project
5. Add your connection string:
   ```
   DATABASE_URL="postgresql://user:password@host.neon.tech/neondb?sslmode=require"
   ```

### 2. Push the Schema to Database

Run one of the following commands from the root directory:

```bash
# Push schema changes without creating migrations (good for development)
pnpm db:push

# OR create a migration (recommended for production)
pnpm db:migrate
```

### 3. Verify Database Setup

Open Prisma Studio to view your database:

```bash
pnpm db:studio
```

This will open a browser interface at `http://localhost:5555` where you can view and edit your data.

## Database Schema

The schema includes the following models:

### Core Models
- **User** - User accounts with authentication and plan information
- **Account** - OAuth account connections (NextAuth)
- **Session** - User sessions (NextAuth)
- **VerificationToken** - Email verification tokens (NextAuth)

### Menu System
- **Menu** - Restaurant/cafe menus with branding
- **Category** - Menu categories (e.g., Drinks, Food, Desserts)
- **Product** - Menu items with multi-language support
- **ProductVariation** - Product sizes/portions (e.g., Small, Medium, Large)
- **Promotion** - Special offers and promotions

### Analytics
- **MenuView** - Track menu views for analytics

### Enums
- **Plan** - FREE, STARTER, PRO
- **MenuStatus** - DRAFT, PUBLISHED
- **Language** - KA (Georgian), EN (English), RU (Russian)
- **Allergen** - GLUTEN, DAIRY, EGGS, NUTS, SEAFOOD, SOY, PORK

## Key Features

### Multi-language Support
Products and categories store translations in separate fields:
- `nameKa` - Georgian (required)
- `nameEn` - English (optional)
- `nameRu` - Russian (optional)

### Cascading Deletes
When you delete a parent record, all related records are automatically deleted:
- Delete User → Deletes all Menus
- Delete Menu → Deletes all Categories, Promotions, and Views
- Delete Category → Deletes all Products
- Delete Product → Deletes all Variations

### Indexes
The schema includes indexes on frequently queried fields for performance:
- Foreign keys (userId, menuId, categoryId, etc.)
- Composite indexes for ordering (menuId + sortOrder)
- Unique constraints (email, slug, sessionToken)

## Available Scripts

From the root directory:

```bash
# Generate Prisma Client after schema changes
pnpm generate

# Push schema to database (dev)
pnpm db:push

# Create and run migrations (production)
pnpm db:migrate

# Open Prisma Studio
pnpm db:studio
```

## Usage in Application

Import the Prisma client in your application:

```typescript
import { prisma } from '@digital-menu/database';

// Example: Get all menus for a user
const menus = await prisma.menu.findMany({
  where: { userId: 'user-id' },
  include: {
    categories: {
      orderBy: { sortOrder: 'asc' },
      include: { products: true }
    }
  }
});
```

## Important Notes

- Always filter queries by `userId` to ensure users can only access their own data
- Use `sortOrder` field for drag-and-drop reordering of categories and products
- Prices are stored as `Decimal` type with 2 decimal places
- All timestamps are automatically managed by Prisma (`createdAt`, `updatedAt`)
- The Prisma client uses a singleton pattern to prevent multiple instances in development

## Troubleshooting

### Error: "Environment variable not found: DATABASE_URL"
- Make sure you have a `.env` file in the root directory
- Check that `DATABASE_URL` is defined in the `.env` file

### Error: "Can't reach database server"
- Verify your Neon database connection string
- Ensure your database is running
- Check your internet connection

### Schema changes not reflected
- Run `pnpm generate` to regenerate the Prisma client
- Run `pnpm db:push` to push schema changes to the database
