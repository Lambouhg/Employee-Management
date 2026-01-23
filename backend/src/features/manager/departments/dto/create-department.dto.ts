import { IsOptional, IsString } from 'class-validator';

export class CreateDepartmentDto {
  @IsString()
  name: string;

  @IsString()
  code: string;

  @IsOptional()
  @IsString()
  description?: string;
}
