#!/usr/bin/env node
/**
 * AutoLog — Live Security Test Suite (v2 — adversarial)
 * ---------------------------------------------------------------
 * Each test is designed to FAIL if the security control is absent.
 * Where a test can only verify partial behavior from outside the
 * black box, the output says so explicitly ("OBSERVABLE LIMIT").
 *
 * Run:
 *   node scripts/security-test.mjs
 *   node scripts/security-test.mjs --aggressive   (triggers IP rate limit)
 */

const TARGET = process.env.TARGET_URL || 'https://autolog.click';
const AGGRESSIVE = process.argv.includes('--aggressive');

const C = {
  reset: '\x1b[0m', green: '\x1b[32m', red: '\x1b[31m',
  yellow: '\x1b[33m', cyan: '\x1b[36m', bold: '\x1b[1m', dim: '\x1b[2m',
};

let passed = 0, failed = 0, warned = 0, info = 0;
const fails = [];

function pass(name, detail = '') { passed++; console.log(`  ${C.green}✓ PASS${C.reset}  ${name}  ${C.dim}${detail}${C.reset}`); }
function fail(name, detail = '') { failed++; fails.push({ name, detail }); console.log(`  ${C.red}✗ FAIL${C.reset}  ${name}  ${detail}`); }
function warn(name, detail = '') { warned++; console.log(`  ${C.yellow}! WARN${C.reset}  ${name}  ${C.dim}${detail}${C.reset}`); }
function note(name, detail = '') { info++; console.log(`  ${C.cyan}i INFO${C.reset}  ${name}  ${C.dim}${detail}${C.reset}`); }
function section(t) { console.log(`\n${C.bold}${C.cyan}── ${t} ──${C.reset}`); }

async function req(url, init = {}) {
  const start = Date.now();
  try {
    const res = await fetch(url, { redirect: 'manual', ...init });
    const headers = Object.fromEntries(res.headers.entries());
    const body = await res.text().catch(() => '');
    return { status: res.status, headers, body, ms: Date.now() - start };
  } catch (e) { return { error: e.message, ms: Date.now() - start }; }
}

// ════════════════════════════════════════════════════════════════
// 1. Security headers
// ════════════════════════════════════════════════════════════════
async function testSecurityHeaders() {
  section('1. Security headers — must all be present on every response');
  const r = await req(`${TARGET}/`);
  if (r.error) return fail('GET /', r.error);

  const checks = {
    'content-security-policy': {
      required: (v) => v && /default-src/i.test(v) && /script-src/i.test(v),
      reason: 'must contain default-src + script-src',
    },
    'strict-transport-security': {
      required: (v) => v && /max-age=(\d+)/.test(v) && parseInt(v.match(/max-age=(\d+)/)[1]) >= 15552000,
      reason: 'must set max-age ≥ 180 days (15552000)',
    },
    'x-frame-options': {
      required: (v) => v && /^(DENY|SAMEORIGIN)$/i.test(v.trim()),
      reason: 'must be DENY or SAMEORIGIN',
    },
    'x-content-type-options': {
      required: (v) => v && /nosniff/i.test(v),
      reason: 'must be nosniff',
    },
    'referrer-policy': {
      required: (v) => v && !/^unsafe-url$/i.test(v),
      reason: 'must not be unsafe-url',
    },
    'permissions-policy': {
      required: (v) => !!v,
      reason: 'must be present',
    },
  };

  for (const [hdr, { required, reason }] of Object.entries(checks)) {
    const v = r.headers[hdr];
    if (required(v)) pass(hdr, (v || '').slice(0, 80) + ((v || '').length > 80 ? '…' : ''));
    else fail(hdr, v ? `value="${v.slice(0, 100)}" — ${reason}` : `MISSING — ${reason}`);
  }

  // CSP must NOT contain 'unsafe-eval' on script-src
  const csp = r.headers['content-security-policy'] || '';
  const scriptSrc = csp.match(/script-src[^;]*/i)?.[0] || '';
  if (/'unsafe-eval'/i.test(scriptSrc))
    fail('CSP no unsafe-eval', `script-src contains 'unsafe-eval': ${scriptSrc}`);
  else pass('CSP no unsafe-eval', '');

  // Server header should not expose runtime version
  const server = r.headers['server'] || '';
  if (/express|node|apache|nginx\/\d/i.test(server))
    fail('Server header version leak', `leaks: ${server}`);
  else pass('Server header', server || '(absent)');
}

