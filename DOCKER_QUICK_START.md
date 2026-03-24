# AutoLog Docker Quick Start

## One-Minute Setup

```bash
# 1. Build and start
docker-compose up -d

# 2. Verify it's running
docker ps | grep autolog-app

# 3. Test the application
curl http://localhost:3000
```

## Common Commands

| Command | Purpose |
|---------|---------|
| `docker-compose up -d` | Start application in background |
| `docker-compose down` | Stop and remove containers |
| `docker-compose logs -f` | View live logs |
| `docker-compose ps` | Check container status |
| `docker-compose build` | Rebuild image |
| `docker-compose exec autolog-app sh` | Access container shell |

## Environment Variables

Set in `docker-compose.yml` under `environment:` section:

```yaml
environment:
  NODE_ENV: production
  DATABASE_URL: "file:/app/data/production.db"
  LOCALE: "he_IL"
  NEXT_TELEMETRY_DISABLED: "1"
  # Add your custom variables here:
  # NEXT_PUBLIC_API_URL: "https://your-api.com"
  # JWT_SECRET: "your-secret"
```

## Database

- **Location**: `./data/production.db` (SQLite)
- **Persistence**: Automatic (volume mount)
- **Migrations**: Run `docker-compose exec autolog-app npx prisma migrate deploy`

## Troubleshooting

### Application not responding
```bash
docker-compose logs autolog-app  # Check error logs
docker-compose restart autolog-app
```

### Port 3000 already in use
```yaml
# Change port in docker-compose.yml:
ports:
  - "8000:3000"  # Map to different port
```

### Database errors
```bash
docker-compose down  # Stop
rm -rf ./data        # Delete database
docker-compose up    # Restart (fresh database)
```

## Next Steps

1. **HTTPS**: Set up reverse proxy (nginx/Traefik)
2. **Database**: Migrate to PostgreSQL for production
3. **Monitoring**: Add health monitoring and alerting
4. **Backup**: Configure automated database backups

See `DOCKER_SETUP.md` for comprehensive documentation.
