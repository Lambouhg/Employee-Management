import { IsEnum, IsDateString, IsString, MinLength, IsOptional } from 'class-validator';
import { LeaveType } from '@prisma/client';

export class CreateLeaveRequestDto {
    @IsEnum(LeaveType)
    leaveType: LeaveType;

    @IsDateString()
    startDate: string; // YYYY-MM-DD

    @IsDateString()
    endDate: string; // YYYY-MM-DD

    @IsString()
    @MinLength(10, { message: 'Reason must be at least 10 characters' })
    reason: string;
}

export class UpdateLeaveRequestDto {
    @IsOptional()
    @IsEnum(LeaveType)
    leaveType?: LeaveType;

    @IsOptional()
    @IsDateString()
    startDate?: string;

    @IsOptional()
    @IsDateString()
    endDate?: string;

    @IsOptional()
    @IsString()
    @MinLength(10)
    reason?: string;
}
