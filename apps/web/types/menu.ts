export type MenuStatus = 'DRAFT' | 'PUBLISHED';
export type Language = 'KA' | 'EN' | 'RU';
export type AllergenDisplay = 'TEXT' | 'ICON' | 'WARNING';
export type CaloriesDisplay = 'DIRECT' | 'FLIP_REVEAL' | 'HIDDEN';
export type QrStyle = 'SQUARE' | 'ROUNDED' | 'DOTS';
export type CategoryType = 'FOOD' | 'DRINK' | 'OTHER';
export type MenuLayout = 'LINEAR' | 'CATEGORIES_FIRST';
export type MenuTemplate = 'CLASSIC' | 'MAGAZINE' | 'COMPACT';
export type ProductCardStyle = 'FLAT' | 'BORDERED' | 'ELEVATED' | 'MINIMAL';
export type ProductTouchEffect = 'NONE' | 'SCALE' | 'GLOW' | 'GRADIENT';

export type Allergen =
  | 'GLUTEN'
  | 'DAIRY'
  | 'EGGS'
  | 'NUTS'
  | 'PEANUTS'
  | 'SEAFOOD'
  | 'FISH'
  | 'SHELLFISH'
  | 'SOY'
  | 'PORK'
  | 'SESAME'
  | 'MUSTARD'
  | 'CELERY'
  | 'LUPIN'
  | 'SULPHITES';

export type Ribbon =
  | 'POPULAR'
  | 'CHEF_CHOICE'
  | 'DAILY_DISH'
  | 'NEW'
  | 'SPICY';

export interface Menu {
  id: string;
  userId: string;
  name: string;
  slug: string;
  description: string | null;
  status: MenuStatus;
  publishedAt: string | null;
  logoUrl: string | null;
  primaryColor: string | null;
  accentColor: string | null;
  currencySymbol: string | null;

  // Typography
  headingFont: string | null;
  bodyFont: string | null;

  // Language config
  enabledLanguages: Language[];

  // Display settings
  allergenDisplay: AllergenDisplay;
  caloriesDisplay: CaloriesDisplay;
  showNutrition: boolean;
  showDiscount: boolean;

  // Layout & visual style
  splitByType: boolean;
  menuLayout: MenuLayout;
  menuTemplate: MenuTemplate;
  productCardStyle: ProductCardStyle;
  productTouchEffect: ProductTouchEffect;

  // Header info
  address: string | null;
  phone: string | null;
  wifiSsid: string | null;
  wifiPassword: string | null;
  wcDirection: string | null;
  wcImageUrl: string | null;
  locationLat: number | null;
  locationLng: number | null;

  // QR design
  qrStyle: QrStyle;
  qrForegroundColor: string | null;
  qrBackgroundColor: string | null;
  qrLogoUrl: string | null;
  qrTemplate: string | null;

  createdAt: string;
  updatedAt: string;
  _count: {
    categories: number;
    views: number;
  };
}

export interface MenuWithDetails extends Menu {
  categories: Category[];
  promotions: Promotion[];
}

export interface Category {
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
  type: CategoryType;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  products?: Product[];
  _count?: {
    products: number;
  };
}

export interface Product {
  id: string;
  categoryId: string;
  nameKa: string;
  nameEn: string | null;
  nameRu: string | null;
  descriptionKa: string | null;
  descriptionEn: string | null;
  descriptionRu: string | null;
  price: number;
  oldPrice: number | null;
  currency: string;
  imageUrl: string | null;
  imageFocalX: number | null;
  imageFocalY: number | null;
  imageZoom: number | null;
  isAvailable: boolean;
  allergens: Allergen[];
  ribbons: Ribbon[];
  isVegan: boolean;
  isVegetarian: boolean;
  calories: number | null;
  protein: number | null;
  fats: number | null;
  carbs: number | null;
  fiber: number | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  variations: ProductVariation[];
}

export interface ProductVariation {
  id: string;
  productId: string;
  nameKa: string;
  nameEn: string | null;
  nameRu: string | null;
  price: number;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface Promotion {
  id: string;
  menuId: string;
  titleKa: string;
  titleEn: string | null;
  titleRu: string | null;
  descriptionKa: string | null;
  descriptionEn: string | null;
  descriptionRu: string | null;
  imageUrl: string | null;
  startDate: string;
  endDate: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface MenuFilters {
  status?: MenuStatus;
  page?: number;
  limit?: number;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedMenus {
  data: Menu[];
  pagination: PaginationInfo;
}
