import { Module } from '@nestjs/common';
import { DatabaseModule } from '@common/database/database.module';
import { StaffShiftRegistrationsController } from './staff-shift-registrations.controller';
import { StaffShiftRegistrationsService } from './staff-shift-registrations.service';

@Module({
  imports: [DatabaseModule],
  controllers: [StaffShiftRegistrationsController],
  providers: [StaffShiftRegistrationsService],
  exports: [StaffShiftRegistrationsService],
})
export class StaffShiftRegistrationsModule {}
