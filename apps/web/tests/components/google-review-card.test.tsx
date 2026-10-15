import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { GoogleReviewCard } from '@/components/public/google-review-card';

const URL = 'https://g.page/r/CafeLinville/review';

describe('GoogleReviewCard', () => {
  it('renders nothing when url is null', () => {
    const { container } = render(<GoogleReviewCard url={null} locale="ka" />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing when url is empty', () => {
    const { container } = render(<GoogleReviewCard url="  " locale="en" />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders an external link that opens in a new tab', () => {
    render(<GoogleReviewCard url={URL} locale="en" />);
    expect(screen.getByTestId('google-review-card')).toBeInTheDocument();
    const link = screen.getByRole('link', { name: 'Leave a review' });
    expect(link).toHaveAttribute('href', URL);
    expect(link).toHaveAttribute('target', '_blank');
    expect(link.getAttribute('rel')).toContain('noopener');
  });

  it.each([
    ['ka', 'შეგვაფასეთ Google-ზე', 'შეფასების დატოვება'],
    ['en', 'Rate us on Google', 'Leave a review'],
    ['ru', 'Оцените нас в Google', 'Оставить отзыв'],
  ] as const)('renders %s labels', (locale, title, cta) => {
    render(<GoogleReviewCard url={URL} locale={locale} />);
    expect(screen.getByText(title)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: cta })).toBeInTheDocument();
  });
});
