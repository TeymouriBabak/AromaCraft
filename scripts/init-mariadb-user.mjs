import { execSync } from 'child_process';

const commands = [
  "mariadb -uroot -e \"CREATE DATABASE IF NOT EXISTS aromacraft;\"",
  'mariadb -uroot -e "CREATE USER IF NOT EXISTS \'aromacraft_user\'@\'%\' IDENTIFIED BY \'local_app_password\';"',
  'mariadb -uroot -e "GRANT ALL PRIVILEGES ON aromacraft.* TO \'aromacraft_user\'@\'%\';"',
  'mariadb -uroot -e "FLUSH PRIVILEGES;"',
];

for (const command of commands) {
  const wslCommand = `wsl -d Ubuntu-24.04 -u root -- sh -c ${JSON.stringify(command)}`;
  console.log(wslCommand);
  try {
    const output = execSync(wslCommand, { stdio: 'pipe', encoding: 'utf8' });
    console.log(output);
  } catch (error) {
    console.error(error.stdout?.toString() || error.message);
    console.error(error.stderr?.toString() || '');
    process.exit(1);
  }
}
