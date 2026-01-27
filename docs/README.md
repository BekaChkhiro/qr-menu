# Digital Menu - პროექტის დოკუმენტაცია

> 🎯 **SaaS პლატფორმა ციფრული მენიუების შესაქმნელად და მართვისთვის QR კოდის საშუალებით**

**ვერსია:** 1.0
**სტატუსი:** Development
**გუნდი:** 2-3 Fullstack დეველოპერი
**ვადა:** 10 კვირა (3 Phase)

---

## 📚 სარჩევი

1. [Getting Started](./01-getting-started.md) - როგორ დავიწყოთ პროექტზე მუშაობა
2. [Architecture](./02-architecture.md) - სისტემის არქიტექტურა და დიზაინი
3. [Development Guide](./03-development-guide.md) - დეველოპმენტის გაიდი
4. [Features](./04-features.md) - ფუნქციონალის დეტალური აღწერა
5. [API Reference](./05-api-reference.md) - API დოკუმენტაცია
6. [Deployment](./06-deployment.md) - Deploy-ის გაიდი
7. [Timeline & Roadmap](./07-timeline-roadmap.md) - პროექტის გეგმა და ეტაპები
8. [Best Practices](./08-best-practices.md) - საუკეთესო პრაქტიკები

---

## 🎯 პროექტის მიმოხილვა

### რა არის Digital Menu?

Digital Menu არის SaaS პლატფორმა, რომელიც კაფეებს და რესტორნებს საშუალებას აძლევს:
- შექმნან და მართონ ციფრული მენიუები
- გამოაქვეყნონ მენიუები QR კოდის საშუალებით
- რეალურ დროში განაახლონ ფასები და პროდუქტები
- მიიღონ ანალიტიკა სტუმრების ქცევაზე
- მართონ რამდენიმე მენიუ (საუზმე, სადილი, ბარი)

### პლატფორმის კომპონენტები

```
┌─────────────────────────────────────────────────────────┐
│                    digitalmenu.ge                       │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  📱 Marketing Website (/)                               │
│     └─ Landing, Pricing, Demo                          │
│                                                         │
│  🎛️  Admin Panel (/admin/*)                            │
│     └─ Dashboard, Menu Management, Analytics           │
│                                                         │
│  📋 Public Menu (/m/[slug])                            │
│     └─ Customer-facing menu                            │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 🛠 ტექნოლოგიური სტეკი

### Core Technologies

```typescript
Frontend:        Next.js 14+ (App Router) + TypeScript 5+
UI:              Tailwind CSS + shadcn/ui
Runtime:         Node.js 20+
Package Manager: pnpm
Monorepo:        Turborepo
```

### Backend & Database

```typescript
Database:        PostgreSQL (Neon - Serverless)
ORM:             Prisma
Caching:         Redis (Upstash)
Storage:         Cloudflare R2
API:             Next.js API Routes (REST)
```

### Authentication & Real-time

```typescript
Auth:            NextAuth.js (Auth.js v5)
OAuth:           Google
Real-time:       Pusher
Email:           Resend
```

### Infrastructure

```typescript
Hosting:         Railway
CI/CD:           GitHub Actions + Railway Auto-deploy
Domain:          TBD (digitalmenu.ge recommended)
SSL:             Automatic via Railway
```

---

## 💰 Pricing Tiers

| Tier | ფასი | მენიუები | კატეგორიები | პროდუქტები | Features |
|------|------|----------|-------------|-------------|----------|
| **Free** | 0 ₾ | 1 | 3 | 15 | Basic QR |
| **Starter** | 29 ₾/თვე | 3 | ∞ | ∞ | + Promotions, Branding |
| **Pro** | 59 ₾/თვე | ∞ | ∞ | ∞ | + Multilingual, Allergens, Analytics |

---

## 🚀 სწრაფი დაწყება

### Prerequisites

```bash
# Node.js 20+
node --version  # v20.0.0+

# pnpm
npm install -g pnpm

# Git
git --version
```

### Installation

```bash
# Clone repository
git clone <repository-url>
cd qr-menu

# Install dependencies
pnpm install

# Setup environment variables
cp .env.example .env.local

# Setup database
pnpm db:push

