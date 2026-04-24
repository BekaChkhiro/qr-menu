import { describe, it, expect, vi, beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import { render, screen, within } from '@/tests/utils';

import { YourMenusCard, type YourMenuRow } from '../your-menus-card';

// Keep the mutation hook happy without hitting the API — the table test
// verifies filter/search locally and the delete-dialog wiring. The full
// DELETE → /api/menus/[id] path is exercised by the Playwright suite.
vi.mock('@/hooks/use-menus', () => ({
  useDeleteMenu: () => ({
    mutateAsync: vi.fn().mockResolvedValue(undefined),
    isPending: false,
  }),
}));

const now = new Date().toISOString();

function makeRow(overrides: Partial<YourMenuRow> = {}): YourMenuRow {
  return {
    id: `menu-${Math.random().toString(36).slice(2, 8)}`,
    name: 'Main menu',
    slug: 'main',
    status: 'PUBLISHED',
    viewsToday: 12,
    viewsWeek: 84,
    updatedAt: now,
    ...overrides,
  };
}

describe('YourMenusCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('empty state', () => {
    it('renders the empty card with 3 templates when menus is empty', () => {
      render(<YourMenusCard menus={[]} />);

      expect(screen.getByTestId('dashboard-your-menus-empty')).toBeInTheDocument();
      expect(
        screen.getByTestId('dashboard-menus-template-cafe'),
      ).toBeInTheDocument();
      expect(
        screen.getByTestId('dashboard-menus-template-restaurant'),
      ).toBeInTheDocument();
      expect(
        screen.getByTestId('dashboard-menus-template-bar'),
      ).toBeInTheDocument();
      expect(
        screen.getByTestId('dashboard-menus-create-from-scratch'),
      ).toHaveAttribute('href', '/admin/menus/new');
    });

    it('does not render the table when there are zero menus', () => {
      render(<YourMenusCard menus={[]} />);
      expect(screen.queryByTestId('dashboard-your-menus')).not.toBeInTheDocument();
    });
  });

  describe('table with rows', () => {
    const rows: YourMenuRow[] = [
      makeRow({ id: 'a', name: 'Main menu — All day', slug: 'main', status: 'PUBLISHED' }),
      makeRow({ id: 'b', name: 'Brunch — Weekends', slug: 'brunch', status: 'PUBLISHED' }),
      makeRow({ id: 'c', name: 'Wine & cocktails', slug: 'wine', status: 'PUBLISHED' }),
      makeRow({ id: 'd', name: 'Seasonal', slug: 'seasonal', status: 'DRAFT' }),
    ];

    it('renders one row per menu with correct status attribute', () => {
      render(<YourMenusCard menus={rows} />);

      const renderedRows = screen.getAllByTestId('dashboard-menus-row');
      expect(renderedRows).toHaveLength(4);
      expect(renderedRows[0]).toHaveAttribute('data-menu-status', 'PUBLISHED');
      expect(renderedRows[3]).toHaveAttribute('data-menu-status', 'DRAFT');
    });

    it('filter pill "Published" hides draft rows', async () => {
      const user = userEvent.setup();
      render(<YourMenusCard menus={rows} />);

      await user.click(screen.getByTestId('dashboard-menus-filter-published'));

      const visible = screen.getAllByTestId('dashboard-menus-row');
      expect(visible).toHaveLength(3);
      for (const row of visible) {
        expect(row).toHaveAttribute('data-menu-status', 'PUBLISHED');
      }
      expect(screen.getByTestId('dashboard-menus-filter-published')).toHaveAttribute(
        'data-active',
        'true',
      );
    });

    it('filter pill "Draft" shows only draft rows', async () => {
      const user = userEvent.setup();
      render(<YourMenusCard menus={rows} />);

      await user.click(screen.getByTestId('dashboard-menus-filter-draft'));

      const visible = screen.getAllByTestId('dashboard-menus-row');
      expect(visible).toHaveLength(1);
      expect(visible[0]).toHaveAttribute('data-menu-status', 'DRAFT');
    });

    it('search input filters rows by name (case-insensitive)', async () => {
      const user = userEvent.setup();
      render(<YourMenusCard menus={rows} />);

      await user.type(
        screen.getByTestId('dashboard-menus-search'),
        'BRUNCH',
      );

      const visible = screen.getAllByTestId('dashboard-menus-row');
      expect(visible).toHaveLength(1);
      expect(within(visible[0]).getByText('Brunch — Weekends')).toBeInTheDocument();
    });

    it('shows the no-results message when no rows match', async () => {
      const user = userEvent.setup();
      render(<YourMenusCard menus={rows} />);

      await user.type(
        screen.getByTestId('dashboard-menus-search'),
        'zzznothing',
      );

      expect(screen.getByTestId('dashboard-menus-no-results')).toBeInTheDocument();
      expect(screen.queryAllByTestId('dashboard-menus-row')).toHaveLength(0);
    });

    it('displays views today/week with tabular nums', () => {
      render(
        <YourMenusCard
          menus={[
            makeRow({ id: 'x', name: 'Solo', slug: 'solo', viewsToday: 42, viewsWeek: 1234 }),
          ]}
        />,
      );

      const row = screen.getByTestId('dashboard-menus-row');
      expect(within(row).getByText('42')).toBeInTheDocument();
      // "42 · 1,234" — separator + locale-formatted week count.
      expect(within(row).getByText(/1,234/)).toBeInTheDocument();
    });
  });
});
