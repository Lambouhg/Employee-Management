import { Module } from '@nestjs/common';
import { StaffAttendanceController } from './staff-attendance.controller';
import { StaffAttendanceService } from './staff-attendance.service';
import { DatabaseModule } from '@common/database/database.module';

@Module({
    imports: [DatabaseModule],
    controllers: [StaffAttendanceController],
    providers: [StaffAttendanceService],
    exports: [StaffAttendanceService],
})
export class StaffAttendanceModule { }
