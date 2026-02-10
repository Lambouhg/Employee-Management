import { IsDateString, IsNumber, IsBoolean, IsOptional, IsString, Min, IsEnum } from 'class-validator';
import { ShiftType } from '@prisma/client';

export class UpdateShiftDto {
    @IsDateString()
    @IsOptional()
    date?: string;

    @IsEnum(ShiftType)
    @IsOptional()
    shiftType?: ShiftType;

    @IsString()
    @IsOptional()
    startTime?: string;

    @IsString()
    @IsOptional()
    endTime?: string;

    // Part-time settings
    @IsBoolean()
    @IsOptional()
    isPTEnabled?: boolean;

    @IsNumber()
    @Min(0)
    @IsOptional()
    ptCapacity?: number;

    // Full-time settings
    @IsBoolean()
    @IsOptional()
    isFTEnabled?: boolean;

    // NOTE: ftAutoAssigned đã bị loại bỏ - Quản lý phòng ban phải gán ca thủ công cho FT

    @IsString()
    @IsOptional()
    notes?: string;
}
