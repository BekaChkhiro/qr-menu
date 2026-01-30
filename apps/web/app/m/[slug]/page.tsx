import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/db';
import { cacheGetOrSet, CACHE_KEYS, CACHE_TTL } from '@/lib/cache/redis';
import { getLocaleFromCookie, LOCALE_COOKIE_NAME, type Locale } from '@/i18n/config';
import { MenuHeader } from '@/components/public/menu-header';
import { CategoryNav } from '@/components/public/category-nav';
import { CategorySection } from '@/components/public/category-section';
import { PromotionBanner } from '@/components/public/promotion-banner';
import { MenuFooter } from '@/components/public/menu-footer';
import { ViewTracker } from '@/components/public/view-tracker';

interface PageProps {
  params: Promise<{ slug: string }>;
}

// Serialized types for client components (Decimal serializes to string via JSON)
interface SerializedVariation {
  id: string;
  nameKa: string;
  nameEn: string | null;
  nameRu: string | null;
  price: number | string; // Prisma Decimal serializes to string
  sortOrder: number;
}

interface SerializedProduct {
  id: string;
  nameKa: string;
  nameEn: string | null;
  nameRu: string | null;
  descriptionKa: string | null;
  descriptionEn: string | null;
  descriptionRu: string | null;
  price: number | string; // Prisma Decimal serializes to string
  currency: string;
  imageUrl: string | null;
  allergens: string[];
  sortOrder: number;
  variations: SerializedVariation[];
}

interface SerializedCategory {
  id: string;
  nameKa: string;
  nameEn: string | null;
  nameRu: string | null;
  descriptionKa: string | null;
  descriptionEn: string | null;
  descriptionRu: string | null;
  sortOrder: number;
  products: SerializedProduct[];
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
}

interface SerializedMenu {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logoUrl: string | null;
  primaryColor: string | null;
  accentColor: string | null;
  status: string;
  publishedAt: string | null;
  categories: SerializedCategory[];
  promotions: SerializedPromotion[];
}

/**
 * Serialize menu data for client components (convert Decimals to numbers, dates to strings)
 */
function serializeMenuData(data: NonNullable<Awaited<ReturnType<typeof getPublicMenu>>>): SerializedMenu {
  return JSON.parse(JSON.stringify(data));
}

async function getPublicMenu(slug: string) {
  return cacheGetOrSet(
    CACHE_KEYS.publicMenu(slug),
    async () => {
      return prisma.menu.findUnique({
        where: {
          slug,
          status: 'PUBLISHED',
        },
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
          logoUrl: true,
          primaryColor: true,
          accentColor: true,
          status: true,
          publishedAt: true,
          categories: {
            orderBy: { sortOrder: 'asc' },
            select: {
              id: true,
              nameKa: true,
              nameEn: true,
              nameRu: true,
              descriptionKa: true,
              descriptionEn: true,
              descriptionRu: true,
              sortOrder: true,
              products: {
                where: { isAvailable: true },
                orderBy: { sortOrder: 'asc' },
                select: {
                  id: true,
                  nameKa: true,
                  nameEn: true,
                  nameRu: true,
                  descriptionKa: true,
                  descriptionEn: true,
                  descriptionRu: true,
                  price: true,
                  currency: true,
                  imageUrl: true,
                  allergens: true,
                  sortOrder: true,
                  variations: {
                    orderBy: { sortOrder: 'asc' },
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
            orderBy: { startDate: 'asc' },
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
            },
          },
        },
      });
    },
    CACHE_TTL.PUBLIC_MENU
  );
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const menu = await getPublicMenu(slug);

  if (!menu) {
    return {
      title: 'Menu Not Found',
    };
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

export default async function PublicMenuPage({ params }: PageProps) {
  const { slug } = await params;
  const rawMenu = await getPublicMenu(slug);

  if (!rawMenu) {
    notFound();
  }

  // Serialize menu data to convert Prisma Decimals to plain numbers
  const menu = serializeMenuData(rawMenu);

  const cookieStore = await cookies();
  const locale = getLocaleFromCookie(cookieStore.get(LOCALE_COOKIE_NAME)?.value) as Locale;

  // Filter out empty categories (categories with no available products)
  const categoriesWithProducts = menu.categories.filter(
    (category) => category.products.length > 0
  );

  const hasPromotions = menu.promotions.length > 0;
  const hasCategories = categoriesWithProducts.length > 0;

  return (
    <div
      className="min-h-screen bg-background"
      style={{
        '--primary-color': menu.primaryColor || '#000000',
        '--accent-color': menu.accentColor || '#666666',
      } as React.CSSProperties}
    >
      {/* Track menu view */}
      <ViewTracker menuId={menu.id} />

      {/* Menu Header */}
      <MenuHeader
        name={menu.name}
        description={menu.description}
        logoUrl={menu.logoUrl}
        locale={locale}
      />

      {/* Promotions */}
      {hasPromotions && (
        <section className="px-4 py-4">
          <div className="max-w-2xl mx-auto space-y-3">
            {menu.promotions.map((promotion) => (
              <PromotionBanner
                key={promotion.id}
                promotion={promotion}
                locale={locale}
              />
            ))}
          </div>
        </section>
      )}

      {/* Category Navigation */}
      {hasCategories && (
        <CategoryNav categories={categoriesWithProducts} locale={locale} />
      )}

      {/* Menu Content */}
      <main className="px-4 pb-8">
        <div className="max-w-2xl mx-auto">
          {hasCategories ? (
            <div className="space-y-8">
              {categoriesWithProducts.map((category, index) => (
                <CategorySection
                  key={category.id}
                  category={category}
                  locale={locale}
                  index={index}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                {locale === 'ka'
                  ? 'მენიუ ცარიელია'
                  : locale === 'ru'
                  ? 'Меню пусто'
                  : 'Menu is empty'}
              </p>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <MenuFooter locale={locale} />
    </div>
  );
}
