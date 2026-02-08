import { Module } from '@nestjs/common';
import { DeptManagerShiftsController } from './dept-manager-shifts.controller';
import { DeptManagerShiftsService } from './dept-manager-shifts.service';
import { DatabaseModule } from '../../../common/database/database.module';

@Module({
    imports: [DatabaseModule],
    controllers: [DeptManagerShiftsController],
    providers: [DeptManagerShiftsService],
    exports: [DeptManagerShiftsService]
})
export class DeptManagerShiftsModule { }
