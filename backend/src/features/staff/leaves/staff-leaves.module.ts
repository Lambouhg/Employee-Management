import { Module } from '@nestjs/common';
import { StaffLeavesController } from './staff-leaves.controller';
import { StaffLeavesService } from './staff-leaves.service';
import { DatabaseModule } from '@common/database/database.module';

@Module({
    imports: [DatabaseModule],
    controllers: [StaffLeavesController],
    providers: [StaffLeavesService],
    exports: [StaffLeavesService]
})
export class StaffLeavesModule { }
