import { IsDateString, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateScheduleDto {
    @IsDateString()
    @IsNotEmpty()
    weekStartDate: string; // Ngày bất kỳ trong tuần, hệ thống sẽ tính weekStartDate (Monday)

    @IsString()
    @IsOptional()
    notes?: string;
}
