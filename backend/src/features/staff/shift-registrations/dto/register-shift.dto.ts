import { IsString, IsOptional, IsNotEmpty, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegisterShiftDto {
  @ApiProperty({ description: 'Shift opening ID to register for' })
  @IsUUID()
  @IsNotEmpty()
  openingId: string;

  @ApiPropertyOptional({ description: 'Notes from employee' })
  @IsString()
  @IsOptional()
  notes?: string;
}
