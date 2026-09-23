import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@/tests/utils';
import userEvent from '@testing-library/user-event';
import { ProductForm } from '../product-form';

// T24.20 — switching the KA/EN/RU scope must swap which translation the box is
// editing. React Hook Form binds a field name at MOUNT, so a component that
// merely changes `name` on an already-mounted input keeps showing (and then
// saves) the previous language's text — the exact complaint in the Promotions
// V2 report. These tests pin the round-trip: type, switch, switch back, and the
// first language's text is still there and unchanged.

const categories = [
  { id: 'cat-1', nameKa: 'ღვინო', nameEn: 'Wine', nameRu: null, iconUrl: null },
];

function renderForm(activeLang: 'KA' | 'EN' | 'RU') {
  return render(
    <ProductForm
      categories={categories as never}
      defaultCategoryId="cat-1"
      onSubmit={vi.fn()}
      onCancel={vi.fn()}
      activeLang={activeLang}
    />
  );
}

const nameInput = () =>
  screen.getByTestId('product-basics-name-input') as HTMLInputElement;
const descInput = () =>
  screen.getByTestId('product-basics-description-textarea') as HTMLTextAreaElement;

describe('ProductForm — language scope switching', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('keeps each language’s name separate across a full round-trip', async () => {
    const user = userEvent.setup();
    const { rerender } = renderForm('KA');

    await user.type(nameInput(), 'ჭაჭა');
    expect(nameInput().value).toBe('ჭაჭა');

    // KA → EN: a fresh translation starts empty, it does NOT inherit KA.
    rerender(
      <ProductForm
        categories={categories as never}
        defaultCategoryId="cat-1"
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
        activeLang="EN"
      />
    );
    expect(nameInput().value).toBe('');

    await user.type(nameInput(), 'Chacha');
    expect(nameInput().value).toBe('Chacha');

    // EN → KA: the Georgian text is intact and was not overwritten.
    rerender(
      <ProductForm
        categories={categories as never}
        defaultCategoryId="cat-1"
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
        activeLang="KA"
      />
    );
    expect(nameInput().value).toBe('ჭაჭა');
  });

  it('keeps each language’s description separate too', async () => {
    const user = userEvent.setup();
    const { rerender } = renderForm('KA');

    await user.type(descInput(), 'ქართული აღწერა');

    rerender(
      <ProductForm
        categories={categories as never}
        defaultCategoryId="cat-1"
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
        activeLang="RU"
      />
    );
    expect(descInput().value).toBe('');
    await user.type(descInput(), 'Описание');

    rerender(
      <ProductForm
        categories={categories as never}
        defaultCategoryId="cat-1"
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
        activeLang="KA"
      />
    );
    expect(descInput().value).toBe('ქართული აღწერა');
  });

  it('loads the stored translation of an existing product, not the Georgian one', () => {
    const product = {
      id: 'p-1',
      categoryId: 'cat-1',
      nameKa: 'საფერავი, ქვევრი',
      nameEn: 'Saperavi, qvevri',
      nameRu: null,
      price: 25,
    };

    const { rerender } = render(
      <ProductForm
        product={product as never}
        categories={categories as never}
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
        activeLang="KA"
      />
    );
    expect(nameInput().value).toBe('საფერავი, ქვევრი');

    rerender(
      <ProductForm
        product={product as never}
        categories={categories as never}
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
        activeLang="EN"
      />
    );
    expect(nameInput().value).toBe('Saperavi, qvevri');
  });
});
