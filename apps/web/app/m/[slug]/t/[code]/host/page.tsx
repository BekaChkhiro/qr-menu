import { notFound, redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { Metadata } from 'next';
import { prisma } from '@/lib/db';
import { TABLE_COOKIE_NAME, verifyTableToken } from '@/lib/auth/table-token';
import { getLocaleFromCookie, LOCALE_COOKIE_NAME, type Locale } from '@/i18n/config';
import { TableHostView } from '@/components/public/table-host-view';

interface PageProps {
  params: Promise<{ slug: string; code: string }>;
}

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Shared Table — Host',
  robots: { index: false, follow: false },
};

export default async function HostTablePage({ params }: PageProps) {
  const { slug, code } = await params;
  const cookieStore = await cookies();
  const tokenRaw = cookieStore.get(TABLE_COOKIE_NAME)?.value;
  const token = verifyTableToken(tokenRaw);

  if (!token) {
    // No (or expired) cookie — bounce to the join page so the visitor can
    // authenticate. The join page (T19.5) will be added later; until then it
    // resolves to the standard public menu and the join form lives at the
    // table-scoped path.
    redirect(`/m/${slug}/t/${code}`);
  }

  if (!token.isHost) {
    // Cookie says they are a guest at *some* table — send them to the guest
    // route, which will reconcile against this code via cookie check.
    redirect(`/m/${slug}/t/${code}`);
  }

  const table = await prisma.tableSession.findUnique({
    where: { code },
    select: {
      id: true,
      code: true,
      menuId: true,
      hostName: true,
      maxGuests: true,
      status: true,
      expiresAt: true,
      extendedAt: true,
      createdAt: true,
      menu: { select: { slug: true, name: true } },
      guests: {
        orderBy: { joinedAt: 'asc' },
        select: {
          id: true,
          name: true,
          isHost: true,
          joinedAt: true,
        },
      },
      selections: {
        orderBy: { createdAt: 'asc' },
        select: {
          id: true,
          guestId: true,
          productId: true,
          variationId: true,
          quantity: true,
          note: true,
          createdAt: true,
        },
      },
    },
  });

  if (!table || table.menu.slug !== slug || table.id !== token.tableId) {
    notFound();
  }

  // Auto-close-on-read parity with GET /api/public/tables/[code]: if the
  // window passed and the row is still OPEN, mark it EXPIRED so the host UI
  // shows a coherent state on first paint.
  let effectiveStatus = table.status;
  if (table.status === 'OPEN' && table.expiresAt.getTime() <= Date.now()) {
    await prisma.tableSession
      .update({ where: { id: table.id }, data: { status: 'EXPIRED' } })
      .catch(() => undefined);
    effectiveStatus = 'EXPIRED';
  }

  // Eager-fetch every product on the menu so the host view can render
  // selections (and incoming Pusher events in T19.6) without a per-row lookup.
  const products = await prisma.product.findMany({
    where: { category: { menuId: table.menuId } },
    select: {
      id: true,
      nameKa: true,
      nameEn: true,
      nameRu: true,
      price: true,
      currency: true,
      imageUrl: true,
      variations: {
        orderBy: { sortOrder: 'asc' },
        select: {
          id: true,
          nameKa: true,
          nameEn: true,
          nameRu: true,
          price: true,
        },
      },
    },
  });

  const locale: Locale = getLocaleFromCookie(
    cookieStore.get(LOCALE_COOKIE_NAME)?.value,
  );

  // Strip Decimals/Dates → primitive shape for the client island.
  const initial = JSON.parse(
    JSON.stringify({
      code: table.code,
      slug: table.menu.slug,
      menuName: table.menu.name,
      hostName: table.hostName,
      hostGuestId: token.guestId,
      maxGuests: table.maxGuests,
      status: effectiveStatus,
      expiresAt: table.expiresAt.toISOString(),
      extendedAt: table.extendedAt ? table.extendedAt.toISOString() : null,
      createdAt: table.createdAt.toISOString(),
      guests: table.guests.map((g) => ({
        id: g.id,
        name: g.name,
        isHost: g.isHost,
        joinedAt: g.joinedAt.toISOString(),
      })),
      selections: table.selections.map((s) => ({
        id: s.id,
        guestId: s.guestId,
        productId: s.productId,
        variationId: s.variationId,
        quantity: s.quantity,
        note: s.note,
        createdAt: s.createdAt.toISOString(),
      })),
      products,
    }),
  ) as TableHostInitial;

  return <TableHostView initial={initial} locale={locale} />;
}

// ---------- Types ---------------------------------------------------------

interface TableHostInitial {
  code: string;
  slug: string;
  menuName: string;
  hostName: string;
  hostGuestId: string;
  maxGuests: number;
  status: 'OPEN' | 'CLOSED' | 'EXPIRED';
  expiresAt: string;
  extendedAt: string | null;
  createdAt: string;
  guests: Array<{
    id: string;
    name: string;
    isHost: boolean;
    joinedAt: string;
  }>;
  selections: Array<{
    id: string;
    guestId: string;
    productId: string;
    variationId: string | null;
    quantity: number;
    note: string | null;
    createdAt: string;
  }>;
  products: Array<{
    id: string;
    nameKa: string;
    nameEn: string | null;
    nameRu: string | null;
    price: number | string;
    currency: string;
    imageUrl: string | null;
    variations: Array<{
      id: string;
      nameKa: string;
      nameEn: string | null;
      nameRu: string | null;
      price: number | string;
    }>;
  }>;
}
