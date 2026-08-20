import http from 'node:http';
import { URL } from 'node:url';
import { createHash } from 'node:crypto';
import { SignJWT } from 'jose';
import mysql from 'mysql2/promise';

const BASE = 'http://127.0.0.1:3000';
const AUTH_SECRET = process.env.AUTH_SECRET || 'development-auth-secret-change-me';
const DB = {
  host: '172.29.236.10',
  port: 3306,
  user: 'aromacraft_user',
  password: 'local_app_password',
  database: 'aromacraft',
};

const jar = new Map();
const log = console.log;

function setCookieHeader(setCookie) {
  if (!setCookie) return;
  const values = Array.isArray(setCookie) ? setCookie : [setCookie];
  for (const value of values) {
    const [cookie] = value.split(';');
    const [name] = cookie.split('=');
    jar.set(name, cookie);
  }
}

function getCookieHeader() {
  return Array.from(jar.values()).join('; ');
}

function getCookieValue(name) {
  const cookie = jar.get(name);
  if (!cookie) return null;
  return cookie.split('=')[1] || null;
}

async function request(path, options = {}) {
  const url = new URL(path, BASE);
  const reqHeaders = { ...(options.headers || {}) };
  if (jar.size) reqHeaders.cookie = getCookieHeader();
  const body = options.body ? Buffer.from(options.body) : undefined;
  if (body) {
    reqHeaders['content-length'] = body.length;
  }

  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        protocol: url.protocol,
        hostname: url.hostname,
        port: url.port,
        path: `${url.pathname}${url.search}`,
        method: options.method || 'GET',
        headers: reqHeaders,
      },
      (res) => {
        let data = '';
        res.setEncoding('utf8');
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          if (res.headers['set-cookie']) setCookieHeader(res.headers['set-cookie']);
          resolve({ statusCode: res.statusCode, headers: res.headers, body: data });
        });
      }
    );
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

async function querySessionByCookieValue(rawToken) {
  const tokenHash = createHash('sha256').update(rawToken).digest('hex');
  const conn = await mysql.createConnection(DB);
  const [rows] = await conn.execute('SELECT id, userId, status, expiresAt, tokenHash FROM Session WHERE tokenHash = ?', [tokenHash]);
  await conn.end();
  return rows;
}

function parseMaxAge(setCookieValue) {
  const parts = setCookieValue.split(';').map((s) => s.trim());
  const maxAge = parts.find((p) => p.toLowerCase().startsWith('max-age='));
  if (!maxAge) return null;
  const num = Number(maxAge.split('=')[1]);
  return Number.isNaN(num) ? null : num;
}

