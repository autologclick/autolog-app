import { NextRequest } from 'next/server';
import { generateCsrfToken, storeCsrfToken } from '@/lib/csrf';
import { jsonResponse, errorResponse } from '@/lib/api-helpers';

// GET /api/auth/csrf-token - Generate a CSRF token for the current session
export async function GET(req: NextRequest) {
  try {
    // Get or create a session identifier
    // For unauthenticated requests, we use a temporary session cookie
    let sessionId = req.cookies.get('session-id')?.value;

    if (!sessionId) {
      // Generate a new session ID for this user
      sessionId = require('crypto').randomBytes(16).toString('hex');
    }

    // Generate a new CSRF token
    const csrfToken = generateCsrfToken();

    // Store the token
    storeCsrfToken(sessionId!, csrfToken);

    const response = jsonResponse({ csrfToken });

    // Set session ID cookie if not already set
    if (!req.cookies.get('session-id')?.value) {
      response.cookies.set('session-id', sessionId!, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 24 * 60 * 60, // 24 hours
        path: '/',
      });
    }

    return response;
  } catch (error) {
    console.error('CSRF token generation error:', error);
    return errorResponse('×©×××× ××× ×¤×§×ª ×××§× ×××××', 500);
  }
}
