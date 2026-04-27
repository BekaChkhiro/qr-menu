import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';
import { prisma } from '@/lib/db';
import {
  generateQRCode,
  getPublicMenuUrl,
  isValidQRFormat,
  isValidQRSize,
  isValidQRStyle,
  type QRFormat,
  type QRSize,
  type QRStyle,
} from '@/lib/qr';
import {
  createErrorResponse,
  handleApiError,
  ERROR_CODES,
} from '@/lib/api';

interface RouteParams {
  params: Promise<{ menuId: string }>;
}

/**
 * GET /api/qr/:menuId
 * Generate a QR code for a menu.
 *
 * Query params:
 * - format: png | svg | pdf (default png)
 * - size: small | medium | large (default medium)
 * - download: true | false
 * - fg / bg: hex overrides (falls back to menu settings)
 * - style: SQUARE | ROUNDED | DOTS (falls back to menu settings)
 * - logo: 'menu' | 'custom' | 'none' (default: 'menu' — use menu.qrLogoUrl)
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return createErrorResponse(
        ERROR_CODES.UNAUTHORIZED,
        'You must be logged in to generate QR codes',
        401
      );
    }

    const { menuId } = await params;
    const { searchParams } = new URL(request.url);

    const formatParam = searchParams.get('format') || 'png';
    const sizeParam = searchParams.get('size') || 'medium';
    const download = searchParams.get('download') === 'true';
    const fgOverride = searchParams.get('fg');
    const bgOverride = searchParams.get('bg');
    const styleOverride = searchParams.get('style');
    const logoMode = searchParams.get('logo') || 'menu';

    if (!isValidQRFormat(formatParam)) {
      return createErrorResponse(ERROR_CODES.VALIDATION_ERROR, 'Invalid format', 400);
    }
    if (!isValidQRSize(sizeParam)) {
      return createErrorResponse(ERROR_CODES.VALIDATION_ERROR, 'Invalid size', 400);
    }
    if (styleOverride && !isValidQRStyle(styleOverride)) {
      return createErrorResponse(ERROR_CODES.VALIDATION_ERROR, 'Invalid style', 400);
    }

    const menu = await prisma.menu.findUnique({
      where: { id: menuId, userId: session.user.id },
      select: {
        id: true,
        slug: true,
        name: true,
        qrStyle: true,
        qrForegroundColor: true,
        qrBackgroundColor: true,
        qrLogoUrl: true,
      },
    });

    if (!menu) {
      return createErrorResponse(ERROR_CODES.MENU_NOT_FOUND, 'Menu not found', 404);
    }

    const publicUrl = getPublicMenuUrl(menu.slug);

    const darkColor =
      (fgOverride && /^#[0-9A-Fa-f]{6}$/.test(fgOverride)
        ? fgOverride
        : menu.qrForegroundColor) || '#000000';
    const lightColor =
      (bgOverride && /^#[0-9A-Fa-f]{6}$/.test(bgOverride)
        ? bgOverride
        : menu.qrBackgroundColor) || '#ffffff';
    const style = (styleOverride as QRStyle | null) || menu.qrStyle || 'SQUARE';

    let logoUrl: string | null = null;
    if (logoMode === 'menu') {
      logoUrl = menu.qrLogoUrl;
    } else if (logoMode.startsWith('http')) {
      // caller passed a direct URL
      logoUrl = logoMode;
    }

    const { data, contentType, filename } = await generateQRCode({
      url: publicUrl,
      format: formatParam as QRFormat,
      size: sizeParam as QRSize,
      darkColor,
      lightColor,
      style,
      logoUrl,
    });

    const headers: Record<string, string> = {
      'Content-Type': contentType,
      'Cache-Control': 'private, max-age=60',
    };

    if (download) {
      headers['Content-Disposition'] = `attachment; filename="${filename}"`;
    }

    if (formatParam === 'svg') {
      return new NextResponse(data as string, { headers });
    }

    return new NextResponse(new Uint8Array(data as Buffer), { headers });
  } catch (error) {
    return handleApiError(error);
  }
}