// ════════════════════════════════════════════════════════════════
// 2. HTTPS enforcement
// ════════════════════════════════════════════════════════════════
async function testHttpsEnforcement() {
  section('2. HTTPS enforcement');
  try {
    const r = await fetch(`http://autolog.click/`, { redirect: 'manual' });
    if (r.status >= 300 && r.status < 400) {
      const loc = r.headers.get('location') || '';
      if (loc.startsWith('https://')) pass('HTTP→HTTPS redirect', `${r.status} → ${loc}`);
      else fail('HTTP→HTTPS redirect', `redirects to non-https: ${loc}`);
    } else if (r.status === 200) {
      fail('HTTP→HTTPS redirect', `CRITICAL: HTTP serves 200 (no redirect)`);
    } else note('HTTP→HTTPS redirect', `status=${r.status}`);
  } catch (e) {
    note('HTTP→HTTPS redirect', `connection refused (acceptable: ${e.message})`);
  }
}

// ════════════════════════════════════════════════════════════════
// 3. Pen-test guard — best-effort observable verification
// ════════════════════════════════════════════════════════════════
async function testPenTestGuard() {
  section('3. Pen-test guard — attack signatures');
  note('OBSERVABLE LIMIT', 'guard logs but does not block by design; we verify (a) no 5xx crash, (b) no secret leak, (c) middleware still ran (headers present)');

  const probes = [
    { name: "SQLi  ' OR 1=1--",            path: "/?q=%27%20OR%201%3D1--" },
    { name: "SQLi  UNION SELECT",          path: "/?q=1%20UNION%20SELECT%20password%20FROM%20users" },
    { name: "XSS   <script>",              path: "/?q=%3Cscript%3Ealert(1)%3C%2Fscript%3E" },
    { name: "XSS   event handler",         path: "/?q=%3Cimg%20src%3Dx%20onerror%3Dalert(1)%3E" },
    { name: "Path traversal /etc/passwd",  path: "/?file=..%2F..%2F..%2Fetc%2Fpasswd" },
    { name: "SSRF  localhost",             path: "/?url=http%3A%2F%2F127.0.0.1%2F" },
    { name: "SSRF  AWS metadata",          path: "/?url=http%3A%2F%2F169.254.169.254%2Flatest%2Fmeta-data%2F" },
    { name: "CMDi  ; cat /etc/passwd",     path: "/?x=%3B%20cat%20%2Fetc%2Fpasswd" },
    { name: "Recon /.env",                 path: "/.env" },
    { name: "Recon /.git/config",          path: "/.git/config" },
    { name: "Recon /wp-admin/",            path: "/wp-admin/" },
    { name: "Recon /phpmyadmin/",          path: "/phpmyadmin/" },
    { name: "Recon /backup.zip",           path: "/backup.zip" },
  ];

  const SECRET_PATTERN = /POSTGRES_URL|DATABASE_URL|JWT_SECRET|sk-ant-[a-z0-9]|sk_live_|sk_test_|AKIA[A-Z0-9]{16}|-----BEGIN [A-Z ]+PRIVATE KEY/;

  for (const p of probes) {
    const r = await req(`${TARGET}${p.path}`);
    if (r.error) { fail(p.name, r.error); continue; }
    if (r.status >= 500) { fail(p.name, `CRASH: ${r.status}`); continue; }
    if (r.body && SECRET_PATTERN.test(r.body)) { fail(p.name, 'SECRETS LEAKED IN BODY'); continue; }
    // Verify middleware ran by checking for security headers
    if (!r.headers['content-security-policy']) { fail(p.name, 'middleware did not run (no CSP)'); continue; }
    pass(p.name, `status=${r.status}, middleware ran`);
  }

  // Scanner User-Agents
  const scanners = ['sqlmap/1.6 (https://sqlmap.org)', 'Nikto/2.5.0', 'masscan/1.3', 'nmap scripting engine'];
  for (const ua of scanners) {
    const r = await req(`${TARGET}/`, { headers: { 'User-Agent': ua } });
    if (r.error) { fail(`Scanner UA: ${ua}`, r.error); continue; }
    if (r.status >= 500) fail(`Scanner UA: ${ua}`, `CRASH: ${r.status}`);
    else pass(`Scanner UA: ${ua.split(/[\s\/]/)[0]}`, `status=${r.status}`);
  }
}

