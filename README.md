# Digital Menu - QR Code Menu Management SaaS

A modern SaaS platform enabling cafes and restaurants to create and manage digital menus via QR codes.

[![Next.js](https://img.shields.io/badge/Next.js-14+-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5+-blue?logo=typescript)](https://typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3+-38bdf8?logo=tailwindcss)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-Private-red)]()

## Overview

Digital Menu provides three main components:

- **Marketing Website** (`/`) - Landing page, pricing, and demo
- **Admin Panel** (`/admin/*`) - Menu management dashboard for cafe owners
- **Public Menu** (`/m/[slug]`) - Customer-facing menu accessed via QR code

### Key Features

- User authentication (Email/Password & Google OAuth)
- Multi-language support (Georgian, English, Russian)
- Menu, category, and product management
- Product variations (sizes, portions)
- Drag-and-drop reordering
- Promotions and special offers
- QR code generation
- Real-time updates
- Basic analytics (menu views)
- Plan-based feature limits (Free, Starter, Pro)

## Project Structure

```
digital-menu/
├── apps/web/              # Main Next.js application
│   ├── app/               # Next.js App Router
│   │   ├── (marketing)/   # Public pages (/, /pricing, /demo)
│   │   ├── (auth)/        # Auth pages (/login, /register)
│   │   ├── admin/         # Admin panel with sidebar layout
│   │   ├── m/[slug]/      # Public menus
│   │   └── api/           # API routes
│   ├── components/        # React components
│   ├── lib/               # Utilities and configurations
│   └── hooks/             # Custom React hooks
├── packages/
│   ├── database/          # Prisma schema and migrations
│   ├── config/            # Shared configurations
│   └── types/             # Shared TypeScript types
└── docs/                  # Project documentation
```

## Tech Stack

| Category | Technology |
|----------|------------|
| Framework | Next.js 14+ (App Router) |
| Language | TypeScript 5+ |
| Styling | Tailwind CSS + shadcn/ui |
| Database | PostgreSQL (Neon) |
| ORM | Prisma |
| Authentication | NextAuth.js |
| State Management | TanStack Query + Zustand |
| Real-time | Pusher |
| Image Storage | Cloudinary |
| Caching | Redis (Upstash) |
| Email | Resend |
| Monitoring | Sentry |
| Package Manager | pnpm |
| Monorepo | Turborepo |

## Quick Start

### Prerequisites

- Node.js 18+ (20+ recommended)
- pnpm 8+
- Git

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd qr-menu

# Install dependencies
pnpm install

# Copy environment variables
cp apps/web/.env.example apps/web/.env.local

# Edit .env.local with your credentials (see Environment Variables below)
```

### Database Setup

```bash
# Push schema to database
pnpm db:push

# Generate Prisma client
pnpm prisma generate

# (Optional) Open Prisma Studio
pnpm db:studio
```

### Development

```bash
# Start development server
pnpm dev

# Open http://localhost:3000
```

### Build & Production

```bash
# Build for production
pnpm build

# Start production server
pnpm start
```

## Environment Variables

Create a `.env.local` file in `apps/web/` with the following variables:

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | Neon PostgreSQL connection string | `postgresql://user:pass@host/db` |
| `AUTH_SECRET` | NextAuth.js secret (generate with `openssl rand -base64 32`) | `your-secret-key` |
| `NEXTAUTH_URL` | Application URL | `http://localhost:3000` |

### Optional Variables

| Variable | Description | Service |
|----------|-------------|---------|
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | Google Cloud Console |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret | Google Cloud Console |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name | Cloudinary |
| `CLOUDINARY_API_KEY` | Cloudinary API key | Cloudinary |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret | Cloudinary |
| `PUSHER_APP_ID` | Pusher app ID | Pusher |
| `PUSHER_KEY` | Pusher key | Pusher |
| `PUSHER_SECRET` | Pusher secret | Pusher |
| `PUSHER_CLUSTER` | Pusher cluster (e.g., `eu`) | Pusher |
| `UPSTASH_REDIS_REST_URL` | Upstash Redis URL | Upstash |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash Redis token | Upstash |
| `RESEND_API_KEY` | Resend email API key | Resend |
| `SENTRY_DSN` | Sentry error tracking DSN | Sentry |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | Google Analytics ID | Google Analytics |

See [`apps/web/.env.example`](apps/web/.env.example) for the complete list with descriptions.

## Available Scripts

### Development

```bash
pnpm dev              # Start development server
pnpm build            # Build for production
pnpm start            # Start production server
pnpm lint             # Run ESLint
pnpm format           # Format with Prettier
pnpm type-check       # TypeScript type checking
```

### Database

```bash
pnpm db:push          # Push schema changes to database
pnpm db:migrate       # Run migrations
pnpm db:studio        # Open Prisma Studio
pnpm db:generate      # Generate Prisma client
```

### Testing

```bash
pnpm test             # Run all tests
pnpm test:watch       # Run tests in watch mode
pnpm test:coverage    # Run tests with coverage
```

## API Endpoints

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/[...nextauth]` | NextAuth.js handlers |

### Menus

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/menus` | List user's menus |
| POST | `/api/menus` | Create menu |
| GET | `/api/menus/:id` | Get menu details |
| PUT | `/api/menus/:id` | Update menu |
| DELETE | `/api/menus/:id` | Delete menu |
| POST | `/api/menus/:id/publish` | Publish/unpublish menu |
| GET | `/api/menus/public/:slug` | Get public menu |

### Categories

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/menus/:id/categories` | List categories |
| POST | `/api/menus/:id/categories` | Create category |
| PUT | `/api/menus/:id/categories/:cid` | Update category |
| DELETE | `/api/menus/:id/categories/:cid` | Delete category |
| POST | `/api/menus/:id/categories/reorder` | Reorder categories |

### Products

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/menus/:id/products` | List products |
| POST | `/api/menus/:id/products` | Create product |
| PUT | `/api/menus/:id/products/:pid` | Update product |
| DELETE | `/api/menus/:id/products/:pid` | Delete product |
| POST | `/api/menus/:id/products/reorder` | Reorder products |

### Product Variations

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/menus/:id/products/:pid/variations` | List variations |
| POST | `/api/menus/:id/products/:pid/variations` | Create variation |
| PUT | `/api/menus/:id/products/:pid/variations/:vid` | Update variation |
| DELETE | `/api/menus/:id/products/:pid/variations/:vid` | Delete variation |
| POST | `/api/menus/:id/products/:pid/variations/reorder` | Reorder variations |

### Promotions

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/menus/:id/promotions` | List promotions |
| POST | `/api/menus/:id/promotions` | Create promotion |
| PUT | `/api/menus/:id/promotions/:pid` | Update promotion |
| DELETE | `/api/menus/:id/promotions/:pid` | Delete promotion |

### Other

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/upload` | Upload image |
| GET | `/api/qr/:menuId` | Generate QR code |
| GET | `/api/menus/:id/analytics` | Get menu analytics |
| POST | `/api/menus/:id/views` | Track menu view |
| GET | `/api/health` | Health check |

See [API Reference](docs/05-api-reference.md) for complete documentation.

## Pricing Tiers

| Tier | Price | Menus | Categories | Products | Features |
|------|-------|-------|------------|----------|----------|
| **Free** | 0₾ | 1 | 3 | 15 | Basic QR |
| **Starter** | 29₾/mo | 3 | ∞ | ∞ | + Promotions, Branding |
| **Pro** | 59₾/mo | ∞ | ∞ | ∞ | + Multilingual, Allergens, Analytics |

## Deployment

The application is designed to be deployed on Vercel with:

- **Database**: Neon PostgreSQL
- **Image Storage**: Cloudinary
- **Caching**: Upstash Redis
- **Real-time**: Pusher

See [Deployment Guide](docs/06-deployment.md) for detailed instructions.

## Documentation

| Document | Description |
|----------|-------------|
| [Getting Started](docs/01-getting-started.md) | Development environment setup |
| [Architecture](docs/02-architecture.md) | System architecture and design |
| [Development Guide](docs/03-development-guide.md) | Development guidelines |
| [Features](docs/04-features.md) | Feature documentation |
| [API Reference](docs/05-api-reference.md) | API documentation |
| [Deployment](docs/06-deployment.md) | Deployment guide |
| [Timeline & Roadmap](docs/07-timeline-roadmap.md) | Project timeline |
| [Best Practices](docs/08-best-practices.md) | Coding best practices |
| [User Guide](docs/USER_GUIDE.md) | Guide for cafe owners |
| [CLAUDE.md](CLAUDE.md) | Claude Code development instructions |

## Contributing

This project follows the guidelines in [CLAUDE.md](CLAUDE.md) for development with Claude Code.

### Development Workflow

1. Create a feature branch from `develop`
2. Make your changes
3. Run tests: `pnpm test`
4. Run linting: `pnpm lint`
5. Create a pull request

## License

Private - All Rights Reserved

---

**Last Updated**: 2026-01-30
