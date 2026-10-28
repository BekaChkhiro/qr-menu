import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/db', () => ({
  prisma: {
    menu: { findUnique: vi.fn() },
    category: { findFirst: vi.fn(), update: vi.fn() },
  },
}));

import { prisma } from '@/lib/db';
import { placeOffersCategory } from '../combo';

const menuFindUnique = prisma.menu.findUnique as unknown as ReturnType<typeof vi.fn>;
const categoryFindFirst = prisma.category.findFirst as unknown as ReturnType<typeof vi.fn>;
const categoryUpdate = prisma.category.update as unknown as ReturnType<typeof vi.fn>;

// Regular categories span sortOrder 1..3; Offers sits wherever the test puts it.
function seedCategories(offersSortOrder: number, regular = { first: 1, last: 3 }) {
  categoryFindFirst.mockImplementation(
    (args: { where: { isSystemOffers: boolean }; orderBy?: { sortOrder: 'asc' | 'desc' } }) =>
      Promise.resolve(
        args.where.isSystemOffers
          ? { id: 'offers', sortOrder: offersSortOrder }
          : { sortOrder: args.orderBy?.sortOrder === 'asc' ? regular.first : regular.last },
      ),
  );
}

// T3.2 — Menu.offersRailPosition places the Offers category, rail ON or OFF.
describe('placeOffersCategory', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('moves Offers past the last regular category when BOTTOM', async () => {
    menuFindUnique.mockResolvedValue({ offersRailPosition: 'BOTTOM' });
    seedCategories(0);

    await placeOffersCategory('menu-1');

    expect(categoryUpdate).toHaveBeenCalledWith({
      where: { id: 'offers' },
      data: { sortOrder: 4 },
    });
  });

  it('moves Offers before the first regular category when TOP', async () => {
    menuFindUnique.mockResolvedValue({ offersRailPosition: 'TOP' });
    seedCategories(4);

    await placeOffersCategory('menu-1');

    expect(categoryUpdate).toHaveBeenCalledWith({
      where: { id: 'offers' },
      data: { sortOrder: 0 },
    });
  });

  it('does not read the rail switch — the position applies with the rail OFF', async () => {
    menuFindUnique.mockResolvedValue({ offersRailPosition: 'BOTTOM', offersRailEnabled: false });
    seedCategories(0);

    await placeOffersCategory('menu-1');

    expect(menuFindUnique).toHaveBeenCalledWith({
      where: { id: 'menu-1' },
      select: { offersRailPosition: true },
    });
    expect(categoryUpdate).toHaveBeenCalledWith({
      where: { id: 'offers' },
      data: { sortOrder: 4 },
    });
  });

  it('does nothing when Offers is already at its edge', async () => {
    menuFindUnique.mockResolvedValue({ offersRailPosition: 'BOTTOM' });
    seedCategories(4);
    await placeOffersCategory('menu-1');

    menuFindUnique.mockResolvedValue({ offersRailPosition: 'TOP' });
    seedCategories(0);
    await placeOffersCategory('menu-1');

    expect(categoryUpdate).not.toHaveBeenCalled();
  });

  it('does nothing when the menu has no Offers category', async () => {
    menuFindUnique.mockResolvedValue({ offersRailPosition: 'TOP' });
    categoryFindFirst.mockResolvedValue(null);

    await placeOffersCategory('menu-1');

    expect(categoryUpdate).not.toHaveBeenCalled();
  });

  it('does nothing when the menu is gone', async () => {
    menuFindUnique.mockResolvedValue(null);

    await placeOffersCategory('menu-1');

    expect(categoryFindFirst).not.toHaveBeenCalled();
    expect(categoryUpdate).not.toHaveBeenCalled();
  });
});
