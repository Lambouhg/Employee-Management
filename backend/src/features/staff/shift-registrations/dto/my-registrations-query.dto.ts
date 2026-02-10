import { IsOptional, IsEnum, IsInt, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { RegistrationStatus } from '@prisma/client';
import { Type } from 'class-transformer';

export class MyRegistrationsQueryDto {
  @ApiPropertyOptional({ enum: RegistrationStatus, description: 'Filter by status' })
  @IsEnum(RegistrationStatus)
  @IsOptional()
  status?: RegistrationStatus;

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
