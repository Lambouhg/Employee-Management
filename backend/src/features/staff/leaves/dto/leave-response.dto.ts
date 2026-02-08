import { LeaveStatus, LeaveType } from '@prisma/client';

export class LeaveRequestResponseDto {
    id: string;
    employeeId: string;
    leaveType: LeaveType;
    startDate: Date;
    endDate: Date;
    reason: string;
    status: LeaveStatus;
    approvedById: string | null;
    approvedBy: {
        id: string;
        fullName: string;
        email: string;
    } | null;
    approvedAt: Date | null;
    rejectionReason: string | null;
    createdAt: Date;
    updatedAt: Date;
    dayCount: number; // Số ngày nghỉ
}

export class LeaveBalanceDto {
    totalAnnualLeave: number; // Tổng phép năm
    usedLeave: number; // Đã sử dụng
    remainingLeave: number; // Còn lại
    pendingLeave: number; // Đang chờ duyệt
}

export class LeaveRequestListDto {
    data: LeaveRequestResponseDto[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}
