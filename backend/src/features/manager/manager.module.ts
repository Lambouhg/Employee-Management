import { Module } from '@nestjs/common';
import { ManagerEmployeesModule } from './employees/manager-employees.module';
import { ManagerRolesModule } from './roles/manager-roles.module';
import { ManagerDepartmentsModule } from './departments/manager-departments.module';

@Module({
  imports: [ManagerEmployeesModule, ManagerRolesModule, ManagerDepartmentsModule],
})
export class ManagerModule {}
