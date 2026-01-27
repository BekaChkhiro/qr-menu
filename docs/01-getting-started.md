# Getting Started - დაწყების გაიდი

> 🚀 **ეს გაიდი ნულიდან დაგეხმარება ლოკალური development გარემოს დაყენებაში**

---

## 📋 სარჩევი

1. [Prerequisites](#prerequisites)
2. [Infrastructure Setup](#infrastructure-setup)
3. [Local Development Setup](#local-development-setup)
4. [Environment Variables](#environment-variables)
5. [Database Setup](#database-setup)
6. [Running the Application](#running-the-application)
7. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### საჭირო Software

```bash
# Node.js 20+ (LTS)
node --version  # v20.0.0 ან უფრო მაღალი

# pnpm Package Manager
npm install -g pnpm
pnpm --version  # 8.0.0+

# Git
git --version  # 2.30.0+

# PostgreSQL Client (optional, for local testing)
psql --version  # 14.0+
```

### Recommended Tools

```bash
# VS Code Extensions
- ESLint
- Prettier
- Prisma
- Tailwind CSS IntelliSense
- GitLens

# CLI Tools
- GitHub CLI (gh)
- Railway CLI (optional)
```

---

## Infrastructure Setup

**⚠️ მნიშვნელოვანი:** ყველა infrastructure service უნდა დაყენდეს პროექტის დაწყებამდე.

### 1. Database - Neon (PostgreSQL)

#### რატომ Neon?
- ✅ Serverless PostgreSQL
- ✅ უფასო tier-ი 0.5 GB-მდე
- ✅ ავტომატური scaling
- ✅ Branch-based development

#### Setup ნაბიჯები:

1. **გაიხსენი Account**
   ```
   https://neon.tech
   → Sign up with GitHub/Google
   ```

2. **შექმენი Project**
   ```
   Project Name: digital-menu-dev
   Region:       Europe (Frankfurt) - ახლოს საქართველოსთან
   PostgreSQL:   v15 (recommended)
   ```

3. **მიიღე Connection String**
   ```
   Dashboard → Connection Details → Connection String

   Format:
   postgresql://[user]:[password]@[host]/[database]?sslmode=require

   მაგალითი:
   postgresql://user:pass@ep-cool-name-123456.eu-central-1.aws.neon.tech/dbname?sslmode=require
   ```

4. **შექმენი Development Branch (Optional)**
   ```
   Neon Dashboard → Branches → Create Branch
   Name: development
   ```

5. **შენახე Credentials**
   ```bash
   # .env.local ფაილში
   DATABASE_URL="postgresql://[your-connection-string]"
   ```

---

### 2. Caching - Upstash Redis

#### რატომ Upstash?
- ✅ Serverless Redis
- ✅ უფასო tier 10k commands/day
- ✅ Edge ready
- ✅ REST API

#### Setup ნაბიჯები:

1. **გაიხსენი Account**
   ```
   https://upstash.com
   → Sign up with GitHub/Email
   ```

2. **შექმენი Redis Database**
   ```
   Console → Create Database

   Name:     digital-menu-cache
   Type:     Regional (EU-CENTRAL-1)
   Plan:     Free (10K commands/day)
   TLS:      Enabled
   ```

3. **მიიღე Credentials**
   ```
   Database → REST API → Copy Credentials

   დაგჭირდება:
   - UPSTASH_REDIS_REST_URL
   - UPSTASH_REDIS_REST_TOKEN
   ```

4. **შენახე .env.local-ში**
   ```bash
   UPSTASH_REDIS_REST_URL="https://your-endpoint.upstash.io"
   UPSTASH_REDIS_REST_TOKEN="your-token-here"
   ```

---

### 3. File Storage - Cloudflare R2

#### რატომ R2?
- ✅ S3-compatible API
- ✅ უფასო 10GB storage
- ✅ Zero egress fees
- ✅ Global CDN

#### Setup ნაბიჯები:

1. **გაიხსენი Cloudflare Account**
   ```
   https://dash.cloudflare.com
   → Sign up
   ```

2. **R2-ის გააქტიურება**
   ```
   Dashboard → R2 → Purchase R2
   → Free Plan (10GB free)
   ```

3. **შექმენი Bucket**
   ```
   R2 → Create Bucket

   Name:     digital-menu-uploads
   Location: Automatic (EEUR for Europe)
   ```

4. **შექმენი API Token**
   ```
   R2 → Manage R2 API Tokens → Create API Token

   Permissions:
   ✅ Object Read & Write
   ✅ Bucket: digital-menu-uploads

   გაწერე:
   - Access Key ID
   - Secret Access Key
   ```

5. **მიიღე Public URL (Optional)**
   ```
   Bucket Settings → Public Access → Enable

   Custom Domain (optional):
   cdn.digitalmenu.ge → Point to R2
   ```

6. **შენახე .env.local-ში**
   ```bash
   R2_ACCOUNT_ID="your-account-id"
   R2_ACCESS_KEY_ID="your-access-key"
   R2_SECRET_ACCESS_KEY="your-secret-key"
   R2_BUCKET_NAME="digital-menu-uploads"
   R2_PUBLIC_URL="https://pub-xxxxx.r2.dev" # or custom domain
   ```

---

### 4. Real-time - Pusher

#### რატომ Pusher?
- ✅ WebSocket as a Service
- ✅ უფასო tier 200k messages/day
- ✅ Simple API
- ✅ Presence channels

#### Setup ნაბიჯები:

1. **გაიხსენი Account**
   ```
   https://pusher.com
   → Sign up
   ```

2. **შექმენი Channels App**
   ```
   Dashboard → Create App

   Name:      Digital Menu
   Cluster:   eu (Europe)
   Tech:      React, Node.js
   ```

3. **მიიღე Credentials**
   ```
   App Settings → Keys

   დაგჭირდება:
   - app_id
   - key (public)
   - secret (private)
   - cluster
   ```

4. **შენახე .env.local-ში**
   ```bash
   # Server-side
   PUSHER_APP_ID="123456"
   PUSHER_SECRET="your-secret"
   PUSHER_CLUSTER="eu"

   # Client-side (NEXT_PUBLIC_*)
   NEXT_PUBLIC_PUSHER_KEY="your-public-key"
   NEXT_PUBLIC_PUSHER_CLUSTER="eu"
   ```

---

### 5. Email - Resend

#### რატომ Resend?
- ✅ Modern Email API
- ✅ უფასო 3k emails/month
- ✅ Simple integration
- ✅ Email templates support

#### Setup ნაბიჯები:

1. **გაიხსენი Account**
   ```
   https://resend.com
   → Sign up
   ```

2. **დაამატე Domain (Optional)**
   ```
   Domains → Add Domain
   → digitalmenu.ge

   Configure DNS:
   Add MX, TXT records (მითითებული იქნება)
   ```

3. **შექმენი API Key**
   ```
   API Keys → Create API Key

   Name:        Production
   Permissions: Full Access (or sending only)
   ```

4. **შენახე .env.local-ში**
   ```bash
   RESEND_API_KEY="re_xxxxxxxxxxxxx"
   RESEND_FROM_EMAIL="noreply@digitalmenu.ge" # or onboarding@resend.dev
   ```

---

### 6. Authentication - Google OAuth

#### Setup ნაბიჯები:

1. **Google Cloud Console**
   ```
   https://console.cloud.google.com
   ```

2. **შექმენი Project**
   ```
   New Project → "Digital Menu"
   ```

3. **OAuth Consent Screen**
   ```
   APIs & Services → OAuth consent screen

   User Type: External
   App Name:  Digital Menu
   Email:     your-email@example.com
   Logo:      (optional)
   Scopes:    email, profile
   ```

4. **შექმენი OAuth Credentials**
   ```
   Credentials → Create Credentials → OAuth 2.0 Client ID

   Application Type: Web Application
   Name:            Digital Menu Web

   Authorized JavaScript origins:
   - http://localhost:3000
   - https://digitalmenu.ge (later)

   Authorized redirect URIs:
   - http://localhost:3000/api/auth/callback/google
   - https://digitalmenu.ge/api/auth/callback/google (later)
   ```

5. **შენახე Credentials**
   ```bash
   GOOGLE_CLIENT_ID="xxxxx.apps.googleusercontent.com"
   GOOGLE_CLIENT_SECRET="GOCSPX-xxxxxxxxxxxxx"
   ```

---

### 7. Hosting - Railway (Production only)

**⚠️ შენიშვნა:** Railway setup საჭიროა მხოლოდ deployment-ისთვის (Phase 1 completion).

დეტალური Railway setup: [06-deployment.md](./06-deployment.md)

---

## Local Development Setup

### 1. Clone Repository

```bash
# Clone project
git clone <repository-url>
cd qr-menu

# შექმენი development branch
git checkout -b develop
```

### 2. Install Dependencies

```bash
# Install all packages
pnpm install

# დაიწყოს dependency installation
# ეს რამდენიმე წუთი გრძელდება
```

### 3. Setup Environment Variables

```bash
# Copy example env file
cp .env.example .env.local

# Edit .env.local with your credentials
nano .env.local  # or use VS Code
```

---

## Environment Variables

### შექმენი `.env.local` ფაილი

```bash
# ===================================
# DATABASE
# ===================================
DATABASE_URL="postgresql://user:pass@host/db?sslmode=require"

# ===================================
# AUTHENTICATION
# ===================================
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"

# Google OAuth
GOOGLE_CLIENT_ID="xxxxx.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="GOCSPX-xxxxxxxxxxxxx"

# ===================================
# FILE STORAGE (Cloudflare R2)
# ===================================
R2_ACCOUNT_ID="your-account-id"
R2_ACCESS_KEY_ID="your-access-key"
R2_SECRET_ACCESS_KEY="your-secret-key"
R2_BUCKET_NAME="digital-menu-uploads"
R2_PUBLIC_URL="https://pub-xxxxx.r2.dev"

# ===================================
# CACHING (Upstash Redis)
# ===================================
UPSTASH_REDIS_REST_URL="https://your-endpoint.upstash.io"
UPSTASH_REDIS_REST_TOKEN="your-token-here"

# ===================================
# REAL-TIME (Pusher)
# ===================================
PUSHER_APP_ID="123456"
PUSHER_SECRET="your-secret"
PUSHER_CLUSTER="eu"

# Public (client-side)
NEXT_PUBLIC_PUSHER_KEY="your-public-key"
NEXT_PUBLIC_PUSHER_CLUSTER="eu"

# ===================================
# EMAIL (Resend)
# ===================================
RESEND_API_KEY="re_xxxxxxxxxxxxx"
RESEND_FROM_EMAIL="noreply@digitalmenu.ge"

# ===================================
# APPLICATION
# ===================================
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NODE_ENV="development"
```

### Generate NEXTAUTH_SECRET

```bash
# Terminal-ში გაუშვი:
openssl rand -base64 32

# Copy output to NEXTAUTH_SECRET
```

---

## Database Setup

### 1. Verify Connection

```bash
# Check if DATABASE_URL is correct
pnpm prisma db pull
```

### 2. Push Schema (First Time)

```bash
# Push Prisma schema to database
pnpm db:push

# ან
pnpm prisma db push
```

### 3. Generate Prisma Client

```bash
# Generate TypeScript types
pnpm prisma generate
```

### 4. Seed Database (Optional)

```bash
# Add demo data
pnpm db:seed

# Script location: packages/database/prisma/seed.ts
```

### 5. Open Prisma Studio

```bash
# Visual database browser
pnpm db:studio

# Opens at: http://localhost:5555
```

---

## Running the Application

### Development Mode

```bash
# Start dev server with hot reload
pnpm dev

# App runs at:
# - http://localhost:3000 (main app)
# - http://localhost:3000/admin (admin panel)
```

### Build for Production (Testing)

```bash
# Build
pnpm build

# Start production server
pnpm start
```

### Other Commands

```bash
# Linting
pnpm lint

# Format code
pnpm format

# Type checking
pnpm type-check

# Run tests
pnpm test
```

---

## Verify Installation

### Checklist

```
✅ pnpm install - success
✅ .env.local - configured with all services
✅ pnpm db:push - database schema created
✅ pnpm dev - app running at localhost:3000
✅ http://localhost:3000 - homepage loads
✅ http://localhost:3000/admin/login - auth page loads
✅ Register new account - works
✅ Google OAuth login - works
✅ Create test menu - works
✅ Upload image - works (R2)
✅ Pusher connection - check browser console
```

### Test Basic Functionality

```bash
# 1. Create Account
http://localhost:3000/admin/register
→ Email: test@example.com
→ Password: Test1234!
→ Business Name: Test Cafe

# 2. Login
http://localhost:3000/admin/login

# 3. Create Menu
Dashboard → Create Menu
→ Name: My First Menu
→ Slug: my-first-menu

# 4. View Public Menu
http://localhost:3000/m/my-first-menu
```

---

## Troubleshooting

### Common Issues

#### 1. Database Connection Failed

```bash
Error: P1001: Can't reach database server

Fix:
- Check DATABASE_URL in .env.local
- Verify Neon database is active
- Check internet connection
- Verify firewall/VPN not blocking
```

#### 2. Pusher Connection Failed

```bash
Error: Pusher connection failed

Fix:
- Check PUSHER_APP_ID, PUSHER_SECRET, PUSHER_CLUSTER
- Verify NEXT_PUBLIC_PUSHER_KEY starts with NEXT_PUBLIC_
- Check Pusher dashboard for app status
```

#### 3. R2 Upload Failed

```bash
Error: Upload failed

Fix:
- Verify R2_ACCESS_KEY_ID and R2_SECRET_ACCESS_KEY
- Check bucket permissions
- Verify bucket name matches R2_BUCKET_NAME
```

#### 4. Google OAuth Not Working

```bash
Error: Invalid redirect_uri

Fix:
- Check Google Console → Credentials
- Verify http://localhost:3000/api/auth/callback/google is added
- NEXTAUTH_URL matches current URL
```

#### 5. Package Installation Fails

```bash
Error: EACCES permission denied

Fix:
# Clear cache and reinstall
rm -rf node_modules
rm pnpm-lock.yaml
pnpm install
```

#### 6. Port Already in Use

```bash
Error: Port 3000 is already in use

Fix:
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or use different port
pnpm dev -- -p 3001
```

---

## Next Steps

✅ **Setup Complete!** თქვენი development environment მზადაა.

### რას ვაკეთებთ შემდეგ?

1. 📖 **წაიკითხე Architecture**: [02-architecture.md](./02-architecture.md)
2. 🛠 **დაიწყე Development**: [03-development-guide.md](./03-development-guide.md)
3. 🎯 **იხილე Timeline**: [07-timeline-roadmap.md](./07-timeline-roadmap.md)

---

## Additional Resources

### Documentation Links

- [Neon Docs](https://neon.tech/docs)
- [Upstash Docs](https://docs.upstash.com)
- [Cloudflare R2 Docs](https://developers.cloudflare.com/r2)
- [Pusher Docs](https://pusher.com/docs)
- [Resend Docs](https://resend.com/docs)
- [Prisma Docs](https://www.prisma.io/docs)
- [Next.js Docs](https://nextjs.org/docs)

### Support

თუ პრობლემა გაქვთ:
1. შეამოწმე [Troubleshooting](#troubleshooting) სექცია
2. იხილე GitHub Issues
3. დაუკავშირდი გუნდს

---

**ბოლო განახლება:** 2026-01-26
