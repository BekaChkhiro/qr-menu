import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/db', () => ({
  prisma: {
    menu: { findUnique: vi.fn() },
    category: { findFirst: vi.fn(), update: vi.fn() },
  },
}));

import { prisma } from '@/lib/db';
import { pushOffersCategoryLast } from '../combo';

const menuFindUnique = prisma.menu.findUnique as unknown as ReturnType<typeof vi.fn>;
const categoryFindFirst = prisma.category.findFirst as unknown as ReturnType<typeof vi.fn>;
const categoryUpdate = prisma.category.update as unknown as ReturnType<typeof vi.fn>;

// Offers sits at sortOrder 0 while two regular categories follow it.
function seedCategories(offersSortOrder: number, lastRegularSortOrder: number) {
  categoryFindFirst.mockImplementation((args: { where: { isSystemOffers: boolean } }) =>
    Promise.resolve(
      args.where.isSystemOffers
        ? { id: 'offers', sortOrder: offersSortOrder }
        : { sortOrder: lastRegularSortOrder },
    ),
  );
}

describe('pushOffersCategoryLast', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('moves Offers past the last regular category when the rail is ON', async () => {
    menuFindUnique.mockResolvedValue({ offersRailEnabled: true });
    seedCategories(0, 2);

    await pushOffersCategoryLast('menu-1');

    expect(categoryUpdate).toHaveBeenCalledWith({
      where: { id: 'offers' },
      data: { sortOrder: 3 },
    });
  });

  it('leaves Offers at its own sortOrder when the rail is OFF', async () => {
    menuFindUnique.mockResolvedValue({ offersRailEnabled: false });
    seedCategories(0, 2);

    await pushOffersCategoryLast('menu-1');

    expect(categoryUpdate).not.toHaveBeenCalled();
    expect(categoryFindFirst).not.toHaveBeenCalled();
  });

  it('does nothing when Offers is already last', async () => {
    menuFindUnique.mockResolvedValue({ offersRailEnabled: true });
    seedCategories(3, 2);

    await pushOffersCategoryLast('menu-1');

    expect(categoryUpdate).not.toHaveBeenCalled();
  });

  it('does nothing when the menu has no Offers category', async () => {
    menuFindUnique.mockResolvedValue({ offersRailEnabled: true });
    categoryFindFirst.mockResolvedValue(null);

    await pushOffersCategoryLast('menu-1');

    expect(categoryUpdate).not.toHaveBeenCalled();
  });
});
