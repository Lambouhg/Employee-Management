/*
  Warnings:

  - You are about to drop the column `position` on the `shifts` table. All the data in the column will be lost.
  - You are about to drop the `employee_availabilities` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `employee_skills` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `shift_requirements` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "employee_availabilities" DROP CONSTRAINT "employee_availabilities_employeeId_fkey";

-- DropForeignKey
ALTER TABLE "employee_skills" DROP CONSTRAINT "employee_skills_employeeId_fkey";

-- AlterTable
ALTER TABLE "shifts" DROP COLUMN "position";

-- DropTable
DROP TABLE "employee_availabilities";

-- DropTable
DROP TABLE "employee_skills";

-- DropTable
DROP TABLE "shift_requirements";
