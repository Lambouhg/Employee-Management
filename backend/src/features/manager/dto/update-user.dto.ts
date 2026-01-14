import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsString,
  MinLength,
  IsEnum,
  IsOptional,
  IsUUID,
  IsBoolean,
  ValidateIf,
} from 'class-validator';
import { EmploymentType, DayOfWeek } from '@prisma/client';

export class UpdateUserDto {
  @ApiPropertyOptional({ example: 'john.doe@example.com' })
  @IsOptional()
  @IsEmail({}, { message: 'Email không hợp lệ' })
  email?: string;

  @ApiPropertyOptional({ example: 'newpassword123', minLength: 6 })
  @IsOptional()
  @IsString()
  @MinLength(6, { message: 'Mật khẩu phải có ít nhất 6 ký tự' })
  password?: string;

  @ApiPropertyOptional({ example: 'John Doe Updated' })
  @IsOptional()
  @IsString()
  fullName?: string;

  @ApiPropertyOptional({ example: '0987654321' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: 'role-uuid' })
  @IsOptional()
  @ValidateIf((o) => o.roleId !== null && o.roleId !== undefined && o.roleId !== '')
  @IsUUID(4, { message: 'Vai trò phải là UUID hợp lệ' })
  roleId?: string;

  @ApiPropertyOptional({ enum: EmploymentType, example: 'PART_TIME' })
  @IsOptional()
  @IsEnum(EmploymentType, { message: 'Loại hình làm việc không hợp lệ' })
  employmentType?: EmploymentType;

  @ApiPropertyOptional({ enum: DayOfWeek, example: 'SUNDAY' })
  @IsOptional()
  @IsEnum(DayOfWeek, { message: 'Ngày nghỉ cố định không hợp lệ' })
  fixedDayOff?: DayOfWeek;

  @ApiPropertyOptional({ example: 'manager-uuid' })
  @IsOptional()
  @ValidateIf((o) => o.managerId !== null && o.managerId !== undefined && o.managerId !== '')
  @IsUUID(4, { message: 'Người quản lý phải là UUID hợp lệ' })
  managerId?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
