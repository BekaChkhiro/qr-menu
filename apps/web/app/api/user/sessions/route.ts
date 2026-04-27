import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth/auth';
import { prisma } from '@/lib/db';
import {
  handleApiError,
  createSuccessResponse,
  createErrorResponse,
  ERROR_CODES,
} from '@/lib/api';

export interface SessionItem {
  id: string;
  device: string;
  browser: string;
  location: string;
  lastActive: string;
  isCurrent: boolean;
}

function parseUserAgent(ua: string | null): { device: string; browser: string } {
  if (!ua) return { device: 'Unknown device', browser: 'Unknown browser' };

  const browserMatch = ua.match(/(Chrome|Safari|Firefox|Edge|Opera)\/(\d+)/);
  const browser = browserMatch
    ? `${browserMatch[1]} ${browserMatch[2]}`
    : 'Web browser';

  let device = 'Computer';
  if (/iPhone|iPod/.test(ua)) device = 'iPhone';
  else if (/iPad/.test(ua)) device = 'iPad';
  else if (/Android.*Mobile/.test(ua)) device = 'Android phone';
  else if (/Android/.test(ua)) device = 'Android tablet';
  else if (/Macintosh|Mac OS X/.test(ua)) device = 'Mac';
  else if (/Windows/.test(ua)) device = 'Windows PC';
  else if (/Linux/.test(ua)) device = 'Linux PC';

  return { device, browser };
}

function formatLastActive(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return 'Active now';
  if (diffMins < 60) return `${diffMins} minute${diffMins === 1 ? '' : 's'} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
  if (diffDays < 30) return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
  return date.toLocaleDateString('en-GB', { month: 'short', day: 'numeric' });
}

/**
 * GET /api/user/sessions
 * Returns active sessions for the signed-in user.
 * Includes the current session (inferred from User-Agent) plus any DB sessions.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return createErrorResponse(
        ERROR_CODES.UNAUTHORIZED,
        'You must be logged in to view sessions',
        401
      );
    }

    const userAgent = request.headers.get('user-agent');
    const { device, browser } = parseUserAgent(userAgent);

    const currentSession: SessionItem = {
      id: 'current',
      device,
      browser,
      location: 'Tbilisi, GE',
      lastActive: 'Active now',
      isCurrent: true,
    };

    // Fetch any database sessions for this user
    const dbSessions = await prisma.session.findMany({
      where: { userId: session.user.id },
      orderBy: { expires: 'desc' },
    });

    const mappedDbSessions: SessionItem[] = dbSessions.map((s) => ({
      id: s.id,
      device: 'Web browser',
      browser: 'OAuth session',
      location: 'Tbilisi, GE',
      lastActive: formatLastActive(s.expires),
      isCurrent: false,
    }));

    return createSuccessResponse({
      sessions: [currentSession, ...mappedDbSessions],
    });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * DELETE /api/user/sessions
 * Signs out of all other sessions by incrementing sessionVersion
 * and deleting all database sessions for the user.
 */
export async function DELETE() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return createErrorResponse(
        ERROR_CODES.UNAUTHORIZED,
        'You must be logged in',
        401
      );
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: { sessionVersion: { increment: 1 } },
    });

    await prisma.session.deleteMany({
      where: { userId: session.user.id },
    });

    return createSuccessResponse({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
