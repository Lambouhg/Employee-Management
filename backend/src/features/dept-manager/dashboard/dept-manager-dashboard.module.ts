import { Module } from '@nestjs/common';
import { DeptManagerDashboardController } from './dept-manager-dashboard.controller';
import { DeptManagerDashboardService } from './dept-manager-dashboard.service';
import { DatabaseModule } from '../../../common/database/database.module';

@Module({
    imports: [DatabaseModule],
    controllers: [DeptManagerDashboardController],
    providers: [DeptManagerDashboardService],
    exports: [DeptManagerDashboardService],
})
export class DeptManagerDashboardModule { }
