import type { MenuStarterTemplateKey } from '@/lib/validations/menu';

// Prisma enum values. We avoid importing from @prisma/client at the top of
// this module so it can be shared with client components that reference
// `MENU_STARTER_TEMPLATES` for display-only metadata (counts, labels).
type CategoryTypeValue = 'FOOD' | 'DRINK' | 'OTHER';

export interface TemplateProductSeed {
  nameKa: string;
  nameEn: string;
  descriptionKa?: string;
  descriptionEn?: string;
  priceGEL: number;
}

export interface TemplateCategorySeed {
  nameKa: string;
  nameEn: string;
  type: CategoryTypeValue;
  products: TemplateProductSeed[];
}

export interface MenuStarterTemplate {
  id: MenuStarterTemplateKey;
  /** Used to pick the gradient tone so the template card and the resulting menu card feel consistent. */
  tone: 'a' | 'b' | 'c';
  defaults: {
    nameKa: string;
    nameEn: string;
    slugBase: string; // lowercase, hyphenated, ≤20 chars
  };
  categories: TemplateCategorySeed[];
}

// Preset seed data — kept to 3 categories × ≤5 products so every template fits
// within FREE plan limits (3 cats / 15 products). Real Georgian names per
// CLAUDE.md non-negotiables.

export const MENU_STARTER_TEMPLATES: Record<
  MenuStarterTemplateKey,
  MenuStarterTemplate
