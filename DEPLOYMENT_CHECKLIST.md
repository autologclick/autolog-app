# AutoLog Security Hardening - Deployment Checklist

## Pre-Deployment (Development)

### Local Testing
- [ ] Run `npm install` to ensure all dependencies are installed
- [ ] Start dev server: `npm run dev`
- [ ] Test login endpoint: Works and enforces rate limiting
- [ ] Test register endpoint: Works and enforces rate limiting
- [ ] Test vehicle endpoints: Works and rate-limited
- [ ] Test RBAC: Regular user cannot access admin endpoints
- [ ] Test XSS sanitization: `<script>` tags are removed
- [ ] Test ownership: User A cannot access User B's vehicles
- [ ] Verify security headers present: `curl -I http://localhost:3000/`

### Code Review
- [ ] `/src/middleware.ts` - RBAC logic reviewed
- [ ] `/src/lib/rate-limit.ts` - Rate limiting strategy reviewed
- [ ] `/src/lib/env.ts` - Environment validation rules reviewed
- [ ] `/src/lib/api-helpers.ts` - Ownership and sanitization logic reviewed
- [ ] `/next.config.js` - Security headers reviewed
- [ ] All routes check authentication before processing

### Environment Setup
- [ ] Generate strong JWT_SECRET: `openssl rand -base64 32`
- [ ] Create `.env.local` for development testing
- [ ] Create `.env.production` for production secrets
- [ ] Verify `.env` files are in `.gitignore`
- [ ] Never commit secrets to repository

---

## Staging Deployment

### Before Deploying to Staging

- [ ] All tests passing locally
- [ ] No TypeScript errors: `npm run build`
- [ ] No linting errors: `npm run lint`
- [ ] Run security audit: `npm audit`
- [ ] All critical vulnerabilities resolved

### Staging Environment

- [ ] Deploy to staging URL
- [ ] Test with production-like database (PostgreSQL, not SQLite)
- [ ] Verify HTTPS enabled
- [ ] Test rate limiting under load
- [ ] Monitor performance metrics
- [ ] Check database logs for injection attempts
- [ ] Verify email notifications work (if applicable)

### Security Testing in Staging

```bash
# Test rate limiting
for i in {1..6}; do
  curl -X POST https://staging-autolog.example.com/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","password":"wrong"}'
done
# 6th attempt should return 429

# Test RBAC with invalid token
curl -H "Authorization: Bearer invalid" \
  https://staging-autolog.example.com/api/admin
# Should return 401

# Test XSS sanitization
curl -X POST https://staging-autolog.example.com/api/vehicles \
  -d '{"nickname":"<img src=x onerror=\"alert(1)\">"}'
# Should remove dangerous tags

# Test ownership restriction
# Login as user A, get vehicle ID
# Login as user B
curl https://staging-autolog.example.com/api/vehicles/{user_a_vehicle_id}
# Should return 403
```

### Staging Approval
- [ ] Security team approves hardening changes
- [ ] Load testing shows acceptable performance
- [ ] No regressions in existing functionality
- [ ] Quick-access demo login buttons work
- [ ] All Hebrew translations display correctly

---

## Production Deployment

### Pre-Production Tasks

- [ ] Database backed up
- [ ] Rollback plan documented
- [ ] Deployment window scheduled (low-traffic time)
- [ ] On-call engineer assigned
- [ ] Notification to stakeholders sent

### Production Environment Configuration

**Set these environment variables in production:**

```env
# Use PostgreSQL, not SQLite
DATABASE_URL=postgresql://user:secure-password@prod-db.example.com/autolog_prod

# Strong JWT secret (generate fresh)
JWT_SECRET=<output-from-openssl-rand-base64-32>

# Production app URL
NEXT_PUBLIC_APP_URL=https://autolog.example.com

# Node environment
NODE_ENV=production

# Optional: Disable development features
DEBUG=false
```

### Production Deployment Steps

1. **Pre-flight Checks**
   - [ ] All environment variables set
   - [ ] Database connection verified
   - [ ] Backups created
   - [ ] Monitoring enabled

2. **Deploy**
   - [ ] Deploy new code to production
   - [ ] Run database migrations if needed
   - [ ] Verify deployment health checks pass

3. **Post-Deployment Verification**
   - [ ] Application loads on production URL
   - [ ] Login works
   - [ ] Security headers present: `curl -I https://autolog.example.com/`
   - [ ] Rate limiting active (test with multiple requests)
   - [ ] RBAC enforced (test with different user roles)
   - [ ] No errors in application logs

4. **Monitor**
   - [ ] Watch error rate for 1 hour
   - [ ] Check 429 rate limit responses (expected)
   - [ ] Check 403 forbidden responses (expected for RBAC)
   - [ ] Monitor database query performance
   - [ ] Check for failed authentication attempts

