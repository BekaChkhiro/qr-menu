import { S3Client } from '@aws-sdk/client-s3';

/**
 * Cloudflare R2 is S3-compatible. We use the official AWS SDK pointed at
 * R2's `<account-id>.r2.cloudflarestorage.com` endpoint with the bucket-scoped
 * API token (Object Read & Write on the 3D-models bucket only).
 *
 * R2 has no per-asset size limit (vs. Cloudinary free tier's 10 MB cap on
 * raw uploads), so uploading 15 MB+ GLB / USDZ files works without an
 * account upgrade. R2 also has zero egress fees, so serving these models
 * to public-menu visitors is free at any scale.
 */

interface R2Config {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucketName: string;
  publicUrlBase: string;
}

let _config: R2Config | null = null;
let _client: S3Client | null = null;

export function isR2Configured(): boolean {
  return !!(
    process.env.R2_ACCOUNT_ID &&
    process.env.R2_ACCESS_KEY_ID &&
    process.env.R2_SECRET_ACCESS_KEY &&
    process.env.R2_BUCKET_NAME &&
    process.env.R2_PUBLIC_URL_BASE
  );
}

export function getR2Config(): R2Config {
  if (_config) return _config;

  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucketName = process.env.R2_BUCKET_NAME;
  const publicUrlBase = process.env.R2_PUBLIC_URL_BASE;

  if (!accountId || !accessKeyId || !secretAccessKey || !bucketName || !publicUrlBase) {
    throw new Error('Cloudflare R2 is not fully configured');
  }

  _config = {
    accountId,
    accessKeyId,
    secretAccessKey,
    bucketName,
    // Strip trailing slash so we can join with `/<key>` reliably.
    publicUrlBase: publicUrlBase.replace(/\/+$/, ''),
  };
  return _config;
}

export function getR2Client(): S3Client {
  if (_client) return _client;

  const { accountId, accessKeyId, secretAccessKey } = getR2Config();

  _client = new S3Client({
    // R2's S3-compatible endpoint. The signing region must be `auto` per
    // Cloudflare docs — R2 doesn't use AWS regions but the signer requires
    // a non-empty value.
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  });
  return _client;
}

/** Build the public URL for an object given its key. */
export function publicUrlForKey(key: string): string {
  const { publicUrlBase } = getR2Config();
  return `${publicUrlBase}/${key.replace(/^\/+/, '')}`;
}
