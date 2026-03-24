import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { createLogger } from '@/lib/logger';

const healthLogger = createLogger('api');

export async function GET() {
  try {
    // Check database connectivity
    const startTime = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    const dbLatency = Date.now() - startTime;

    healthLogger.info('Health check successful', {
      dbLatency,
      status: 'ok',
    });

    return NextResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      dbLatency,
      environment: process.env.NODE_ENV,
    });
  } catch (error) {
    healthLogger.error('Health check failed', {
      error: error instanceof Error ? error.message : 'Database connection failed',
    });

    return NextResponse.json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: 'Database connection failed',
    }, { status: 503 });
  }
}
