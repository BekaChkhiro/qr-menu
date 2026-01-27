import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';
import { prisma } from '@/lib/db';
import {
  generateQRCode,
  getPublicMenuUrl,
  isValidQRFormat,
  isValidQRSize,
  type QRFormat,
  type QRSize,
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
 * Generate a QR code for a menu
 *
 * Query parameters:
 * - format: 'png' | 'svg' (default: 'png')
 * - size: 'small' | 'medium' | 'large' (default: 'medium')
 * - download: 'true' | 'false' (default: 'false') - triggers download with Content-Disposition
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

    // Parse query parameters
    const formatParam = searchParams.get('format') || 'png';
    const sizeParam = searchParams.get('size') || 'medium';
    const download = searchParams.get('download') === 'true';

    // Validate format
    if (!isValidQRFormat(formatParam)) {
      return createErrorResponse(
        ERROR_CODES.VALIDATION_ERROR,
        'Invalid format. Must be "png" or "svg"',
        400
      );
    }

    // Validate size
    if (!isValidQRSize(sizeParam)) {
      return createErrorResponse(
        ERROR_CODES.VALIDATION_ERROR,
        'Invalid size. Must be "small", "medium", or "large"',
        400
      );
    }

    const format: QRFormat = formatParam;
    const size: QRSize = sizeParam;

    // Fetch menu and verify ownership
    const menu = await prisma.menu.findUnique({
      where: {
        id: menuId,
        userId: session.user.id,
      },
      select: {
        id: true,
        slug: true,
        name: true,
      },
    });

    if (!menu) {
      return createErrorResponse(
        ERROR_CODES.MENU_NOT_FOUND,
        'Menu not found',
        404
      );
    }

    // Generate the public URL for this menu
    const publicUrl = getPublicMenuUrl(menu.slug);

    // Generate the QR code
    const { data, contentType, filename } = await generateQRCode({
      url: publicUrl,
      format,
      size,
    });

    // Create response headers
    const headers: Record<string, string> = {
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
    };

    // Add download header if requested
    if (download) {
      headers['Content-Disposition'] = `attachment; filename="${filename}"`;
    }

    // Return the QR code
    if (format === 'svg') {
      return new NextResponse(data as string, { headers });
    }

    // Convert Buffer to Uint8Array for NextResponse compatibility
    return new NextResponse(new Uint8Array(data as Buffer), { headers });
  } catch (error) {
    return handleApiError(error);
  }
}
