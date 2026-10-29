/*
  Warnings:

  - You are about to drop the column `createdAt` on the `funding_services` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `funding_services` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `funding_services` DROP COLUMN `createdAt`,
    DROP COLUMN `updatedAt`,
    ADD COLUMN `endDate` DATE NULL,
    ADD COLUMN `startDate` DATE NULL;
