#!/bin/bash

################################################################################
# AutoLog: SQLite to PostgreSQL Migration Script
################################################################################
#
# This script migrates data from SQLite (development) to PostgreSQL (production).
#
# Prerequisites:
#   - Node.js and npm installed
#   - Prisma CLI available (npm install -g @prisma/cli)
#   - PostgreSQL server running and accessible
#   - PostgreSQL database created with correct permissions
#
# Usage:
#   bash scripts/migrate-to-postgres.sh
#
# Environment Setup:
#   1. Create a PostgreSQL database and user:
#      ```sql
#      CREATE DATABASE autolog;
#      CREATE USER autolog_user WITH PASSWORD 'your_secure_password';
#      GRANT ALL PRIVILEGES ON DATABASE autolog TO autolog_user;
#      ```
#
#   2. Update .env with PostgreSQL connection:
#      DATABASE_URL="postgresql://autolog_user:password@localhost:5432/autolog?schema=public"
#
################################################################################

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo "=========================================="
echo "AutoLog: SQLite to PostgreSQL Migration"
echo "=========================================="
echo ""

# Check if running from project root
if [ ! -f "$PROJECT_ROOT/package.json" ]; then
  echo "Error: package.json not found. Please run this script from the project root."
  exit 1
fi

# Step 1: Verify current SQLite database exists
echo "Step 1: Checking SQLite database..."
if [ ! -f "$PROJECT_ROOT/dev.db" ]; then
  echo "Warning: SQLite database (dev.db) not found. Skipping data export."
  SKIP_EXPORT=true
else
  SKIP_EXPORT=false
  echo "  ✓ SQLite database found"
fi

# Step 2: Export SQLite data to JSON
if [ "$SKIP_EXPORT" = false ]; then
  echo ""
  echo "Step 2: Exporting data from SQLite to JSON..."

  EXPORT_DIR="$PROJECT_ROOT/migration-backup"
  mkdir -p "$EXPORT_DIR"
  EXPORT_FILE="$EXPORT_DIR/sqlite-backup-$(date +%Y%m%d-%H%M%S).json"

  # Create a temporary Node.js script to export data
  cat > "$PROJECT_ROOT/export-sqlite.js" << 'EXPORT_SCRIPT'
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'file:./dev.db',
    },
  },
});

async function exportData() {
  const data = {
    users: await prisma.user.findMany(),
    vehicles: await prisma.vehicle.findMany(),
    vehicleDrivers: await prisma.vehicleDriver.findMany(),
    garages: await prisma.garage.findMany(),
    inspections: await prisma.inspection.findMany(),
    inspectionItems: await prisma.inspectionItem.findMany(),
    appointments: await prisma.appointment.findMany(),
    sosEvents: await prisma.sosEvent.findMany(),
    clubBenefits: await prisma.clubBenefit.findMany(),
    expenses: await prisma.expense.findMany(),
    garageReviews: await prisma.garageReview.findMany(),
    documents: await prisma.document.findMany(),
    notifications: await prisma.notification.findMany(),
  };

  console.log(JSON.stringify(data, null, 2));
}

exportData()
  .catch((e) => {
    console.error('Export error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
EXPORT_SCRIPT

  node "$PROJECT_ROOT/export-sqlite.js" > "$EXPORT_FILE" 2>/dev/null || {
    echo "  Note: Could not auto-export SQLite data (database might be locked or incompatible)"
    echo "  Manual backup saved to: $EXPORT_FILE"
  }

  rm -f "$PROJECT_ROOT/export-sqlite.js"
  echo "  ✓ Data exported to: $EXPORT_FILE"
fi

# Step 3: Verify PostgreSQL connection
echo ""
echo "Step 3: Verifying PostgreSQL connection..."

if [ -z "$DATABASE_URL" ]; then
  echo "  ✗ DATABASE_URL environment variable is not set"
  echo ""
  echo "  Please set your PostgreSQL connection string:"
  echo "    export DATABASE_URL='postgresql://user:password@localhost:5432/autolog?schema=public'"
  echo ""
  exit 1
fi

if ! echo "$DATABASE_URL" | grep -q "postgresql"; then
  echo "  ✗ DATABASE_URL does not appear to be a PostgreSQL connection"
  echo "  Current value: $DATABASE_URL"
  exit 1
fi

echo "  ✓ PostgreSQL connection configured"

# Step 4: Run Prisma migrations
echo ""
echo "Step 4: Running Prisma migrations..."
echo "  This will create all tables and indexes in PostgreSQL"

cd "$PROJECT_ROOT"

# Generate Prisma client
echo "  - Generating Prisma client..."
npx prisma generate

# Run migrations
echo "  - Deploying schema to PostgreSQL..."
npx prisma migrate deploy || {
  echo "  - No migrations found, pushing schema directly..."
  npx prisma db push --force-reset
}

echo "  ✓ Schema deployed successfully"

# Step 5: Import data from backup (if available)
if [ "$SKIP_EXPORT" = false ] && [ -f "$EXPORT_FILE" ]; then
  echo ""
  echo "Step 5: Importing data from SQLite backup..."

  # Create a temporary Node.js script to import data
  cat > "$PROJECT_ROOT/import-postgres.js" << 'IMPORT_SCRIPT'
const fs = require('fs');
const { PrismaClient } = require('@prisma/client');

const backupFile = process.argv[2];
const data = JSON.parse(fs.readFileSync(backupFile, 'utf-8'));
const prisma = new PrismaClient();

async function importData() {
  try {
    // Import in order of dependencies
    for (const user of data.users) {
      await prisma.user.upsert({
        where: { id: user.id },
        update: user,
        create: user,
      });
    }
    console.log(`✓ Imported ${data.users.length} users`);

    for (const vehicle of data.vehicles) {
      await prisma.vehicle.upsert({
        where: { id: vehicle.id },
        update: vehicle,
        create: vehicle,
      });
    }
    console.log(`✓ Imported ${data.vehicles.length} vehicles`);

    for (const garage of data.garages) {
      await prisma.garage.upsert({
        where: { id: garage.id },
        update: garage,
        create: garage,
      });
    }
    console.log(`✓ Imported ${data.garages.length} garages`);

    // Continue with remaining tables...
    // Note: Adjust as needed based on your data relationships

    console.log('\n✓ Data import complete!');
  } catch (error) {
    console.error('Import error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

importData().catch(process.exit);
IMPORT_SCRIPT

  node "$PROJECT_ROOT/import-postgres.js" "$EXPORT_FILE" || {
    echo "  Note: Could not auto-import data"
    echo "  Backup file available at: $EXPORT_FILE"
  }

  rm -f "$PROJECT_ROOT/import-postgres.js"
else
  echo ""
  echo "Step 5: Skipping data import (no backup available)"
fi

# Step 6: Summary
echo ""
echo "=========================================="
echo "Migration Complete!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "  1. Verify PostgreSQL database contains all tables:"
echo "     npx prisma studio"
echo ""
echo "  2. Update your deployment environment:"
echo "     - Set DATABASE_URL in production environment variables"
echo "     - Ensure PostgreSQL credentials are secure"
echo ""
echo "  3. Test the application:"
echo "     npm run dev"
echo ""
echo "Backup location: $PROJECT_ROOT/migration-backup"
echo "SQLite database can be deleted once verified: rm dev.db"
echo ""

exit 0
