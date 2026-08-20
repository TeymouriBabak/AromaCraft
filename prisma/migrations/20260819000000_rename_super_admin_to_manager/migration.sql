-- Rename legacy SUPER_ADMIN role values to MANAGER and ensure enum definition includes MANAGER
-- This migration is written for MySQL/MariaDB. It's idempotent: running it multiple times is safe.

-- 1) Update any rows that still reference the old literal.
UPDATE `User` SET `role` = 'MANAGER' WHERE `role` = 'SUPER_ADMIN';

-- 2) Ensure the column's enum type contains only the intended values (no SUPER_ADMIN literal).
ALTER TABLE `User`
  MODIFY COLUMN `role` ENUM('CUSTOMER', 'ADMIN', 'MANAGER') NOT NULL DEFAULT 'CUSTOMER';

-- 3) For good measure, also update any other tables/columns if you introduced role elsewhere.
-- (No-op if not applicable.)

-- End migration
