export interface Employee {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  employmentType: 'FULL_TIME' | 'PART_TIME';
  fixedDayOff?: string;
  isActive: boolean;
  createdAt: string;
  role: {
    id: string;
    name: string;
    displayName: string;
    level: number;
  };
  department?: {
    id: string;
    name: string;
    code: string;
  };
  manager?: {
    id: string;
    fullName: string;
    email: string;
  };
  subordinates?: any[];
  permissions?: string[];
}

export interface EmployeeQueryParams {
  search?: string;
  employmentType?: 'FULL_TIME' | 'PART_TIME';
  roleId?: string;
  managerId?: string;
  departmentId?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
}

export interface CreateEmployeeDto {
  email: string;
  password: string;
  fullName: string;
  phone?: string;
  roleId: string;
  departmentId?: string;
  employmentType: 'FULL_TIME' | 'PART_TIME';
  fixedDayOff?: string;
  managerId?: string;
}

export interface UpdateEmployeeDto {
  email?: string;
  password?: string;
  fullName?: string;
  phone?: string;
  roleId?: string;
  departmentId?: string;
  employmentType?: 'FULL_TIME' | 'PART_TIME';
  fixedDayOff?: string;
  managerId?: string;
  isActive?: boolean;
}

export interface SubordinatesResponse {
  manager: {
    id: string;
    fullName: string;
    email: string;
  };
  subordinates: Employee[];
  count: number;
}
