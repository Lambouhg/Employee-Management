import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class CheckInDto {
    @IsNotEmpty()
    @IsUUID()
    shiftId: string; // ID của shift cần check-in
    
    @IsOptional()
    @IsString()
    notes?: string; // Ghi chú khi điểm danh (nếu có)
}
