/**
 * OAuth state store - DB-backed (shared across all PM2 workers).
 *
 * Previously an in-memory Map, which broke Google sign-in ~50% of the
 * time in cluster mode: the state was stored on one worker and the
 * callback landed on the other ("works only on the second attempt").
 * Postgres makes it consistent across workers and restart-safe.
 */

import { randomUUID } from 'crypto';
import prisma from '@/lib/db';

const STATE_TTL_MS = 600_000; // 10 minutes

export interface OAuthStateData {
  codeVerifier: string;
  next?: string;
  referralCode?: string;
  createdAt: number;
}

export async function storeOAuthState(data: OAuthStateData): Promise<string> {
  const state = randomUUID().replace(/-/g, '');
  await prisma.oAuthState.create({
    data: {
      state,
      data: JSON.stringify(data),
      expiresAt: new Date(Date.now() + STATE_TTL_MS),
    },
  });
  // Opportunistic cleanup of expired rows - fire and forget.
  prisma.oAuthState.deleteMany({ where: { expiresAt: { lt: new Date() } } }).catch(() => {});
  return state;
}

export async function consumeOAuthState(state: string): Promise<OAuthStateData | null> {
  if (!state || typeof state !== 'string') return null;
  try {
    // delete() is atomic - guarantees single-use even across workers.
    const row = await prisma.oAuthState.delete({ where: { state } });
    if (row.expiresAt.getTime() < Date.now()) return null;
    return JSON.parse(row.data) as OAuthStateData;
  } catch {
    return null;
  }
}
