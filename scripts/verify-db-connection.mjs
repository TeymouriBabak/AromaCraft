import 'dotenv/config';
import mysql from 'mysql2/promise';
import { URL } from 'url';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error('DATABASE_URL is not set in the environment.');
}

const {
  hostname: host,
  port,
  username: user,
  password,
  pathname,
} = new URL(databaseUrl);
const database = pathname?.startsWith('/') ? pathname.slice(1) : pathname;
const resolvedPort = Number(process.env.DB_PORT || port || 3306);

const connection = await mysql.createConnection({
  host: host || '127.0.0.1',
  port: Number.isFinite(resolvedPort) ? resolvedPort : 3306,
  user: user || undefined,
  password: password || undefined,
  database,
});

await connection.execute('SELECT 1');
console.log('Database connection successful.');
await connection.end();
