import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@/tests/utils';

import { TopProductsCard } from '../top-products-card';
import type { TopProductsResponse } from '@/hooks/use-top-products';

// Mock the hook so we can drive loading / data / empty / error states
// without hitting the network.
const mockUseTopProducts = vi.fn();
vi.mock('@/hooks/use-top-products', () => ({
  useTopProducts: (args?: unknown) => mockUseTopProducts(args),
}));

function makeRow(
  rank: number,
  overrides: Partial<TopProductsResponse['rows'][number]> = {},
): TopProductsResponse['rows'][number] {
  return {
    id: `product-${rank}`,
    rank,
    name: {
      ka: `პროდუქტი ${rank}`,
      en: `Product ${rank}`,
      ru: null,
    },
    category: {
      id: `cat-${rank}`,
      name: { ka: 'კატ.', en: 'Cat.', ru: null },
    },
    menu: { id: `menu-${rank}`, name: `Menu ${rank}` },
    price: (rank * 10).toFixed(2),
    currency: 'GEL',
    imageUrl: null,
    views: 2000 - rank * 300,
    ...overrides,
  };
}

describe('TopProductsCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the skeleton while loading', () => {
    mockUseTopProducts.mockReturnValue({ isLoading: true, isError: false });
    render(<TopProductsCard />);
    expect(
      screen.getByTestId('dashboard-top-products-skeleton'),
    ).toBeInTheDocument();
  });

  it('renders the empty state when there are no rows', () => {
    mockUseTopProducts.mockReturnValue({
      data: { rows: [], period: { days: 30 }, heuristic: true },
      isLoading: false,
      isError: false,
    });
    render(<TopProductsCard />);
    expect(
      screen.getByTestId('dashboard-top-products-empty'),
    ).toBeInTheDocument();
  });

  it('renders 5 ranked rows with top-3 flagged', () => {
    mockUseTopProducts.mockReturnValue({
      data: {
        rows: [1, 2, 3, 4, 5].map((r) => makeRow(r)),
        period: { days: 30 },
        heuristic: true,
      },
      isLoading: false,
      isError: false,
    });
    render(<TopProductsCard />);

    const rows = screen.getAllByTestId('dashboard-top-products-row');
    expect(rows).toHaveLength(5);

    for (let i = 0; i < 3; i++) {
      expect(rows[i]).toHaveAttribute('data-top-three', 'true');
      expect(rows[i]).toHaveAttribute('data-rank', String(i + 1));
    }
    expect(rows[3]).toHaveAttribute('data-top-three', 'false');
    expect(rows[4]).toHaveAttribute('data-top-three', 'false');
  });

  it('row link points to the owning menu editor', () => {
    mockUseTopProducts.mockReturnValue({
      data: {
        rows: [makeRow(1, { menu: { id: 'menu-abc', name: 'Main menu' } })],
        period: { days: 30 },
        heuristic: true,
      },
      isLoading: false,
      isError: false,
    });
    render(<TopProductsCard />);
    const link = screen
      .getByTestId('dashboard-top-products-row')
      .querySelector('a');
    expect(link).toHaveAttribute('href', '/admin/menus/menu-abc');
  });
});
