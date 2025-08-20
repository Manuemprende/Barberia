-- CreateEnum
CREATE TYPE "public"."PaymentStatus" AS ENUM ('UNPAID', 'PAID', 'REFUNDED');

-- AlterEnum
ALTER TYPE "public"."AppointmentStatus" ADD VALUE 'CONFIRMED';

-- AlterTable
ALTER TABLE "public"."Appointment" ADD COLUMN     "paidAt" TIMESTAMP(3),
ADD COLUMN     "paymentStatus" "public"."PaymentStatus" NOT NULL DEFAULT 'UNPAID',
ADD COLUMN     "priceSnapshot" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "public"."comments" ADD COLUMN     "visible" BOOLEAN NOT NULL DEFAULT true;
