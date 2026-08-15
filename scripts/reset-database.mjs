import mysql from 'mysql2/promise';

const rootPool = mysql.createPool({
  host: '127.0.0.1',
  port: 3307,
  user: 'root',
  password: '13781229',
});

try {
  const conn = await rootPool.getConnection();
  await conn.execute('DROP DATABASE IF EXISTS aromacraft');
  await conn.execute('CREATE DATABASE aromacraft CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');
  console.log('DATABASE_RESET_SUCCESS');
  conn.release();
  await rootPool.end();
} catch (err) {
  console.error('ERROR:', err.message);
  process.exit(1);
}
