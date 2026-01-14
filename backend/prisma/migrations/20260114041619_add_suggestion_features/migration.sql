/*
  Warnings:

  - You are about to drop the column `dayOfWeek` on the `shifts` table. All the data in the column will be lost.
  - You are about to drop the column `weekEndDate` on the `work_schedules` table. All the data in the column will be lost.
  - You are about to drop the column `weekNumber` on the `work_schedules` table. All the data in the column will be lost.
  - You are about to drop the column `year` on the `work_schedules` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[employeeId,weekStartDate]` on the table `work_schedules` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "AvailabilityStatus" AS ENUM ('AVAILABLE', 'PREFERRED', 'NOT_PREFERRED', 'UNAVAILABLE');

-- CreateEnum
CREATE TYPE "ShiftPosition" AS ENUM ('CASHIER', 'COOK', 'WAITER', 'CLEANER', 'SECURITY', 'MANAGER', 'OTHER');

-- DropIndex
DROP INDEX "work_schedules_employeeId_year_weekNumber_key";

-- AlterTable
ALTER TABLE "shifts" DROP COLUMN "dayOfWeek",
ADD COLUMN     "position" "ShiftPosition";

-- AlterTable
ALTER TABLE "work_schedules" DROP COLUMN "weekEndDate",
DROP COLUMN "weekNumber",
DROP COLUMN "year";

-- CreateTable
CREATE TABLE "employee_availabilities" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "status" "AvailabilityStatus" NOT NULL DEFAULT 'AVAILABLE',
    "priority" INTEGER NOT NULL DEFAULT 5,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employee_availabilities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employee_skills" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "position" "ShiftPosition" NOT NULL,
    "proficiencyLevel" INTEGER NOT NULL DEFAULT 3,
    "isPreferred" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employee_skills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shift_requirements" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "shiftType" "ShiftType" NOT NULL,
    "position" "ShiftPosition" NOT NULL,
    "requiredCount" INTEGER NOT NULL DEFAULT 1,
    "filledCount" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shift_requirements_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "employee_availabilities_date_status_idx" ON "employee_availabilities"("date", "status");

-- CreateIndex
CREATE UNIQUE INDEX "employee_availabilities_employeeId_date_key" ON "employee_availabilities"("employeeId", "date");

-- CreateIndex
CREATE INDEX "employee_skills_position_proficiencyLevel_idx" ON "employee_skills"("position", "proficiencyLevel");

-- CreateIndex
CREATE UNIQUE INDEX "employee_skills_employeeId_position_key" ON "employee_skills"("employeeId", "position");

-- CreateIndex
CREATE INDEX "shift_requirements_date_shiftType_idx" ON "shift_requirements"("date", "shiftType");

-- CreateIndex
CREATE UNIQUE INDEX "shift_requirements_date_shiftType_position_key" ON "shift_requirements"("date", "shiftType", "position");

-- CreateIndex
CREATE INDEX "shifts_date_shiftType_idx" ON "shifts"("date", "shiftType");

-- CreateIndex
CREATE UNIQUE INDEX "work_schedules_employeeId_weekStartDate_key" ON "work_schedules"("employeeId", "weekStartDate");

-- AddForeignKey
ALTER TABLE "employee_availabilities" ADD CONSTRAINT "employee_availabilities_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_skills" ADD CONSTRAINT "employee_skills_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
