import { Module } from '@nestjs/common';
import { DeptManagerService } from './dept-manager.service';
import { DeptManagerController } from './dept-manager.controller';

@Module({
    controllers: [DeptManagerController],
    providers: [DeptManagerService],
    exports: [DeptManagerService],
})
export class DeptManagerModule { }
