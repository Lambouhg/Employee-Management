import { PartialType } from '@nestjs/mapped-types';
import { CreateShiftTemplateDto } from './create-shift-template.dto';
import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateShiftTemplateDto extends PartialType(CreateShiftTemplateDto) {
    @IsBoolean()
    @IsOptional()
    isActive?: boolean;
}
