-- AlterTable
ALTER TABLE `Review` ADD COLUMN `hiddenAt` DATETIME(3) NULL,
    ADD COLUMN `hiddenBy` VARCHAR(191) NULL,
    ADD COLUMN `isHidden` BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE `User` ADD COLUMN `bannedAt` DATETIME(3) NULL,
    ADD COLUMN `bannedBy` VARCHAR(191) NULL,
    ADD COLUMN `isBanned` BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE `BannedIdentity` (
    `id` VARCHAR(191) NOT NULL,
    `type` VARCHAR(32) NOT NULL,
    `value` VARCHAR(255) NOT NULL,
    `createdBy` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `BannedIdentity_type_idx`(`type`),
    UNIQUE INDEX `BannedIdentity_type_value_key`(`type`, `value`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