### Post-Deployment Checklist
- [ ] All systems operating normally
- [ ] No unexpected errors or warnings
- [ ] Rate limiting working as expected
- [ ] User authentication working
- [ ] Vehicle data access controlled properly
- [ ] Security headers present in all responses
- [ ] Performance acceptable
- [ ] Backups are clean and verified

---

## After Deployment

### Week 1
- [ ] Monitor error logs daily
- [ ] Check for failed login patterns (potential attacks)
- [ ] Verify rate limiting is effective
- [ ] Collect feedback from users
- [ ] No critical bugs reported

### Week 2-4
- [ ] Reduce monitoring frequency to twice daily
- [ ] Update documentation based on findings
- [ ] Schedule security audit
- [ ] Review access logs for anomalies

### Monthly
- [ ] Run `npm audit` and update dependencies
- [ ] Review security logs
- [ ] Test disaster recovery procedures
- [ ] Update this checklist with lessons learned

---

## Rollback Procedure

**If issues occur after deployment:**

1. **Immediate Actions**
   - [ ] Assess severity of issue
   - [ ] Identify affected users
   - [ ] Notify stakeholders

2. **Rollback Decision**
   - [ ] Confirm rollback is needed
   - [ ] Have previous version ready
   - [ ] Notify database team if schema changed

3. **Rollback Steps**
   ```bash
   # Revert to previous commit
   git revert <commit-hash>
   # Or deploy previous tagged version
   git checkout v1.0.0
   npm run build
   # Deploy to production
   ```

4. **Post-Rollback**
   - [ ] Verify application works
   - [ ] Verify all features available
   - [ ] Check logs for errors
   - [ ] Communicate status to users
   - [ ] Schedule investigation meeting

---

## Monitoring & Maintenance

### Daily Checks (Automated)
```bash
# Monitor for errors
tail -f /var/log/autolog/error.log | grep -i "error\|warning"

# Check rate limiting activity
grep "429" /var/log/autolog/access.log | wc -l

# Check authentication failures
grep "401\|403" /var/log/autolog/access.log | wc -l
```

### Weekly Manual Review
- [ ] Security logs for suspicious patterns
- [ ] Rate limit effectiveness
- [ ] API response times
- [ ] Database performance
- [ ] Backup verification

### Monthly Security Review
- [ ] OWASP Top 10 checklist
- [ ] Dependency vulnerability scan
- [ ] Access control audit
- [ ] Data encryption verification

---

## Configuration Recommendations

### Web Server (Nginx Example)
```nginx
server {
  listen 443 ssl http2;
  server_name autolog.example.com;

  # SSL configuration
  ssl_certificate /etc/letsencrypt/live/autolog.example.com/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/autolog.example.com/privkey.pem;
  ssl_protocols TLSv1.2 TLSv1.3;

  # Security headers (backup, Next.js headers are primary)
  add_header Strict-Transport-Security "max-age=31536000" always;
  add_header X-Content-Type-Options "nosniff" always;
  add_header X-Frame-Options "DENY" always;

  # Proxy to Node
  location / {
    proxy_pass http://localhost:3000;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
```

### Database (PostgreSQL)
```sql
-- Create restricted user for app
CREATE USER autolog_app WITH PASSWORD 'strong-password';
GRANT CONNECT ON DATABASE autolog_prod TO autolog_app;
GRANT USAGE ON SCHEMA public TO autolog_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO autolog_app;

-- Audit logging
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
-- Restrict to own records
CREATE POLICY user_isolation ON users
  USING (auth.uid() = id);
```

### Monitoring (Example Tools)
- **Error Tracking:** Sentry, DataDog
- **Performance:** New Relic, CloudWatch
- **Security:** Snyk, Aqua Security
- **Logging:** ELK Stack, Splunk, CloudWatch Logs

---

## Emergency Contacts

| Role | Name | Email | Phone |
|------|------|-------|-------|
| Security Lead | [Name] | [Email] | [Phone] |
| DevOps Lead | [Name] | [Email] | [Phone] |
| Database Admin | [Name] | [Email] | [Phone] |
| Incident Commander | [Name] | [Email] | [Phone] |

---

## Sign-Off

- [ ] **Security Team:** Approved for production
  - Name: _________________ Date: _________

- [ ] **DevOps Team:** Deployment procedures reviewed
  - Name: _________________ Date: _________

- [ ] **Product Owner:** Release approved
  - Name: _________________ Date: _________

---

## Notes & Lessons Learned

```
[Use this space to document any issues encountered and lessons learned]



```

---

**Document Version:** 1.0
**Last Updated:** March 20, 2026
**Next Review:** June 20, 2026
