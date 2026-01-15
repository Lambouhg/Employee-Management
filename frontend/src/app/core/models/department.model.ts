export interface Department {
  id: string;
  name: string;
  code: string;
  description?: string;
  parentId?: string;
  isActive: boolean;
  createdAt: string;
  manager?: DepartmentManager;
  employees?: DepartmentEmployee[];
  subDepartments?: {
    id: string;
    name: string;
    code: string;
  }[];
  _count?: {
    employees: number;
    subDepartments: number;
  };
}

export interface DepartmentDetail extends Department {
  parent?: {
    id: string;
    name: string;
    code: string;
  };
  statistics: {
    totalEmployees: number;
    activeEmployees: number;
    fullTimeEmployees: number;
    partTimeEmployees: number;
    totalSubDepartments: number;
  };
}

export interface DepartmentEmployee {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  employmentType: 'FULL_TIME' | 'PART_TIME';
  isActive: boolean;
  role: {
    id: string;
    name: string;
    displayName: string;
    level: number;
  };
}

export interface DepartmentManager {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  role: {
    id: string;
    name: string;
    displayName: string;
    level: number;
  };
}
