import { Module } from '@nestjs/common';
import { DeptManagerEmployeesController } from './dept-manager-employees.controller';
import { DeptManagerEmployeesService } from './dept-manager-employees.service';
import { DatabaseModule } from '../../../common/database/database.module';

@Module({
    imports: [DatabaseModule],
    controllers: [DeptManagerEmployeesController],
    providers: [DeptManagerEmployeesService],
    exports: [DeptManagerEmployeesService],
})
export class DeptManagerEmployeesModule { }
