import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth/auth';
import { cacheGetOrSet, CACHE_KEYS, CACHE_TTL } from '@/lib/cache/redis';
import { getLocaleFromCookie, isValidLocale, LOCALE_COOKIE_NAME, type Locale } from '@/i18n/config';
import { MenuHeader } from '@/components/public/menu-header';
import { MenuInfoWidget } from '@/components/public/menu-info-widget';
import { MenuBody } from '@/components/public/menu-body';
import { PromotionCarousel } from '@/components/public/promotion-carousel';
import { FeaturedCarousel } from '@/components/public/featured-carousel';
import { MenuFooter } from '@/components/public/menu-footer';
import { ViewTracker } from '@/components/public/view-tracker';
import { MenuPasswordGate } from '@/components/public/menu-password-gate';
import {
  menuPassCookieName,
  verifyMenuPassToken,
} from '@/lib/menu-visibility';

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ preview?: string; draft?: string; locale?: string }>;
}

// Shared select shape for menu fetch queries — kept identical between public and preview
const menuSelect = {
  id: true,
  name: true,
  slug: true,
  description: true,
  logoUrl: true,
  primaryColor: true,
  accentColor: true,
  currencySymbol: true,
  headingFont: true,
  bodyFont: true,
  enabledLanguages: true,
  allergenDisplay: true,
  caloriesDisplay: true,
  showNutrition: true,
  showDiscount: true,
  splitByType: true,
  menuLayout: true,
  menuTemplate: true,
  productCardStyle: true,
  productTouchEffect: true,
  address: true,
  phone: true,
  wifiSsid: true,
  wifiPassword: true,
  wcDirection: true,
  wcImageUrl: true,
  locationLat: true,
  locationLng: true,
  status: true,
  publishedAt: true,
  passwordHash: true,
  categories: {
    orderBy: { sortOrder: 'asc' as const },
    select: {
      id: true,
      nameKa: true,
      nameEn: true,
      nameRu: true,
      descriptionKa: true,
      descriptionEn: true,
      descriptionRu: true,
      iconUrl: true,
      brandLabel: true,
      type: true,
      sortOrder: true,
      products: {
        where: { isAvailable: true },
        orderBy: { sortOrder: 'asc' as const },
        select: {
          id: true,
          nameKa: true,
          nameEn: true,
          nameRu: true,
          descriptionKa: true,
          descriptionEn: true,
          descriptionRu: true,
          price: true,
          oldPrice: true,
          currency: true,
          imageUrl: true,
          imageFocalX: true,
          imageFocalY: true,
          imageZoom: true,
          allergens: true,
          ribbons: true,
          isVegan: true,
          isVegetarian: true,
          calories: true,
          protein: true,
          fats: true,
          carbs: true,
          fiber: true,
          arEnabled: true,
          arModelUrl: true,
          arModelUrlIos: true,
          arPosterUrl: true,
          sortOrder: true,
          variations: {
            orderBy: { sortOrder: 'asc' as const },
            select: {
              id: true,
              nameKa: true,
              nameEn: true,
              nameRu: true,
              price: true,
              sortOrder: true,
            },
          },
        },
      },
    },
  },
  promotions: {
    where: {
      isActive: true,
      startDate: { lte: new Date() },
      endDate: { gte: new Date() },
    },
    orderBy: [{ sortOrder: 'asc' as const }, { startDate: 'asc' as const }],
    select: {
      id: true,
      titleKa: true,
      titleEn: true,
      titleRu: true,
      descriptionKa: true,
      descriptionEn: true,
      descriptionRu: true,
      imageUrl: true,
      startDate: true,
      endDate: true,
      sortOrder: true,
    },
  },
};

async function getPublicMenu(slug: string) {
  return cacheGetOrSet(
    CACHE_KEYS.publicMenu(slug),
    async () => {
      return prisma.menu.findUnique({
        where: { slug, status: 'PUBLISHED' },
        select: menuSelect,
      });
    },
    CACHE_TTL.PUBLIC_MENU
  );
}

async function getPreviewMenu(slug: string, userId: string) {
  return prisma.menu.findUnique({
    where: { slug, userId },
    select: menuSelect,
  });
}

// Serialize Prisma data (Decimals/Dates → primitives) for client components
type RawMenu = NonNullable<Awaited<ReturnType<typeof getPublicMenu>>>;

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const menu = await getPublicMenu(slug);

  if (!menu) {
    return { title: 'Menu Not Found' };
  }

  return {
    title: menu.name,
    description: menu.description || `View the menu for ${menu.name}`,
    openGraph: {
      title: menu.name,
      description: menu.description || `View the menu for ${menu.name}`,
      type: 'website',
      ...(menu.logoUrl && { images: [{ url: menu.logoUrl }] }),
    },
  };
}

