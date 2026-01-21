import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsUUID, MaxLength } from 'class-validator';

export class UpdateDepartmentDto {
  @ApiPropertyOptional({ example: 'Phòng Kinh doanh', description: 'Tên phòng ban' })
  @IsString({ message: 'Tên phòng ban phải là chuỗi' })
  @IsOptional()
  @MaxLength(100, { message: 'Tên phòng ban không được quá 100 ký tự' })
  name?: string;

  @ApiPropertyOptional({
    example: 'SALES',
    description: 'Mã phòng ban (viết hoa, không dấu)',
  })
  @IsString({ message: 'Mã phòng ban phải là chuỗi' })
  @IsOptional()
  @MaxLength(20, { message: 'Mã phòng ban không được quá 20 ký tự' })
  code?: string;

  @ApiPropertyOptional({
    example: 'Phòng chuyên về kinh doanh và bán hàng',
    description: 'Mô tả phòng ban',
  })
  @IsString({ message: 'Mô tả phải là chuỗi' })
  @IsOptional()
  @MaxLength(500, { message: 'Mô tả không được quá 500 ký tự' })
  description?: string;

  @ApiPropertyOptional({ example: 'uuid-manager', description: 'ID trưởng phòng' })
  @IsUUID('4', { message: 'ID trưởng phòng phải là UUID hợp lệ' })
  @IsOptional()
  managerId?: string | null;
}


