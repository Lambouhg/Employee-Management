import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum, IsNumber, Min, IsBoolean } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { EmploymentType } from '@prisma/client';

export class QueryUserDto {
  @ApiPropertyOptional({ example: 'John', description: 'Tìm kiếm theo tên hoặc email' })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ enum: EmploymentType, example: 'FULL_TIME' })
  @IsEnum(EmploymentType)
  @IsOptional()
  employmentType?: EmploymentType;

  @ApiPropertyOptional({ example: 'role-uuid', description: 'Lọc theo vai trò' })
  @IsString()
  @IsOptional()
  roleId?: string;

  @ApiPropertyOptional({ example: 'manager-uuid', description: 'Lọc theo người quản lý' })
  @IsString()
  @IsOptional()
  managerId?: string;

  @ApiPropertyOptional({ example: true, description: 'Chỉ lấy nhân viên đang hoạt động' })
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({ example: 1, minimum: 1, default: 1 })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({ example: 10, minimum: 1, default: 10 })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @IsOptional()
  limit?: number = 10;
}