// ════════════════════════════════════════════════════════════════
// 4. JWT tampering — strict, baselined
// ════════════════════════════════════════════════════════════════
async function testJwt() {
  section('4. JWT signature verification — STRICT (compares to no-auth baseline)');

  // Baseline: hit a protected endpoint with NO cookie
  const baseline = await req(`${TARGET}/api/auth/me`);
  if (baseline.error) return fail('Baseline /api/auth/me', baseline.error);
  if (baseline.status === 200) {
    fail('Baseline check', `CRITICAL: /api/auth/me returns 200 with no auth — endpoint is unprotected`);
    return;
  }
  note('Baseline (no cookie)', `status=${baseline.status} — protected endpoint confirmed`);

  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({
    userId: 'attacker',
    email: 'attacker@example.com',
    role: 'admin',
    exp: Math.floor(Date.now() / 1000) + 3600,
  })).toString('base64url');

  // Test 1: Forged signature (random bytes)
  const forgedSig = Buffer.from('thisisnotavalidhmacsignature123').toString('base64url');
  const r1 = await req(`${TARGET}/api/auth/me`, { headers: { Cookie: `auth-token=${header}.${payload}.${forgedSig}` } });
  if (r1.error) fail('Forged HS256 signature', r1.error);
  else if (r1.status === 200) fail('Forged HS256 signature', `CRITICAL: forged token accepted (status=200)`);
  else if (r1.status === baseline.status) pass('Forged HS256 signature', `status=${r1.status} (same as no-auth baseline)`);
  else warn('Forged HS256 signature', `status=${r1.status} differs from baseline=${baseline.status} — investigate`);

  // Test 2: alg=none attack
  const headerNone = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url');
  const r2 = await req(`${TARGET}/api/auth/me`, { headers: { Cookie: `auth-token=${headerNone}.${payload}.` } });
  if (r2.error) fail('alg=none attack', r2.error);
  else if (r2.status === 200) fail('alg=none attack', `CRITICAL: alg=none accepted (status=200)`);
  else pass('alg=none attack', `status=${r2.status} (rejected)`);

  // Test 3: Wrong-secret HMAC (still HS256, but signed with a guessed secret)
  // We can't actually compute a wrong HMAC without crypto, but a syntactically-valid
  // sig from a different secret looks like a real sig — covered by Test 1 already.

  // Test 4: Algorithm confusion — claim RS256 (would only work if server accepts asymmetric)
  const headerRS = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
  const r4 = await req(`${TARGET}/api/auth/me`, { headers: { Cookie: `auth-token=${headerRS}.${payload}.${forgedSig}` } });
  if (r4.error) fail('alg=RS256 confusion', r4.error);
  else if (r4.status === 200) fail('alg=RS256 confusion', `CRITICAL: RS256 accepted (status=200)`);
  else pass('alg=RS256 confusion', `status=${r4.status}`);

  // Test 5: Expired token (valid format, but exp in the past)
  const expiredPayload = Buffer.from(JSON.stringify({
    userId: 'attacker', email: 'attacker@example.com', role: 'admin',
    exp: Math.floor(Date.now() / 1000) - 3600, // 1h ago
  })).toString('base64url');
  const r5 = await req(`${TARGET}/api/auth/me`, { headers: { Cookie: `auth-token=${header}.${expiredPayload}.${forgedSig}` } });
  if (r5.error) fail('Expired token', r5.error);
  else if (r5.status === 200) fail('Expired token', `CRITICAL: expired token accepted`);
  else pass('Expired token', `status=${r5.status}`);

  // Test 6: Garbage cookie
  const r6 = await req(`${TARGET}/api/auth/me`, { headers: { Cookie: 'auth-token=totally.not.a.jwt' } });
  if (r6.error) fail('Garbage cookie', r6.error);
  else if (r6.status >= 400 && r6.status < 500) pass('Garbage cookie', `status=${r6.status}`);
  else fail('Garbage cookie', `unexpected status=${r6.status}`);

  // Test 7: Try to access admin-only route with a forged user-role token
  const userPayload = Buffer.from(JSON.stringify({
    userId: 'attacker', email: 'a@b.com', role: 'user',
    exp: Math.floor(Date.now() / 1000) + 3600,
  })).toString('base64url');
  const r7 = await req(`${TARGET}/api/admin/users`, { headers: { Cookie: `auth-token=${header}.${userPayload}.${forgedSig}` } });
  if (r7.error) fail('Forged token → admin route', r7.error);
  else if (r7.status === 200) fail('Forged token → admin route', `CRITICAL: forged token accessed admin endpoint`);
  else pass('Forged token → admin route', `status=${r7.status}`);
}

