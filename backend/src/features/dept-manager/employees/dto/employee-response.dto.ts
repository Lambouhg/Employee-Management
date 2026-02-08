import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EmploymentType } from '@prisma/client';

export class EmployeeRoleDto {
  @ApiProperty({ description: 'Display name of the role' })
  displayName: string;
}

export class EmployeeListItemDto {
  @ApiProperty({ description: 'Employee ID' })
  id: string;

  @ApiProperty({ description: 'Full name of the employee' })
  fullName: string;

  @ApiProperty({ description: 'Email address' })
  email: string;

  @ApiPropertyOptional({ description: 'Phone number' })
  phone?: string;

  @ApiProperty({ enum: EmploymentType, description: 'Employment type' })
  employmentType: EmploymentType;

  @ApiPropertyOptional({ description: 'Fixed day off (0=Sunday, 6=Saturday)', minimum: 0, maximum: 6 })
  fixedDayOff?: number;

  @ApiPropertyOptional({ description: 'Employee role', type: EmployeeRoleDto })
  role?: EmployeeRoleDto;

  @ApiProperty({ description: 'Account creation date' })
  createdAt: Date;
}

export class DepartmentDto {
  @ApiProperty({ description: 'Department name' })
  name: string;

  @ApiProperty({ description: 'Department code' })
  code: string;
}

export class EmployeeRoleDetailDto {
  @ApiProperty({ description: 'Display name of the role' })
  displayName: string;

  @ApiProperty({ description: 'Role name/identifier' })
  name: string;
}

export class EmployeeDetailDto {
  @ApiProperty({ description: 'Employee ID' })
  id: string;

  @ApiProperty({ description: 'Email address' })
  email: string;

  @ApiProperty({ description: 'Full name of the employee' })
  fullName: string;

  @ApiPropertyOptional({ description: 'Phone number' })
  phone?: string;

  @ApiProperty({ enum: EmploymentType, description: 'Employment type' })
  employmentType: EmploymentType;

  @ApiPropertyOptional({ description: 'Fixed day off (0=Sunday, 6=Saturday)', minimum: 0, maximum: 6 })
  fixedDayOff?: number;

  @ApiPropertyOptional({ description: 'Department information', type: DepartmentDto })
  department?: DepartmentDto;

  @ApiPropertyOptional({ description: 'Role information', type: EmployeeRoleDetailDto })
  role?: EmployeeRoleDetailDto;

  @ApiProperty({ description: 'Account creation date' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update date' })
  updatedAt: Date;

  @ApiProperty({ description: 'Whether the account is active' })
  isActive: boolean;
}

export class WeeklyStatsDto {
  @ApiProperty({ description: 'Total shifts assigned in the week' })
  totalShiftsAssigned: number;

  @ApiProperty({ description: 'Maximum shifts per week for this employment type' })
  maxShiftsPerWeek: number;

  @ApiProperty({ description: 'Can assign more shifts this week' })
  canAssignMore: boolean;

  @ApiProperty({ description: 'Remaining slots available' })
  remainingSlots: number;
}

export class EmployeeSelectionDto {
  @ApiProperty({ description: 'Employee ID' })
  id: string;

  @ApiProperty({ description: 'Full name of the employee' })
  fullName: string;

  @ApiProperty({ description: 'Email address' })
  email: string;

  @ApiProperty({ enum: EmploymentType, description: 'Employment type' })
  employmentType: EmploymentType;

  @ApiPropertyOptional({ description: 'Fixed day off (MONDAY, TUESDAY, etc.)' })
  fixedDayOff?: string;

  @ApiPropertyOptional({ description: 'Fixed day off as number (1-7, 1=Monday)', minimum: 1, maximum: 7 })
  fixedDayOffNumber?: number;

  @ApiPropertyOptional({ description: 'Weekly statistics', type: WeeklyStatsDto })
  weeklyStats?: WeeklyStatsDto;
}
