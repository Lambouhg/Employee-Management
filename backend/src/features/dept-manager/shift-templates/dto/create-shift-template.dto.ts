import { IsString, IsNotEmpty, IsEnum, IsNumber, IsBoolean, IsOptional, Min, Max } from 'class-validator';
import { ShiftType } from '@prisma/client';

export class CreateShiftTemplateDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsNotEmpty()
    code: string;

    @IsEnum(ShiftType)
    shiftType: ShiftType;

    @IsString()
    @IsNotEmpty()
    startTime: string; // Format: "HH:MM:SS" or "HH:MM"

    @IsString()
    @IsNotEmpty()
    endTime: string; // Format: "HH:MM:SS" or "HH:MM"

    @IsNumber()
    @Min(0.5)
    @Max(24)
    @IsOptional()
    totalHours?: number; // Will be calculated if not provided

    @IsBoolean()
    @IsOptional()
    allowFullTime?: boolean;

    @IsBoolean()
    @IsOptional()
    allowPartTime?: boolean;

    @IsString()
    @IsOptional()
    description?: string;

    @IsString()
    @IsOptional()
    notes?: string;
}
