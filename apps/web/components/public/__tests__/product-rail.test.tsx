import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { OffersCarousel } from '../offers-carousel';
import { JUMP_TO_CATEGORY_EVENT } from '../jump-to-category';
import { FeaturedCarousel } from '../featured-carousel';
import type { PublicProduct, PublicDisplaySettings } from '../product-card';

// T24.18 — the Offers rail mirrors the combo category above the menu body and
// carries a "see all" shortcut down to the category section itself.

const settings: PublicDisplaySettings = {
  currencySymbol: '₾',
  allergenDisplay: 'TEXT',
  caloriesDisplay: 'DIRECT',
  showNutrition: false,
  showDiscount: true,
  productCardStyle: 'BORDERED',
  productTouchEffect: 'SCALE',
};

function product(overrides: Partial<PublicProduct> = {}): PublicProduct {
  return {
    id: 'p-1',
    nameKa: 'კომბო',
    nameEn: 'Combo',
    nameRu: 'Комбо',
    descriptionKa: null,
    descriptionEn: null,
    descriptionRu: null,
    price: 25,
    oldPrice: null,
    currency: 'GEL',
    imageUrl: null,
    allergens: [],
    variations: [],
    ...overrides,
  } as PublicProduct;
}

describe('OffersCarousel', () => {
  it('renders the localized heading and the "see all" shortcut', () => {
    render(
      <OffersCarousel
        products={[product()]}
        categoryId="cat-offers"
        locale="ka"
        settings={settings}
      />
    );

    expect(screen.getByRole('region', { name: 'შეთავაზება' })).toBeInTheDocument();
    const seeAll = screen.getByTestId('offers-carousel-see-all');
    expect(seeAll).toHaveTextContent('სრულიად');
    expect(seeAll).toHaveAttribute('href', '#category-cat-offers');
  });

  it('scrolls to the Offers category section instead of navigating', () => {
    const scrollIntoView = vi.fn();
    const section = document.createElement('section');
    section.id = 'category-cat-offers';
    section.scrollIntoView = scrollIntoView;
    document.body.appendChild(section);

    render(
      <OffersCarousel
        products={[product()]}
        categoryId="cat-offers"
        locale="en"
        settings={settings}
      />
    );

    fireEvent.click(screen.getByTestId('offers-carousel-see-all'));
    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'start' });

    section.remove();
  });

  it('lets a listening MenuBody claim the jump instead of scrolling', () => {
    const scrollIntoView = vi.fn();
    const section = document.createElement('section');
    section.id = 'category-cat-offers';
    section.scrollIntoView = scrollIntoView;
    document.body.appendChild(section);

    const seen: string[] = [];
    const listener = (e: Event) => {
      seen.push((e as CustomEvent<string>).detail);
      e.preventDefault();
    };
    window.addEventListener(JUMP_TO_CATEGORY_EVENT, listener);

    render(
      <OffersCarousel
        products={[product()]}
        categoryId="cat-offers"
        locale="en"
        settings={settings}
      />
    );
    fireEvent.click(screen.getByTestId('offers-carousel-see-all'));

    expect(seen).toEqual(['cat-offers']);
    // MenuBody handles the reveal + scroll itself — the rail must not also
    // scroll, or the two fight over the scroll position.
    expect(scrollIntoView).not.toHaveBeenCalled();

    window.removeEventListener(JUMP_TO_CATEGORY_EVENT, listener);
    section.remove();
  });

  it('renders nothing when the Offers category has no products', () => {
    const { container } = render(
      <OffersCarousel products={[]} categoryId="cat-offers" locale="en" settings={settings} />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('shows the discount badge only when the old price is higher', () => {
    render(
      <OffersCarousel
        products={[product({ price: 20, oldPrice: 25 })]}
        categoryId="cat-offers"
        locale="en"
        settings={settings}
      />
    );
    expect(screen.getByText('-20%')).toBeInTheDocument();
  });
});

describe('FeaturedCarousel', () => {
  it('renders the "Most Ordered" heading with no "see all" shortcut', () => {
    render(<FeaturedCarousel products={[product()]} locale="en" settings={settings} />);

    expect(screen.getByRole('region', { name: 'Most Ordered' })).toBeInTheDocument();
    expect(screen.queryByTestId('featured-carousel-see-all')).not.toBeInTheDocument();
  });

  it('renders nothing without featured products', () => {
    const { container } = render(
      <FeaturedCarousel products={[]} locale="ka" settings={settings} />
    );
    expect(container).toBeEmptyDOMElement();
  });
});
