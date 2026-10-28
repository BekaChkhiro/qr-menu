import { prisma } from '@/lib/db';

// T22.24 — Combo promotions materialize a real, orderable product in an
// auto-managed "Offers / შეთავაზება" category. This keeps the combo visible on
// the public menu (as a product card) in addition to the promotions carousel.
//
// T1.9 — COMBO promotions are retired as a creation path (the API rejects new
// ones); combos are products with kind COMBO in any category. This module now
// only keeps legacy COMBO promotions and their generated products in step. The
// generated product is kind COMBO, and scripts/migrate-combo-products.ts gives
// existing ones their ComboItem rows.
//
// syncComboProduct is idempotent: call it after creating/updating any promotion.
// - COMBO promotion with a price → upsert the Offers category + combo product,
//   and link it back via Promotion.comboProductId.
// - Any other promotion (or a combo that lost its price) → remove a previously
//   generated combo product, if one exists.

/**
 * T24.8 — the Offers category is never hand-ordered. Creating or reordering a
 * normal category used to leave Offers stranded in the middle, so every path
 * that can disturb the order calls this to snap Offers back into place.
 *
 * T3.2 (client #2) — the place is Menu.offersRailPosition: TOP puts Offers
 * before the first regular category, BOTTOM past the last one. It applies with
 * the Offers rail switched OFF too (supersedes the T1.12 OFF rule).
 */
export async function placeOffersCategory(menuId: string): Promise<void> {
  const menu = await prisma.menu.findUnique({
    where: { id: menuId },
    select: { offersRailPosition: true },
  });
  if (!menu) return;

  const offers = await prisma.category.findFirst({
    where: { menuId, isSystemOffers: true },
    select: { id: true, sortOrder: true },
  });
  if (!offers) return;

  const onTop = menu.offersRailPosition !== 'BOTTOM';
  const edgeRegular = await prisma.category.findFirst({
    where: { menuId, isSystemOffers: false },
    orderBy: { sortOrder: onTop ? 'asc' : 'desc' },
    select: { sortOrder: true },
  });

  const target = onTop ? (edgeRegular?.sortOrder ?? 1) - 1 : (edgeRegular?.sortOrder ?? -1) + 1;
  if (offers.sortOrder === target) return;

  await prisma.category.update({
    where: { id: offers.id },
    data: { sortOrder: target },
  });
}

async function getOrCreateOffersCategory(menuId: string): Promise<string> {
  const existing = await prisma.category.findFirst({
    where: { menuId, isSystemOffers: true },
    select: { id: true },
  });
  if (existing) {
    await placeOffersCategory(menuId);
    return existing.id;
  }

  // Sort past the last *regular* category — the Offers row itself must never
  // be part of that measurement, or it drifts one slot further on every sync.
  // placeOffersCategory then moves it to the top when the menu asks for that.
  const last = await prisma.category.findFirst({
    where: { menuId, isSystemOffers: false },
    orderBy: { sortOrder: 'desc' },
    select: { sortOrder: true },
  });

  const created = await prisma.category.create({
    data: {
      menuId,
      nameKa: 'შეთავაზება',
      nameEn: 'Offers',
      nameRu: 'Предложения',
      type: 'OTHER',
      isSystemOffers: true,
      sortOrder: (last?.sortOrder ?? -1) + 1,
    },
    select: { id: true },
  });
  await placeOffersCategory(menuId);
  return created.id;
}

async function removeComboProduct(comboProductId: string | null): Promise<void> {
  if (!comboProductId) return;
  await prisma.product.deleteMany({ where: { id: comboProductId } });
}

