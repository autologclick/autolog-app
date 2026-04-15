import { describe, it, expect, beforeAll } from 'vitest';

beforeAll(() => {
  process.env.JWT_SECRET = 'test-jwt-secret-do-not-use-in-production';
});

// Import after setting env var
import { hashPassword, verifyPassword, generateToken, verifyToken, requireRole } from '../auth';

describe('password hashing', () => {
  it('hashes a password to a non-plain string', async () => {
    const hash = await hashPassword('mypassword');
    expect(hash).not.toBe('mypassword');
    expect(hash.length).toBeGreaterThan(40);
  });

  it('verifies a correct password', async () => {
    const hash = await hashPassword('mypassword');
    expect(await verifyPassword('mypassword', hash)).toBe(true);
  });

  it('rejects a wrong password', async () => {
    const hash = await hashPassword('mypassword');
    expect(await verifyPassword('wrongpassword', hash)).toBe(false);
  });

  it('produces different hashes for the same password (salt)', async () => {
    const a = await hashPassword('mypassword');
    const b = await hashPassword('mypassword');
    expect(a).not.toBe(b);
  });
});

describe('jwt tokens', () => {
  const payload = { userId: 'u1', email: 'test@example.com', role: 'user' };

  it('generates and verifies a valid token', () => {
    const token = generateToken(payload);
    const decoded = verifyToken(token);
    expect(decoded).not.toBeNull();
    expect(decoded?.userId).toBe('u1');
    expect(decoded?.email).toBe('test@example.com');
    expect(decoded?.role).toBe('user');
    expect(decoded?.type).toBe('access');
  });

  it('rejects a garbage token', () => {
    expect(verifyToken('not-a-real-token')).toBeNull();
  });

  it('rejects a tampered token', () => {
    const token = generateToken(payload);
    const tampered = token.slice(0, -5) + 'XXXXX';
    expect(verifyToken(tampered)).toBeNull();
  });
});

describe('requireRole', () => {
  it('accepts matching role', () => {
    expect(requireRole('admin', 'admin')).toBe(true);
  });

  it('accepts role from list', () => {
    expect(requireRole('admin', ['user', 'admin'])).toBe(true);
  });

  it('rejects non-matching role', () => {
    expect(requireRole('user', 'admin')).toBe(false);
  });

  it('rejects when role not in list', () => {
    expect(requireRole('user', ['admin', 'mechanic'])).toBe(false);
  });
});
