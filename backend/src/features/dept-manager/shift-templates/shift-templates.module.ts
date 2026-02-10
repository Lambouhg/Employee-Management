import { Module } from '@nestjs/common';
import { ShiftTemplatesService } from './shift-templates.service';
import { ShiftTemplatesController } from './shift-templates.controller';
import { DatabaseModule } from '../../../common/database/database.module';

@Module({
    imports: [DatabaseModule],
    controllers: [ShiftTemplatesController],
    providers: [ShiftTemplatesService],
    exports: [ShiftTemplatesService],
})
export class ShiftTemplatesModule { }
