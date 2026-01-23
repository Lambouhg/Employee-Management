/*
  Warnings:

  - You are about to drop the column `teamId` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `approvedAtLevel2` on the `work_schedules` table. All the data in the column will be lost.
  - You are about to drop the column `approvedByLevel2Id` on the `work_schedules` table. All the data in the column will be lost.
  - You are about to drop the column `lockedById` on the `work_schedules` table. All the data in the column will be lost.
  - You are about to drop the `teams` table. If the table is not empty, all the data it contains will be lost.
  - Changed the type of `name` on the `roles` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "RoleName" AS ENUM ('MANAGER', 'DEPT_MANAGER', 'STAFF');

-- DropForeignKey
ALTER TABLE "teams" DROP CONSTRAINT "teams_departmentId_fkey";

-- DropForeignKey
ALTER TABLE "teams" DROP CONSTRAINT "teams_leadId_fkey";

-- DropForeignKey
ALTER TABLE "users" DROP CONSTRAINT "users_teamId_fkey";

-- DropForeignKey
ALTER TABLE "work_schedules" DROP CONSTRAINT "work_schedules_approvedByLevel2Id_fkey";

-- DropForeignKey
ALTER TABLE "work_schedules" DROP CONSTRAINT "work_schedules_lockedById_fkey";

-- DropIndex
DROP INDEX "users_teamId_idx";

-- AlterTable
ALTER TABLE "roles" DROP COLUMN "name",
ADD COLUMN     "name" "RoleName" NOT NULL;

-- AlterTable
ALTER TABLE "users" DROP COLUMN "teamId";

-- AlterTable
ALTER TABLE "work_schedules" DROP COLUMN "approvedAtLevel2",
DROP COLUMN "approvedByLevel2Id",
DROP COLUMN "lockedById";

-- DropTable
DROP TABLE "teams";

-- CreateIndex
CREATE UNIQUE INDEX "roles_name_key" ON "roles"("name");
