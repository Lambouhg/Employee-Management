import { IsDateString, IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, Min, ValidateNested, IsBoolean, ValidateIf } from 'class-validator';
import { Type } from 'class-transformer';
import { ShiftType } from '@prisma/client';

export class CreateShiftOpeningDto {
    @IsOptional()
    @IsString()
    templateId?: string;

    @IsDateString()
    date: string;

    @ValidateIf(o => !o.templateId)
    @IsEnum(ShiftType)
    shiftType: ShiftType;

    @ValidateIf(o => !o.templateId)
    @IsDateString()
    startTime: string;

    @ValidateIf(o => !o.templateId)
    @IsDateString()
    endTime: string;

    @IsOptional()
    @IsBoolean()
    isFTEnabled?: boolean;

    @IsOptional()
    @IsBoolean()
    ftAutoAssigned?: boolean;

    @IsOptional()
    @IsBoolean()
    isPTEnabled?: boolean;

    @IsOptional()
    @IsInt()
    @Min(0)
    ptCapacity?: number;

    @IsOptional()
    @IsString()
    notes?: string;
}

export class CreateWeeklyPlanDto {
    @IsDateString()
    @IsNotEmpty()
    weekStartDate: string;

    @IsOptional()
    @ValidateNested({ each: true })
    @Type(() => CreateShiftOpeningDto)
    shiftOpenings?: CreateShiftOpeningDto[];
}
