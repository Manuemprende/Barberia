/*
  Warnings:

  - The values [CONFIRMED] on the enum `AppointmentStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `available` on the `Barber` table. All the data in the column will be lost.
  - You are about to drop the column `specialties` on the `Barber` table. All the data in the column will be lost.
  - You are about to drop the `Comment` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `GalleryImage` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `User` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "public"."AppointmentStatus_new" AS ENUM ('SCHEDULED', 'CANCELLED', 'COMPLETED');
ALTER TABLE "public"."Appointment" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "public"."Appointment" ALTER COLUMN "status" TYPE "public"."AppointmentStatus_new" USING ("status"::text::"public"."AppointmentStatus_new");
ALTER TYPE "public"."AppointmentStatus" RENAME TO "AppointmentStatus_old";
ALTER TYPE "public"."AppointmentStatus_new" RENAME TO "AppointmentStatus";
DROP TYPE "public"."AppointmentStatus_old";
ALTER TABLE "public"."Appointment" ALTER COLUMN "status" SET DEFAULT 'SCHEDULED';
COMMIT;

-- AlterTable
ALTER TABLE "public"."Appointment" ADD COLUMN     "appointmentDate" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "whatsappNormalized" TEXT NOT NULL DEFAULT '';

-- AlterTable
ALTER TABLE "public"."Barber" DROP COLUMN "available",
DROP COLUMN "specialties";

-- DropTable
DROP TABLE "public"."Comment";

-- DropTable
DROP TABLE "public"."GalleryImage";

-- DropTable
DROP TABLE "public"."User";

-- DropEnum
DROP TYPE "public"."Role";

-- CreateIndex
CREATE INDEX "Appointment_whatsappNormalized_appointmentDate_idx" ON "public"."Appointment"("whatsappNormalized", "appointmentDate");
