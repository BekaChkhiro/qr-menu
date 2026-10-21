import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@/tests/utils';
import userEvent from '@testing-library/user-event';
import { ProductForm } from '../product-form';

// T1.11 — the "Recommended" switch in the product drawer. Switching it on reveals
// the order field, and the order is required while it's on. Switching it off
// submits no order at all, so a dish can't keep a stale rail position.

const categories = [
  { id: 'cat-1', nameKa: 'ღვინო', nameEn: 'Wine', nameRu: null, iconUrl: null },
];

function renderForm(onSubmit = vi.fn(), product?: Record<string, unknown>) {
  render(
    <ProductForm
      categories={categories as never}
      defaultCategoryId="cat-1"
      product={product as never}
      onSubmit={onSubmit}
      onCancel={vi.fn()}
      activeLang="KA"
    />
  );
  return onSubmit;
}

const featuredToggle = () =>
  screen.getByTestId('product-basics-featured-toggle') as HTMLButtonElement;
const rankInput = () =>
  screen.queryByTestId('product-basics-featured-rank-input') as HTMLInputElement | null;

// Fill the fields every submit needs, so only the Recommended rule is under test.
async function fillRequired(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByTestId('product-basics-name-input'), 'ხაჭაპური');
  await user.type(screen.getByTestId('product-basics-price-input'), '12');
}

describe('ProductForm — Recommended (T1.11)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('hides the order field until the switch is on', async () => {
    const user = userEvent.setup();
    renderForm();

    expect(featuredToggle()).toHaveAttribute('aria-checked', 'false');
    expect(rankInput()).toBeNull();

    await user.click(featuredToggle());

    expect(featuredToggle()).toHaveAttribute('aria-checked', 'true');
    expect(rankInput()).not.toBeNull();
  });

  it('opens with the switch on and the saved order when the dish is already picked', () => {
    renderForm(vi.fn(), { featuredRank: 4 });

    expect(featuredToggle()).toHaveAttribute('aria-checked', 'true');
    expect(rankInput()!.value).toBe('4');
  });

  it('blocks submit while the switch is on and the order is empty', async () => {
    const user = userEvent.setup();
    const onSubmit = renderForm();
    await fillRequired(user);

    await user.click(featuredToggle());
    await user.click(screen.getByRole('button', { name: /create|შექმნა|Создать/i }));

    await waitFor(() =>
      expect(screen.getByTestId('product-basics-featured-rank-error')).toBeInTheDocument()
    );
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('submits the order when the switch is on', async () => {
    const user = userEvent.setup();
    const onSubmit = renderForm();
    await fillRequired(user);

    await user.click(featuredToggle());
    await user.type(rankInput()!, '3');
    await user.click(screen.getByRole('button', { name: /create|შექმნა|Создать/i }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit.mock.calls[0][0]).toMatchObject({ featured: true, featuredRank: '3' });
  });
});
