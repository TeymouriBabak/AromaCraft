import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: '127.0.0.1',
  port: 3307,
  user: 'aromacraft_user',
  password: '13781229',
  database: 'aromacraft',
});

try {
  const conn = await pool.getConnection();
  await conn.execute('DELETE FROM `User` WHERE email = ?', ['tbabak@example.com']);
  await conn.execute('DELETE FROM `User` WHERE username = ?', ['TestUser123']);
    await conn.execute('SELECT COUNT(*) as count FROM `User`');
  console.log('CLEANUP_DONE');
  conn.release();
  await pool.end();
} catch (err) {
  console.error('ERROR:', err.message);
  process.exit(1);
}
