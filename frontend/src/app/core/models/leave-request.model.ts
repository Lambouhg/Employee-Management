export enum LeaveStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED'
}

export enum LeaveType {
  SICK = 'SICK',
  EMERGENCY = 'EMERGENCY',
  PERSONAL = 'PERSONAL',
  OTHER = 'OTHER'
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  employee?: {
    id: string;
    fullName: string;
    email: string;
    department?: {
      id: string;
      name: string;
    };
  };
  leaveType: LeaveType;
  startDate: string; // ISO date string
  endDate: string; // ISO date string
  reason: string;
  status: LeaveStatus;
  approvedById?: string;
  approvedBy?: {
    id: string;
    fullName: string;
  };
  approvedAt?: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateLeaveRequestDto {
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  reason: string;
}

export interface UpdateLeaveRequestDto {
  status?: LeaveStatus;
  approvedById?: string;
  rejectionReason?: string;
}

export interface LeaveRequestFilterDto {
  status?: LeaveStatus;
  employeeId?: string;
  departmentId?: string;
  startDate?: string;
  endDate?: string;
  leaveType?: LeaveType;
}
