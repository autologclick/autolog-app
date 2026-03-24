# AutoLog Deployment Guide

## Overview

AutoLog supports both SQLite (development) and PostgreSQL (production) databases. This guide covers setting up and deploying to production with PostgreSQL.

## Development Setup (SQLite)

### Quick Start

SQLite is configured by default for local development:

```bash
# Install dependencies
npm install

# Initialize SQLite database
npx prisma migrate dev

# Start dev server
npm run dev
```

The SQLite database will be created at `dev.db` in the project root.

### Database Commands

```bash
# Create a new migration
npx prisma migrate dev --name migration_name

# Reset database (development only)
npx prisma migrate reset

# View database in Prisma Studio
npx prisma studio
```

## Production Setup (PostgreSQL)

### 1. Create PostgreSQL Database

On your PostgreSQL server, create a database and user:

```sql
CREATE DATABASE autolog;
CREATE USER autolog_user WITH PASSWORD 'your_secure_password';

-- Grant all privileges to user
GRANT ALL PRIVILEGES ON DATABASE autolog TO autolog_user;

-- Connect to the database and grant schema privileges
\c autolog
GRANT ALL ON SCHEMA public TO autolog_user;
```

### 2. Update Environment Variables

Update your `.env` file for production:

```env
# Production PostgreSQL connection
DATABASE_URL="postgresql://autolog_user:password@host:5432/autolog?schema=public"

# Keep your other production secrets
JWT_SECRET="your-production-secret-key"
NEXT_PUBLIC_APP_URL="https://your-domain.com"
NODE_ENV="production"
```

### 3. Migrate from SQLite (Optional)

If you have existing SQLite data to migrate:

```bash
# Run the migration script
bash scripts/migrate-to-postgres.sh
```

This script will:
- Export data from SQLite to JSON backup
- Verify PostgreSQL connection
- Deploy schema to PostgreSQL
- Optionally import data from backup

**Important**: The script will create backups in `migration-backup/` directory. Keep these for reference.

### 4. Deploy Application

#### Using a Docker container:

```dockerfile
# Use Node.js LTS image
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build Next.js application
RUN npm run build

# Expose port
EXPOSE 3000

# Start application
CMD ["npm", "start"]
```

Build and run:

```bash
docker build -t autolog:latest .
docker run -p 3000:3000 \
  -e DATABASE_URL="postgresql://..." \
  -e JWT_SECRET="..." \
  -e NEXT_PUBLIC_APP_URL="https://..." \
  autolog:latest
```

#### Using a process manager (e.g., PM2):

```bash
# Install PM2
npm install -g pm2

# Create ecosystem.config.js
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [
    {
      name: 'autolog',
      script: 'npm',
      args: 'start',
      env: {
        NODE_ENV: 'production',
        DATABASE_URL: process.env.DATABASE_URL,
        JWT_SECRET: process.env.JWT_SECRET,
        NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
      },
    },
  ],
};
EOF

# Start the application
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### 5. Database Maintenance

#### Backup PostgreSQL Database

```bash
# Full backup
pg_dump -U autolog_user -h localhost autolog > autolog_backup_$(date +%Y%m%d).sql

# Compressed backup
pg_dump -U autolog_user -h localhost -Fc autolog > autolog_backup_$(date +%Y%m%d).dump
```

#### Restore from Backup

```bash
# From SQL backup
psql -U autolog_user -h localhost autolog < autolog_backup.sql

# From compressed backup
pg_restore -U autolog_user -h localhost -d autolog autolog_backup.dump
```

#### Monitor Connection Pool

AutoLog uses Prisma's built-in connection pooling for PostgreSQL. For high-traffic deployments, consider using PgBouncer:

```ini
# pgbouncer.ini
[databases]
autolog = host=localhost port=5432 dbname=autolog

