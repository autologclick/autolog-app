import { OAuth2Client } from 'google-auth-library';
import { randomBytes, createHash } from 'crypto';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_REDIRECT_URI =
  process.env.GOOGLE_REDIRECT_URI ||
  `${process.env.NEXT_PUBLIC_APP_URL || 'https://autolog.click'}/api/auth/google/callback`;

if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
  console.warn('[google-oauth] GOOGLE_CLIENT_ID/SECRET not configured');
}

export const googleClient = new OAuth2Client({
  clientId: GOOGLE_CLIENT_ID,
  clientSecret: GOOGLE_CLIENT_SECRET,
  redirectUri: GOOGLE_REDIRECT_URI,
});

export function isGoogleConfigured(): boolean {
  return !!(GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET);
}

export interface GoogleProfile {
  sub: string;
  email: string;
  email_verified: boolean;
  name?: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
  locale?: string;
}

export function generateOAuthState(): string {
  return randomBytes(32).toString('base64url');
}

export function generatePkceVerifier(): string {
  return randomBytes(32).toString('base64url');
}

export function pkceChallengeFromVerifier(verifier: string): string {
  return createHash('sha256').update(verifier).digest('base64url');
}

export function buildAuthorizationUrl(opts: { state: string; codeChallenge: string }): string {
  return googleClient.generateAuthUrl({
    access_type: 'online',
    scope: ['openid', 'email', 'profile'],
    state: opts.state,
    code_challenge: opts.codeChallenge,
    code_challenge_method: 'S256',
    prompt: 'select_account',
    include_granted_scopes: true,
  });
}

export async function exchangeCodeForProfile(
  code: string,
  codeVerifier: string,
): Promise<GoogleProfile> {
  const { tokens } = await googleClient.getToken({
    code,
    codeVerifier,
    redirect_uri: GOOGLE_REDIRECT_URI,
  });

  if (!tokens.id_token) throw new Error('Google did not return an id_token');

  const ticket = await googleClient.verifyIdToken({
    idToken: tokens.id_token,
    audience: GOOGLE_CLIENT_ID,
  });

  const p = ticket.getPayload();
  if (!p || !p.sub || !p.email) throw new Error('Invalid Google ID token payload');

  return {
    sub: p.sub,
    email: p.email.toLowerCase(),
    email_verified: !!p.email_verified,
    name: p.name,
    given_name: p.given_name,
    family_name: p.family_name,
    picture: p.picture,
    locale: p.locale,
  };
}
