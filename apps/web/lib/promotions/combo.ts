import { prisma } from '@/lib/db';

// T22.24 — Combo promotions materialize a real, orderable product in an
// auto-managed "Offers / შეთავაზება" category. This keeps the combo visible on
// the public menu (as a product card) in addition to the promotions carousel.
//
// syncComboProduct is idempotent: call it after creating/updating any promotion.
// - COMBO promotion with a price → upsert the Offers category + combo product,
//   and link it back via Promotion.comboProductId.
// - Any other promotion (or a combo that lost its price) → remove a previously
//   generated combo product, if one exists.

async function getOrCreateOffersCategory(menuId: string): Promise<string> {
  const existing = await prisma.category.findFirst({
    where: { menuId, isSystemOffers: true },
    select: { id: true },
  });
  if (existing) return existing.id;

  const last = await prisma.category.findFirst({
    where: { menuId },
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
    categoryId,
    nameKa: promo.titleKa,
    nameEn: promo.titleEn,
    nameRu: promo.titleRu,
    descriptionKa: promo.descriptionKa || join((c) => c.nameKa),
    descriptionEn: promo.descriptionEn || join((c) => c.nameEn),
    descriptionRu: promo.descriptionRu || join((c) => c.nameRu),
    price: promo.comboPrice!,
    isAvailable: promo.isActive,
  };

  // Update the linked product if it still exists, else (re)create + relink.
  if (promo.comboProductId) {
    const updated = await prisma.product.updateMany({
      where: { id: promo.comboProductId },
      data,
    });
    if (updated.count > 0) return;
  }

  const product = await prisma.product.create({
    data: { ...data, categoryId },
    select: { id: true },
  });
  await prisma.promotion.update({
    where: { id: promo.id },
    data: { comboProductId: product.id },
  });
}

// Called from the promotion DELETE handler to clean up the generated product.
export async function deleteComboProductFor(promotion: {
  comboProductId: string | null;
}): Promise<void> {
  await removeComboProduct(promotion.comboProductId);
}