> = {
  'cafe-bakery': {
    id: 'cafe-bakery',
    tone: 'a',
    defaults: {
      nameKa: 'კაფე-საცხობი',
      nameEn: 'Café & bakery',
      slugBase: 'cafe-bakery',
    },
    categories: [
      {
        nameKa: 'ცხელი სასმელები',
        nameEn: 'Hot drinks',
        type: 'DRINK',
        products: [
          {
            nameKa: 'ესპრესო',
            nameEn: 'Espresso',
            descriptionKa: 'ერთმაგი შოტი, 30 მლ',
            descriptionEn: 'Single shot, 30 ml',
            priceGEL: 4,
          },
          {
            nameKa: 'ამერიკანო',
            nameEn: 'Americano',
            priceGEL: 5,
          },
          {
            nameKa: 'კაპუჩინო',
            nameEn: 'Cappuccino',
            priceGEL: 7,
          },
          {
            nameKa: 'ლატე',
            nameEn: 'Latte',
            priceGEL: 8,
          },
        ],
      },
      {
        nameKa: 'გამომცხვარი',
        nameEn: 'Pastries',
        type: 'FOOD',
        products: [
          {
            nameKa: 'ხაჭაპური აჭარული',
            nameEn: 'Adjaruli Khachapuri',
            descriptionKa: 'კვერცხით და კარაქით',
            descriptionEn: 'With egg and butter',
            priceGEL: 16,
          },
          {
            nameKa: 'ყველიანი კრუასანი',
            nameEn: 'Cheese croissant',
            priceGEL: 9,
          },
          {
            nameKa: 'შოკოლადის მაფინი',
            nameEn: 'Chocolate muffin',
            priceGEL: 7,
          },
          {
            nameKa: 'ჩურჩხელა',
            nameEn: 'Churchkhela',
            descriptionKa: 'ტრადიციული ქართული ტკბილეული',
            descriptionEn: 'Traditional Georgian sweet',
            priceGEL: 5,
          },
        ],
      },
      {
        nameKa: 'საუზმე',
        nameEn: 'Breakfast',
        type: 'FOOD',
        products: [
          {
            nameKa: 'ავოკადოს ტოსტი',
            nameEn: 'Avocado toast',
            priceGEL: 14,
          },
          {
            nameKa: 'ომლეტი ბოსტნეულით',
            nameEn: 'Veggie omelette',
            priceGEL: 12,
          },
          {
            nameKa: 'იოგურტი ხილით',
            nameEn: 'Yogurt bowl',
            descriptionKa: 'სეზონური ხილი და თაფლი',
            descriptionEn: 'Seasonal fruit and honey',
            priceGEL: 11,
          },
        ],
      },
    ],
  },
  'full-restaurant': {
    id: 'full-restaurant',
    tone: 'b',
    defaults: {
      nameKa: 'სრული რესტორანი',
      nameEn: 'Full restaurant',
      slugBase: 'restaurant',
    },
    categories: [
      {
        nameKa: 'ცივი კერძები',
        nameEn: 'Starters',
        type: 'FOOD',
        products: [
          {
            nameKa: 'ბადრიჯანი ნიგვზით',
            nameEn: 'Eggplant with walnut',
            priceGEL: 14,
          },
          {
            nameKa: 'ფხალი',
            nameEn: 'Pkhali platter',
            descriptionKa: 'ტრიო: ისპანახის, ჭარხლის, ჭარხლის ფოთლის',
            descriptionEn: 'Spinach, beetroot and beet-leaf trio',
            priceGEL: 18,
          },
          {
            nameKa: 'ცეზარი ქათმით',
            nameEn: 'Chicken Caesar salad',
            priceGEL: 19,
          },
          {
            nameKa: 'კაპრეზე',
            nameEn: 'Caprese',
            priceGEL: 21,
          },
        ],
      },
      {
        nameKa: 'ძირითადი კერძები',
        nameEn: 'Mains',
        type: 'FOOD',
        products: [
          {
            nameKa: 'ხინკალი',
            nameEn: 'Khinkali (5 pcs)',
            descriptionKa: 'საქონლის და ღორის ხორცით',
            descriptionEn: 'Beef and pork filling',
            priceGEL: 12,
          },
          {
            nameKa: 'ჩაქაფული',
            nameEn: 'Chakapuli',
            descriptionKa: 'ცხვრის ხორცი ტარხუნით',
            descriptionEn: 'Lamb stew with tarragon',
            priceGEL: 32,
          },
          {
            nameKa: 'შაშლიკი ღორის',
            nameEn: 'Pork shashlik',
            priceGEL: 28,
          },
          {
            nameKa: 'კარტოფილი ფრი',
            nameEn: 'French fries',
            priceGEL: 9,
          },
          {
            nameKa: 'ლობიო ქოთანში',
            nameEn: 'Bean pot (lobio)',
            priceGEL: 14,
          },
        ],
      },
      {
        nameKa: 'დესერტები',
        nameEn: 'Desserts',
        type: 'FOOD',
        products: [
          {
            nameKa: 'ნაფოტები',
            nameEn: 'Napoleon cake',
            priceGEL: 11,
          },
          {
            nameKa: 'ტირამისუ',
            nameEn: 'Tiramisu',
            priceGEL: 13,
          },
          {
            nameKa: 'პახლავა',
            nameEn: 'Pakhlava',
            priceGEL: 9,
          },
        ],
      },
    ],
  },
  'bar-cocktails': {
    id: 'bar-cocktails',
    tone: 'c',
    defaults: {
      nameKa: 'ბარი და კოქტეილები',
      nameEn: 'Bar & cocktails',
      slugBase: 'bar-cocktails',
    },
    categories: [
      {
        nameKa: 'ღვინო',
        nameEn: 'Wine',
        type: 'DRINK',
        products: [
          {
            nameKa: 'საფერავი, ქვევრი',
            nameEn: 'Saperavi, qvevri',
            descriptionKa: 'კახეთი · 2022',
            descriptionEn: 'Kakheti · 2022',
            priceGEL: 18,
          },
          {
            nameKa: 'რქაწითელი',
            nameEn: 'Rkatsiteli',
            priceGEL: 15,
          },
          {
            nameKa: 'ხიხვი, ქარვისფერი',
            nameEn: 'Khikhvi, amber',
            priceGEL: 22,
          },
          {
            nameKa: 'ქინძმარაული',
            nameEn: 'Kindzmarauli',
            priceGEL: 17,
          },
        ],
      },
      {
        nameKa: 'ძლიერი სასმელები',
        nameEn: 'Spirits',
        type: 'DRINK',
        products: [
          {
            nameKa: 'ჭაჭა',
            nameEn: 'Chacha',
            priceGEL: 8,
          },
          {
            nameKa: 'ჯინი ტონიკით',
            nameEn: 'Gin & tonic',
            priceGEL: 16,
          },
          {
            nameKa: 'უისკი, 40 მლ',
            nameEn: 'Whisky, 40 ml',
            priceGEL: 19,
          },
          {
            nameKa: 'ნეგრონი',
            nameEn: 'Negroni',
            priceGEL: 18,
          },
        ],
      },
      {
        nameKa: 'ხელნაკეთი კოქტეილები',
        nameEn: 'Signature cocktails',
        type: 'DRINK',
        products: [
          {
            nameKa: 'თარხუნის მოხიტო',
            nameEn: 'Tarragon mojito',
            descriptionKa: 'რომი · თარხუნი · ლიმონი',
            descriptionEn: 'Rum · tarragon · lime',
            priceGEL: 22,
          },
          {
            nameKa: 'ქართული სპრიცი',
            nameEn: 'Georgian spritz',
            priceGEL: 21,
          },
          {
            nameKa: 'ყურძნის სოური',
            nameEn: 'Grape sour',
            priceGEL: 24,
          },
          {
            nameKa: 'ესპრესო მარტინი',
            nameEn: 'Espresso martini',
            priceGEL: 23,
          },
        ],
      },
    ],
  },
};

/** Convenience accessors for the UI layer. */
export function getStarterTemplate(
  id: MenuStarterTemplateKey,
): MenuStarterTemplate {
  return MENU_STARTER_TEMPLATES[id];
}

export function listStarterTemplates(): MenuStarterTemplate[] {
  return [
    MENU_STARTER_TEMPLATES['cafe-bakery'],
    MENU_STARTER_TEMPLATES['full-restaurant'],
    MENU_STARTER_TEMPLATES['bar-cocktails'],
  ];
}

export function countTemplateItems(tpl: MenuStarterTemplate): number {
  return tpl.categories.reduce((sum, c) => sum + c.products.length, 0);
}
