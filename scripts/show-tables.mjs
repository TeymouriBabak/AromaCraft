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
  const [tables] = await conn.execute('SHOW TABLES');
  console.log('TABLES:', tables.length, 'found');
  tables.forEach((t) => {
    const tableName = Object.values(t)[0];
    console.log('  -', tableName);
  });
  conn.release();
  await pool.end();
} catch (err) {
  console.error('ERROR:', err.message);
  process.exit(1);
}
