import {
  PrismaClient,
  type ActivityLog,
  type ActivityType,
  type Menu,
  type MenuStatus,
  type Plan,
  type Prisma,
  type Promotion,
  type User,
} from '@prisma/client';
import bcrypt from 'bcryptjs';

// A dedicated Prisma client for the test process. Reuses the DATABASE_URL
// loaded by `playwright.config.ts` so seeding writes to the same database the
// dev server reads from.
const globalForPrisma = globalThis as unknown as { __planTestPrisma?: PrismaClient };

export const prismaTest: PrismaClient =
  globalForPrisma.__planTestPrisma ??
  new PrismaClient({
    log: ['error'],
  });

if (!globalForPrisma.__planTestPrisma) {
  globalForPrisma.__planTestPrisma = prismaTest;
}

// ---------------------------------------------------------------------------
// Safety guard: only allow seed/reset helpers to touch a local test DB.
// Anything else (Neon dev/staging/prod, RDS, any remote host) is rejected
// up-front so a stray `pnpm test:e2e` cannot truncate real data.
// ---------------------------------------------------------------------------

const SAFE_TEST_HOSTS = new Set(['localhost', '127.0.0.1', '::1']);

function assertSafeTestDatabase(): void {
  const rawUrl = process.env.DATABASE_URL ?? '';
  if (!rawUrl) {
    throw new Error(
      'DATABASE_URL is not set. Seed helpers require a database connection. ' +
        'Set DATABASE_URL to a local Postgres before running E2E tests.',
    );
  }

  let host: string;
  try {
    host = new URL(rawUrl).hostname.toLowerCase();
  } catch {
    throw new Error(
      'DATABASE_URL is not a parseable URL. Cannot verify it is safe to truncate.',
    );
  }

  if (!SAFE_TEST_HOSTS.has(host)) {
    throw new Error(
      `Refusing to run destructive seed/reset helpers against host "${host}". ` +
        `These helpers TRUNCATE every domain table — they must only run against a local test DB ` +
        `(${[...SAFE_TEST_HOSTS].join(' / ')}). ` +
        `Override DATABASE_URL for the test process, e.g.:\n` +
        `  DATABASE_URL=postgresql://postgres:postgres@localhost:5433/digital_menu_test pnpm test:e2e`,
    );
  }
}

// ---------------------------------------------------------------------------
// resetDb
// ---------------------------------------------------------------------------

/**
 * Wipes all domain tables via TRUNCATE CASCADE. Fast enough to call in
 * `beforeEach` for full test isolation. Runs in a single statement so it is
 * atomic across tables.
 *
 * Ordered explicitly to document intent — CASCADE handles FK dependencies,
 * but listing tables makes future schema additions easier to audit.
 */
export async function resetDb(): Promise<void> {
  assertSafeTestDatabase();

  await prismaTest.$executeRawUnsafe(
    `TRUNCATE TABLE ` +
      [
        '"table_selections"',
        '"table_guests"',
        '"table_sessions"',
        '"activity_logs"',
        '"menu_views"',
        '"promotions"',
        '"product_variations"',
        '"products"',
        '"categories"',
        '"menus"',
        '"notification_preferences"',
        '"verification_tokens"',
        '"sessions"',
        '"accounts"',
        '"users"',
      ].join(', ') +
      ` RESTART IDENTITY CASCADE`,
  );
}

// ---------------------------------------------------------------------------
// seedUser
// ---------------------------------------------------------------------------

export interface SeedUserOptions {
  plan?: Plan;
  name?: string;
  email?: string;
  /**
   * Plain-text password. Hashed with bcrypt before storage. If omitted, the
   * user is created without a password (OAuth-style) — loginAs() still works.
   */
  password?: string;
}

export async function seedUser(opts: SeedUserOptions = {}): Promise<User> {
  assertSafeTestDatabase();

  const email = (opts.email ?? `user-${randomId()}@test.local`).toLowerCase();
  const password = opts.password ? await bcrypt.hash(opts.password, 10) : null;

  return prismaTest.user.create({
    data: {
      email,
      name: opts.name ?? 'Nino Kapanadze',
      plan: opts.plan ?? 'FREE',
      password,
      emailVerified: new Date(),
    },
  });
}

// ---------------------------------------------------------------------------
// seedMenu
// ---------------------------------------------------------------------------

const GEORGIAN_CATEGORIES: Array<{
  nameKa: string;
  nameEn: string;
  nameRu: string;
  type: 'FOOD' | 'DRINK' | 'OTHER';
}> = [
  { nameKa: 'ცხელი კერძები', nameEn: 'Hot Dishes', nameRu: 'Горячие блюда', type: 'FOOD' },
  { nameKa: 'სალათები', nameEn: 'Salads', nameRu: 'Салаты', type: 'FOOD' },
  { nameKa: 'სასმელები', nameEn: 'Drinks', nameRu: 'Напитки', type: 'DRINK' },
  { nameKa: 'დესერტები', nameEn: 'Desserts', nameRu: 'Десерты', type: 'FOOD' },
];