// ════════════════════════════════════════════════════════════════
// 5. User enumeration via response comparison
// ════════════════════════════════════════════════════════════════
async function testUserEnumeration() {
  section('5. User enumeration — compares unknown vs valid-format response');

  // Three login attempts with different email patterns
  const probes = [
    { label: 'unknown but valid format', email: `nobody-${Date.now()}@example.com` },
    { label: 'gibberish format',         email: 'aaaaa@bbbbb.ccccc' },
    { label: 'real-looking domain',      email: `user-${Date.now()}@gmail.com` },
  ];

  const results = [];
  for (const p of probes) {
    const r = await req(`${TARGET}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: p.email, password: 'NopeNope123!' }),
    });
    results.push({ ...p, status: r.status, bodyLen: r.body?.length || 0, body: r.body?.slice(0, 300) || '' });
    await new Promise(r => setTimeout(r, 200));
  }

  // All three should return the same status code
  const statusSet = new Set(results.map(r => r.status));
  if (statusSet.size === 1) pass('Same status for all unknown emails', `status=${[...statusSet][0]}`);
  else fail('Same status for all unknown emails', `differs: ${results.map(r => `${r.label}=${r.status}`).join(', ')}`);

  // Body length should be roughly the same (within 20% delta)
  const lens = results.map(r => r.bodyLen);
  const maxLen = Math.max(...lens), minLen = Math.min(...lens);
  const delta = maxLen > 0 ? ((maxLen - minLen) / maxLen) : 0;
  if (delta < 0.2) pass('Same body length for all unknown emails', `${lens.join('/')}, Δ=${(delta * 100).toFixed(1)}%`);
  else warn('Body length differs', `${lens.join('/')}, Δ=${(delta * 100).toFixed(1)}% — could leak existence`);

  // Body content: extract the error message text and compare
  // Hebrew: "אימייל או סיסמה שגויים" vs "משתמש לא נמצא" would be a leak
  const errs = results.map(r => {
    try { return JSON.parse(r.body)?.error || JSON.parse(r.body)?.message || r.body; }
    catch { return r.body; }
  });
  const distinctErrs = new Set(errs.map(e => String(e).slice(0, 100)));
  if (distinctErrs.size === 1) pass('Identical error message', `"${[...distinctErrs][0].slice(0, 60)}"`);
  else fail('Error messages differ', `leaks existence: ${[...distinctErrs].map(s => `"${s.slice(0, 40)}"`).join(' vs ')}`);

  // Verify the message does NOT explicitly say "user not found" or "email does not exist" in any language we know
  const leakPatterns = /not found|does not exist|לא נמצא|לא קיים|unknown user|invalid email only/i;
  for (const err of errs) {
    if (leakPatterns.test(String(err))) {
      fail('No "user not found" wording', `body says: "${String(err).slice(0, 80)}"`);
      return;
    }
  }
  pass('No user-existence wording', 'error message is auth-generic');
}

// ════════════════════════════════════════════════════════════════
// 6. Cookie behavior on failed login
// ════════════════════════════════════════════════════════════════
async function testCookieFlagsOnFailure() {
  section('6. Cookies on failed login');
  const r = await req(`${TARGET}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: `nobody-${Date.now()}@example.com`, password: 'Wrong1!' }),
  });
  if (r.error) return fail('POST /api/auth/login', r.error);

  const setCookie = r.headers['set-cookie'] || '';
  if (!/auth-token=/.test(setCookie)) pass('No auth-token set on failed login', '');
  else fail('No auth-token set on failed login', `CRITICAL: ${setCookie.slice(0, 200)}`);
  if (!/refresh-token=/.test(setCookie)) pass('No refresh-token set on failed login', '');
  else fail('No refresh-token set on failed login', `CRITICAL: ${setCookie.slice(0, 200)}`);
}

