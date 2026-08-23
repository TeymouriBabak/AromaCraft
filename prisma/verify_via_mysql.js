const mysql = require('mysql2/promise');
const host = process.env.DATABASE_HOST || 'localhost';
const port = process.env.DATABASE_PORT
  ? Number(process.env.DATABASE_PORT)
  : 3308;
const user = process.env.DATABASE_USER || 'root';
const password = process.env.DATABASE_PASSWORD || '';
const database = process.env.DATABASE_NAME || 'aromacraft';

(async () => {
  try {
    const conn = await mysql.createConnection({
      host,
      port,
      user,
      password,
      database,
    });
    const [rowsOld] = await conn.query(
      "SELECT COUNT(*) AS cnt_old FROM `User` WHERE `role` = 'SUPER_ADMIN'"
    );
    console.log('cnt_old=', rowsOld[0].cnt_old);
    const [rowsManagers] = await conn.query(
      "SELECT id, email, role FROM `User` WHERE `role` = 'MANAGER' LIMIT 20"
    );
    console.log('managers=', rowsManagers);
    await conn.end();
  } catch (err) {
    console.error('ERROR', err);
    process.exit(1);
  }
})();
