export type MenuStatus = 'DRAFT' | 'PUBLISHED';

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
  currency: string;
  imageUrl: string | null;
  isAvailable: boolean;
  allergens: string[];
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
