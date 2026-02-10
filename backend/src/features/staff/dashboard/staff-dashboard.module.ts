import { Module } from '@nestjs/common';
import { StaffDashboardController } from './staff-dashboard.controller';
import { StaffDashboardService } from './staff-dashboard.service';
import { DatabaseModule } from '@common/database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [StaffDashboardController],
  providers: [StaffDashboardService],
  exports: [StaffDashboardService],
})
export class StaffDashboardModule {}
