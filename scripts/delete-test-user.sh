#!/bin/bash
mysql -h 127.0.0.1 -P 3307 -u aromacraft_user -p13781229 aromacraft -e "DELETE FROM user WHERE email = 'tbabak@example.com';"
echo "User deleted"
