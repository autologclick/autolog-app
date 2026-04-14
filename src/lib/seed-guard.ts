import { NextResponse } from 'next/server';

/**
 * Guard for /api/admin/seed-* and /api/seed endpoints.
 * Blocks execution in production unless ALLOW_SEED=true is set on the env.
 */
export function assertSeedAllowed(): NextResponse | null {
  const isProd = process.env.NODE_ENV === 'production';
  const allow = process.env.ALLOW_SEED === 'true';
  if (isProd && !allow) {
    return NextResponse.json(
      { error: 'Seed endpoints are disabled in production. Set ALLOW_SEED=true temporarily to enable.' },
      { status: 403 }
    );
  }
  return null;
}
