import { notFound } from 'next/navigation';
import { cookies } from 'next/headers';
import { Metadata } from 'next';
import { prisma } from '@/lib/db';
import {
  getPublicMenu,
  type SerializedPublicMenu,
} from '@/lib/public-menu';
import {
  TABLE_COOKIE_NAME,
  verifyTableToken,
} from '@/lib/auth/table-token';
import {
  getLocaleFromCookie,
  LOCALE_COOKIE_NAME,
  type Locale,
} from '@/i18n/config';
import { MenuHeader } from '@/components/public/menu-header';
import { MenuInfoWidget } from '@/components/public/menu-info-widget';
import { MenuBody } from '@/components/public/menu-body';
import { PromotionCarousel } from '@/components/public/promotion-carousel';
import { FeaturedCarousel } from '@/components/public/featured-carousel';
import { MenuFooter } from '@/components/public/menu-footer';
import { JoinTableForm } from '@/components/public/join-table-form';
import {
  TableModeProvider,
  type TableSelection,
} from '@/components/public/table-mode-provider';
import {
  TableGuestTray,
  type TrayProductInfo,
} from '@/components/public/table-guest-tray';

interface PageProps {
  params: Promise<{ slug: string; code: string }>;
}

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Shared Table',
  robots: { index: false, follow: false },
};

const PROVIDER_COPY: Record<
  Locale,
  {
    addedToast: string;
    addFailed: string;
    addClosed: string;
    removeFailed: string;
    leaveFailed: string;
  }
> = {
  ka: {
    addedToast: 'დაემატა შენს არჩევანში',
    addFailed: 'დამატება ვერ მოხერხდა',
    addClosed: 'მაგიდა დახურულია',
    removeFailed: 'წაშლა ვერ მოხერხდა',
    leaveFailed: 'გასვლა ვერ მოხერხდა',
  },
  en: {
    addedToast: 'Added to your picks',
    addFailed: "Couldn't add that item",
    addClosed: 'Table is no longer accepting picks',
    removeFailed: "Couldn't remove that pick",
    leaveFailed: "Couldn't leave the table",
  },
  ru: {
    addedToast: 'Добавлено в ваш выбор',
    addFailed: 'Не удалось добавить',
    addClosed: 'Стол больше не принимает выборы',
    removeFailed: 'Не удалось удалить',
    leaveFailed: 'Не удалось выйти',
  },
};

export default async function TableEntryPage({ params }: PageProps) {
  const { slug, code } = await params;

  // Look up the table session first — without it, the join form can't even
  // identify which menu we're talking about.
  const table = await prisma.tableSession.findUnique({
    where: { code },
    select: {
      id: true,
      code: true,
      status: true,
      expiresAt: true,
      menu: { select: { slug: true, name: true } },
    },
  });

  if (!table || table.menu.slug !== slug) {
    notFound();
  }

  const cookieStore = await cookies();
  const tokenRaw = cookieStore.get(TABLE_COOKIE_NAME)?.value;
  const token = verifyTableToken(tokenRaw);
  const locale: Locale = getLocaleFromCookie(
    cookieStore.get(LOCALE_COOKIE_NAME)?.value,
  );

  // Auto-close-on-read parity with GET /api/public/tables/[code] — keeps the UI
  // coherent if the visitor lands after the window passed.
  let effectiveStatus: 'OPEN' | 'CLOSED' | 'EXPIRED' = table.status;
  if (table.status === 'OPEN' && table.expiresAt.getTime() <= Date.now()) {
    await prisma.tableSession
      .update({ where: { id: table.id }, data: { status: 'EXPIRED' } })
      .catch(() => undefined);
    effectiveStatus = 'EXPIRED';
  }

  // Cookie binds *some* table — figure out whether it binds *this* one.
  if (token && token.tableId === table.id) {
    // Hosts and guests both render the table-mode menu here so the host can
    // also pick items. Hosts can switch to /host via the tray's
    // "Host dashboard" button.
    const guest = await prisma.tableGuest.findUnique({
      where: { id: token.guestId },
      select: { id: true, name: true, isHost: true },
    });

    if (guest) {
      // Touch lastSeenAt — best-effort, mirrors the API GET behavior.
      await prisma.tableGuest
        .update({
          where: { id: guest.id },
          data: { lastSeenAt: new Date() },
        })
        .catch(() => undefined);

      // If the table is no longer OPEN, fall through and show the join form so
      // the visitor sees a coherent reason instead of a "ghost" guest menu.
      if (effectiveStatus !== 'OPEN') {
        return (
          <JoinTableForm
            slug={slug}
            code={code}
            menuName={table.menu.name}
            locale={locale}
          />
        );
      }

      return await renderGuestMenu({
        slug,
        code,
        guestId: guest.id,
        guestName: guest.name,
        isHost: guest.isHost,
        tableId: table.id,
        status: effectiveStatus,
        locale,
      });
    }
    // Cookie binds this table but the guest row is gone (e.g. host removed).
    // Fall through to the join form.
  }

  // No matching cookie → render the join form.
  return (
    <JoinTableForm
      slug={slug}
      code={code}
      menuName={table.menu.name}
      locale={locale}
    />
  );
}

