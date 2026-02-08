import { AttendanceStatus, ShiftType } from '@prisma/client';

export class AttendanceResponseDto {
    id: string;
    shiftId: string;
    employeeId: string;
    checkInTime: Date | null;
    checkOutTime: Date | null;
    totalMinutes: number | null;
    status: AttendanceStatus;
    notes: string | null;
    createdAt: Date;
    updatedAt: Date;

    // Thông tin ca làm việc
    shift: {
        date: Date;
        shiftType: ShiftType;
        startTime: Date;
        endTime: Date;
    };
}

export class TodayAttendanceDto {
    hasShift: boolean; // Có ca làm hôm nay không
    shift?: {
        id: string;
        date: Date;
        shiftType: ShiftType;
        startTime: Date;
        endTime: Date;
        notes: string | null;
    };
    attendance?: {
        id: string;
        checkInTime: Date | null;
        status: AttendanceStatus;
        notes: string | null;
        canCheckIn: boolean; // Có thể điểm danh được không
        message?: string; // Thông báo (quá giờ, đã điểm danh, etc.)
    };
    canCheckIn: boolean; // Có thể điểm danh không
    message?: string; // Thông báo cho user
}