const GEORGIAN_PRODUCTS: Array<{
  nameKa: string;
  nameEn: string;
  price: number;
}> = [
  { nameKa: 'ხაჭაპური აჭარული', nameEn: 'Adjarian Khachapuri', price: 18.0 },
  { nameKa: 'ბადრიჯანი ნიგვზით', nameEn: 'Eggplant with Walnuts', price: 14.5 },
  { nameKa: 'თარხუნის ლიმონათი', nameEn: 'Tarragon Lemonade', price: 6.0 },
  { nameKa: 'ჩაქაფული', nameEn: 'Chakapuli', price: 24.0 },
  { nameKa: 'ჩურჩხელა', nameEn: 'Churchkhela', price: 5.5 },
  { nameKa: 'ხინკალი', nameEn: 'Khinkali', price: 2.0 },
];

export interface SeedMenuOptions {
  userId: string;
  status?: MenuStatus;
  categoryCount?: number;
  /** Products per category. Total products = categoryCount × productCount. */
  productCount?: number;
  name?: string;
  slug?: string;
}

export async function seedMenu(opts: SeedMenuOptions): Promise<Menu> {
  assertSafeTestDatabase();

  const categoryCount = opts.categoryCount ?? 3;
  const productCount = opts.productCount ?? 5;
  const status = opts.status ?? 'DRAFT';

  const menu = await prismaTest.menu.create({
    data: {
      userId: opts.userId,
      name: opts.name ?? 'Café Linville',
      slug: opts.slug ?? `menu-${randomId()}`,
      description: null,
      status,
      publishedAt: status === 'PUBLISHED' ? new Date() : null,
      enabledLanguages: ['KA'],
    },
  });

  for (let ci = 0; ci < categoryCount; ci++) {
    const cat = GEORGIAN_CATEGORIES[ci % GEORGIAN_CATEGORIES.length];
    const category = await prismaTest.category.create({
      data: {
        menuId: menu.id,
        nameKa: cat.nameKa,
        nameEn: cat.nameEn,
        nameRu: cat.nameRu,
        type: cat.type,
        sortOrder: ci,
      },
    });

    const productsData = Array.from({ length: productCount }, (_, pi) => {
      const p = GEORGIAN_PRODUCTS[pi % GEORGIAN_PRODUCTS.length];
      return {
        categoryId: category.id,
        nameKa: p.nameKa,
        nameEn: p.nameEn,
        price: p.price,
        sortOrder: pi,
      };
    });
    await prismaTest.product.createMany({ data: productsData });
  }

  return menu;
}

// ---------------------------------------------------------------------------
// seedPromotion
// ---------------------------------------------------------------------------

export interface SeedPromotionOptions {
  menuId: string;
  titleKa?: string;
  titleEn?: string;
  isActive?: boolean;
  startDate?: Date;
  endDate?: Date;
  sortOrder?: number;
  discountType?: string;
  discountValue?: number;
  applyTo?: string;
  categoryId?: string;
  timeRestrictions?: object;
}

export async function seedPromotion(opts: SeedPromotionOptions): Promise<Promotion> {
  assertSafeTestDatabase();

  const now = new Date();
  return prismaTest.promotion.create({
    data: {
      menuId: opts.menuId,
      titleKa: opts.titleKa ?? 'ფასდაკლება -20%',
      titleEn: opts.titleEn ?? null,
      isActive: opts.isActive ?? true,
      startDate: opts.startDate ?? now,
      endDate: opts.endDate ?? new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
      sortOrder: opts.sortOrder ?? 0,
      discountType: opts.discountType ?? null,
      discountValue: opts.discountValue ?? null,
      applyTo: opts.applyTo ?? null,
      categoryId: opts.categoryId ?? null,
      timeRestrictions: opts.timeRestrictions ?? null,
    },
  });
}

// ---------------------------------------------------------------------------
// seedMenuViews
// ---------------------------------------------------------------------------

export interface SeedMenuViewsOptions {
  menuId: string;
  /** How many days back to spread views across. Default 30. */
  days?: number;
  /** Views per day (approximate — +/- noise). Default 20. */
  viewsPerDay?: number;
  /** Device labels to round-robin across. Default mobile/desktop/tablet. */
  devices?: string[];
  /**
   * Relative device weights. When omitted, devices are round-robined
   * (equal share). When provided, must align with `devices` length; the
   * seeder distributes each day's `viewsPerDay` views proportionally.
   */
  deviceWeights?: number[];
  /** Optional browser labels to round-robin across. */
  browsers?: string[];
  /**
   * Attribute each view to a specific category. When provided, at least one
   * entry's weight must be > 0. Entries with `categoryId: null` produce
   * menu-level views (no category attribution), matching the production
   * tracker's default behavior.
   */
  categoryDistribution?: Array<{ categoryId: string | null; weight: number }>;
}

