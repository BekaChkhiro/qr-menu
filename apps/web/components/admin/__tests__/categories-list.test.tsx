import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@/tests/utils';
import userEvent from '@testing-library/user-event';
import { CategoriesList } from '../categories-list';

type Category = {
  id: string;
  menuId: string;
  nameKa: string;
  nameEn: string | null;
  nameRu: string | null;
  descriptionKa: string | null;
  descriptionEn: string | null;
  descriptionRu: string | null;
  iconUrl: string | null;
  brandLabel: string | null;
  type: 'FOOD' | 'DRINK' | 'OTHER';
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  _count: { products: number };
};

function makeCategory(overrides: Partial<Category> = {}): Category {
  return {
    id: 'cat-1',
    menuId: 'menu-1',
    nameKa: 'ცხელი კერძები',
    nameEn: 'Hot Dishes',
    nameRu: null,
    descriptionKa: null,
    descriptionEn: null,
    descriptionRu: null,
    iconUrl: null,
    brandLabel: null,
    type: 'FOOD',
    sortOrder: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    _count: { products: 3 },
    ...overrides,
  };
}

// Hook mocks — drive state through the `useCategories` result; mutation hooks
// only need pending + mutate/mutateAsync stubs for the UI logic we exercise.
const reorderMutate = vi.fn();
const duplicateMutateAsync = vi.fn().mockResolvedValue(undefined);
const deleteMutateAsync = vi.fn().mockResolvedValue(undefined);
const createMutateAsync = vi.fn().mockResolvedValue(undefined);
const updateMutateAsync = vi.fn().mockResolvedValue(undefined);

let categoriesFixture: Category[] = [];

vi.mock('@/hooks/use-categories', () => ({
  useCategories: () => ({ data: categoriesFixture, isLoading: false, error: null }),
  useCreateCategory: () => ({ mutateAsync: createMutateAsync, isPending: false }),
  useUpdateCategory: () => ({ mutateAsync: updateMutateAsync, isPending: false }),
  useDeleteCategory: () => ({ mutateAsync: deleteMutateAsync, isPending: false }),
  useDuplicateCategory: () => ({ mutateAsync: duplicateMutateAsync, isPending: false }),
  useReorderCategories: () => ({ mutate: reorderMutate, isPending: false }),
}));

// Plan state is set per test group so we can cover FREE-limit paths.
const userPlan = { plan: 'STARTER' as 'FREE' | 'STARTER' | 'PRO', canCreate: true };
vi.mock('@/hooks/use-user-plan', () => ({
  useUserPlan: () => ({
    plan: userPlan.plan,
    canCreate: () => userPlan.canCreate,
    getLimit: () => Infinity,
  }),
}));

// ProductsList pulls its own hooks; stub it to a simple marker so expanding a
// row doesn't reach into React Query land.
vi.mock('../products-list', () => ({
  ProductsList: ({ categoryId }: { categoryId: string }) => (
    <div data-testid="products-list-stub" data-category-id={categoryId}>
      products for {categoryId}
    </div>
  ),
}));

