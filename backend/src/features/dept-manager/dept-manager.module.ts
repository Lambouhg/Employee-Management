import { Module } from '@nestjs/common';
import { DeptManagerDashboardModule } from './dashboard/dept-manager-dashboard.module';
import { DeptManagerEmployeesModule } from './employees/dept-manager-employees.module';
import { DeptManagerSchedulesModule } from './schedules/dept-manager-schedules.module';
import { DeptManagerPlansModule } from './plans/dept-manager-plans.module';
import { ShiftTemplatesModule } from './shift-templates/shift-templates.module';
import { DeptManagerShiftRegistrationsModule } from './shift-registrations/dept-manager-shift-registrations.module';
import { DeptManagerShiftsModule } from './shifts/dept-manager-shifts.module';
import { DeptManagerLeavesModule } from './leaves/dept-manager-leaves.module';

@Module({
    imports: [
        DeptManagerDashboardModule,
        DeptManagerEmployeesModule,
        DeptManagerSchedulesModule,
        DeptManagerPlansModule,
        ShiftTemplatesModule,
        DeptManagerShiftRegistrationsModule,
        DeptManagerShiftsModule,
        DeptManagerLeavesModule,
    ],
    exports: [
        DeptManagerDashboardModule,
        DeptManagerEmployeesModule,
        DeptManagerSchedulesModule,
        DeptManagerPlansModule,
        ShiftTemplatesModule,
        DeptManagerShiftRegistrationsModule,
        DeptManagerShiftsModule,
        DeptManagerLeavesModule,
    ],
})
export class DeptManagerModule { }
