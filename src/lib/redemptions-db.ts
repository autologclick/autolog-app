import prisma from './db';

// Ensure the BenefitRedemption table exists (auto-migration)
let tableChecked = false;

export async function ensureRedemptionTable() {
  if (tableChecked) return;
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS BenefitRedemption (
        id TEXT PRIMARY KEY,
        benefitId TEXT NOT NULL,
        userId TEXT NOT NULL,
        code TEXT NOT NULL UNIQUE,
        qrData TEXT,
        benefitName TEXT NOT NULL,
        partnerName TEXT,
        discount TEXT,
        status TEXT NOT NULL DEFAULT 'active',
        usedAt TEXT,
        expiresAt TEXT,
        createdAt TEXT NOT NULL DEFAULT (datetime('now'))
      )
    `);
    tableChecked = true;
  } catch (e) {
    console.error('Failed to ensure BenefitRedemption table:', e);
  }
}

function generateId() {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let id = 'br_';
  for (let i = 0; i < 20; i++) {
    id += chars[Math.floor(Math.random() * chars.length)];
  }
  return id;
}

function generateRedemptionCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = 'AL-';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export interface BenefitRedemptionRow {
  id: string;
  benefitId: string;
  userId: string;
  code: string;
  qrData: string | null;
  benefitName: string;
  partnerName: string | null;
  discount: string | null;
  status: string; // 'active' | 'used' | 'expired'
  usedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
}

export async function createRedemption(data: {
  benefitId: string;
  userId: string;
  benefitName: string;
  partnerName?: string;
  discount?: string;
  expiresAt?: string;
}): Promise<BenefitRedemptionRow> {
  await ensureRedemptionTable();

  const id = generateId();
  const code = generateRedemptionCode();
  const qrData = JSON.stringify({
    code,
    benefitName: data.benefitName,
    partnerName: data.partnerName || '',
    discount: data.discount || '',
    createdAt: new Date().toISOString(),
  });

  await prisma.$executeRawUnsafe(
    `INSERT INTO BenefitRedemption (id, benefitId, userId, code, qrData, benefitName, partnerName, discount, expiresAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    id,
    data.benefitId,
    data.userId,
    code,
    qrData,
    data.benefitName,
    data.partnerName || null,
    data.discount || null,
    data.expiresAt || null
  );

  const rows = await prisma.$queryRawUnsafe(
    `SELECT * FROM BenefitRedemption WHERE id = ?`,
    id
  ) as BenefitRedemptionRow[];

  return rows[0];
}

export async function getUserRedemptions(userId: string): Promise<BenefitRedemptionRow[]> {
  await ensureRedemptionTable();

  return prisma.$queryRawUnsafe(
    `SELECT * FROM BenefitRedemption
     WHERE userId = ?
     ORDER BY
       CASE status WHEN 'active' THEN 0 WHEN 'used' THEN 1 WHEN 'expired' THEN 2 END,
       createdAt DESC`,
    userId
  ) as Promise<BenefitRedemptionRow[]>;
}

export async function getRedemptionByCode(code: string): Promise<BenefitRedemptionRow | null> {
  await ensureRedemptionTable();

  const rows = await prisma.$queryRawUnsafe(
    `SELECT * FROM BenefitRedemption WHERE code = ?`,
    code
  ) as BenefitRedemptionRow[];

  return rows[0] || null;
}

export async function markRedemptionUsed(code: string): Promise<boolean> {
  await ensureRedemptionTable();

  const redemption = await getRedemptionByCode(code);
  if (!redemption) {
    return false;
  }

  if (redemption.status !== 'active') {
    return false;
  }

  await prisma.$executeRawUnsafe(
    `UPDATE BenefitRedemption
     SET status = 'used', usedAt = datetime('now')
     WHERE code = ?`,
    code
  );

  return true;
}

export async function getRedemptionById(id: string): Promise<BenefitRedemptionRow | null> {
  await ensureRedemptionTable();

  const rows = await prisma.$queryRawUnsafe(
    `SELECT * FROM BenefitRedemption WHERE id = ?`,
    id
  ) as BenefitRedemptionRow[];

  return rows[0] || null;
}
