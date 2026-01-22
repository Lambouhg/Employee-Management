import { IsOptional, IsUUID } from 'class-validator';

export class TransferDepartmentDto {
  @IsOptional()
  @IsUUID()
  departmentId?: string | null;
}
