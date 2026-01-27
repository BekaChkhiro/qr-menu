# Digital Menu - QR Code Menu Management SaaS

A modern SaaS platform enabling cafes and restaurants to create and manage digital menus via QR codes.

## Project Structure

This is a Turborepo monorepo containing:

- **apps/web** - Main Next.js 14+ application
- **packages/database** - Prisma schema and database utilities
- **packages/config** - Shared configuration
- **packages/types** - Shared TypeScript types

## Tech Stack

- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **Database**: PostgreSQL (Neon)
- **ORM**: Prisma
- **Authentication**: NextAuth.js
- **Monorepo**: Turborepo
- **Package Manager**: pnpm

## Getting Started

### Prerequisites

- Node.js 18+ installed
- pnpm installed (or use `corepack enable`)

### Installation

```bash
# Install dependencies
pnpm install

# Set up environment variables
cp apps/web/.env.example apps/web/.env.local
# Edit .env.local with your configuration
```

### Development

```bash
# Start development server
pnpm dev

# Build for production
pnpm build

# Run linting
pnpm lint

# Format code
pnpm format
```

### Database

```bash
# Push schema changes to database
pnpm db:push

# Run migrations
pnpm db:migrate

# Open Prisma Studio
pnpm db:studio
```

## Project Features

### MVP Features
- User authentication (email/password & Google OAuth)
- Menu CRUD operations
- Category and product management
- Multi-language support (Georgian, English, Russian)
- Product variations
- Promotions
- QR code generation
- Public menu display
- Basic analytics

## Documentation

- [CLAUDE.md](./CLAUDE.md) - Development guidelines for Claude Code
- [PROJECT_PLAN.md](./PROJECT_PLAN.md) - Detailed project plan and tasks
- [TECHNICAL_SPEC.md](./TECHNICAL_SPEC.md) - Technical specifications

## Contributing

This project follows the guidelines in CLAUDE.md for development with Claude Code.

## License

Private - All Rights Reserved
