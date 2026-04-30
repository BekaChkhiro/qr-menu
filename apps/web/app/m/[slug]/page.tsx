import { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { auth } from '@/lib/auth/auth';
import { prisma } from '@/lib/db';
import { getPublicMenu, getPreviewMenu, type SerializedPublicMenu } from '@/lib/public-menu';
import { getLocaleFromCookie, isValidLocale, LOCALE_COOKIE_NAME, type Locale } from '@/i18n/config';
import { MenuHeader } from '@/components/public/menu-header';
import { MenuInfoWidget } from '@/components/public/menu-info-widget';
import { MenuBody } from '@/components/public/menu-body';
import { PromotionCarousel } from '@/components/public/promotion-carousel';
import { FeaturedCarousel } from '@/components/public/featured-carousel';
import { MenuFooter } from '@/components/public/menu-footer';
import { ViewTracker } from '@/components/public/view-tracker';
import { MenuPasswordGate } from '@/components/public/menu-password-gate';
import { CreateTableLauncher } from '@/components/public/create-table-launcher';
import {
  menuPassCookieName,
  verifyMenuPassToken,
} from '@/lib/menu-visibility';
import { TABLE_COOKIE_NAME, verifyTableToken } from '@/lib/auth/table-token';

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ preview?: string; draft?: string; locale?: string }>;
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

  // If the visitor already has an active table cookie for THIS menu, send them
  // to the table view instead of re-prompting them to create a new one.
  // Only applies when the table is OPEN; CLOSED/EXPIRED falls through to the
  // regular menu (and the stale cookie will be cleared the next time they
  // interact with a table API).
  if (!isPreview && rawMenu.sharedTableEnabled) {
    const tableTokenRaw = cookieStore.get(TABLE_COOKIE_NAME)?.value;
    const tableToken = verifyTableToken(tableTokenRaw);
    if (tableToken) {
      const boundTable = await prisma.tableSession.findUnique({
        where: { id: tableToken.tableId },
        select: { code: true, status: true, menuId: true },
      });
      if (
        boundTable &&
        boundTable.menuId === rawMenu.id &&
        boundTable.status === 'OPEN'
      ) {
        const target = tableToken.isHost
          ? `/m/${slug}/t/${boundTable.code}/host`
          : `/m/${slug}/t/${boundTable.code}`;
        redirect(target);
      }
    }
  }

  // Strip server-only fields before serialising for the client tree.
  const { passwordHash: _omitPasswordHash, ...rawMenuPublic } = rawMenu;
  void _omitPasswordHash;
  const menu = JSON.parse(JSON.stringify(rawMenuPublic)) as SerializedPublicMenu;
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

      {!isPreview && menu.sharedTableEnabled && (
        <CreateTableLauncher slug={menu.slug} locale={locale} />
      )}
    </div>
  );
}

