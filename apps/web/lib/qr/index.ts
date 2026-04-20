import QRCode from 'qrcode';
import sharp from 'sharp';

export type QRFormat = 'png' | 'svg';
export type QRSize = 'small' | 'medium' | 'large';
export type QRStyle = 'SQUARE' | 'ROUNDED' | 'DOTS';

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
  style?: QRStyle;
  logoUrl?: string | null;
}

/**
 * Apply a style transform to a raw QR SVG.
 * - SQUARE: no-op
 * - ROUNDED: rx=".3" on rect
 * - DOTS: replace <rect> with <circle>
 */
function applySvgStyle(svg: string, style: QRStyle): string {
  if (style === 'SQUARE') return svg;

  if (style === 'ROUNDED') {
    // qrcode lib emits one big <path> of squares, not per-module rects.
    // So we fall back to generating per-cell output via `toString` with modules.
    return svg;
  }

  // DOTS handled by generateQRCodeSVG with per-module conversion
  return svg;
}

/**
 * Generate QR SVG — supports per-module dots/rounded via manual rendering.
 */
export async function generateQRCodeSVG(
  options: GenerateQRCodeOptions
): Promise<string> {
  const {
    url,
    size = 'medium',
    darkColor = '#000000',
    lightColor = '#ffffff',
    style = 'SQUARE',
  } = options;
  const config = SIZE_CONFIG[size];

  if (style === 'SQUARE') {
    return QRCode.toString(url, {
      type: 'svg',
      width: config.width,
      margin: config.margin,
      color: { dark: darkColor, light: lightColor },
      errorCorrectionLevel: 'H',
    });
  }

  // For DOTS/ROUNDED, render cells manually
  const qr = QRCode.create(url, { errorCorrectionLevel: 'H' });
  const modules = qr.modules;
  const moduleCount = modules.size;
  const totalSize = moduleCount + config.margin * 2;
  const cellSize = config.width / totalSize;

  let cells = '';
  for (let y = 0; y < moduleCount; y++) {
    for (let x = 0; x < moduleCount; x++) {
      if (modules.get(x, y)) {
        const cx = (x + config.margin) * cellSize;
        const cy = (y + config.margin) * cellSize;
        if (style === 'DOTS') {
          cells += `<circle cx="${cx + cellSize / 2}" cy="${cy + cellSize / 2}" r="${cellSize / 2}" fill="${darkColor}"/>`;
        } else if (style === 'ROUNDED') {
          cells += `<rect x="${cx}" y="${cy}" width="${cellSize}" height="${cellSize}" rx="${cellSize * 0.3}" fill="${darkColor}"/>`;
        }
      }
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${config.width}" height="${config.width}" viewBox="0 0 ${config.width} ${config.width}" shape-rendering="geometricPrecision"><rect width="100%" height="100%" fill="${lightColor}"/>${cells}</svg>`;
}

/**
 * Generate QR PNG — optionally composites a logo in the center.
 */
export async function generateQRCodePNG(
  options: GenerateQRCodeOptions
): Promise<Buffer> {
  const {
    url,
    size = 'medium',
    darkColor = '#000000',
    lightColor = '#ffffff',
    style = 'SQUARE',
    logoUrl,
  } = options;
  const config = SIZE_CONFIG[size];

  let qrBuffer: Buffer;

  if (style === 'SQUARE') {
    qrBuffer = await QRCode.toBuffer(url, {
      type: 'png',
      width: config.width,
      margin: config.margin,
      color: { dark: darkColor, light: lightColor },
      errorCorrectionLevel: 'H',
    });
  } else {
    // Render styled SVG then rasterize via sharp
    const svg = await generateQRCodeSVG(options);
    qrBuffer = await sharp(Buffer.from(svg)).png().toBuffer();
  }

  // Composite logo if provided
  if (logoUrl) {
    try {
      const logoResponse = await fetch(logoUrl);
      if (logoResponse.ok) {
        const logoArrayBuffer = await logoResponse.arrayBuffer();
        const logoBuffer = Buffer.from(logoArrayBuffer);

        const logoSize = Math.round(config.width * 0.22);
        const logoPadding = Math.round(logoSize * 0.08);
        const whiteBoxSize = logoSize + logoPadding * 2;

        // Resize logo to target size
        const resizedLogo = await sharp(logoBuffer)
          .resize(logoSize, logoSize, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
          .png()
          .toBuffer();

        // White background square behind logo (improves scan reliability)
        const whiteBox = await sharp({
          create: {
            width: whiteBoxSize,
            height: whiteBoxSize,
            channels: 4,
            background: { r: 255, g: 255, b: 255, alpha: 1 },
          },
        })
          .png()
          .toBuffer();

        const offset = Math.round((config.width - whiteBoxSize) / 2);
        const logoOffset = offset + logoPadding;

        qrBuffer = await sharp(qrBuffer)
          .composite([
            { input: whiteBox, top: offset, left: offset },
            { input: resizedLogo, top: logoOffset, left: logoOffset },
          ])
          .png()
          .toBuffer();
      }
    } catch (err) {
      console.error('QR logo composition failed:', err);
    }
  }

  return qrBuffer;
}

/**
 * Generate a QR code in the specified format.
 */
export async function generateQRCode(
  options: GenerateQRCodeOptions
): Promise<{ data: Buffer | string; contentType: string; filename: string }> {
  const { format = 'png', url } = options;

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

export function getPublicMenuUrl(slug: string): string {
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXTAUTH_URL ||
    'http://localhost:3000';
  return `${baseUrl}/m/${slug}`;
}

export function isValidQRFormat(format: string): format is QRFormat {
  return format === 'png' || format === 'svg';
}

export function isValidQRSize(size: string): size is QRSize {
  return size === 'small' || size === 'medium' || size === 'large';
}

export function isValidQRStyle(style: string): style is QRStyle {
  return style === 'SQUARE' || style === 'ROUNDED' || style === 'DOTS';
}
