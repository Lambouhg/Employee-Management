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
    role: {
      name: string;
      displayName: string;
      level: number;
    };
    department?: {
      id: string;
      name: string;
      code: string;
    };
  };
  subordinates?: {
    id: string;
    fullName: string;
    email: string;
    role: {
      name: string;
      displayName: string;
      level: number;
    };
    employmentType: string;
    isActive: boolean;
  }[];
  subordinatesCount?: number;
  reportingChain?: {
    id: string;
    fullName: string;
    role: {
      name: string;
      displayName: string;
      level: number;
    };
  }[];
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
  // managerId will be auto-assigned from department.manager
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
  isActive?: boolean;
  // managerId will be auto-assigned from department.manager
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
