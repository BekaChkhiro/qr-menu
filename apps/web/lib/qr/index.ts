import QRCode from 'qrcode';

export type QRFormat = 'png' | 'svg';
export type QRSize = 'small' | 'medium' | 'large';

interface QRSizeConfig {
  width: number;
  margin: number;
}

const SIZE_CONFIG: Record<QRSize, QRSizeConfig> = {
  small: { width: 200, margin: 2 },
  medium: { width: 400, margin: 3 },
  large: { width: 800, margin: 4 },
};

interface GenerateQRCodeOptions {
  url: string;
  format?: QRFormat;
  size?: QRSize;
  darkColor?: string;
  lightColor?: string;
}

/**
 * Generate a QR code as PNG buffer
 */
export async function generateQRCodePNG(
  options: GenerateQRCodeOptions
): Promise<Buffer> {
  const { url, size = 'medium', darkColor = '#000000', lightColor = '#ffffff' } = options;
  const config = SIZE_CONFIG[size];

  const buffer = await QRCode.toBuffer(url, {
    type: 'png',
    width: config.width,
    margin: config.margin,
    color: {
      dark: darkColor,
      light: lightColor,
    },
    errorCorrectionLevel: 'H', // High error correction for better scanning
  });

  return buffer;
}

/**
 * Generate a QR code as SVG string
 */
export async function generateQRCodeSVG(
  options: GenerateQRCodeOptions
): Promise<string> {
  const { url, size = 'medium', darkColor = '#000000', lightColor = '#ffffff' } = options;
  const config = SIZE_CONFIG[size];

  const svg = await QRCode.toString(url, {
    type: 'svg',
    width: config.width,
    margin: config.margin,
    color: {
      dark: darkColor,
      light: lightColor,
    },
    errorCorrectionLevel: 'H',
  });

  return svg;
}

/**
 * Generate a QR code in the specified format
 */
export async function generateQRCode(
  options: GenerateQRCodeOptions
): Promise<{ data: Buffer | string; contentType: string; filename: string }> {
  const { format = 'png', url } = options;

  // Extract slug from URL for filename
  const slugMatch = url.match(/\/m\/([^/?]+)/);
  const slug = slugMatch ? slugMatch[1] : 'menu';
  const size = options.size || 'medium';

  if (format === 'svg') {
    const svg = await generateQRCodeSVG(options);
    return {
      data: svg,
      contentType: 'image/svg+xml',
      filename: `qr-${slug}-${size}.svg`,
    };
  }

  const buffer = await generateQRCodePNG(options);
  return {
    data: buffer,
    contentType: 'image/png',
    filename: `qr-${slug}-${size}.png`,
  };
}

/**
 * Get the public menu URL for a given slug
 */
export function getPublicMenuUrl(slug: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000';
  return `${baseUrl}/m/${slug}`;
}

/**
 * Validate QR code parameters
 */
export function isValidQRFormat(format: string): format is QRFormat {
  return format === 'png' || format === 'svg';
}

export function isValidQRSize(size: string): size is QRSize {
  return size === 'small' || size === 'medium' || size === 'large';
}