export async function seedMenuViews(opts: SeedMenuViewsOptions): Promise<number> {
  assertSafeTestDatabase();

  const days = opts.days ?? 30;
  const viewsPerDay = opts.viewsPerDay ?? 20;
  const devices = opts.devices ?? ['mobile', 'desktop', 'tablet'];
  const browsers = opts.browsers;
  const deviceWeights = opts.deviceWeights;

  if (deviceWeights && deviceWeights.length !== devices.length) {
    throw new Error(
      `seedMenuViews: deviceWeights length (${deviceWeights.length}) must match devices length (${devices.length})`,
    );
  }

  const categoryDistribution = opts.categoryDistribution;
  const categoryWeightSum = categoryDistribution?.reduce(
    (s, c) => s + Math.max(0, c.weight),
    0,
  );
  if (categoryDistribution && (!categoryWeightSum || categoryWeightSum <= 0)) {
    throw new Error(
      'seedMenuViews: categoryDistribution must have at least one entry with weight > 0',
    );
  }

  function pickCategoryId(index: number): string | null {
    if (!categoryDistribution || !categoryWeightSum) return null;
    // Deterministic round-robin weighted by the cumulative weight function.
    const pos = (index % categoryWeightSum) + 1;
    let acc = 0;
    for (const entry of categoryDistribution) {
      acc += Math.max(0, entry.weight);
      if (pos <= acc) return entry.categoryId;
    }
    return categoryDistribution[categoryDistribution.length - 1].categoryId;
  }

  function pickDeviceIndex(v: number, d: number): number {
    if (!deviceWeights) return (d + v) % devices.length;
    const total = deviceWeights.reduce((s, w) => s + Math.max(0, w), 0);
    if (total === 0) return 0;
    const pos = ((d + v) % total) + 1;
    let acc = 0;
    for (let i = 0; i < deviceWeights.length; i++) {
      acc += Math.max(0, deviceWeights[i]);
      if (pos <= acc) return i;
    }
    return deviceWeights.length - 1;
  }

  const rows: Array<{
    menuId: string;
    categoryId: string | null;
    device: string;
    browser?: string | null;
    viewedAt: Date;
  }> = [];
  const now = Date.now();

  let seq = 0;
  for (let d = 0; d < days; d++) {
    for (let v = 0; v < viewsPerDay; v++) {
      const offsetMs = d * 86_400_000 + Math.floor(Math.random() * 86_400_000);
      rows.push({
        menuId: opts.menuId,
        categoryId: pickCategoryId(seq),
        device: devices[pickDeviceIndex(v, d)],
        browser: browsers ? browsers[seq % browsers.length] : null,
        viewedAt: new Date(now - offsetMs),
      });
      seq += 1;
    }
  }

  const result = await prismaTest.menuView.createMany({ data: rows });
  return result.count;
}

// ---------------------------------------------------------------------------
// seedCompleteScenario
// ---------------------------------------------------------------------------

export interface SeedCompleteScenarioResult {
  user: User;
  menu: Menu;
}

/**
 * One-shot seed for the common "I need a realistic admin logged in" case.
 * Creates: 1 user, 1 PUBLISHED menu, 3 categories × 5 products = 15 products,
 * 2 active promotions, 600 menu views spread over 30 days.
 */
export async function seedCompleteScenario(
  plan: Plan = 'PRO',
): Promise<SeedCompleteScenarioResult> {
  assertSafeTestDatabase();

  const user = await seedUser({
    plan,
    email: `scenario-${plan.toLowerCase()}-${randomId()}@test.local`,
    name: 'Nino Kapanadze',
  });

  const menu = await seedMenu({
    userId: user.id,
    status: 'PUBLISHED',
    categoryCount: 3,
    productCount: 5,
    name: 'Café Linville',
  });

  await seedPromotion({ menuId: menu.id, titleKa: 'შემოდგომა -15%', titleEn: 'Autumn -15%' });
  await seedPromotion({ menuId: menu.id, titleKa: 'კომბო -10%', titleEn: 'Combo -10%', sortOrder: 1 });

  await seedMenuViews({ menuId: menu.id, days: 30, viewsPerDay: 20 });

  return { user, menu };
}

// ---------------------------------------------------------------------------
// seedActivityLog
// ---------------------------------------------------------------------------

export interface SeedActivityLogOptions {
  userId: string;
  menuId?: string | null;
  type: ActivityType;
  payload?: Record<string, unknown>;
  /** Explicit timestamp for deterministic ordering. */
  createdAt?: Date;
}

export async function seedActivityLog(
  opts: SeedActivityLogOptions,
): Promise<ActivityLog> {
  assertSafeTestDatabase();

  return prismaTest.activityLog.create({
    data: {
      userId: opts.userId,
      menuId: opts.menuId ?? null,
      type: opts.type,
      payload: (opts.payload ?? {}) as Prisma.InputJsonValue,
      ...(opts.createdAt ? { createdAt: opts.createdAt } : {}),
    },
  });
}

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------

function randomId(): string {
  return Math.random().toString(36).slice(2, 10);
}
