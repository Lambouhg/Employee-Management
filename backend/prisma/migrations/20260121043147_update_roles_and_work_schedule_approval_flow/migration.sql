-- AlterTable
ALTER TABLE "work_schedules" ADD COLUMN     "approvedAtLevel2" TIMESTAMP(3),
ADD COLUMN     "approvedByLevel2Id" TEXT,
ADD COLUMN     "lockedById" TEXT;

-- AddForeignKey
ALTER TABLE "work_schedules" ADD CONSTRAINT "work_schedules_approvedByLevel2Id_fkey" FOREIGN KEY ("approvedByLevel2Id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_schedules" ADD CONSTRAINT "work_schedules_lockedById_fkey" FOREIGN KEY ("lockedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
