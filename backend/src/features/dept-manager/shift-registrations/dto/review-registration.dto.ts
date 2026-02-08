import { IsEnum, IsString, IsOptional, IsNotEmpty } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RegistrationStatus } from '@prisma/client';

export class ReviewRegistrationDto {
  @ApiProperty({ enum: RegistrationStatus, description: 'Approval decision (APPROVED or REJECTED)' })
  @IsEnum(RegistrationStatus)
  @IsNotEmpty()
  status: RegistrationStatus;

  @ApiPropertyOptional({ description: 'Rejection reason (required if rejected)' })
  @IsString()
  @IsOptional()
  rejectionReason?: string;
}
