import { Module } from '@nestjs/common';
import { ManagerEmployeesController } from './manager-employees.controller';
import { ManagerEmployeesService } from './manager-employees.service';

@Module({
  controllers: [ManagerEmployeesController],
  providers: [ManagerEmployeesService],
  exports: [ManagerEmployeesService],
})
export class ManagerEmployeesModule {}