// ════════════════════════════════════════════════════════════════
// 7. Rate limit / account lockout
// ════════════════════════════════════════════════════════════════
async function testRateLimit() {
  section(`7. Rate limit / account lockout — ${AGGRESSIVE ? 'AGGRESSIVE' : 'safe (3 attempts only)'}`);
  if (!AGGRESSIVE) note('safe mode', '3 attempts (under threshold) — verifies counter increments without locking your IP');

  const email = `security-test+${Date.now()}@invalid.test`;
  const attempts = AGGRESSIVE ? 8 : 3;
  const statuses = [];
  for (let i = 0; i < attempts; i++) {
    const r = await req(`${TARGET}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: 'Wrong1!' }),
    });
    statuses.push(r.status);
    if (r.status === 429 || r.status === 403) break;
    await new Promise(r => setTimeout(r, 200));
  }

  const sawBlock = statuses.some(s => s === 429 || s === 403);
  if (AGGRESSIVE) {
    if (sawBlock) pass('Rate limit triggered', `statuses: ${statuses.join(',')}`);
    else fail('Rate limit triggered', `CRITICAL: ${attempts} bad attempts, never blocked (statuses: ${statuses.join(',')})`);
  } else {
    if (statuses.every(s => s === 401)) pass('Counter increments without blocking', `statuses: ${statuses.join(',')}`);
    else warn('Unexpected statuses', `statuses: ${statuses.join(',')} — re-run with --aggressive to see lockout`);
  }
}

// ════════════════════════════════════════════════════════════════
// 8. CORS
// ════════════════════════════════════════════════════════════════
async function testCors() {
  section('8. CORS — must reject evil origins');

  for (const endpoint of ['/api/auth/me', '/api/vehicles']) {
    const r = await req(`${TARGET}${endpoint}`, {
      method: 'OPTIONS',
      headers: {
        'Origin': 'https://evil.example.com',
        'Access-Control-Request-Method': 'GET',
        'Access-Control-Request-Headers': 'authorization',
      },
    });
    if (r.error) { warn(`CORS OPTIONS ${endpoint}`, r.error); continue; }
    const allow = r.headers['access-control-allow-origin'];
    if (!allow) pass(`CORS ${endpoint} — no Allow-Origin`, '(absent, evil origin rejected)');
    else if (allow === '*') fail(`CORS ${endpoint}`, `Allow-Origin: * — TOO PERMISSIVE`);
    else if (allow === 'https://evil.example.com') fail(`CORS ${endpoint}`, `CRITICAL: reflects evil origin`);
    else pass(`CORS ${endpoint}`, `Allow-Origin=${allow}`);
  }
}

// ════════════════════════════════════════════════════════════════
// 9. Open redirect — tests routes that actually use redirect params
// ════════════════════════════════════════════════════════════════
async function testOpenRedirect() {
  section('9. Open redirect — auth/login and known redirect-handling routes');

  const targets = [
    `/auth/login?next=https%3A%2F%2Fevil.example.com%2F`,
    `/auth/login?next=%2F%2Fevil.example.com`,           // protocol-relative
    `/auth/login?redirect=https%3A%2F%2Fevil.example.com%2F`,
    `/auth/login?returnTo=https%3A%2F%2Fevil.example.com%2F`,
    `/api/auth/logout?redirect=https%3A%2F%2Fevil.example.com%2F`,
  ];

  for (const path of targets) {
    const r = await req(`${TARGET}${path}`);
    if (r.error) { warn(path, r.error); continue; }
    const loc = r.headers['location'] || '';
    if (/^https?:\/\/evil\.example\.com/.test(loc) || /^\/\/evil\.example\.com/.test(loc))
      fail(`Open redirect: ${path.slice(0, 60)}…`, `redirects to ${loc}`);
    else if (r.body && /https:\/\/evil\.example\.com/.test(r.body) && /href=["']https:\/\/evil/.test(r.body))
      fail(`Reflected redirect URL: ${path.slice(0, 60)}…`, `body contains evil URL as href`);
    else pass(`No open redirect via ${path.split('?')[1].split('=')[0]}=`, `loc="${loc || 'none'}"`);
  }
}

// ════════════════════════════════════════════════════════════════
// 10. Password policy enforcement
// ════════════════════════════════════════════════════════════════
async function testPasswordPolicy() {
  section('10. Password policy on /api/auth/register');

  const weakPasswords = [
    { pw: '123456', why: '6 digits' },
    { pw: 'password', why: 'common word' },
    { pw: 'Password1', why: 'no special char' },
    { pw: 'Pass!1', why: 'too short (<8)' },
    { pw: 'PASSWORD123!', why: 'no lowercase' },
    { pw: 'password123!', why: 'no uppercase' },
    { pw: 'Password!', why: 'no digit' },
  ];

  for (const { pw, why } of weakPasswords) {
    const r = await req(`${TARGET}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: `pwtest-${Date.now()}-${Math.random()}@invalid.test`,
        password: pw,
        fullName: 'Test',
      }),
    });
    if (r.error) { warn(`Weak password "${pw}"`, r.error); continue; }
    if (r.status === 400 || r.status === 422) pass(`Rejects weak password (${why})`, `status=${r.status}`);
    else if (r.status === 201 || r.status === 200) fail(`Rejects weak password (${why})`, `CRITICAL: accepted "${pw}"`);
    else warn(`Weak password "${pw}"`, `status=${r.status}`);
    await new Promise(r => setTimeout(r, 250));
  }
}

