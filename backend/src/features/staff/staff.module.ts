import { Module } from '@nestjs/common';
import { StaffSchedulesModule } from './schedules/staff-schedules.module';
import { StaffShiftRegistrationsModule } from './shift-registrations/staff-shift-registrations.module';
import { StaffAttendanceModule } from './attendance/staff-attendance.module';
import { StaffLeavesModule } from './leaves/staff-leaves.module';
import { StaffDashboardModule } from './dashboard/staff-dashboard.module';

@Module({
    imports: [
        StaffDashboardModule,
        StaffSchedulesModule,
        StaffShiftRegistrationsModule,
        StaffAttendanceModule,
        StaffLeavesModule,
    ],
})
export class StaffModule { }
