import { Module } from '@nestjs/common';
import { ManagerEmployeesModule } from './employees/manager-employees.module';
import { ManagerDepartmentsModule } from './departments/manager-departments.module';
import { ManagerRolesModule } from './roles/manager-roles.module';

@Module({
  imports: [ManagerEmployeesModule, ManagerDepartmentsModule, ManagerRolesModule],
})
export class ManagerModule {}


