import { IsOptional, IsDateString, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { ShiftType } from '@prisma/client';

export class GetAvailableShiftsQueryDto {
  @ApiPropertyOptional({ description: 'Start date (YYYY-MM-DD)' })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional({ description: 'End date (YYYY-MM-DD)' })
  @IsDateString()
  @IsOptional()
  endDate?: string;

  @ApiPropertyOptional({ enum: ShiftType, description: 'Filter by shift type' })
  @IsEnum(ShiftType)
  @IsOptional()
  shiftType?: ShiftType;
}
