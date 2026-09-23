import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { MenuBody } from '../menu-body';
import { requestCategoryJump } from '../jump-to-category';
import type { PublicDisplaySettings, PublicProduct } from '../product-card';

// T24.18 — the Offers rail's "see all" reaches MenuBody through a window event.
// Under the CATEGORIES_FIRST layout the target section is not mounted yet, so a
// raw `scrollIntoView` would land nowhere: MenuBody has to leave the icon grid
// first. These tests pin that contract from MenuBody's side.

const settings: PublicDisplaySettings = {
  currencySymbol: '₾',
  allergenDisplay: 'TEXT',
  caloriesDisplay: 'DIRECT',
  showNutrition: false,
  showDiscount: true,
  productCardStyle: 'BORDERED',
  productTouchEffect: 'SCALE',
};

function product(id: string): PublicProduct {
  return {
    id,
    nameKa: id,
    nameEn: id,
    nameRu: id,
    descriptionKa: null,
    descriptionEn: null,
    descriptionRu: null,
    price: 10,
    oldPrice: null,
    currency: 'GEL',
    imageUrl: null,
    allergens: [],
    variations: [],
  } as PublicProduct;
}

function category(id: string, name: string, type: 'FOOD' | 'DRINK' = 'FOOD') {
  return {
    id,
    nameKa: name,
    nameEn: name,
    nameRu: name,
    descriptionKa: null,
    descriptionEn: null,
    descriptionRu: null,
    iconUrl: null,
    brandLabel: null,
    type,
    products: [product(`${id}-p1`)],
  };
}

const categories = [
  category('cat-food', 'Hot dishes', 'FOOD'),
  category('cat-offers', 'Offers', 'DRINK'),
];

function renderBody(layout: 'LINEAR' | 'CATEGORIES_FIRST', splitByType = false) {
  return render(
    <MenuBody
      menuId="menu-1"
      trackViews={false}
      categories={categories}
      locale="en"
      settings={settings}
      layout={layout}
      splitByType={splitByType}
    />
  );
}

describe('MenuBody — category jump event', () => {
  // MenuBody defers its scroll by two animation frames so the section it just
  // revealed is mounted first. Queue the callbacks instead of running them
  // inline: running them inline would fire them BEFORE React commits, which is
  // the one ordering the real browser never produces.
  const frames: FrameRequestCallback[] = [];
  const flushFrames = () =>
    act(() => {
      while (frames.length) frames.shift()!(0);
    });

  beforeEach(() => {
    frames.length = 0;
    // jsdom implements neither; the component calls both on a jump.
    window.scrollTo = vi.fn() as unknown as typeof window.scrollTo;
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) =>
      frames.push(cb)
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('leaves the icon grid and mounts the section it was asked for', () => {
    renderBody('CATEGORIES_FIRST');

    // Grid first: the section does not exist yet, which is exactly why a plain
    // scrollIntoView from the rail would be a no-op.
    expect(document.getElementById('category-cat-offers')).toBeNull();

    let handled = false;
    act(() => {
      handled = requestCategoryJump('cat-offers');
    });

    expect(handled).toBe(true);
    expect(document.getElementById('category-cat-offers')).not.toBeNull();

    flushFrames();
    expect(window.scrollTo).toHaveBeenCalledWith(
      expect.objectContaining({ behavior: 'smooth' })
    );
  });

  it('clears a Foods/Drinks filter that would hide the target category', () => {
    renderBody('LINEAR', true);

    // Narrow to Foods — the Offers category is a DRINK and drops out.
    act(() => {
      screen.getByRole('button', { name: 'Foods' }).click();
    });
    expect(document.getElementById('category-cat-offers')).toBeNull();

    act(() => {
      requestCategoryJump('cat-offers');
    });
    expect(document.getElementById('category-cat-offers')).not.toBeNull();
  });

  it('ignores a jump for a category this menu does not have', () => {
    renderBody('CATEGORIES_FIRST');

    let handled = true;
    act(() => {
      handled = requestCategoryJump('cat-missing');
    });

    // Unclaimed, so the rail knows to fall back rather than assume success.
    expect(handled).toBe(false);
    expect(screen.getByText('Hot dishes')).toBeInTheDocument();
  });
});
