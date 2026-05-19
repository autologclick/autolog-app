import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, blacklistToken, TRUSTED_DEVICE_COOKIE } from '@/lib/auth';

export async function POST(req: NextRequest) {
  // Blacklist both access and refresh tokens server-side so they cannot be
  // reused even if copied from cookies before logout.
  const accessToken = req.cookies.get('auth-token')?.value;
  const refreshToken = req.cookies.get('refresh-token')?.value;

  for (const tok of [accessToken, refreshToken]) {
    if (!tok) continue;
    try {
      const decoded = verifyToken(tok);
      if (decoded?.tokenId) {
        blacklistToken(decoded.tokenId);
      }
    } catch {
      /* ignore */
    }
  }

  const response = NextResponse.json({ message: 'Logged out' });
  response.cookies.set('auth-token', '', { maxAge: 0, path: '/' });
  response.cookies.set('refresh-token', '', { maxAge: 0, path: '/' });
  // Also clear the trusted-device cookie — without this, an attacker who
  // compromises the device retains 2FA-bypass capability even after the
  // legitimate user logs out.
  response.cookies.set(TRUSTED_DEVICE_COOKIE, '', { maxAge: 0, path: '/' });
  return response;
}
