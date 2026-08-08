import http from 'node:http';
import { URL } from 'node:url';
import { createHash } from 'node:crypto';
import mysql from 'mysql2/promise';
import { setTimeout as delay } from 'node:timers/promises';

const base = 'http://127.0.0.1:3000';
const jar = new Map();

function setCookieHeader(res, setCookie) {
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
  const url = new URL(path, base);
  const reqHeaders = {
    ...(options.headers || {}),
  };
  if (jar.size) {
    reqHeaders.cookie = getCookieHeader();
  }
  const body = options.body ? Buffer.from(options.body) : undefined;
  if (body) {
    reqHeaders['content-length'] = body.length;
  }
  const res = await new Promise((resolve, reject) => {
    const req = http.request(
      {
        protocol: url.protocol,
        hostname: url.hostname,
        port: url.port,
        path: `${url.pathname}${url.search}`,
        method: options.method || 'GET',
        headers: reqHeaders,
      },
      (response) => {
        let data = '';
        response.setEncoding('utf8');
        response.on('data', (chunk) => { data += chunk; });
        response.on('end', () => resolve({ statusCode: response.statusCode, headers: response.headers, body: data }));
      },
    );
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
  if (res.headers['set-cookie']) {
    setCookieHeader(res, res.headers['set-cookie']);
  }
  return res;
}

async function querySessionByCookieValue(rawToken) {
  const tokenHash = createHash('sha256').update(rawToken).digest('hex');
  const conn = await mysql.createConnection({ host: '172.29.236.10', port: 3306, user: 'aromacraft_user', password: 'local_app_password', database: 'aromacraft' });
  const [rows] = await conn.execute('SELECT id, userId, status, expiresAt FROM Session WHERE tokenHash = ?', [tokenHash]);
  await conn.end();
  return rows;
}

async function main() {
  await delay(1000);
  const dashboardBefore = await request('/dashboard');
  console.log('DASHBOARD_BEFORE', dashboardBefore.statusCode, dashboardBefore.headers.location || '-');

  const login = await request('/api/auth/login', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: 'email=tbabak@example.com&password=Teymouribabak78%23',
  });
  console.log('LOGIN_STATUS', login.statusCode);
  console.log('LOGIN_SETCOOKIE', JSON.stringify(login.headers['set-cookie'] || []));

  const sessionToken = getCookieValue('aromacraft_sid');
  if (!sessionToken) {
    console.log('SESSION_COOKIE_MISSING');
    process.exit(1);
  }

  const sessionRows = await querySessionByCookieValue(sessionToken);
  console.log('DB_SESSION_CREATED', Array.isArray(sessionRows) && sessionRows.length > 0 ? 'true' : 'false');
  console.log('DB_SESSION_ROWS', JSON.stringify(sessionRows));

  const me = await request('/api/auth/me');
  console.log('ME_STATUS', me.statusCode);
  console.log('ME_BODY', me.body);

  const dashboardAfter = await request('/dashboard');
  console.log('DASHBOARD_AFTER', dashboardAfter.statusCode, dashboardAfter.headers.location || '-');

  const routeHintOnlyJar = new Map(jar);
  routeHintOnlyJar.delete('aromacraft_sid');

  const routeHintResponse = await (async () => {
    const url = new URL('/dashboard', base);
    const reqHeaders = { cookie: Array.from(routeHintOnlyJar.values()).join('; ') };
    return new Promise((resolve, reject) => {
      const req = http.request({ protocol: url.protocol, hostname: url.hostname, port: url.port, path: url.pathname, method: 'GET', headers: reqHeaders }, (response) => {
        response.on('data', () => {});
        response.on('end', () => resolve({ statusCode: response.statusCode, headers: response.headers }));
      });
      req.on('error', reject);
      req.end();
    });
  })();
  console.log('ROUTE_HINT_ONLY_DASHBOARD', routeHintResponse.statusCode, routeHintResponse.headers.location || '-');

  const logout = await request('/api/auth/logout', { method: 'POST' });
  console.log('LOGOUT_STATUS', logout.statusCode);
  console.log('LOGOUT_SETCOOKIE', JSON.stringify(logout.headers['set-cookie'] || []));

  const logoutSessionRows = await querySessionByCookieValue(sessionToken);
  console.log('DB_SESSION_REVOKED', Array.isArray(logoutSessionRows) && logoutSessionRows.length === 0 ? 'true' : 'false');
  console.log('DB_SESSION_AFTER_LOGOUT_ROWS', JSON.stringify(logoutSessionRows));

  const meAfterLogout = await request('/api/auth/me');
  console.log('ME_AFTER_LOGOUT_STATUS', meAfterLogout.statusCode);

  const dashboardAfterLogout = await request('/dashboard');
  console.log('DASHBOARD_AFTER_LOGOUT', dashboardAfterLogout.statusCode, dashboardAfterLogout.headers.location || '-');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
