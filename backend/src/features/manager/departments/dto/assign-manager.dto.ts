import { IsOptional, IsUUID } from 'class-validator';

export class AssignDepartmentManagerDto {
  @IsOptional()
  @IsUUID()
  managerId?: string | null;
}
