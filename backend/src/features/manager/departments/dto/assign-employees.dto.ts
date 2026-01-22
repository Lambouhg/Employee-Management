import { IsArray, IsBoolean, IsOptional, IsUUID } from 'class-validator';

export class AssignEmployeesDto {
  @IsArray()
  @IsUUID('all', { each: true })
  employeeIds: string[];

  @IsOptional()
  @IsBoolean()
  autoAssignManager?: boolean = true;
}
