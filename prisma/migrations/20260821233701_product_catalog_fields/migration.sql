/*
  Warnings:

  - You are about to alter the column `productId` on the `OrderItem` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Int`.
  - The primary key for the `Product` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `createdAt` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `imageUrl` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `inventory` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `isActive` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Product` table. All the data in the column will be lost.
  - You are about to alter the column `id` on the `Product` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Int`.
  - You are about to alter the column `price` on the `Product` table. The data in that column could be lost. The data in that column will be cast from `Decimal(12,0)` to `Decimal(12,2)`.
  - Added the required column `acidity` to the `Product` table without a default value. This is not possible if the table is not empty.
  - Added the required column `body` to the `Product` table without a default value. This is not possible if the table is not empty.
  - Added the required column `brand` to the `Product` table without a default value. This is not possible if the table is not empty.
  - Added the required column `brewMethods` to the `Product` table without a default value. This is not possible if the table is not empty.
  - Added the required column `coffeeType` to the `Product` table without a default value. This is not possible if the table is not empty.
  - Added the required column `country` to the `Product` table without a default value. This is not possible if the table is not empty.
  - Added the required column `grindTypes` to the `Product` table without a default value. This is not possible if the table is not empty.
  - Added the required column `image` to the `Product` table without a default value. This is not possible if the table is not empty.
  - Added the required column `origin` to the `Product` table without a default value. This is not possible if the table is not empty.
  - Added the required column `originRegion` to the `Product` table without a default value. This is not possible if the table is not empty.
  - Added the required column `process` to the `Product` table without a default value. This is not possible if the table is not empty.
  - Added the required column `rating` to the `Product` table without a default value. This is not possible if the table is not empty.
  - Added the required column `reviews` to the `Product` table without a default value. This is not possible if the table is not empty.
  - Added the required column `roast` to the `Product` table without a default value. This is not possible if the table is not empty.
  - Added the required column `size` to the `Product` table without a default value. This is not possible if the table is not empty.
  - Added the required column `specialTags` to the `Product` table without a default value. This is not possible if the table is not empty.
  - Added the required column `sweetness` to the `Product` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tastingNotes` to the `Product` table without a default value. This is not possible if the table is not empty.
  - Made the column `description` on table `Product` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE `OrderItem` DROP FOREIGN KEY `OrderItem_productId_fkey`;

-- DropIndex
DROP INDEX `Product_slug_idx` ON `Product`;

-- AlterTable
ALTER TABLE `OrderItem` MODIFY `productId` INTEGER NOT NULL;

-- AlterTable
ALTER TABLE `Product` DROP PRIMARY KEY,
    DROP COLUMN `createdAt`,
    DROP COLUMN `imageUrl`,
    DROP COLUMN `inventory`,
    DROP COLUMN `isActive`,
    DROP COLUMN `updatedAt`,
    ADD COLUMN `acidity` VARCHAR(191) NOT NULL,
    ADD COLUMN `body` VARCHAR(191) NOT NULL,
    ADD COLUMN `brand` VARCHAR(191) NOT NULL,
    ADD COLUMN `brewMethods` JSON NOT NULL,
    ADD COLUMN `catalog` VARCHAR(191) NOT NULL DEFAULT 'shop',
    ADD COLUMN `coffeeType` VARCHAR(191) NOT NULL,
    ADD COLUMN `country` VARCHAR(191) NOT NULL,
    ADD COLUMN `grindTypes` JSON NOT NULL,
    ADD COLUMN `image` VARCHAR(191) NOT NULL,
    ADD COLUMN `inStock` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `origin` VARCHAR(191) NOT NULL,
    ADD COLUMN `originRegion` VARCHAR(191) NOT NULL,
    ADD COLUMN `process` VARCHAR(191) NOT NULL,
    ADD COLUMN `rating` DOUBLE NOT NULL,
    ADD COLUMN `reviews` INTEGER NOT NULL,
    ADD COLUMN `roast` VARCHAR(191) NOT NULL,
    ADD COLUMN `size` VARCHAR(191) NOT NULL,
    ADD COLUMN `specialTags` JSON NOT NULL,
    ADD COLUMN `sweetness` VARCHAR(191) NOT NULL,
    ADD COLUMN `tastingNotes` JSON NOT NULL,
    MODIFY `id` INTEGER NOT NULL,
    MODIFY `slug` VARCHAR(191) NOT NULL,
    MODIFY `name` VARCHAR(191) NOT NULL,
    MODIFY `description` VARCHAR(191) NOT NULL,
    MODIFY `price` DECIMAL(12, 2) NOT NULL,
    ADD PRIMARY KEY (`id`);

-- AddForeignKey
ALTER TABLE `OrderItem` ADD CONSTRAINT `OrderItem_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `Product`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
