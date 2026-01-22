import { IsArray, IsUUID } from 'class-validator';

export class RemoveEmployeesDto {
  @IsArray()
  @IsUUID('all', { each: true })
  employeeIds: string[];
}