export default async function PublicMenuPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const { preview, draft, locale: localeParam } = await searchParams;
  // Preview mode (owner viewing DRAFT) — triggered by either `preview=true` or
  // `draft=true` so the admin iframe can signal intent with either param.
  const isPreview = preview === 'true' || draft === 'true';

  let rawMenu: RawMenu | null = null;

  if (isPreview) {
    const session = await auth();
    if (session?.user?.id) {
      rawMenu = await getPreviewMenu(slug, session.user.id);
    }
  }

  if (!rawMenu) {
    rawMenu = await getPublicMenu(slug);
  }

  if (!rawMenu) {
    notFound();
  }

  const cookieStore = await cookies();

  // T15.13 — password gate. Owner preview bypasses.
  if (!isPreview && rawMenu.passwordHash) {
    const token = cookieStore.get(menuPassCookieName(rawMenu.id))?.value;
    if (!verifyMenuPassToken(rawMenu.id, token)) {
      return (
        <MenuPasswordGate
          slug={rawMenu.slug}
          menuName={rawMenu.name}
        />
      );
    }
  }

  // Strip server-only fields before serialising for the client tree.
  const { passwordHash: _omitPasswordHash, ...rawMenuPublic } = rawMenu;
  void _omitPasswordHash;
  const menu = JSON.parse(JSON.stringify(rawMenuPublic)) as RawMenuSerialized;
  // `?locale=` query param takes precedence over the cookie so the admin preview
  // iframe can force a specific language without touching the visitor's cookie.
  const locale: Locale =
    localeParam && isValidLocale(localeParam)
      ? localeParam
      : (getLocaleFromCookie(cookieStore.get(LOCALE_COOKIE_NAME)?.value) as Locale);

  const categoriesWithProducts = menu.categories.filter((c) => c.products.length > 0);
  const hasPromotions = menu.promotions.length > 0;
  const hasCategories = categoriesWithProducts.length > 0;
  const hasInfo = Boolean(menu.address || menu.phone || menu.wifiSsid || menu.wcDirection);

  // Collect "featured" products — those with POPULAR, CHEF_CHOICE, or DAILY_DISH ribbons
  const featuredProducts = categoriesWithProducts
    .flatMap((c) => c.products)
    .filter((p) =>
      p.ribbons?.some((r) => r === 'POPULAR' || r === 'CHEF_CHOICE' || r === 'DAILY_DISH')
    )
    .slice(0, 8);

  const currencySymbol = menu.currencySymbol || '₾';

  const displaySettings = {
    currencySymbol,
    allergenDisplay: menu.allergenDisplay || 'TEXT',
    caloriesDisplay: menu.caloriesDisplay || 'DIRECT',
    showNutrition: menu.showNutrition ?? false,
    showDiscount: menu.showDiscount ?? true,
    productCardStyle: menu.productCardStyle || 'BORDERED',
    productTouchEffect: menu.productTouchEffect || 'SCALE',
  };

  const splitByType = menu.splitByType ?? false;
  const menuLayout = menu.menuLayout || 'LINEAR';
  const menuTemplate = menu.menuTemplate || 'CLASSIC';

  return (
    <div
      className="min-h-screen bg-background"
      style={{
        '--primary-color': menu.primaryColor || '#000000',
        '--accent-color': menu.accentColor || '#666666',
        ...(menu.headingFont ? { '--heading-font': `"${menu.headingFont}"` } : {}),
        ...(menu.bodyFont ? { '--body-font': `"${menu.bodyFont}"` } : {}),
      } as React.CSSProperties}
    >
      {!isPreview && <ViewTracker menuId={menu.id} />}

      <MenuHeader
        name={menu.name}
        description={menu.description}
        logoUrl={menu.logoUrl}
        locale={locale}
        enabledLocales={
          menu.enabledLanguages
            ?.map((l) => l.toLowerCase())
            .filter((l): l is Locale => l === 'ka' || l === 'en' || l === 'ru')
        }
      />

      {hasInfo && (
        <MenuInfoWidget
          address={menu.address}
          phone={menu.phone}
          wifiSsid={menu.wifiSsid}
          wifiPassword={menu.wifiPassword}
          wcDirection={menu.wcDirection}
          wcImageUrl={menu.wcImageUrl}
          locationLat={menu.locationLat}
          locationLng={menu.locationLng}
          locale={locale}
        />
      )}

      {hasPromotions && (
        <PromotionCarousel promotions={menu.promotions} locale={locale} />
      )}

      {featuredProducts.length > 0 && (
        <FeaturedCarousel
          products={featuredProducts}
          locale={locale}
          settings={displaySettings}
        />
      )}

      {hasCategories ? (
        <MenuBody
          categories={categoriesWithProducts}
          locale={locale}
          settings={displaySettings}
          layout={menuLayout}
          splitByType={splitByType}
          template={menuTemplate}
        />
      ) : (
        <main id="main-content" className="px-4 pb-8" tabIndex={-1}>
          <div className="max-w-2xl mx-auto">
            <div className="text-center py-12" role="status">
              <p className="text-muted-foreground">
                {locale === 'ka'
                  ? 'მენიუ ცარიელია'
                  : locale === 'ru'
                  ? 'Меню пусто'
                  : 'Menu is empty'}
              </p>
            </div>
          </div>
        </main>
      )}

      <MenuFooter
        locale={locale}
        currencySymbol={currencySymbol}
        allergenMode={displaySettings.allergenDisplay}
        hasAllergens={categoriesWithProducts.some((c) =>
          c.products.some((p) => p.allergens.length > 0)
        )}
      />
    </div>
  );
}

