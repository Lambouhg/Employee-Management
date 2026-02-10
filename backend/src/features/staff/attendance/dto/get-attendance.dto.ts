import { IsOptional, IsDateString, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { AttendanceResponseDto } from './attendance-response.dto';

export class GetAttendanceHistoryDto {
    @IsOptional()
    @IsDateString()
    startDate?: string; // YYYY-MM-DD

    @IsOptional()
    @IsDateString()
    endDate?: string; // YYYY-MM-DD

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    page?: number = 1;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    limit?: number = 10;
}

export class AttendanceHistoryResponseDto {
    data: AttendanceResponseDto[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}
