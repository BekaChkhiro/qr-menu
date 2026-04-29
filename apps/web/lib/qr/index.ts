import QRCode from 'qrcode';
import sharp from 'sharp';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

export type QRFormat = 'png' | 'svg' | 'pdf';
export type QRSize = 'small' | 'medium' | 'large';
export type QRStyle = 'SQUARE' | 'ROUNDED' | 'DOTS';
export type QRTemplate =
  | 'tent-A4'
  | 'poster-A3'
  | 'tent-min'
  | 'receipt'
  | 'decal'
  | 'booklet';

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
  /** `null` or `'transparent'` for no background. */
  lightColor?: string | null;
  style?: QRStyle;
  logoUrl?: string | null;
  /** PDF-only — show URL line below the code. */
  includeUrl?: boolean;
  /** PDF-only — show "SCAN TO VIEW MENU" caption above the code. */
  includeCta?: boolean;
  /** Print template variant — controls PDF page size and layout. */
  template?: QRTemplate;
  /** Display name for the menu (used in some templates). */
  menuName?: string;
}

function isTransparent(color: string | null | undefined): boolean {
  return color == null || color === 'transparent';
}

/** Hex string used by `qrcode` for transparency. */
function effectiveLightForQrcode(color: string | null | undefined): string {
  return isTransparent(color) ? '#FFFFFF00' : (color as string);
}

/**
 * Generate QR SVG — supports per-module dots/rounded, optional logo, transparent bg.
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
    logoUrl,
  } = options;
  const config = SIZE_CONFIG[size];
  const transparent = isTransparent(lightColor);

  // For SQUARE without a logo, defer to qrcode's built-in renderer.
  if (style === 'SQUARE' && !logoUrl) {
    return QRCode.toString(url, {
      type: 'svg',
      width: config.width,
      margin: config.margin,
      color: {
        dark: darkColor,
        light: transparent ? '#FFFFFF00' : (lightColor as string),
      },
      errorCorrectionLevel: 'H',
    });
  }

  const qr = QRCode.create(url, { errorCorrectionLevel: 'H' });
  const modules = qr.modules;
  const moduleCount = modules.size;
  const totalSize = moduleCount + config.margin * 2;
  const cellSize = config.width / totalSize;

  // Compute logo cut-out region (white plate behind logo).
  const logoBoxSize = logoUrl ? Math.round(config.width * 0.22) : 0;
  const logoPadding = logoUrl ? Math.round(logoBoxSize * 0.08) : 0;
  const plateSize = logoBoxSize + logoPadding * 2;
  const plateX = (config.width - plateSize) / 2;
  const plateY = (config.width - plateSize) / 2;
  const logoX = plateX + logoPadding;
  const logoY = plateY + logoPadding;

  const inLogoArea = (modX: number, modY: number, cell: number): boolean => {
    if (!logoUrl) return false;
    const cx = modX + cell / 2;
    const cy = modY + cell / 2;
    return (
      cx >= plateX &&
      cx <= plateX + plateSize &&
      cy >= plateY &&
      cy <= plateY + plateSize
    );
  };

  let cells = '';
  for (let y = 0; y < moduleCount; y++) {
    for (let x = 0; x < moduleCount; x++) {
      if (!modules.get(x, y)) continue;
      const cx = (x + config.margin) * cellSize;
      const cy = (y + config.margin) * cellSize;
      if (inLogoArea(cx, cy, cellSize)) continue;

      if (style === 'DOTS') {
        cells += `<circle cx="${cx + cellSize / 2}" cy="${cy + cellSize / 2}" r="${cellSize / 2}" fill="${darkColor}"/>`;
      } else if (style === 'ROUNDED') {
        cells += `<rect x="${cx}" y="${cy}" width="${cellSize}" height="${cellSize}" rx="${cellSize * 0.3}" fill="${darkColor}"/>`;
      } else {
        cells += `<rect x="${cx}" y="${cy}" width="${cellSize}" height="${cellSize}" fill="${darkColor}"/>`;
      }
    }
  }

  const bgRect = transparent
    ? ''
    : `<rect width="100%" height="100%" fill="${lightColor}"/>`;

  let logoMarkup = '';
  if (logoUrl) {
    logoMarkup +=
      `<rect x="${plateX}" y="${plateY}" width="${plateSize}" height="${plateSize}" rx="${cellSize * 0.6}" fill="#FFFFFF"/>` +
      `<image href="${escapeXml(logoUrl)}" x="${logoX}" y="${logoY}" width="${logoBoxSize}" height="${logoBoxSize}" preserveAspectRatio="xMidYMid meet"/>`;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${config.width}" height="${config.width}" viewBox="0 0 ${config.width} ${config.width}" shape-rendering="geometricPrecision">${bgRect}${cells}${logoMarkup}</svg>`;
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
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
      color: {
        dark: darkColor,
        light: effectiveLightForQrcode(lightColor),
      },
      errorCorrectionLevel: 'H',
    });
  } else {
    const svg = await generateQRCodeSVG({
      url,
      size,
      darkColor,
      lightColor,
      style,
      // Skip logo here — sharp composites it after rasterization.
      logoUrl: null,
    });
    qrBuffer = await sharp(Buffer.from(svg)).png().toBuffer();
  }

  if (logoUrl) {
    try {
      const logoResponse = await fetch(logoUrl);
      if (logoResponse.ok) {
        const logoArrayBuffer = await logoResponse.arrayBuffer();
        const logoBuffer = Buffer.from(logoArrayBuffer);

        const logoSize = Math.round(config.width * 0.22);
        const logoPadding = Math.round(logoSize * 0.08);
        const whiteBoxSize = logoSize + logoPadding * 2;

        const resizedLogo = await sharp(logoBuffer)
          .resize(logoSize, logoSize, {
            fit: 'contain',
            background: { r: 255, g: 255, b: 255, alpha: 1 },
          })
          .png()
          .toBuffer();

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

interface PageDef {
  /** Width in PDF points (72pt = 1 inch). */
  width: number;
  height: number;
}