// ── Serialized types (decimals/dates become strings after JSON) ─────
interface RawMenuSerialized {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logoUrl: string | null;
  primaryColor: string | null;
  accentColor: string | null;
  currencySymbol: string | null;
  headingFont: string | null;
  bodyFont: string | null;
  enabledLanguages: string[];
  allergenDisplay: 'TEXT' | 'ICON' | 'WARNING';
  caloriesDisplay: 'DIRECT' | 'FLIP_REVEAL' | 'HIDDEN';
  showNutrition: boolean;
  showDiscount: boolean;
  splitByType: boolean;
  menuLayout: 'LINEAR' | 'CATEGORIES_FIRST';
  menuTemplate: 'CLASSIC' | 'MAGAZINE' | 'COMPACT';
  productCardStyle: 'FLAT' | 'BORDERED' | 'ELEVATED' | 'MINIMAL';
  productTouchEffect: 'NONE' | 'SCALE' | 'GLOW' | 'GRADIENT';
  address: string | null;
  phone: string | null;
  wifiSsid: string | null;
  wifiPassword: string | null;
  wcDirection: string | null;
  wcImageUrl: string | null;
  locationLat: number | string | null;
  locationLng: number | string | null;
  status: string;
  publishedAt: string | null;
  categories: SerializedCategory[];
  promotions: SerializedPromotion[];
}

interface SerializedCategory {
  id: string;
  nameKa: string;
  nameEn: string | null;
  nameRu: string | null;
  descriptionKa: string | null;
  descriptionEn: string | null;
  descriptionRu: string | null;
  iconUrl: string | null;
  brandLabel: string | null;
  type: 'FOOD' | 'DRINK' | 'OTHER';
  sortOrder: number;
  products: SerializedProduct[];
}

interface SerializedProduct {
  id: string;
  nameKa: string;
  nameEn: string | null;
  nameRu: string | null;
  descriptionKa: string | null;
  descriptionEn: string | null;
  descriptionRu: string | null;
  price: number | string;
  oldPrice: number | string | null;
  currency: string;
  imageUrl: string | null;
  imageFocalX: number | null;
  imageFocalY: number | null;
  imageZoom: number | null;
  allergens: string[];
  ribbons: string[];
  isVegan: boolean;
  isVegetarian: boolean;
  calories: number | null;
  protein: number | string | null;
  fats: number | string | null;
  carbs: number | string | null;
  fiber: number | string | null;
  arEnabled: boolean;
  arModelUrl: string | null;
  arModelUrlIos: string | null;
  arPosterUrl: string | null;
  sortOrder: number;
  variations: SerializedVariation[];
}

interface SerializedVariation {
  id: string;
  nameKa: string;
  nameEn: string | null;
  nameRu: string | null;
  price: number | string;
  sortOrder: number;
}

interface SerializedPromotion {
  id: string;
  titleKa: string;
  titleEn: string | null;
  titleRu: string | null;
  descriptionKa: string | null;
  descriptionEn: string | null;
  descriptionRu: string | null;
  imageUrl: string | null;
  startDate: string;
  endDate: string;
  sortOrder: number;
}
