import { IsNotEmpty, IsUUID, IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';
import { ShiftType } from '@prisma/client';

export class AssignShiftDto {
    @IsNotEmpty()
    @IsUUID()
    employeeId: string;

    @IsNotEmpty()
    @IsUUID()
    openingId: string;

    @IsNotEmpty()
    @IsDateString()
    date: string;

    @IsNotEmpty()
    @IsEnum(ShiftType)
    shiftType: ShiftType;

    @IsOptional()
    @IsString()
    notes?: string;
}

export class BulkAssignShiftDto {
    @IsNotEmpty()
    shifts: AssignShiftDto[];
}
