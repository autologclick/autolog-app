import prisma from '@/lib/db';

let tableChecked = false;

export async function ensureTreatmentTable() {
  if (tableChecked) return;
  try {
    await (prisma as any).$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS Treatment (
        id TEXT PRIMARY KEY,
        vehicleId TEXT NOT NULL,
        userId TEXT NOT NULL,
        garageId TEXT,
        garageName TEXT,
        mechanicName TEXT,
        type TEXT NOT NULL DEFAULT 'maintenance',
        title TEXT NOT NULL,
        description TEXT,
        items TEXT,
        mileage INTEGER,
        cost REAL,
        date TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'draft',
        sentByGarage INTEGER NOT NULL DEFAULT 0,
        approvedAt TEXT,
        rejectedAt TEXT,
        rejectionReason TEXT,
        notes TEXT,
        createdAt TEXT NOT NULL DEFAULT (datetime('now')),
        updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
      )
    `);
    tableChecked = true;
  } catch (e) {
    console.error('Failed to ensure Treatment table:', e);
  }
}

// Types
export interface Treatment {
  id: string;
  vehicleId: string;
  userId: string;
  garageId?: string;
  garageName?: string;
  mechanicName?: string;
  type: string;
  title: string;
  description?: string;
  items?: string; // JSON array of treatment items
  mileage?: number;
  cost?: number;
  date: string;
  status: string; // draft | pending_approval | approved | rejected
  sentByGarage: number;
  approvedAt?: string;
  rejectedAt?: string;
  rejectionReason?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// Generate unique ID
function generateId(): string {
  return 'trt_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

// Create a treatment (user self-report)
export async function createTreatment(data: {
  vehicleId: string;
  userId: string;
  garageId?: string;
  garageName?: string;
  mechanicName?: string;
  type: string;
  title: string;
  description?: string;
  items?: string;
  mileage?: number;
  cost?: number;
  date: string;
  notes?: string;
}): Promise<Treatment> {
  await ensureTreatmentTable();
  const id = generateId();
  const now = new Date().toISOString();

  await (prisma as any).$executeRawUnsafe(
    `INSERT INTO Treatment (id, vehicleId, userId, garageId, garageName, mechanicName, type, title, description, items, mileage, cost, date, status, sentByGarage, notes, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'approved', 0, ?, ?, ?)`,
    id, data.vehicleId, data.userId, data.garageId || null, data.garageName || null,
    data.mechanicName || null, data.type, data.title, data.description || null,
    data.items || null, data.mileage || null, data.cost || null, data.date,
    data.notes || null, now, now
  );

  return getTreatmentById(id) as Promise<Treatment>;
}

// Create treatment from garage (pending approval)
export async function createGarageTreatment(data: {
  vehicleId: string;
  userId: string;
  garageId: string;
  garageName: string;
  mechanicName?: string;
  type: string;
  title: string;
  description?: string;
  items?: string;
  mileage?: number;
  cost?: number;
  date: string;
  notes?: string;
}): Promise<Treatment> {
  await ensureTreatmentTable();
  const id = generateId();
  const now = new Date().toISOString();

  await (prisma as any).$executeRawUnsafe(
    `INSERT INTO Treatment (id, vehicleId, userId, garageId, garageName, mechanicName, type, title, description, items, mileage, cost, date, status, sentByGarage, notes, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending_approval', 1, ?, ?, ?)`,
    id, data.vehicleId, data.userId, data.garageId, data.garageName,
    data.mechanicName || null, data.type, data.title, data.description || null,
    data.items || null, data.mileage || null, data.cost || null, data.date,
    data.notes || null, now, now
  );

  return getTreatmentById(id) as Promise<Treatment>;
}

// Get treatment by ID
export async function getTreatmentById(id: string): Promise<Treatment | null> {
  await ensureTreatmentTable();
  const results = await (prisma as any).$queryRawUnsafe(
    `SELECT * FROM Treatment WHERE id = ?`, id
  );
  return results.length > 0 ? results[0] : null;
}

// Get treatments for a user (optionally filter by vehicle)
export async function getUserTreatments(userId: string, vehicleId?: string): Promise<Treatment[]> {
  await ensureTreatmentTable();
  if (vehicleId) {
    return (prisma as any).$queryRawUnsafe(
      `SELECT * FROM Treatment WHERE userId = ? AND vehicleId = ? ORDER BY date DESC`,
      userId, vehicleId
    );
  }
  return (prisma as any).$queryRawUnsafe(
    `SELECT * FROM Treatment WHERE userId = ? ORDER BY date DESC`,
    userId
  );
}

// Get pending treatments for a user
export async function getPendingTreatments(userId: string): Promise<Treatment[]> {
  await ensureTreatmentTable();
  return (prisma as any).$queryRawUnsafe(
    `SELECT * FROM Treatment WHERE userId = ? AND status = 'pending_approval' ORDER BY createdAt DESC`,
    userId
  );
}

// Get treatments sent by a garage
export async function getGarageTreatments(garageId: string): Promise<Treatment[]> {
  await ensureTreatmentTable();
  return (prisma as any).$queryRawUnsafe(
    `SELECT * FROM Treatment WHERE garageId = ? ORDER BY date DESC`,
    garageId
  );
}

// Approve a treatment
export async function approveTreatment(id: string, userId: string): Promise<boolean> {
  await ensureTreatmentTable();
  const now = new Date().toISOString();
  const result = await (prisma as any).$executeRawUnsafe(
    `UPDATE Treatment SET status = 'approved', approvedAt = ?, updatedAt = ? WHERE id = ? AND userId = ? AND status = 'pending_approval'`,
    now, now, id, userId
  );
  return result > 0;
}

// Reject a treatment
export async function rejectTreatment(id: string, userId: string, reason?: string): Promise<boolean> {
  await ensureTreatmentTable();
  const now = new Date().toISOString();
  const result = await (prisma as any).$executeRawUnsafe(
    `UPDATE Treatment SET status = 'rejected', rejectedAt = ?, rejectionReason = ?, updatedAt = ? WHERE id = ? AND userId = ? AND status = 'pending_approval'`,
    now, reason || null, now, id, userId
  );
  return result > 0;
}

// Update a treatment (only user's own drafts/approved)
export async function updateTreatment(id: string, userId: string, data: Partial<{
  title: string;
  description: string;
  type: string;
  items: string;
  mileage: number;
  cost: number;
  date: string;
  garageName: string;
  mechanicName: string;
  notes: string;
}>): Promise<boolean> {
  await ensureTreatmentTable();
  const now = new Date().toISOString();
  const sets: string[] = ['updatedAt = ?'];
  const values: any[] = [now];

  for (const [key, val] of Object.entries(data)) {
    if (val !== undefined) {
      sets.push(`${key} = ?`);
      values.push(val);
    }
  }

  values.push(id, userId);
  const result = await (prisma as any).$executeRawUnsafe(
    `UPDATE Treatment SET ${sets.join(', ')} WHERE id = ? AND userId = ?`,
    ...values
  );
  return result > 0;
}

// Delete a treatment
export async function deleteTreatment(id: string, userId: string): Promise<boolean> {
  await ensureTreatmentTable();
  const result = await (prisma as any).$executeRawUnsafe(
    `DELETE FROM Treatment WHERE id = ? AND userId = ?`,
    id, userId
  );
  return result > 0;
}
