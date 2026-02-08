export interface DeptLeaveRequest {
    id: string;
    employeeId: string;
    employee: {
        id: string;
        fullName: string;
        email: string;
        employmentType: 'FULL_TIME' | 'PART_TIME';
    };
    leaveType: 'SICK' | 'EMERGENCY' | 'PERSONAL' | 'OTHER';
    startDate: string | Date;
    endDate: string | Date;
    reason: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    approvedById?: string;
    approvedBy?: {
        id: string;
        fullName: string;
        email: string;
    };
    approvedAt?: string | Date;
    rejectionReason?: string;
    createdAt: string | Date;
    updatedAt: string | Date;
    dayCount?: number;
}

export interface DeptLeaveRequestDetail extends DeptLeaveRequest {
    conflictingShifts: ConflictingShift[];
}

export interface ConflictingShift {
    id: string;
    date: string | Date;
    shiftType: 'MORNING' | 'AFTERNOON' | 'EVENING' | 'NIGHT';
    scheduleStatus: 'PENDING' | 'APPROVED' | 'LOCKED';
}

export interface DeptLeavesListResponse {
    data: DeptLeaveRequest[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    department: {
        id: string;
        name: string;
        code: string;
    };
}

export interface DeptLeaveStatsResponse {
    department: {
        id: string;
        name: string;
        code: string;
    };
    totalEmployees: number;
    leaveStats: {
        pendingRequests: number;
        approvedThisYear: number;
        rejectedThisYear: number;
        requestsThisMonth: number;
    };
}

export interface ApproveLeaveRequest {
    action: 'APPROVE' | 'REJECT';
    rejectionReason?: string;
}

export interface GetDeptLeavesQuery {
    status?: 'PENDING' | 'APPROVED' | 'REJECTED';
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
}
