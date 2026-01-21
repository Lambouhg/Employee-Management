import { Module } from '@nestjs/common';
import { EmployeesController } from './controllers/employees.controller';
import { EmployeeActionsController } from './controllers/employee-actions.controller';
import { EmployeesService } from './services/employees.service';
import { EmployeeActionsService } from './services/employee-actions.service';

@Module({
  controllers: [EmployeesController, EmployeeActionsController],
  providers: [EmployeesService, EmployeeActionsService],
  exports: [EmployeesService, EmployeeActionsService],
})
export class ManagerEmployeesModule {}


