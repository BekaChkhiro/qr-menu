# Database Setup Guide

This guide will help you set up the PostgreSQL database for the Digital Menu application using Neon.

## Step 1: Create a Neon Database

1. Visit [Neon](https://neon.tech) and create a free account
2. Click "Create a new project"
3. Choose a project name (e.g., "digital-menu")
4. Select your preferred region
5. Click "Create Project"

## Step 2: Get Your Connection String

After creating the project:

1. Go to your project dashboard
2. Click on "Connection Details" or find the connection string section
3. Select "Prisma" from the connection string format dropdown
4. Copy the connection string (it will look like this):
   ```
   postgresql://username:password@ep-xxx-xxx.region.aws.neon.tech/neondb?sslmode=require
   ```

## Step 3: Configure Environment Variables

1. In the root of your project, create a `.env` file:
   ```bash
   cp .env.example .env
   ```

2. Open `.env` and add your Neon connection string:
   ```env
   DATABASE_URL="postgresql://username:password@ep-xxx-xxx.region.aws.neon.tech/neondb?sslmode=require"
   ```

3. Keep the `.env` file secure - it's already in `.gitignore` and won't be committed to version control

## Step 4: Push Schema to Database

From the root directory, run:

```bash
# This will create all tables based on the Prisma schema
pnpm db:push
```

You should see output like:
```
✔ Generated Prisma Client
✔ Database synchronized successfully
```

## Step 5: Verify the Setup

1. Open Prisma Studio to view your database:
   ```bash
   pnpm db:studio
   ```

2. This opens a web interface at `http://localhost:5555`

3. You should see all your tables:
   - users
   - accounts
   - sessions
   - menus
   - categories
   - products
   - product_variations
   - promotions
   - menu_views

## Understanding the Database Structure

### User & Authentication
- **users** - Main user accounts
- **accounts** - OAuth providers (Google, Apple)
- **sessions** - Active user sessions
- **verification_tokens** - Email verification

### Menu System
- **menus** - Restaurant/cafe menus (belongs to user)
- **categories** - Menu sections (belongs to menu)
- **products** - Menu items (belongs to category)
- **product_variations** - Size options like S/M/L (belongs to product)

### Marketing & Analytics
- **promotions** - Special offers (belongs to menu)
- **menu_views** - View tracking for analytics

### Plan Limits

The database enforces these limits at the application level:

| Plan | Max Menus | Max Categories | Max Products |
|------|-----------|----------------|--------------|
| FREE | 1 | 3 | 15 |
| STARTER | 3 | Unlimited | Unlimited |
| PRO | Unlimited | Unlimited | Unlimited |

## Common Database Commands

From the root directory:

```bash
# Regenerate Prisma Client after schema changes
pnpm db:generate

# Push schema changes to database (development)
pnpm db:push

# Create a migration (production-ready)
pnpm db:migrate

# Open Prisma Studio (database GUI)
pnpm db:studio
```

## Troubleshooting

### Connection Errors

**Error: Can't reach database server**
- Check your internet connection
- Verify the DATABASE_URL is correct
- Ensure your Neon database is active

**Error: Environment variable not found: DATABASE_URL**
- Make sure `.env` file exists in the root directory
- Verify `DATABASE_URL` is defined in `.env`
- Restart your development server

### Schema Sync Issues

**Tables not updating after schema changes**
1. Run `pnpm db:generate` to regenerate the client
2. Run `pnpm db:push` to sync with database
3. Restart your development server

**Migration conflicts**
- Use `pnpm db:push` for development (skips migrations)
- Use `pnpm db:migrate` for production (creates migration history)

## Next Steps

After database setup:

1. **Test the connection** - Run Prisma Studio to verify
2. **Seed data (optional)** - Add test menus and products
3. **Continue with T1.3** - Set up authentication system
4. **Build API routes** - Create CRUD endpoints in Phase 2

## Database Backups

Neon provides automatic backups:
- Free plan: 7-day backup retention
- Paid plans: 30-day backup retention

To manually export your database:
```bash
# Using Neon CLI or pg_dump
# See Neon documentation for details
```

## Security Best Practices

1. ✅ Never commit `.env` file (already in `.gitignore`)
2. ✅ Use environment variables for all secrets
3. ✅ Always filter by `userId` in queries
4. ✅ Enable SSL mode in connection string
5. ✅ Use Prisma's parameterized queries (automatic)
6. ✅ Implement rate limiting on API routes

## Resources

- [Prisma Documentation](https://www.prisma.io/docs)
- [Neon Documentation](https://neon.tech/docs)
- [Database Schema](./packages/database/prisma/schema.prisma)
- [Database Package README](./packages/database/README.md)