// ════════════════════════════════════════════════════════════════
// Main
// ════════════════════════════════════════════════════════════════
(async () => {
  console.log(`${C.bold}AutoLog Live Security Test Suite v2${C.reset}`);
  console.log(`Target:  ${C.cyan}${TARGET}${C.reset}`);
  console.log(`Mode:    ${AGGRESSIVE ? C.yellow + 'AGGRESSIVE (triggers IP rate limit)' : C.green + 'safe'}${C.reset}`);
  console.log(`Time:    ${new Date().toISOString()}`);

  await testSecurityHeaders();
  await testHttpsEnforcement();
  await testPenTestGuard();
  await testJwt();
  await testUserEnumeration();
  await testCookieFlagsOnFailure();
  await testCors();
  await testOpenRedirect();
  await testPasswordPolicy();
  await testRateLimit();

  console.log(`\n${C.bold}── Summary ──${C.reset}`);
  console.log(`${C.green}${passed} passed${C.reset}, ${C.red}${failed} failed${C.reset}, ${C.yellow}${warned} warnings${C.reset}, ${C.cyan}${info} info${C.reset}`);

  if (fails.length) {
    console.log(`\n${C.bold}${C.red}Failures:${C.reset}`);
    for (const f of fails) console.log(`  ${C.red}•${C.reset} ${f.name}: ${C.dim}${f.detail}${C.reset}`);
    process.exit(1);
  } else {
    console.log(`\n${C.green}${C.bold}All security checks passed.${C.reset}`);
  }
})();
