-- Verify no SUPER_ADMIN rows remain
SELECT COUNT(*) AS cnt_old FROM `User` WHERE `role` = 'SUPER_ADMIN';

-- Show manager accounts
SELECT id, email, role FROM `User` WHERE `role` = 'MANAGER' LIMIT 20;
