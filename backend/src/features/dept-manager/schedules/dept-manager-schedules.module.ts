import { Module } from '@nestjs/common';
import { DeptManagerSchedulesController } from './dept-manager-schedules.controller';
import { DeptManagerSchedulesService } from './dept-manager-schedules.service';
import { DatabaseModule } from '../../../common/database/database.module';

@Module({
    imports: [DatabaseModule],
    controllers: [DeptManagerSchedulesController],
    providers: [DeptManagerSchedulesService],
    exports: [DeptManagerSchedulesService],
})
export class DeptManagerSchedulesModule { }
