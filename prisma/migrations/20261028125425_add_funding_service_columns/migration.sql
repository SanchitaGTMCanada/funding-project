-- AlterTable
ALTER TABLE `funding_services` ADD COLUMN `category` JSON NULL,
    ADD COLUMN `territory` JSON NULL,
    ADD COLUMN `whoYouAre` JSON NULL;
