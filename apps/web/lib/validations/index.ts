// Auth validations
export {
  loginSchema,
  registerSchema,
  type LoginInput,
  type RegisterInput,
} from './auth';

// Menu validations
export {
  createMenuSchema,
  createMenuFromTemplateSchema,
  updateMenuSchema,
  publishMenuSchema,
  menuQuerySchema,
  menuStarterTemplateValues,
  type CreateMenuInput,
  type UpdateMenuInput,
  type PublishMenuInput,
  type MenuQueryInput,
  type MenuStarterTemplateKey,
  type MenuVisibility,
} from './menu';

// Category validations
export {
  createCategorySchema,
  updateCategorySchema,
  reorderCategoriesSchema,
  type CreateCategoryInput,
  type UpdateCategoryInput,
  type ReorderCategoriesInput,
} from './category';

// Product validations
export {
  createProductSchema,
  updateProductSchema,
  reorderProductsSchema,
  productQuerySchema,
  type CreateProductInput,
  type UpdateProductInput,
  type ReorderProductsInput,
  type ProductQueryInput,
} from './product';

// Product variation validations
export {
  createProductVariationSchema,
  updateProductVariationSchema,
  bulkCreateVariationsSchema,
  reorderVariationsSchema,
  type CreateProductVariationInput,
  type UpdateProductVariationInput,
  type BulkCreateVariationsInput,
  type ReorderVariationsInput,
} from './product-variation';

// Promotion validations
export {
  createPromotionSchema,
  updatePromotionSchema,
  reorderPromotionsSchema,
  promotionQuerySchema,
  type CreatePromotionInput,
  type UpdatePromotionInput,
  type ReorderPromotionsInput,
  type PromotionQueryInput,
} from './promotion';

// Upload validations
export {
  uploadMetadataSchema,
  uploadResponseSchema,
  validateFile,
  formatFileSize,
  ALLOWED_MIME_TYPES,
  MAX_FILE_SIZE,
  IMAGE_PRESET_VALUES,
  type UploadMetadata,
  type UploadResponse,
  type AllowedMimeType,
} from './upload';

// User validations
export {
  updateProfileSchema,
  type UpdateProfileInput,
} from './user';

// Analytics validations
export {
  trackViewSchema,
  analyticsQuerySchema,
  analyticsOverviewSchema,
  dailyViewSchema,
  deviceBreakdownSchema,
  browserBreakdownSchema,
  menuAnalyticsSchema,
  type TrackViewInput,
  type AnalyticsQueryInput,
  type AnalyticsOverview,
  type DailyView,
  type DeviceBreakdown,
  type BrowserBreakdown,
  type MenuAnalytics,
} from './analytics';

// Shared Table Sessions validations (Phase 19, PRO)
export {
  createTableSchema,
  joinTableSchema,
  addSelectionSchema,
  type CreateTableInput,
  type JoinTableInput,
  type AddSelectionInput,
} from './table';
