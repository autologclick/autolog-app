import prisma from './db';
import { BenefitRedemption } from '@prisma/client';

export type { BenefitRedemption };

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
}): Promise<BenefitRedemption> {
  const code = generateRedemptionCode();
  const qrData = JSON.stringify({
    code,
    benefitName: data.benefitName,
    partnerName: data.partnerName || '',
    discount: data.discount || '',
    createdAt: new Date().toISOString(),
  });

  return prisma.benefitRedemption.create({
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
}

export async function getUserRedemptions(userId: string): Promise<BenefitRedemption[]> {
  return prisma.benefitRedemption.findMany({
    where: { userId },
    orderBy: [
      { status: 'asc' },
      { createdAt: 'desc' },
    ],
  });
}

export async function getRedemptionByCode(code: string): Promise<BenefitRedemption | null> {
  return prisma.benefitRedemption.findUnique({ where: { code } });
}

export async function markRedemptionUsed(code: string): Promise<boolean> {
  const redemption = await getRedemptionByCode(code);
  if (!redemption || redemption.status !== 'active') {
    return false;
  }

  await prisma.benefitRedemption.update({
    where: { code },
    data: { status: 'used', usedAt: new Date() },
  });
  return true;
}

export async function getRedemptionById(id: string): Promise<BenefitRedemption | null> {
  return prisma.benefitRedemption.findUnique({ where: { id } });
}
