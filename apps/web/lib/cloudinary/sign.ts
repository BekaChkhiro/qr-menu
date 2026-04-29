// Import the configured singleton — this triggers the `cloudinary.config(...)`
// side-effect in `./index.ts`, so callers don't get an "api_secret missing"
// throw at request time when they reach for `api_sign_request`.
import cloudinary from './index';

/**
 * Resolve the Cloudinary credentials we need to mint signed direct-upload
 * payloads. Throws when the environment is missing values — callers should
 * surface a 500 to the client rather than emitting a partial signature.
 */
export function getCloudinaryConfig(): {
  cloudName: string;
  apiKey: string;
  apiSecret: string;
} {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error('Cloudinary is not fully configured');
  }
  return { cloudName, apiKey, apiSecret };
}

/**
 * Sign an arbitrary set of upload params using the configured api_secret.
 * Mirrors `cloudinary.utils.api_sign_request`, but resolves the secret from
 * env so route handlers don't have to.
 */
export function signUploadParams(params: Record<string, string | number>): string {
  const { apiSecret } = getCloudinaryConfig();
  return cloudinary.utils.api_sign_request(params, apiSecret);
}
