'use client';

import { useEffect, useState, useRef } from 'react';
import { cn } from '@/lib/utils';
import type { Locale } from '@/i18n/config';

interface Category {
  id: string;
  nameKa: string;
  nameEn: string | null;
  nameRu: string | null;
}

interface CategoryNavProps {
  categories: Category[];
  locale: Locale;
}

function getCategoryName(category: Category, locale: Locale): string {
  switch (locale) {
    case 'en':
      return category.nameEn || category.nameKa;
    case 'ru':
      return category.nameRu || category.nameKa;
    default:
      return category.nameKa;
  }
}

export function CategoryNav({ categories, locale }: CategoryNavProps) {
  const [activeCategory, setActiveCategory] = useState<string | null>(
    categories[0]?.id || null
  );
  const navRef = useRef<HTMLDivElement>(null);
  const isScrollingRef = useRef(false);

  useEffect(() => {
    const handleScroll = () => {
      if (isScrollingRef.current) return;

      const headerOffset = 140; // Account for sticky header + nav
      let currentCategory = categories[0]?.id || null;

      for (const category of categories) {
        const element = document.getElementById(`category-${category.id}`);
        if (element) {
          const rect = element.getBoundingClientRect();
          if (rect.top <= headerOffset + 50) {
            currentCategory = category.id;
          }
        }
      }

      setActiveCategory(currentCategory);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [categories]);

  const scrollToCategory = (categoryId: string) => {
    const element = document.getElementById(`category-${categoryId}`);
    if (element) {
      isScrollingRef.current = true;
      const headerOffset = 140;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.scrollY - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      });

      setActiveCategory(categoryId);

      // Reset scrolling flag after animation completes
      setTimeout(() => {
        isScrollingRef.current = false;
      }, 500);
    }
  };

  // Scroll active button into view in the nav
  useEffect(() => {
    if (activeCategory && navRef.current) {
      const activeButton = navRef.current.querySelector(
        `[data-category-id="${activeCategory}"]`
      );
      if (activeButton) {
        activeButton.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'center',
        });
      }
    }
  }, [activeCategory]);

  if (categories.length === 0) return null;

  return (
    <nav
      ref={navRef}
      className="sticky top-[73px] z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b"
    >
      <div className="max-w-2xl mx-auto px-4 py-2">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
          {categories.map((category) => (
            <button
              key={category.id}
              data-category-id={category.id}
              onClick={() => scrollToCategory(category.id)}
              className={cn(
                'px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap flex-shrink-0',
                'transition-all duration-200 touch-feedback',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
                activeCategory === category.id
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground'
              )}
            >
              {getCategoryName(category, locale)}
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
}
