import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

// Image transformation presets
export const IMAGE_PRESETS = {
  product: {
    width: 400,
    height: 400,
    crop: 'fill',
    gravity: 'auto',
    quality: 'auto',
    format: 'auto',
  },
  productThumbnail: {
    width: 150,
    height: 150,
    crop: 'fill',
    gravity: 'auto',
    quality: 'auto',
    format: 'auto',
  },
  promotion: {
    width: 1200,
    height: 600,
    crop: 'fill',
    gravity: 'auto',
    quality: 'auto',
    format: 'auto',
  },
  logo: {
    width: 200,
    height: 200,
    crop: 'limit',
    quality: 'auto',
    format: 'auto',
  },
} as const;

export type ImagePreset = keyof typeof IMAGE_PRESETS;

/**
 * Check if Cloudinary is configured
 */
export function isCloudinaryConfigured(): boolean {
  return !!(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );
}

/**
 * Upload an image to Cloudinary
 */
export async function uploadImage(
  file: Buffer | string,
  options: {
    folder?: string;
    preset?: ImagePreset;
    publicId?: string;
  } = {}
): Promise<{ url: string; publicId: string }> {
  if (!isCloudinaryConfigured()) {
    throw new Error('Cloudinary is not configured');
  }

  const { folder = 'digital-menu', preset = 'product', publicId } = options;
  const transformation = IMAGE_PRESETS[preset];

  const uploadOptions: Record<string, unknown> = {
    folder,
    transformation,
    resource_type: 'image',
  };

  if (publicId) {
    uploadOptions.public_id = publicId;
    uploadOptions.overwrite = true;
  }

  const result = await cloudinary.uploader.upload(
    typeof file === 'string' ? file : `data:image/png;base64,${file.toString('base64')}`,
    uploadOptions
  );

  return {
    url: result.secure_url,
    publicId: result.public_id,
  };
}

/**
 * Delete an image from Cloudinary
 */
export async function deleteImage(publicId: string): Promise<boolean> {
  if (!isCloudinaryConfigured()) {
    console.warn('Cloudinary not configured, skipping delete');
    return false;
  }

  try {
    await cloudinary.uploader.destroy(publicId);
    return true;
  } catch (error) {
    console.error('Failed to delete image:', error);
    return false;
  }
}

/**
 * Generate an optimized image URL with transformations
 */
export function getOptimizedUrl(
  publicId: string,
  preset: ImagePreset = 'product'
): string {
  if (!process.env.CLOUDINARY_CLOUD_NAME) {
    return publicId; // Return as-is if not configured
  }

  const transformation = IMAGE_PRESETS[preset];

  return cloudinary.url(publicId, {
    ...transformation,
    secure: true,
  });
}

/**
 * Extract public ID from Cloudinary URL
 */
export function extractPublicId(url: string): string | null {
  try {
    const match = url.match(/\/v\d+\/(.+)\.\w+$/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

export default cloudinary;