# Start development server
pnpm dev
```

აპლიკაცია გაეშვება: **http://localhost:3000**

დეტალური Setup გაიდი: [Getting Started](./01-getting-started.md)

---

## 📦 Monorepo სტრუქტურა

```
qr-menu/
├── apps/
│   └── web/                    # მთავარი Next.js აპლიკაცია
│       ├── app/                # App Router
│       │   ├── (marketing)/    # Marketing pages
│       │   ├── (auth)/         # Auth pages
│       │   ├── admin/          # Admin panel
│       │   ├── m/[slug]/       # Public menus
│       │   └── api/            # API routes
│       ├── components/
│       │   ├── ui/             # shadcn/ui components
│       │   ├── admin/          # Admin components
│       │   ├── public/         # Public menu components
│       │   └── marketing/      # Marketing components
│       ├── lib/
│       │   ├── auth/           # NextAuth config
│       │   ├── db/             # Prisma client
│       │   ├── api/            # API utilities
│       │   ├── validations/    # Zod schemas
│       │   └── cache/          # Redis utilities
│       └── hooks/              # Custom React hooks
│
├── packages/
│   ├── database/               # Prisma schema
│   ├── config/                 # Shared configs
│   └── types/                  # Shared TypeScript types
│
├── docs/                       # 📚 ეს დოკუმენტაცია
└── CLAUDE.md                   # Claude Code instructions
```

---

## 🎯 MVP Phases

### Phase 1: Core MVP (4 კვირა)
✅ Infrastructure, Auth, Basic CRUD, QR, Public Menu

### Phase 2: Advanced Features (4 კვირა)
✅ Real-time, Multilingual, All tiers, Promotions, Analytics

### Phase 3: Payments & Polish (2 კვირა)
✅ BOG iPay, PWA, Advanced Analytics, Testing

დეტალური timeline: [Timeline & Roadmap](./07-timeline-roadmap.md)

---

## 👥 გუნდი და როლები

### Development Team
- **2-3 Fullstack დეველოპერი** (TypeScript, React, Node.js)
- პროექტ მენეჯერი/Tech Lead
- QA/Testing (დეველოპერებმა შესრულდება)

### Required Skills
- ✅ Next.js 14+ App Router
- ✅ TypeScript
- ✅ Prisma ORM
- ✅ PostgreSQL
- ✅ Tailwind CSS + shadcn/ui
- ✅ NextAuth.js
- ⚠️ Pusher (real-time) - სასურველია
- ⚠️ Cloudflare R2 - ისწავლება პროექტში

---

## 📋 Development Workflow

### Git Workflow

```bash
# მთავარი ბრანჩები
main        # Production
develop     # Development
feature/*   # Feature branches
```

### Common Commands

```bash
# Development
pnpm dev                    # Start dev server
pnpm build                  # Build for production
pnpm start                  # Start production server

# Database
pnpm db:push                # Push schema changes
pnpm db:migrate             # Run migrations
pnpm db:studio              # Open Prisma Studio

# Testing
pnpm test                   # Run tests
pnpm test:watch             # Watch mode
pnpm lint                   # Lint code
pnpm format                 # Format with Prettier
```

---

## 🔒 Security & Best Practices

### Security Requirements

- ✅ ყველა input-ი validated with Zod
- ✅ Authentication required for admin routes
- ✅ Authorization checks (plan limits, ownership)
- ✅ Rate limiting on sensitive endpoints
- ✅ SQL injection protection (Prisma)
- ✅ XSS protection (Next.js built-in)
- ✅ HTTPS only (enforced by Railway)

### Performance Targets

- First Contentful Paint: < 1.5s
- Largest Contentful Paint: < 2.5s
- Time to Interactive: < 3s
- Core Web Vitals: All "Good"

---

## 📞 Support და კომუნიკაცია

### Development Tools

- **GitHub Repository:** `<repo-url>`
- **Project Board:** GitHub Projects
- **Documentation:** `/docs`
- **API Testing:** Swagger UI (development)

### Communication

- Daily standups (15 min)
- Weekly sprint planning
- Code reviews via Pull Requests
- Technical decisions documented in `/docs`

---

## 🎓 Learning Resources

### Next.js 14
- [Next.js Documentation](https://nextjs.org/docs)
- [App Router Guide](https://nextjs.org/docs/app)
- [Server Actions](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions)

### Prisma
- [Prisma Documentation](https://www.prisma.io/docs)
- [PostgreSQL Best Practices](https://www.prisma.io/docs/guides/performance-and-optimization)

### shadcn/ui
- [shadcn/ui Documentation](https://ui.shadcn.com)
- [Component Examples](https://ui.shadcn.com/examples)

### Authentication
- [NextAuth.js v5](https://authjs.dev)
- [Google OAuth Setup](https://authjs.dev/getting-started/providers/google)

---

## 📝 Contributing

### Pull Request Process

1. შექმენი feature branch: `git checkout -b feature/amazing-feature`
2. Commit changes: `git commit -m "Add amazing feature"`
3. Push to branch: `git push origin feature/amazing-feature`
4. Open Pull Request
5. Code review
6. Merge to develop

### Code Style

- TypeScript strict mode
- ESLint + Prettier
- Conventional Commits
- Component-based architecture

---

## 📄 License

TBD - Commercial project

---

## 🚦 Project Status

**Current Phase:** Phase 1 - Core MVP
**Progress:** 0%
**Next Milestone:** Infrastructure Setup
**Expected Completion:** Week 1

დეტალური progress: [Timeline & Roadmap](./07-timeline-roadmap.md)

---

**შენიშვნა:** ეს დოკუმენტაცია რეგულარულად განახლდება პროექტის განვითარებასთან ერთად.

**ბოლო განახლება:** 2026-01-26
