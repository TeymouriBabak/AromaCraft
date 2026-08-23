import { execSync } from 'child_process';

const command =
  'wsl -d Ubuntu-24.04 -u root -- sh -c "mariadb -uroot -e \'SELECT User, Host, plugin FROM mysql.user WHERE User="aromacraft_user";\'"';
console.log(command);
try {
  const output = execSync(command, { stdio: 'pipe', encoding: 'utf8' });
  console.log(output);
} catch (error) {
  console.error(error.stdout?.toString() || error.message);
  console.error(error.stderr?.toString() || '');
  process.exit(1);
}
