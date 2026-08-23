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
  const [result] = await conn.execute('DELETE FROM user WHERE email = ?', [
    'tbabak@example.com',
  ]);
  console.log('DELETED_ROWS:', result.affectedRows);
  conn.release();
  await pool.end();
} catch (err) {
  console.error('ERROR:', err.message);
  process.exit(1);
}
