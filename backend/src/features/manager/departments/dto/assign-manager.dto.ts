import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsOptional } from 'class-validator';

export class AssignManagerDto {
  @ApiProperty({
    example: 'uuid-manager',
    description: 'ID người quản lý (để null nếu muốn bỏ trưởng phòng)',
    nullable: true,
  })
  @IsUUID('4', { message: 'ID người quản lý phải là UUID hợp lệ' })
  @IsOptional()
  managerId: string | null;
}


