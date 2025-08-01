/*
  Warnings:

  - Added the required column `duration` to the `Course` table without a default value. This is not possible if the table is not empty.
  - Made the column `category` on table `Course` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "public"."Course" ADD COLUMN     "duration" INTEGER NOT NULL,
ALTER COLUMN "category" SET NOT NULL;
