import { Module } from '@nestjs/common';
import { DatabaseModule } from '@common/database/database.module';
import { DeptManagerShiftRegistrationsController } from './dept-manager-shift-registrations.controller';
import { DeptManagerShiftRegistrationsService } from './dept-manager-shift-registrations.service';

@Module({
  imports: [DatabaseModule],
  controllers: [DeptManagerShiftRegistrationsController],
  providers: [DeptManagerShiftRegistrationsService],
  exports: [DeptManagerShiftRegistrationsService],
})
export class DeptManagerShiftRegistrationsModule {}