[pgbouncer]
pool_mode = transaction
max_client_conn = 1000
default_pool_size = 25
min_pool_size = 10
reserve_pool_size = 5
```

## Database Performance Optimization

The schema includes indexes on frequently queried columns:

- **User**: email, role
- **Vehicle**: userId, licensePlate
- **Inspection**: vehicleId, garageId, status
- **Appointment**: garageId, userId, status, date
- **Document**: vehicleId, type, expiryDate
- **Expense**: vehicleId, category, date
- **SosEvent**: userId, status
- **Notification**: userId, isRead
- **GarageReview**: garageId

### Check Indexes

```bash
# List all indexes
npx prisma db execute --stdin --file check_indexes.sql

# SQL command to view indexes
\di  # In psql
```

### Analyze Query Performance

```sql
-- Check slow queries in PostgreSQL
SELECT query, calls, total_time, mean_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;
```

## Health Checks

Add a health check endpoint to verify database connectivity:

```typescript
// src/pages/api/health.ts
import { prisma } from '@/lib/db';

export default async function handler(req, res) {
  try {
    // Test database connection
    await prisma.$queryRaw`SELECT 1`;

    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(503).json({
      status: 'unhealthy',
      error: error.message,
    });
  }
}
```

## Troubleshooting

### Connection Issues

```bash
# Test PostgreSQL connection
psql -U autolog_user -h localhost -d autolog -c "SELECT version();"

# Check environment variable
echo $DATABASE_URL
```

### Prisma Client Issues

```bash
# Regenerate Prisma client
npx prisma generate

# Clear Prisma cache
rm -rf node_modules/@prisma/client
npm install
```

### Schema Drift

```bash
# Check for differences between schema and database
npx prisma migrate diff --from-schema-datasource --to-schema-datamodel

# Resolve by creating a new migration
npx prisma migrate dev --name fix_schema_drift
```

## Switching Between SQLite and PostgreSQL

To temporarily switch back to SQLite development:

```bash
# Update DATABASE_URL in .env
DATABASE_URL="file:./dev.db"

# Regenerate Prisma client
npx prisma generate

# Use SQLite schema backup
# (Prisma will automatically use the correct provider from .env)
```

The `prisma/schema.sqlite.prisma` file contains the SQLite-compatible schema for reference.

## Security Best Practices

1. **Never commit credentials** to version control:
   - Use `.env.local` for development
   - Use `.gitignore` to exclude `.env` files

2. **Use environment variables** for all secrets in production:
   ```bash
   DATABASE_URL="postgresql://user:pass@host:5432/db"
   JWT_SECRET="your-production-secret"
   ```

3. **Enable SSL for PostgreSQL** connections:
   ```env
   DATABASE_URL="postgresql://user:pass@host:5432/db?sslmode=require"
   ```

4. **Implement connection limits**:
   - PostgreSQL: `max_connections`
   - Application: Connection pooling via Prisma

5. **Regular backups**:
   - Daily automated backups
   - Test restoration procedures
   - Store backups in secure location

## Monitoring and Logging

### Enable Prisma Logging

```typescript
// src/lib/db.ts (already configured for PostgreSQL)
const prisma = new PrismaClient({
  log: ['error', 'warn'], // Production
  // log: ['query', 'error', 'warn'], // Development (verbose)
});
```

### Application Monitoring

Consider integrating:
- [Sentry](https://sentry.io/) for error tracking
- [New Relic](https://newrelic.com/) for performance monitoring
- [LogRocket](https://logrocket.com/) for session replay
- [DataDog](https://www.datadoghq.com/) for comprehensive monitoring

## Scaling Considerations

- **Read replicas**: Set up PostgreSQL replicas for read scaling
- **Connection pooling**: Use PgBouncer for horizontal scaling
- **Caching**: Implement Redis for frequently accessed data
- **CDN**: Use Cloudflare or similar for static assets
- **Database optimization**: Monitor and optimize slow queries

## Support and Resources

- [Prisma Documentation](https://www.prisma.io/docs/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Next.js Deployment Guide](https://nextjs.org/docs/deployment)
- [AutoLog GitHub Repository](https://github.com/your-org/autolog)
