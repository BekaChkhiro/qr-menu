// Animated GIF helpers. Client-safe: no server SDK imports, so both the admin
// uploader and the public menu can use them.
//
// Why these exist: the canvas cropper re-encodes every image as one JPEG frame,
// so a GIF must skip it. next/image's optimizer also keeps only the first frame,
// so GIF URLs must be served unoptimized.

export const GIF_MIME_TYPE = 'image/gif';

export function isGifMimeType(mimeType: string | null | undefined): boolean {
  return mimeType?.toLowerCase() === GIF_MIME_TYPE;
}

/**
 * Stored promotion images keep only their URL, so the check reads the path's
 * extension and ignores any query string or fragment.
 */
export function isGifUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  const path = url.split(/[?#]/, 1)[0];
  return path.toLowerCase().endsWith('.gif');
}