const PAGE_SIZES: Record<QRTemplate, PageDef> = {
  // A4 portrait
  'tent-A4': { width: 595.28, height: 841.89 },
  // A3 portrait
  'poster-A3': { width: 841.89, height: 1190.55 },
  // A5 portrait — minimal tent card
  'tent-min': { width: 419.53, height: 595.28 },
  // 80mm receipt: 80mm × 150mm → 226.77 × 425.2 pt
  receipt: { width: 226.77, height: 425.2 },
  // Square decal: 100mm × 100mm
  decal: { width: 283.46, height: 283.46 },
  // A5 booklet cover
  booklet: { width: 419.53, height: 595.28 },
};

/**
 * Generate a print-ready PDF. Layout depends on `template`.
 */
export async function generateQRCodePDF(
  options: GenerateQRCodeOptions
): Promise<Buffer> {
  const {
    url,
    includeUrl = true,
    includeCta = true,
    template = 'tent-A4',
    menuName,
  } = options;

  // Force opaque background — printed PDFs need white behind the QR.
  const qrBuffer = await generateQRCodePNG({
    ...options,
    lightColor: isTransparent(options.lightColor) ? '#FFFFFF' : options.lightColor,
  });

  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([
    PAGE_SIZES[template].width,
    PAGE_SIZES[template].height,
  ]);
  const { width: pageW, height: pageH } = page.getSize();

  const sansBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const sans = await pdfDoc.embedFont(StandardFonts.Helvetica);

  const qrImage = await pdfDoc.embedPng(qrBuffer);

  // Margin and QR scale per template.
  const layout = computeLayout(template, pageW, pageH, qrImage.width);

  // Optional CTA caption above the QR.
  if (includeCta && layout.ctaSize > 0) {
    const ctaText = template === 'receipt' ? 'Rate your visit' : 'SCAN TO VIEW MENU';
    const ctaWidth = sansBold.widthOfTextAtSize(ctaText, layout.ctaSize);
    page.drawText(ctaText, {
      x: (pageW - ctaWidth) / 2,
      y: layout.ctaY,
      size: layout.ctaSize,
      font: sansBold,
      color: rgb(0.094, 0.094, 0.106), // text-default
    });
  }

  // The QR.
  page.drawImage(qrImage, {
    x: layout.qrX,
    y: layout.qrY,
    width: layout.qrSize,
    height: layout.qrSize,
  });

  // Optional menu name (used in tent variants).
  if (menuName && layout.nameSize > 0) {
    const nameWidth = sansBold.widthOfTextAtSize(menuName, layout.nameSize);
    page.drawText(menuName, {
      x: (pageW - nameWidth) / 2,
      y: layout.nameY,
      size: layout.nameSize,
      font: sansBold,
      color: rgb(0.094, 0.094, 0.106),
    });
  }

  // Optional URL line below the QR.
  if (includeUrl && layout.urlSize > 0) {
    const cleanUrl = url.replace(/^https?:\/\//, '');
    const urlWidth = sans.widthOfTextAtSize(cleanUrl, layout.urlSize);
    page.drawText(cleanUrl, {
      x: (pageW - urlWidth) / 2,
      y: layout.urlY,
      size: layout.urlSize,
      font: sans,
      color: rgb(0.443, 0.443, 0.478), // text-muted
    });
  }

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}

interface PdfLayout {
  qrX: number;
  qrY: number;
  qrSize: number;
  ctaY: number;
  ctaSize: number;
  urlY: number;
  urlSize: number;
  nameY: number;
  nameSize: number;
}

/** Compute placement of the QR + caption + URL inside the chosen page. */
function computeLayout(
  template: QRTemplate,
  pageW: number,
  pageH: number,
  qrPxWidth: number
): PdfLayout {
  // Default tent A4
  const defaults = {
    qrFraction: 0.55,
    ctaSize: 18,
    nameSize: 0,
    urlSize: 11,
    gap: 24,
  };

  const cfg: typeof defaults & { nameSize: number } = (() => {
    switch (template) {
      case 'poster-A3':
        return { qrFraction: 0.45, ctaSize: 36, nameSize: 0, urlSize: 18, gap: 60 };
      case 'tent-min':
        return { qrFraction: 0.6, ctaSize: 14, nameSize: 0, urlSize: 9, gap: 16 };
      case 'receipt':
        return { qrFraction: 0.7, ctaSize: 13, nameSize: 0, urlSize: 8, gap: 12 };
      case 'decal':
        return { qrFraction: 0.6, ctaSize: 0, nameSize: 0, urlSize: 0, gap: 0 };
      case 'booklet':
        return { qrFraction: 0.4, ctaSize: 12, nameSize: 14, urlSize: 9, gap: 14 };
      case 'tent-A4':
      default:
        return defaults;
    }
  })();

  const maxDim = Math.min(pageW, pageH);
  const qrSize = Math.min(qrPxWidth, maxDim * cfg.qrFraction);
  const qrX = (pageW - qrSize) / 2;
  const qrY = (pageH - qrSize) / 2;

  const ctaY = qrY + qrSize + cfg.gap;
  const urlY = qrY - cfg.gap;
  const nameY = urlY - cfg.gap;

  return {
    qrX,
    qrY,
    qrSize,
    ctaY,
    ctaSize: cfg.ctaSize,
    urlY,
    urlSize: cfg.urlSize,
    nameY,
    nameSize: cfg.nameSize,
  };
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

  if (format === 'pdf') {
    const buffer = await generateQRCodePDF(options);
    const tplSuffix = options.template ? `-${options.template}` : '';
    return {
      data: buffer,
      contentType: 'application/pdf',
      filename: `qr-${slug}${tplSuffix}-${size}.pdf`,
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
  return format === 'png' || format === 'svg' || format === 'pdf';
}

export function isValidQRSize(size: string): size is QRSize {
  return size === 'small' || size === 'medium' || size === 'large';
}

export function isValidQRStyle(style: string): style is QRStyle {
  return style === 'SQUARE' || style === 'ROUNDED' || style === 'DOTS';
}

export function isValidQRTemplate(t: string): t is QRTemplate {
  return (
    t === 'tent-A4' ||
    t === 'poster-A3' ||
    t === 'tent-min' ||
    t === 'receipt' ||
    t === 'decal' ||
    t === 'booklet'
  );
}
