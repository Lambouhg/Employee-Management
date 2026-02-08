import { IsOptional, IsEnum, IsInt, Min, IsDateString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { RegistrationStatus } from '@prisma/client';
import { Type } from 'class-transformer';

export class GetRegistrationsQueryDto {
  @ApiPropertyOptional({ enum: RegistrationStatus, description: 'Filter by status', default: RegistrationStatus.PENDING })
  @IsEnum(RegistrationStatus)
  @IsOptional()
  status?: RegistrationStatus = RegistrationStatus.PENDING;

  @ApiPropertyOptional({ description: 'Filter by date (YYYY-MM-DD)' })
  @IsDateString()
  @IsOptional()
  date?: string;

  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Page size', default: 20 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  limit?: number = 20;
}
