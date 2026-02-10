import { Module } from '@nestjs/common';
import { StaffSchedulesService } from './staff-schedules.service';
import { StaffSchedulesController } from './staff-schedules.controller';
import { DatabaseModule } from '../../../common/database/database.module';

@Module({
    imports: [DatabaseModule],
    controllers: [StaffSchedulesController],
    providers: [StaffSchedulesService],
})
export class StaffSchedulesModule { }
