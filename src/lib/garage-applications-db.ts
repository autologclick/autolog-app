import prisma from './db';

export interface GarageApplicationRow {
  id: string;
  garageName: string;
  ownerName: string;
  email: string;
  phone: string;
  city: string;
  address: string | null;
  description: string | null;
  services: string | null;
  languages: string | null;
  yearsExperience: number;
  employeeCount: number;
  licenseNumber: string | null;
  images: string | null;
  status: string;
  adminNotes: string | null;
  reviewedBy: string | null;
  reviewedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export async function createApplication(data: {
  garageName: string;
  ownerName: string;
  email: string;
  phone: string;
  city: string;
  address?: string;
  description?: string;
  services?: string;
  languages?: string;
  yearsExperience?: number;
  employeeCount?: number;
  licenseNumber?: string;
  images?: string;
}): Promise<string> {
  const result = await prisma.garageApplication.create({
    data: {
      garageName: data.garageName,
      ownerName: data.ownerName,
      email: data.email,
      phone: data.phone,
      city: data.city,
      address: data.address || null,
      description: data.description || null,
      services: data.services || null,
      languages: data.languages || null,
      yearsExperience: data.yearsExperience || 0,
      employeeCount: data.employeeCount || 1,
      licenseNumber: data.licenseNumber || null,
      images: data.images || null,
      status: 'pending',
    },
  });
  return result.id;
}

export async function getApplications(status?: string): Promise<GarageApplicationRow[]> {
  if (status) {
    return prisma.garageApplication.findMany({
      where: { status },
      orderBy: { createdAt: 'desc' },
    });
  }
  // Sort: pending first, then approved, then rejected
  const applications = await prisma.garageApplication.findMany({
    orderBy: { createdAt: 'desc' },
  });

  const statusOrder: Record<string, number> = { pending: 0, approved: 1, rejected: 2 };
  return applications.sort((a, b) => {
    const orderA = statusOrder[a.status] ?? 3;
    const orderB = statusOrder[b.status] ?? 3;
    if (orderA !== orderB) return orderA - orderB;
    return b.createdAt.getTime() - a.createdAt.getTime();
  });
}

export async function getApplicationById(id: string): Promise<GarageApplicationRow | null> {
  return prisma.garageApplication.findUnique({
    where: { id },
  });
}

export async function getApplicationCount(): Promise<{ total: number; pending: number }> {
  const [total, pending] = await Promise.all([
    prisma.garageApplication.count(),
    prisma.garageApplication.count({ where: { status: 'pending' } }),
  ]);
  return { total, pending };
}

export async function updateApplicationStatus(
  id: string,
  status: 'approved' | 'rejected',
  adminNotes: string | null,
  reviewedBy: string
) {
  await prisma.garageApplication.update({
    where: { id },
    data: {
      status,
      adminNotes,
      reviewedBy,
      reviewedAt: new Date(),
    },
  });
}

export async function checkDuplicateEmail(email: string): Promise<boolean> {
  const count = await prisma.garageApplication.count({
    where: {
      email,
      status: { not: 'rejected' },
    },
  });
  return count > 0;
}