async function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function run() {
  log('BEGIN LIVE AUTH REGRESSION');

  log('1) Anonymous GET /dashboard should redirect to /login');
  const anonDashboard = await request('/dashboard');
  log('  status', anonDashboard.statusCode, 'location', anonDashboard.headers.location || '-');
  await assert([302, 307].includes(anonDashboard.statusCode), 'Expected redirect status for anonymous dashboard');
  await assert(anonDashboard.headers.location?.includes('/login'), 'Expected anonymous dashboard redirect to /login');

  log('2) Login seeded user');
  const login = await request('/api/auth/login', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: 'email=tbabak@example.com&password=Teymouribabak78%23',
  });
  log('  status', login.statusCode);
  await assert(login.statusCode === 200, 'Login failed for seeded user');
  const cookies = Array.isArray(login.headers['set-cookie']) ? login.headers['set-cookie'] : [login.headers['set-cookie']].filter(Boolean);
  await assert(cookies.some((c) => c.includes('aromacraft_sid=')), 'Missing aromacraft_sid cookie');
  await assert(cookies.some((c) => c.includes('aromacraft_route_hint=')), 'Missing aromacraft_route_hint cookie');
  await assert(cookies.some((c) => /HttpOnly/i.test(c)), 'Expected HttpOnly cookies');

  const sidRaw = getCookieValue('aromacraft_sid');
  const routeHintRaw = getCookieValue('aromacraft_route_hint');
  await assert(sidRaw, 'Session cookie missing after login');
  await assert(routeHintRaw, 'Route hint cookie missing after login');

  log('3) Verify DB session row exists and stores only hashed token');
  const sessionRows = await querySessionByCookieValue(sidRaw);
  log('  rows', sessionRows.length);
  await assert(sessionRows.length === 1, 'Expected exactly one DB session row');
  await assert(sessionRows[0].tokenHash && sessionRows[0].tokenHash.length >= 64, 'Expected hashed token in DB row');
  await assert(sessionRows[0].tokenHash !== sidRaw, 'Stored tokenHash should not equal raw session token');

  log('4) Authenticated GET /api/auth/me returns 200');
  const me = await request('/api/auth/me');
  log('  status', me.statusCode);
  await assert(me.statusCode === 200, 'Expected authenticated /api/auth/me to return 200');
  await assert(me.body.includes('tbabak@example.com'), 'Expected authenticated user email in /api/auth/me body');

  log('5) Authenticated GET /dashboard returns 200');
  const dashboardAuthed = await request('/dashboard');
  log('  status', dashboardAuthed.statusCode, 'location', dashboardAuthed.headers.location || '-');
  await assert(dashboardAuthed.statusCode === 200, 'Expected authenticated /dashboard to return 200');

  log('6) Route-hint-only access must not grant /dashboard');
  const hintOnlyJar = new Map(jar);
  hintOnlyJar.delete('aromacraft_sid');
  const hintOnlyResult = await (() => {
    const url = new URL('/dashboard', BASE);
    return new Promise((resolve, reject) => {
      const req = http.request({ protocol: url.protocol, hostname: url.hostname, port: url.port, path: url.pathname, method: 'GET', headers: { cookie: Array.from(hintOnlyJar.values()).join('; ') } }, (res) => {
        res.on('data', () => {});
        res.on('end', () => resolve({ statusCode: res.statusCode, headers: res.headers }));
      });
      req.on('error', reject);
      req.end();
    });
  })();
  log('  status', hintOnlyResult.statusCode, 'location', hintOnlyResult.headers.location || '-');
  await assert([302, 307].includes(hintOnlyResult.statusCode), 'Expected route-hint-only /dashboard to redirect');
  await assert(hintOnlyResult.headers.location?.includes('/login'), 'Expected route-hint-only /dashboard redirect to /login');

  log('7) Malformed route-hint should not grant /dashboard');
  const malformedResult = await (() => {
    const url = new URL('/dashboard', BASE);
    return new Promise((resolve, reject) => {
      const req = http.request({ protocol: url.protocol, hostname: url.hostname, port: url.port, path: url.pathname, method: 'GET', headers: { cookie: 'aromacraft_route_hint=not-a-valid-token' } }, (res) => {
        res.on('data', () => {});
        res.on('end', () => resolve({ statusCode: res.statusCode, headers: res.headers }));
      });
      req.on('error', reject);
      req.end();
    });
  })();
  log('  status', malformedResult.statusCode, 'location', malformedResult.headers.location || '-');
  await assert([302, 307].includes(malformedResult.statusCode), 'Expected malformed route-hint to redirect');

  log('8) Expired route-hint should not grant /dashboard');
  const expiredHint = await new SignJWT({ userId: 'u_customer', role: 'customer' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt(Math.floor(Date.now() / 1000) - 3600)
    .setExpirationTime(Math.floor(Date.now() / 1000) - 10)
    .sign(new TextEncoder().encode(AUTH_SECRET));
  const expiredResult = await (() => {
    const url = new URL('/dashboard', BASE);
    return new Promise((resolve, reject) => {
      const req = http.request({ protocol: url.protocol, hostname: url.hostname, port: url.port, path: url.pathname, method: 'GET', headers: { cookie: `aromacraft_route_hint=${expiredHint}` } }, (res) => {
        res.on('data', () => {});
        res.on('end', () => resolve({ statusCode: res.statusCode, headers: res.headers }));
      });
      req.on('error', reject);
      req.end();
    });
  })();
  log('  status', expiredResult.statusCode, 'location', expiredResult.headers.location || '-');
  await assert([302, 307].includes(expiredResult.statusCode), 'Expected expired route-hint to redirect');

  log('9) Tampered route-hint should not grant /dashboard');
  const tamperedHint = expiredHint.slice(0, -1) + (expiredHint.slice(-1) === 'a' ? 'b' : 'a');
  const tamperedResult = await (() => {
    const url = new URL('/dashboard', BASE);
    return new Promise((resolve, reject) => {
      const req = http.request({ protocol: url.protocol, hostname: url.hostname, port: url.port, path: url.pathname, method: 'GET', headers: { cookie: `aromacraft_route_hint=${tamperedHint}` } }, (res) => {
        res.on('data', () => {});
        res.on('end', () => resolve({ statusCode: res.statusCode, headers: res.headers }));
      });
      req.on('error', reject);
      req.end();
    });
  })();
  log('  status', tamperedResult.statusCode, 'location', tamperedResult.headers.location || '-');
  await assert([302, 307].includes(tamperedResult.statusCode), 'Expected tampered route-hint to redirect');

  log('10) Logout should clear cookies and delete session');
  const logout = await request('/api/auth/logout', { method: 'POST' });
  log('  status', logout.statusCode);
  await assert([200, 204].includes(logout.statusCode), 'Expected logout to succeed');
  const afterRows = await querySessionByCookieValue(sidRaw);
  log('  db rows after logout', afterRows.length);
  await assert(afterRows.length === 0, 'Expected session row removed after logout');

  log('11) Post-logout /api/auth/me returns 401');
  const meAfterLogout = await request('/api/auth/me');
  log('  status', meAfterLogout.statusCode);
  await assert(meAfterLogout.statusCode === 401, 'Expected /api/auth/me to return 401 after logout');

  log('12) Post-logout GET /dashboard redirects to /login');
  const dashboardAfterLogout = await request('/dashboard');
  log('  status', dashboardAfterLogout.statusCode, 'location', dashboardAfterLogout.headers.location || '-');
  await assert([302, 307].includes(dashboardAfterLogout.statusCode), 'Expected /dashboard to redirect after logout');
  await assert(dashboardAfterLogout.headers.location?.includes('/login'), 'Expected /dashboard redirect to /login after logout');

  log('13) Signup missing fields returns 400');
  const signupBad = await request('/api/auth/signup', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: 'bad@example.com' }) });
  log('  status', signupBad.statusCode);
  await assert(signupBad.statusCode === 400, 'Expected signup missing fields to return 400');

  log('14) Signup duplicate account returns 409');
  const signupDuplicate = await request('/api/auth/signup', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      firstName: 'Babak',
      lastName: 'Teymouri',
      gender: 'male',
      username: 'Tbabak1',
      mobile: '1234567890',
      countryCode: 'US',
      email: process.env.E2E_CUSTOMER_EMAIL || 'tbabak@example.com',
      password: process.env.E2E_CUSTOMER_PASSWORD || '',
      verificationCode: '12345678',
    }),
  });
  log('  status', signupDuplicate.statusCode);
  await assert(signupDuplicate.statusCode === 409, 'Expected duplicate signup to return 409');

  log('15) Signup valid new user returns cookies with correct TTL');
  jar.clear();
  const signupValid = await request('/api/auth/signup', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      firstName: 'Test',
      lastName: 'User',
      gender: 'other',
      username: 'TestUser123',
      mobile: '1234567890',
      countryCode: 'US',
      email: 'testuser+runtime@example.com',
      password: 'ValidPass123#',
      verificationCode: '12345678',
    }),
  });
  log('  status', signupValid.statusCode);
  await assert(signupValid.statusCode === 201, 'Expected valid signup to return 201');
  const signupCookies = Array.isArray(signupValid.headers['set-cookie']) ? signupValid.headers['set-cookie'] : [signupValid.headers['set-cookie']].filter(Boolean);
  const sidCookie = signupCookies.find((c) => c.includes('aromacraft_sid='));
  const hintCookie = signupCookies.find((c) => c.includes('aromacraft_route_hint='));
  await assert(sidCookie && hintCookie, 'Expected signup to set both session and route-hint cookies');
  const maxAge = parseMaxAge(sidCookie || '');
  log('  session Max-Age', maxAge);
  await assert(maxAge !== null && maxAge >= 604700 && maxAge <= 604800, 'Expected session cookie TTL around 7 days');

  log('16) Verify-account invalid code returns 401');
  const verifyInvalid = await request('/api/auth/verify-account', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email: 'testuser+runtime@example.com', code: '00000000' }),
  });
  log('  status', verifyInvalid.statusCode);
  await assert(verifyInvalid.statusCode === 401, 'Expected invalid verify-account code to return 401');

  log('LIVE AUTH REGRESSION PASSED');
}

run().catch((error) => {
  console.error('LIVE AUTH REGRESSION FAILED:', error.message || error);
  process.exit(1);
});
