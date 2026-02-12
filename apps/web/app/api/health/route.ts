import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  uptime: number;
  checks: {
    database: {
      status: 'healthy' | 'unhealthy';
      latency?: number;
      error?: string;
    };
    memory: {
      status: 'healthy' | 'warning' | 'critical';
      used: number;
      total: number;
      percentage: number;
    };
  };
}

const startTime = Date.now();

/**
 * Health check endpoint for uptime monitoring
 * GET /api/health
 */
export async function GET() {
  const timestamp = new Date().toISOString();
  const uptime = Math.floor((Date.now() - startTime) / 1000);

  // Check database connectivity
  let dbStatus: HealthStatus['checks']['database'];
  const dbStart = Date.now();

  try {
    await prisma.$queryRaw`SELECT 1`;
    dbStatus = {
      status: 'healthy',
      latency: Date.now() - dbStart,
    };
  } catch (error) {
    dbStatus = {
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown database error',
    };
  }

  // Check memory usage
  const memoryUsage = process.memoryUsage();
  const usedMemoryMB = Math.round(memoryUsage.heapUsed / 1024 / 1024);
  const totalMemoryMB = Math.round(memoryUsage.heapTotal / 1024 / 1024);
  const memoryPercentage = Math.round((usedMemoryMB / totalMemoryMB) * 100);

  let memoryStatus: 'healthy' | 'warning' | 'critical' = 'healthy';
  if (memoryPercentage > 90) {
    memoryStatus = 'critical';
  } else if (memoryPercentage > 75) {
    memoryStatus = 'warning';
  }

  // Determine overall status
  let overallStatus: HealthStatus['status'] = 'healthy';
  if (dbStatus.status === 'unhealthy') {
    overallStatus = 'unhealthy';
  } else if (memoryStatus === 'critical') {
    overallStatus = 'degraded';
  } else if (memoryStatus === 'warning') {
    overallStatus = 'degraded';
  }

  const healthStatus: HealthStatus = {
    status: overallStatus,
    timestamp,
    version: process.env.npm_package_version || '1.0.0',
    uptime,
    checks: {
      database: dbStatus,
      memory: {
        status: memoryStatus,
        used: usedMemoryMB,
        total: totalMemoryMB,
        percentage: memoryPercentage,
      },
    },
  };

  // Return appropriate status code based on health
  const statusCode = overallStatus === 'healthy' ? 200 : overallStatus === 'degraded' ? 200 : 503;

  return NextResponse.json(healthStatus, { status: statusCode });
}
