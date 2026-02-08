// DTOs matching backend response structures
export interface EmployeeRole {
  displayName: string;
}

export interface EmployeeRoleDetail {
  displayName: string;
  name: string;
}

export interface Department {
  name: string;
  code: string;
}

export interface EmployeeListItem {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  employmentType: 'FULL_TIME' | 'PART_TIME';
  fixedDayOff?: number;
  role?: EmployeeRole;
  createdAt: string;
}

export interface EmployeeDetail {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  employmentType: 'FULL_TIME' | 'PART_TIME';
  fixedDayOff?: number;
  department?: Department;
  role?: EmployeeRoleDetail;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
}

export interface EmployeeSelection {
  id: string;
  fullName: string;
  email: string;
  employmentType: 'FULL_TIME' | 'PART_TIME';
  role?: string;

  // Thông tin ngày nghỉ cố định cho FULL_TIME
  fixedDayOff?: string; // 'MONDAY', 'TUESDAY', etc.
  fixedDayOffNumber?: number; // 1-7 (1 = Monday)

  // Thống kê ca làm việc trong tuần
  weeklyStats?: {
    totalShiftsAssigned: number;
    maxShiftsPerWeek: number;
    canAssignMore: boolean;
    remainingSlots: number;
  };
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginatedEmployeesResponse {
  data: EmployeeListItem[];
  meta: PaginationMeta;
}

export interface GetEmployeesParams {
  page?: number;
  limit?: number;
  search?: string;
}
