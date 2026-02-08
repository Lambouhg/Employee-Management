import { Module } from '@nestjs/common';
import { DeptManagerLeavesController } from './dept-manager-leaves.controller';
import { DeptManagerLeavesService } from './dept-manager-leaves.service';
import { DatabaseModule } from '@common/database/database.module';

@Module({
    imports: [DatabaseModule],
    controllers: [DeptManagerLeavesController],
    providers: [DeptManagerLeavesService],
    exports: [DeptManagerLeavesService],
})
export class DeptManagerLeavesModule { }