interface RenderArgs {
  slug: string;
  code: string;
  guestId: string;
  guestName: string;
  isHost: boolean;
  tableId: string;
  status: 'OPEN' | 'CLOSED' | 'EXPIRED';
  locale: Locale;
}

async function renderGuestMenu(args: RenderArgs) {
  const rawMenu = await getPublicMenu(args.slug);
  if (!rawMenu) {
    notFound();
  }

  // Strip server-only fields.
  const { passwordHash: _omitPasswordHash, ...rawMenuPublic } = rawMenu;
  void _omitPasswordHash;
  const menu = JSON.parse(
    JSON.stringify(rawMenuPublic),
  ) as SerializedPublicMenu;

  // This guest's selections — needed to seed the tray + tray totals on first
  // paint (no client fetch round-trip).
  const initialSelectionsRaw = await prisma.tableSelection.findMany({
    where: { tableId: args.tableId, guestId: args.guestId },
    orderBy: { createdAt: 'asc' },
    select: {
      id: true,
      productId: true,
      variationId: true,
      quantity: true,
      note: true,
      createdAt: true,
    },
  });

  const initialSelections: TableSelection[] = initialSelectionsRaw.map((s) => ({
    id: s.id,
    productId: s.productId,
    variationId: s.variationId,
    quantity: s.quantity,
    note: s.note,
    createdAt: s.createdAt.toISOString(),
  }));

  const categoriesWithProducts = menu.categories.filter(
    (c) => c.products.length > 0,
  );

  const trayProducts: TrayProductInfo[] = categoriesWithProducts.flatMap((c) =>
    c.products.map((p) => ({
      id: p.id,
      nameKa: p.nameKa,
      nameEn: p.nameEn,
      nameRu: p.nameRu,
      price: p.price,
      imageUrl: p.imageUrl,
      variations: p.variations.map((v) => ({
        id: v.id,
        nameKa: v.nameKa,
        nameEn: v.nameEn,
        nameRu: v.nameRu,
        price: v.price,
      })),
    })),
  );

  const hasPromotions = menu.promotions.length > 0;
  const hasCategories = categoriesWithProducts.length > 0;
  const hasInfo = Boolean(
    menu.address || menu.phone || menu.wifiSsid || menu.wcDirection,
  );

  const featuredProducts = categoriesWithProducts
    .flatMap((c) => c.products)
    .filter((p) =>
      p.ribbons?.some(
        (r) => r === 'POPULAR' || r === 'CHEF_CHOICE' || r === 'DAILY_DISH',
      ),
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
    <TableModeProvider
      code={args.code}
      slug={args.slug}
      guestId={args.guestId}
      guestName={args.guestName}
      isHost={args.isHost}
      status={args.status}
      initialSelections={initialSelections}
      locale={args.locale}
      copy={PROVIDER_COPY[args.locale]}
    >
      <div
        className="min-h-screen bg-background pb-24"
        style={
          {
            '--primary-color': menu.primaryColor || '#000000',
            '--accent-color': menu.accentColor || '#666666',
            ...(menu.headingFont
              ? { '--heading-font': `"${menu.headingFont}"` }
              : {}),
            ...(menu.bodyFont
              ? { '--body-font': `"${menu.bodyFont}"` }
              : {}),
          } as React.CSSProperties
        }
        data-testid="public-table-guest-menu"
      >
        <MenuHeader
          name={menu.name}
          description={menu.description}
          logoUrl={menu.logoUrl}
          locale={args.locale}
          enabledLocales={
            menu.enabledLanguages
              ?.map((l) => l.toLowerCase())
              .filter(
                (l): l is Locale => l === 'ka' || l === 'en' || l === 'ru',
              )
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
            locale={args.locale}
          />
        )}

        {hasPromotions && (
          <PromotionCarousel promotions={menu.promotions} locale={args.locale} />
        )}

        {featuredProducts.length > 0 && (
          <FeaturedCarousel
            products={featuredProducts}
            locale={args.locale}
            settings={displaySettings}
          />
        )}

        {hasCategories ? (
          <MenuBody
            categories={categoriesWithProducts}
            locale={args.locale}
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
                  {args.locale === 'ka'
                    ? 'მენიუ ცარიელია'
                    : args.locale === 'ru'
                      ? 'Меню пусто'
                      : 'Menu is empty'}
                </p>
              </div>
            </div>
          </main>
        )}

        <MenuFooter
          locale={args.locale}
          currencySymbol={currencySymbol}
          allergenMode={displaySettings.allergenDisplay}
          hasAllergens={categoriesWithProducts.some((c) =>
            c.products.some((p) => p.allergens.length > 0),
          )}
        />
      </div>

      <TableGuestTray
        products={trayProducts}
        currencySymbol={currencySymbol}
        locale={args.locale}
      />
    </TableModeProvider>
  );
}
