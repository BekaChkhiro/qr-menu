// T1.9 — convert legacy COMBO promotions into combo products (kind = COMBO).
//
// For every promotion of type COMBO whose generated product still exists:
//   - the product becomes kind = COMBO (its price stays the combo price);
//   - if it has no ComboItem rows yet, one is created per dish in
//     Promotion.comboProductIds, in the promotion's order (quantity 1).
// Promotion.comboProductId is left untouched, so the promotion keeps showing
// the product exactly as before (see lib/__tests__/combo-visibility.test.ts).
//
// Idempotent: a second run finds kind already COMBO and items already present,
// and changes nothing. Items the owner edited later are never re-added.
//
// Usage (from packages/database):
//   DATABASE_URL=... pnpm dlx tsx scripts/migrate-combo-products.ts [--dry-run]

import { PrismaClient } from '@prisma/client';

const dryRun = process.argv.includes('--dry-run');
const prisma = new PrismaClient();

async function main() {
  const promotions = await prisma.promotion.findMany({
    where: { type: 'COMBO', comboProductId: { not: null } },
    select: { id: true, comboProductId: true, comboProductIds: true },
    orderBy: { createdAt: 'asc' },
  });

  const counts = {
    promotions: promotions.length,
    converted: 0,
    itemsAdded: 0,
    missingProduct: 0,
    underTwoDishes: 0,
  };

  for (const promo of promotions) {
    const comboId = promo.comboProductId!;
    const product = await prisma.product.findUnique({
      where: { id: comboId },
      select: { id: true, kind: true, comboItems: { select: { id: true } } },
    });
    if (!product) {
      counts.missingProduct++;
      continue;
    }

    // Keep the promotion's order; drop the product itself, dishes that no longer
    // exist, and anything that is not a plain dish (combos never nest).
    const candidateIds = promo.comboProductIds.filter((id) => id !== comboId);
    const plain = await prisma.product.findMany({
      where: { id: { in: candidateIds }, kind: 'STANDARD' },
      select: { id: true },
    });
    const plainIds = new Set(plain.map((p) => p.id));
    const componentIds = candidateIds.filter((id) => plainIds.has(id));
    if (componentIds.length < 2) counts.underTwoDishes++;

    const wasStandard = product.kind !== 'COMBO';
    const needsItems = product.comboItems.length === 0 && componentIds.length > 0;
    if (!wasStandard && !needsItems) continue;

    if (dryRun) {
      console.log(
        `[dry-run] ${comboId}: kind ${product.kind} → COMBO, ${needsItems ? componentIds.length : 0} item(s)`
      );
    } else {
      await prisma.$transaction(async (tx) => {
        if (wasStandard) {
          await tx.product.update({ where: { id: comboId }, data: { kind: 'COMBO' } });
        }
        if (needsItems) {
          await tx.comboItem.createMany({
            data: componentIds.map((componentId, index) => ({
              comboId,
              componentId,
              quantity: 1,
              sortOrder: index,
            })),
            skipDuplicates: true,
          });
        }
      });
    }

    if (wasStandard) counts.converted++;
    counts.itemsAdded += needsItems ? componentIds.length : 0;
  }

  console.log(
    `${dryRun ? '[dry-run] ' : ''}COMBO promotions: ${counts.promotions}, products converted: ${counts.converted}, ` +
      `items added: ${counts.itemsAdded}, missing product: ${counts.missingProduct}, ` +
      `under 2 dishes (review in product drawer): ${counts.underTwoDishes}`
  );
}

main()
  .catch((err) => {
    console.error('Combo migration failed:', err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
