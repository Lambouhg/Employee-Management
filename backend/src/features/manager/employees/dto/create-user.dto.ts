import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  IsEnum,
  IsOptional,
  IsUUID,
  ValidateIf,
} from 'class-validator';
import { EmploymentType, DayOfWeek } from '@prisma/client';

export class CreateUserDto {
  @ApiProperty({ example: 'john.doe@example.com' })
  @IsEmail({}, { message: 'Email không hợp lệ' })
  @IsNotEmpty({ message: 'Email không được để trống' })
  email: string;

  @ApiProperty({ example: 'password123', minLength: 6 })
  @IsString()
  @IsNotEmpty({ message: 'Mật khẩu không được để trống' })
  @MinLength(6, { message: 'Mật khẩu phải có ít nhất 6 ký tự' })
  password: string;

  @ApiProperty({ example: 'John Doe' })
  @IsString()
  @IsNotEmpty({ message: 'Họ tên không được để trống' })
  fullName: string;

  @ApiPropertyOptional({ example: '0987654321' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ example: 'role-uuid', description: 'ID của vai trò' })
  @IsNotEmpty({ message: 'Vai trò không được để trống' })
  @IsUUID(4, { message: 'Vai trò phải là UUID hợp lệ' })
  roleId: string;

  @ApiProperty({ enum: EmploymentType, example: 'FULL_TIME' })
  @IsNotEmpty({ message: 'Loại hình làm việc không được để trống' })
  @IsEnum(EmploymentType, { message: 'Loại hình làm việc không hợp lệ' })
  employmentType: EmploymentType;

  @ApiPropertyOptional({ enum: DayOfWeek, example: 'SUNDAY' })
  @IsOptional()
  @IsEnum(DayOfWeek, { message: 'Ngày nghỉ cố định không hợp lệ' })
  fixedDayOff?: DayOfWeek;

  @ApiPropertyOptional({
    example: 'manager-uuid',
    description: 'ID của người quản lý trực tiếp',
  })
  @IsOptional()
  @ValidateIf(
    (o) => o.managerId !== null && o.managerId !== undefined && o.managerId !== '',
  )
  @IsUUID(4, { message: 'Người quản lý phải là UUID hợp lệ' })
  managerId?: string;

  @ApiPropertyOptional({ example: 'department-uuid', description: 'ID của phòng ban' })
  @IsOptional()
  @ValidateIf(
    (o) =>
      o.departmentId !== null && o.departmentId !== undefined && o.departmentId !== '',
  )
  @IsUUID(4, { message: 'Phòng ban phải là UUID hợp lệ' })
  departmentId?: string;
}



