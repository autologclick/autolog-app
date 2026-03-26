import prisma from './db';

export interface BenefitRedemptionRow {
  id: string;
  benefitId: string;
  userId: string;
  code: string;
  qrData: string | null;
  benefitName: string;
  partnerName: string | null;
  discount: string | null;
  status: string;
  usedAt: Date | null;
  expiresAt: Date | null;
  createdAt: Date;
}

function generateRedemptionCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = 'AL-';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export async function createRedemption(data: {
  benefitId: string;
  userId: string;
  benefitName: string;
  partnerName?: string;
  discount?: string;
  expiresAt?: string;
}): Promise<BenefitRedemptionRow> {
  const code = generateRedemptionCode();
  const qrData = JSON.stringify({
    code,
    benefitName: data.benefitName,
    partnerName: data.partnerName || '',
    discount: data.discount || '',
    createdAt: new Date().toISOString(),
  });

  const result = await prisma.benefitRedemption.create({
    data: {
      benefitId: data.benefitId,
      userId: data.userId,
      code,
      qrData,
      benefitName: data.benefitName,
      partnerName: data.partnerName || null,
      discount: data.discount || null,
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
    },
  });

  return result as unknown as BenefitRedemptionRow;
}

export async function getUserRedemptions(userId: string): Promise<BenefitRedemptionRow[]> {
  const results = await prisma.benefitRedemption.findMany({
    where: { userId },
    orderBy: [
      { status: 'asc' },
      { createdAt: 'desc' },
    ],
  });
  return results as unknown as BenefitRedemptionRow[];
}

export async function getRedemptionByCode(code: string): Promise<BenefitRedemptionRow | null> {
  const result = await prisma.benefitRedemption.findUnique({
    where: { code },
  });
  return result as unknown as BenefitRedemptionRow | null;
}

export async function markRedemptionUsed(code: string): Promise<boolean> {
  const redemption = await getRedemptionByCode(code);
  if (!redemption || redemption.status !== 'active') {
    return false;
  }

  await prisma.benefitRedemption.update({
    where: { code },
    data: {
      status: 'used',
      usedAt: new Date(),
    },
  });

  return true;
}

export async function getRedemptionById(id: string): Promise<BenefitRedemptionRow | null> {
  const result = await prisma.benefitRedemption.findUnique({
    where: { id },
  });
  return result as unknown as BenefitRedemptionRow | null;
}
