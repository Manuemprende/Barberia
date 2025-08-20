/*
  Warnings:

  - You are about to drop the column `comentario` on the `comments` table. All the data in the column will be lost.
  - You are about to drop the column `nombre` on the `comments` table. All the data in the column will be lost.
  - Added the required column `message` to the `comments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `comments` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."comments" DROP COLUMN "comentario",
DROP COLUMN "nombre",
ADD COLUMN     "message" TEXT NOT NULL,
ADD COLUMN     "name" TEXT NOT NULL;
