-- AlterTable
ALTER TABLE `Product` ADD COLUMN `altitude` VARCHAR(191) NULL,
    ADD COLUMN `badge` VARCHAR(191) NULL,
    ADD COLUMN `imageAlt` VARCHAR(191) NULL,
    ADD COLUMN `notes` VARCHAR(191) NULL,
    ADD COLUMN `originalPrice` DOUBLE NULL,
    ADD COLUMN `subscriptionEligible` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `subscriptionSavings` DOUBLE NULL,
    ADD COLUMN `variety` VARCHAR(191) NULL;
