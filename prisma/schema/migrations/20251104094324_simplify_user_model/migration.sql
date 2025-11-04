/*
  Warnings:

  - You are about to drop the column `needPasswordChange` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `password` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `role` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `users` table. All the data in the column will be lost.
  - You are about to drop the `admins` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `doctors` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `patients` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `address` to the `users` table without a default value. This is not possible if the table is not empty.
  - Added the required column `age` to the `users` table without a default value. This is not possible if the table is not empty.
  - Added the required column `fname` to the `users` table without a default value. This is not possible if the table is not empty.
  - Added the required column `lname` to the `users` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."admins" DROP CONSTRAINT "admins_email_fkey";

-- DropForeignKey
ALTER TABLE "public"."doctors" DROP CONSTRAINT "doctors_email_fkey";

-- DropForeignKey
ALTER TABLE "public"."patients" DROP CONSTRAINT "patients_email_fkey";

-- AlterTable
ALTER TABLE "users" DROP COLUMN "needPasswordChange",
DROP COLUMN "password",
DROP COLUMN "role",
DROP COLUMN "status",
ADD COLUMN     "address" TEXT NOT NULL,
ADD COLUMN     "age" INTEGER NOT NULL,
ADD COLUMN     "fname" TEXT NOT NULL,
ADD COLUMN     "lname" TEXT NOT NULL;

-- DropTable
DROP TABLE "public"."admins";

-- DropTable
DROP TABLE "public"."doctors";

-- DropTable
DROP TABLE "public"."patients";
