/*
  Warnings:

  - You are about to drop the column `parentId` on the `departments` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "departments" DROP CONSTRAINT "departments_parentId_fkey";

-- AlterTable
ALTER TABLE "departments" DROP COLUMN "parentId";

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "teamId" TEXT;

-- CreateTable
CREATE TABLE "teams" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "departmentId" TEXT,
    "leadId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "teams_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "teams_code_key" ON "teams"("code");

-- CreateIndex
CREATE UNIQUE INDEX "teams_leadId_key" ON "teams"("leadId");

-- CreateIndex
CREATE INDEX "users_teamId_idx" ON "users"("teamId");

-- AddForeignKey
ALTER TABLE "teams" ADD CONSTRAINT "teams_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teams" ADD CONSTRAINT "teams_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE SET NULL ON UPDATE CASCADE;
