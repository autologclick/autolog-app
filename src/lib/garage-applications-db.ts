import prisma from './db';

// Ensure the GarageApplication table exists (auto-migration)
let tableChecked = false;

export async function ensureGarageApplicationTable() {
  if (tableChecked) return;
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS GarageApplication (
        id TEXT PRIMARY KEY,
        garageName TEXT NOT NULL,
        ownerName TEXT NOT NULL,
        email TEXT NOT NULL,
        phone TEXT NOT NULL,
        city TEXT NOT NULL,
        address TEXT,
        description TEXT,
        services TEXT,
        yearsExperience INTEGER DEFAULT 0,
        employeeCount INTEGER DEFAULT 1,
        licenseNumber TEXT,
        images TEXT,
        status TEXT NOT NULL DEFAULT 'pending',
        adminNotes TEXT,
        reviewedBy TEXT,
        reviewedAt TEXT,
        createdAt TEXT NOT NULL DEFAULT (datetime('now')),
        updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
      )
    `);
    // Add images column if table already exists without it
    try {
      await prisma.$executeRawUnsafe(`ALTER TABLE GarageApplication ADD COLUMN images TEXT`);
    } catch {
      // Column already exists
    }
    tableChecked = true;
  } catch (e) {
    console.error('Failed to ensure GarageApplication table:', e);
  }
}

function generateId() {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let id = 'gapp_';
  for (let i = 0; i < 20; i++) {
    id += chars[Math.floor(Math.random() * chars.length)];
  }
  return id;
}

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
  yearsExperience: number;
  employeeCount: number;
  licenseNumber: string | null;
  images: string | null; // JSON array of image URLs
  status: string; // pending | approved | rejected
  adminNotes: string | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
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
  yearsExperience?: number;
  employeeCount?: number;
  licenseNumber?: string;
  images?: string;
}): Promise<string> {
  await ensureGarageApplicationTable();
  const id = generateId();
  await prisma.$executeRawUnsafe(
    `INSERT INTO GarageApplication (id, garageName, ownerName, email, phone, city, address, description, services, yearsExperience, employeeCount, licenseNumber, images, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
    id,
    data.garageName,
    data.ownerName,
    data.email,
    data.phone,
    data.city,
    data.address || null,
    data.description || null,
    data.services || null,
    data.yearsExperience || 0,
    data.employeeCount || 1,
    data.licenseNumber || null,
    data.images || null
  );
  return id;
}

export async function getApplications(status?: string): Promise<GarageApplicationRow[]> {
  await ensureGarageApplicationTable();
  if (status) {
    return prisma.$queryRawUnsafe(
      `SELECT * FROM GarageApplication WHERE status = ? ORDER BY createdAt DESC`,
      status
    ) as Promise<GarageApplicationRow[]>;
  }
  return prisma.$queryRawUnsafe(
    `SELECT * FROM GarageApplication ORDER BY
      CASE status WHEN 'pending' THEN 0 WHEN 'approved' THEN 1 WHEN 'rejected' THEN 2 END,
      createdAt DESC`
  ) as Promise<GarageApplicationRow[]>;
}

export async function getApplicationById(id: string): Promise<GarageApplicationRow | null> {
  await ensureGarageApplicationTable();
  const rows = await prisma.$queryRawUnsafe(
    `SELECT * FROM GarageApplication WHERE id = ?`,
    id
  ) as GarageApplicationRow[];
  return rows[0] || null;
}

export async function getApplicationCount(): Promise<{ total: number; pending: number }> {
  await ensureGarageApplicationTable();
  const total = await prisma.$queryRawUnsafe(
    `SELECT COUNT(*) as count FROM GarageApplication`
  ) as { count: number }[];
  const pending = await prisma.$queryRawUnsafe(
    `SELECT COUNT(*) as count FROM GarageApplication WHERE status = 'pending'`
  ) as { count: number }[];
  return {
    total: Number(total[0]?.count || 0),
    pending: Number(pending[0]?.count || 0),
  };
}

export async function updateApplicationStatus(
  id: string,
  status: 'approved' | 'rejected',
  adminNotes: string | null,
  reviewedBy: string
) {
  await ensureGarageApplicationTable();
  await prisma.$executeRawUnsafe(
    `UPDATE GarageApplication
     SET status = ?, adminNotes = ?, reviewedBy = ?, reviewedAt = datetime('now'), updatedAt = datetime('now')
     WHERE id = ?`,
    status,
    adminNotes,
    reviewedBy,
    id
  );
}

export async function checkDuplicateEmail(email: string): Promise<boolean> {
  await ensureGarageApplicationTable();
  const rows = await prisma.$queryRawUnsafe(
    `SELECT COUNT(*) as count FROM GarageApplication WHERE email = ? AND status != 'rejected'`,
    email
  ) as { count: number }[];
  return Number(rows[0]?.count || 0) > 0;
}
