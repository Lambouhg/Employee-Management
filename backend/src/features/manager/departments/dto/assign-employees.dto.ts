import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsUUID, ArrayMinSize } from 'class-validator';

export class AssignEmployeesDto {
  @ApiProperty({
    example: ['uuid-employee-1', 'uuid-employee-2'],
    description: 'Danh sách ID nhân viên cần gán vào phòng ban',
    type: [String],
  })
  @IsArray({ message: 'Danh sách nhân viên phải là mảng' })
  @ArrayMinSize(1, { message: 'Phải có ít nhất 1 nhân viên' })
  @IsUUID('4', { each: true, message: 'Mỗi ID nhân viên phải là UUID hợp lệ' })
  employeeIds: string[];

  @ApiProperty({
    example: true,
    description: 'Có tự động gán trưởng phòng làm manager trực tiếp cho các nhân viên không? (mặc định: true)',
    required: false,
    default: true,
  })
  autoAssignManager?: boolean = true;
}
