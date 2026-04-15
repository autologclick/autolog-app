import { describe, it, expect, beforeAll } from 'vitest';
import { createShareToken, verifyShareToken } from '../share-tokens';

beforeAll(() => {
  process.env.SHARE_TOKEN_SECRET = 'test-secret-do-not-use-in-production';
});

describe('share-tokens', () => {
  it('accepts a freshly created token', () => {
    const { token, expiresAt } = createShareToken('vehicle-history', 'abc123');
    expect(verifyShareToken('vehicle-history', 'abc123', token, expiresAt)).toBe(true);
  });

  it('rejects a token for a different resource id', () => {
    const { token, expiresAt } = createShareToken('vehicle-history', 'abc123');
    expect(verifyShareToken('vehicle-history', 'xyz999', token, expiresAt)).toBe(false);
  });

  it('rejects a token for a different resource type', () => {
    const { token, expiresAt } = createShareToken('vehicle-history', 'abc123');
    expect(verifyShareToken('inspection-pdf', 'abc123', token, expiresAt)).toBe(false);
  });

  it('rejects a tampered token', () => {
    const { token, expiresAt } = createShareToken('vehicle-history', 'abc123');
    const tampered = token.slice(0, -1) + (token.at(-1) === 'A' ? 'B' : 'A');
    expect(verifyShareToken('vehicle-history', 'abc123', tampered, expiresAt)).toBe(false);
  });

  it('rejects an expired token', () => {
    const { token } = createShareToken('vehicle-history', 'abc123', 60);
    const pastExpiry = Math.floor(Date.now() / 1000) - 10;
    expect(verifyShareToken('vehicle-history', 'abc123', token, pastExpiry)).toBe(false);
  });

  it('rejects empty inputs', () => {
    expect(verifyShareToken('vehicle-history', 'abc123', '', 9999999999)).toBe(false);
    expect(verifyShareToken('vehicle-history', 'abc123', 'something', 0)).toBe(false);
  });

  it('rejects a token signed with a different secret', () => {
    const { token, expiresAt } = createShareToken('vehicle-history', 'abc123');
    process.env.SHARE_TOKEN_SECRET = 'different-secret';
    expect(verifyShareToken('vehicle-history', 'abc123', token, expiresAt)).toBe(false);
    process.env.SHARE_TOKEN_SECRET = 'test-secret-do-not-use-in-production';
  });
});
