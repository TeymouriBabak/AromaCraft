import mysql from 'mysql2/promise';

const connection = await mysql.createConnection({
  host: '127.0.0.1',
  port: Number(process.env.DB_PORT || 3307),
  user: 'root',
  password: '',
  database: 'mysql',
});

await connection.execute('CREATE DATABASE IF NOT EXISTS aromacraft');
await connection.execute("CREATE USER IF NOT EXISTS 'aromacraft_user'@'%' IDENTIFIED BY 'local_app_password'");
await connection.execute("GRANT ALL PRIVILEGES ON aromacraft.* TO 'aromacraft_user'@'%'");
await connection.execute('FLUSH PRIVILEGES');
await connection.end();
console.log('Local database initialized.');
