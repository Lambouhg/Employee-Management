import { IsDateString, IsNotEmpty, IsNumber, IsBoolean, IsOptional, IsString, Min, IsEnum } from 'class-validator';
import { ShiftType } from '@prisma/client';

export class CreateShiftDto {
    @IsDateString()
    @IsNotEmpty()
    date: string; // Ngày làm việc (phải nằm trong tuần của schedule)

    @IsEnum(ShiftType)
    @IsNotEmpty()
    shiftType: ShiftType; // Loại ca: MORNING, AFTERNOON, EVENING, NIGHT

    @IsString()
    @IsNotEmpty()
    startTime: string; // Format: "HH:mm" hoặc ISO time

    @IsString()
    @IsNotEmpty()
    endTime: string; // Format: "HH:mm" hoặc ISO time

    // Part-time settings
    @IsBoolean()
    @IsOptional()
    isPTEnabled?: boolean = true; // Cho phép PT đăng ký

    @IsNumber()
    @Min(0)
    @IsOptional()
    ptCapacity?: number = 5; // Số lượng PT tối đa

    // Full-time settings
    @IsBoolean()
    @IsOptional()
    isFTEnabled?: boolean = false; // Ca này có cho FT không

    // NOTE: ftAutoAssigned đã bị loại bỏ - Quản lý phòng ban phải gán ca thủ công cho FT

    @IsString()
    @IsOptional()
    notes?: string;
}
