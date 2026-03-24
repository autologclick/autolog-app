# AutoLog Docker Production Setup

This document describes the production-ready Docker configuration for the AutoLog Next.js 14 application.

## Files Created

1. **Dockerfile** - Multi-stage production build
2. **docker-compose.yml** - Container orchestration configuration
3. **.dockerignore** - Build context optimization
4. **next.config.js** - Updated with `output: 'standalone'`

## Architecture

### Multi-Stage Dockerfile

The Dockerfile uses three stages to optimize the final image:

#### Stage 1: `deps`
- Base image: `node:18-alpine`
- Installs all npm dependencies
- Minimizes rebuild time with layer caching

#### Stage 2: `builder`
- Copies node_modules from deps stage
- Copies application source code
- Runs `prisma generate` for ORM client
- Executes `next build` to compile the application
- Produces optimized Next.js standalone output

#### Stage 3: `runner`
- Minimal production image (only ~200-300MB)
- Copies only necessary files from builder
- Creates non-root user (nextjs:1001) for security
- Includes SQLite schema and Prisma client
- Exposes port 3000
- Includes healthcheck for orchestration

### Key Features

**Security:**
- Non-root user execution (user: nextjs)
- Read-only filesystem support (optional)
- No-new-privileges security option
- Health checks for monitoring

**Performance:**
- Multi-stage build reduces image size
- Layer caching optimization
- Node.js 18 Alpine (lightweight base)
- Standalone output eliminates node_modules from runtime

**Persistence:**
- SQLite database volume mount (`./data:/app/data`)
- Database URL: `file:/app/data/production.db`
- Automatic directory creation

**Resilience:**
- Restart policy: `unless-stopped`
- Health checks every 30 seconds
- JSON logging with rotation (10MB max per file, 3 files max)
- Resource limits and reservations

## Usage

### Build and Run with Docker Compose

```bash
# Build the image
docker-compose build

# Start the application
docker-compose up -d

# View logs
docker-compose logs -f autolog-app

# Stop the application
docker-compose down

# Stop and remove volumes (careful - deletes data!)
docker-compose down -v
```

### Manual Docker Commands

```bash
# Build the image
docker build -t autolog:latest .

# Run container with volume
docker run -d \
  -p 3000:3000 \
  -v ./data:/app/data \
  -e DATABASE_URL="file:/app/data/production.db" \
  -e NODE_ENV=production \
  --restart unless-stopped \
  --name autolog-app \
  autolog:latest

# Check application health
docker ps | grep autolog-app

# View logs
docker logs -f autolog-app
```

## Environment Configuration

### Required Variables

```env
NODE_ENV=production
DATABASE_URL=file:/app/data/production.db
LOCALE=he_IL
```

### Optional Variables

Add these to `docker-compose.yml` environment section or `.env` file:

```env
NEXT_PUBLIC_API_URL=https://your-api-url.com
JWT_SECRET=your-secret-key
SESSION_SECRET=your-session-key
# Additional application-specific variables
```

### Passing Environment Variables

**Option 1: Via docker-compose.yml**
```yaml
environment:
  DATABASE_URL: "file:/app/data/production.db"
  NEXT_PUBLIC_API_URL: "https://api.example.com"
```

**Option 2: Via .env file**
Create a `.env` file in the app directory and docker-compose will load it.

**Option 3: Via command line**
```bash
docker-compose -e DATABASE_URL="..." up -d
```

## Database Setup

### SQLite with Docker

The application uses SQLite with persistent storage:

```bash
# Database is automatically created at:
# /app/data/production.db

# Run migrations (if needed)
docker-compose exec autolog-app npx prisma migrate deploy

# Access database with Prisma Studio (optional)
docker-compose exec autolog-app npx prisma studio
```

### Production Database Migration

To migrate from SQLite to PostgreSQL:

1. Update `prisma/schema.prisma`:
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

2. Update docker-compose.yml:
```yaml
environment:
  DATABASE_URL: "postgresql://user:password@postgres-host:5432/autolog"
```

3. Run migrations:
```bash
docker-compose exec autolog-app npx prisma migrate deploy
```

## Image Optimization

### Image Size Comparison

- **With standalone output**: ~250-300MB
- **Without standalone output**: ~500-600MB+

### Build Cache Optimization

The Dockerfile uses layer caching:

1. `package.json` changes → rebuild deps stage only
2. Source code changes → rebuild builder and runner stages only
3. Dependency changes → full rebuild

## Monitoring and Health Checks

### Built-in Health Check

The container includes a health check that:
- Runs every 30 seconds
- Waits 40 seconds before first check (start_period)
- Marks unhealthy after 3 failed attempts
- Uses `wget` to check http://localhost:3000

Check health status:
```bash
docker ps # STATUS column shows healthy/unhealthy
```

### Logging

Logs are stored with automatic rotation:
- Format: JSON
- Max file size: 10MB
- Max files: 3
- View logs: `docker-compose logs -f`

## Security Hardening

### Current Security Features

1. **Non-root user**: Runs as `nextjs` (UID 1001)
2. **No privilege escalation**: `no-new-privileges:true`
3. **Read-only option**: Commented out - uncomment for enhanced security
4. **Network isolation**: Only exposed port 3000
5. **Resource limits**: CPU and memory limits configured

### Recommended for Production

```yaml
# Add to docker-compose.yml for enhanced security
read_only: true
tmpfs:
  - /tmp
networks:
  - autolog-network
```

## Troubleshooting

### Container won't start

```bash
# Check logs
docker-compose logs autolog-app

# Common issues:
# 1. Port 3000 already in use
docker ps | grep 3000

# 2. Database permission issues
ls -la ./data

# 3. Missing environment variables
docker-compose config | grep DATABASE_URL
```

### Database is locked

This typically occurs with SQLite under concurrent access:

```bash
# Solution: Use PostgreSQL for production
# See "Production Database Migration" section above
```

### High memory usage

Adjust limits in docker-compose.yml:
```yaml
deploy:
  resources:
    limits:
      memory: 512M  # Reduce if needed
```

## Deployment Checklist

- [ ] Update environment variables in docker-compose.yml
- [ ] Configure DATABASE_URL correctly
- [ ] Set NEXT_PUBLIC_* variables for client-side code
- [ ] Ensure port 3000 is available or mapped differently
- [ ] Create `./data` directory with proper permissions
- [ ] Build image: `docker-compose build`
- [ ] Test locally: `docker-compose up`
- [ ] Check health: `docker ps`
- [ ] Verify application: `curl http://localhost:3000`
- [ ] Set up log rotation
- [ ] Configure reverse proxy (nginx/traefik) for HTTPS
- [ ] Set resource limits based on available hardware
- [ ] Test graceful shutdown: `docker-compose down`

## Next Steps

1. **Reverse Proxy**: Set up nginx/Traefik for HTTPS and load balancing
2. **Database**: Migrate to PostgreSQL for production scale
3. **Monitoring**: Configure Prometheus/Grafana or similar
4. **Backup**: Implement automated database backups
5. **CI/CD**: Automate image builds and deployments

## References

- [Next.js Deployment Documentation](https://nextjs.org/docs/deployment)
- [Prisma Docker Guide](https://www.prisma.io/docs/guides/other/troubleshooting-orm/help-articles/docker)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [Node.js Docker Image](https://hub.docker.com/_/node)