// The upgrade prompt + category dialog are orthogonal; stub so opening them
// doesn't add noise to the tests.
vi.mock('../upgrade-prompt', () => ({
  UpgradePrompt: ({ open }: { open: boolean }) =>
    open ? <div data-testid="upgrade-prompt" /> : null,
}));
vi.mock('../category-dialog', () => ({
  CategoryDialog: ({ open }: { open: boolean }) =>
    open ? <div data-testid="category-dialog" /> : null,
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

beforeEach(() => {
  vi.clearAllMocks();
  categoriesFixture = [];
  userPlan.plan = 'STARTER';
  userPlan.canCreate = true;
});

describe('CategoriesList', () => {
  describe('empty state', () => {
    it('renders the empty card when there are no categories', () => {
      categoriesFixture = [];
      render(<CategoriesList menuId="menu-1" />);

      expect(screen.getByTestId('categories-empty')).toBeInTheDocument();
      expect(screen.queryByTestId('categories-list-rows')).not.toBeInTheDocument();
    });

    it('still renders the dashed "Add category" button in the empty state', () => {
      categoriesFixture = [];
      render(<CategoriesList menuId="menu-1" />);

      const addButton = screen.getByTestId('categories-add-dashed');
      expect(addButton).toBeInTheDocument();
      expect(addButton).toHaveAttribute('data-can-add', 'true');
    });
  });

  describe('list rendering', () => {
    it('renders one row per category with a stable testid and data-category-id', () => {
      categoriesFixture = [
        makeCategory({ id: 'cat-a', nameKa: 'ცხელი კერძები', _count: { products: 3 } }),
        makeCategory({ id: 'cat-b', nameKa: 'სალათები', _count: { products: 5 } }),
        makeCategory({ id: 'cat-c', nameKa: 'სასმელები', type: 'DRINK', _count: { products: 2 } }),
      ];
      render(<CategoriesList menuId="menu-1" />);

      const rows = screen.getAllByTestId('category-row');
      expect(rows).toHaveLength(3);
      expect(rows[0]).toHaveAttribute('data-category-id', 'cat-a');
      expect(rows[1]).toHaveAttribute('data-category-id', 'cat-b');
      expect(rows[2]).toHaveAttribute('data-category-id', 'cat-c');
    });

    it('shows the type-based emoji when iconUrl is null', () => {
      categoriesFixture = [
        makeCategory({ id: 'cat-food', type: 'FOOD', iconUrl: null }),
        makeCategory({ id: 'cat-drink', type: 'DRINK', iconUrl: null }),
        makeCategory({ id: 'cat-other', type: 'OTHER', iconUrl: null }),
      ];
      render(<CategoriesList menuId="menu-1" />);

      const icons = screen.getAllByTestId('category-icon');
      expect(icons).toHaveLength(3);
      icons.forEach((icon) => {
        expect(icon).toHaveAttribute('data-icon-kind', 'emoji');
      });
    });

    it('shows an image icon when iconUrl is set', () => {
      categoriesFixture = [
        makeCategory({
          id: 'cat-branded',
          iconUrl: 'https://cdn.example.com/icons/pizza.png',
        }),
      ];
      render(<CategoriesList menuId="menu-1" />);

      const icon = screen.getByTestId('category-icon');
      expect(icon).toHaveAttribute('data-icon-kind', 'image');
      // alt="" makes the <img> role=presentation, so assert directly on the node.
      const img = icon.querySelector('img');
      expect(img).not.toBeNull();
      expect(img).toHaveAttribute('src', expect.stringContaining('pizza.png'));
    });

    it('marks rows as not-expanded by default', () => {
      categoriesFixture = [makeCategory()];
      render(<CategoriesList menuId="menu-1" />);

      expect(screen.getByTestId('category-row')).toHaveAttribute('data-expanded', 'false');
    });
  });

  describe('expand / collapse', () => {
    it('toggles data-expanded and renders ProductsList when a row is opened', async () => {
      categoriesFixture = [makeCategory({ id: 'cat-a' })];
      const user = userEvent.setup();
      render(<CategoriesList menuId="menu-1" />);

      const toggle = screen.getByTestId('category-row-toggle');
      await user.click(toggle);

      const row = screen.getByTestId('category-row');
      expect(row).toHaveAttribute('data-expanded', 'true');
      const productsStub = screen.getByTestId('products-list-stub');
      expect(productsStub).toHaveAttribute('data-category-id', 'cat-a');

      await user.click(toggle);
      expect(screen.getByTestId('category-row')).toHaveAttribute('data-expanded', 'false');
    });
  });

  describe('search', () => {
    it('filters rows client-side, matching any of ka/en/ru', async () => {
      categoriesFixture = [
        makeCategory({ id: 'cat-a', nameKa: 'ცხელი კერძები', nameEn: 'Hot Dishes' }),
        makeCategory({ id: 'cat-b', nameKa: 'სალათები', nameEn: 'Salads' }),
        makeCategory({ id: 'cat-c', nameKa: 'სასმელები', nameEn: 'Drinks', nameRu: 'Напитки' }),
      ];
      const user = userEvent.setup();
      render(<CategoriesList menuId="menu-1" />);

      const search = screen.getByTestId('categories-search');
      await user.type(search, 'salad');

      const rows = screen.getAllByTestId('category-row');
      expect(rows).toHaveLength(1);
      expect(rows[0]).toHaveAttribute('data-category-id', 'cat-b');

      await user.clear(search);
      await user.type(search, 'Напитки');
      const rusRows = screen.getAllByTestId('category-row');
      expect(rusRows).toHaveLength(1);
      expect(rusRows[0]).toHaveAttribute('data-category-id', 'cat-c');
    });

    it('renders the no-results card when the query matches nothing', async () => {
      categoriesFixture = [
        makeCategory({ id: 'cat-a', nameKa: 'ცხელი კერძები', nameEn: 'Hot Dishes' }),
      ];
      const user = userEvent.setup();
      render(<CategoriesList menuId="menu-1" />);

      await user.type(screen.getByTestId('categories-search'), 'zzz no match');

      expect(screen.queryByTestId('categories-list-rows')).not.toBeInTheDocument();
      expect(screen.getByTestId('categories-no-results')).toBeInTheDocument();
    });
  });

  describe('"Add category" button', () => {
    it('opens the create dialog for a user under their plan cap', async () => {
      categoriesFixture = [makeCategory()];
      userPlan.canCreate = true;
      const user = userEvent.setup();
      render(<CategoriesList menuId="menu-1" />);

      await user.click(screen.getByTestId('categories-add-dashed'));

      expect(screen.getByTestId('category-dialog')).toBeInTheDocument();
      expect(screen.queryByTestId('upgrade-prompt')).not.toBeInTheDocument();
    });

    it('opens the upgrade prompt when the user is at plan cap', async () => {
      categoriesFixture = [makeCategory()];
      userPlan.canCreate = false;
      const user = userEvent.setup();
      render(<CategoriesList menuId="menu-1" />);

      const button = screen.getByTestId('categories-add-dashed');
      expect(button).toHaveAttribute('data-can-add', 'false');

      await user.click(button);

      expect(screen.getByTestId('upgrade-prompt')).toBeInTheDocument();
      expect(screen.queryByTestId('category-dialog')).not.toBeInTheDocument();
    });
  });
});