export async function syncComboProduct(promotionId: string): Promise<void> {
  const promo = await prisma.promotion.findUnique({
    where: { id: promotionId },
    select: {
      id: true,
      menuId: true,
      type: true,
      titleKa: true,
      titleEn: true,
      titleRu: true,
      descriptionKa: true,
      descriptionEn: true,
      descriptionRu: true,
      imageUrl: true,
      isActive: true,
      comboProductIds: true,
      comboPrice: true,
      comboProductId: true,
    },
  });
  if (!promo) return;

  const isCombo = promo.type === 'COMBO' && promo.comboPrice != null;

  // Not (or no longer) a combo → tear down any generated product.
  if (!isCombo) {
    if (promo.comboProductId) {
      await removeComboProduct(promo.comboProductId);
      await prisma.promotion.update({
        where: { id: promo.id },
        data: { comboProductId: null },
      });
    }
    return;
  }

  const categoryId = await getOrCreateOffersCategory(promo.menuId);

  // T22.24 — spell out what's in the combo on its card. The operator's own
  // description wins; otherwise we list the component products ("Coffee +
  // Sandwich + Branded cup") so the card is self-explanatory.
  const components = promo.comboProductIds.length
    ? await prisma.product.findMany({
        where: { id: { in: promo.comboProductIds } },
        select: { id: true, nameKa: true, nameEn: true, nameRu: true },
      })
    : [];
  // Keep the operator's chosen order rather than the DB's.
  const ordered = promo.comboProductIds
    .map((id) => components.find((c) => c.id === id))
    .filter((c): c is (typeof components)[number] => !!c);

  const join = (pick: (c: (typeof ordered)[number]) => string | null) =>
    ordered.length ? ordered.map((c) => pick(c) || c.nameKa).join(' + ') : null;

  const data = {
    kind: 'COMBO' as const,
    categoryId,
    nameKa: promo.titleKa,
    nameEn: promo.titleEn,
    nameRu: promo.titleRu,
    descriptionKa: promo.descriptionKa || join((c) => c.nameKa),
    descriptionEn: promo.descriptionEn || join((c) => c.nameEn),
    descriptionRu: promo.descriptionRu || join((c) => c.nameRu),
    price: promo.comboPrice!,
    isAvailable: promo.isActive,
    // T24.9 — the artwork the operator uploaded for the combo is the same
    // picture the Offers card should show. Without this the combo appeared in
    // the top banner carousel with a photo but as a blank card in the category.
    imageUrl: promo.imageUrl,
  };

  // Update the linked product if it still exists, else (re)create + relink.
  // The promotion drawer is still the only editor of a legacy combo's dishes,
  // so its ComboItem rows follow the promotion's list.
  if (promo.comboProductId) {
    const updated = await prisma.product.updateMany({
      where: { id: promo.comboProductId },
      data,
    });
    if (updated.count > 0) {
      await prisma.comboItem.deleteMany({ where: { comboId: promo.comboProductId } });
      await prisma.comboItem.createMany({
        data: ordered.map((c, index) => ({
          comboId: promo.comboProductId!,
          componentId: c.id,
          quantity: 1,
          sortOrder: index,
        })),
      });
      return;
    }
  }

  const product = await prisma.product.create({
    data: {
      ...data,
      categoryId,
      comboItems: {
        create: ordered.map((c, index) => ({ componentId: c.id, quantity: 1, sortOrder: index })),
      },
    },
    select: { id: true },
  });
  await prisma.promotion.update({
    where: { id: promo.id },
    data: { comboProductId: product.id },
  });
}

/**
 * T2.6 — the COMBO promotion that owns a generated Offers product, if any.
 * That product is rebuilt from the promotion on every save (name, price, image,
 * dishes, availability), so editing or deleting it directly would only desync
 * it until the next sync. The product routes refuse such writes and point the
 * owner at the promotion instead.
 */
export async function findManagingPromotion(
  menuId: string,
  productId: string,
): Promise<{ id: string; titleKa: string } | null> {
  return prisma.promotion.findFirst({
    where: { menuId, type: 'COMBO', comboProductId: productId },
    select: { id: true, titleKa: true },
  });
}

export function promotionManagedMessage(promotion: { titleKa: string }): string {
  return `This combo is managed by the promotion "${promotion.titleKa}". Edit or delete it in the Promotions tab.`;
}

// Called from the promotion DELETE handler to clean up the generated product.
export async function deleteComboProductFor(promotion: {
  comboProductId: string | null;
}): Promise<void> {
  await removeComboProduct(promotion.comboProductId);
}
