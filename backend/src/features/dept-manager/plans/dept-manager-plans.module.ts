import { Module } from '@nestjs/common';
import { DeptManagerPlansController } from './dept-manager-plans.controller';
import { DeptManagerPlansService } from './dept-manager-plans.service';
import { DatabaseModule } from '../../../common/database/database.module';

@Module({
    imports: [DatabaseModule],
    controllers: [DeptManagerPlansController],
    providers: [DeptManagerPlansService],
    exports: [DeptManagerPlansService],
})
export class DeptManagerPlansModule { }
