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
  updateMenuSchema,
  publishMenuSchema,
  menuQuerySchema,
  type CreateMenuInput,
  type UpdateMenuInput,
  type PublishMenuInput,
  type MenuQueryInput,
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
  promotionQuerySchema,
  type CreatePromotionInput,
  type UpdatePromotionInput,
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
