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

export class ShiftWithAttendanceDto {
    id: string;
    date: Date;
    shiftType: ShiftType;
    startTime: Date;
    endTime: Date;
    notes: string | null;
    attendance?: {
        id: string;
        checkInTime: Date | null;
        status: AttendanceStatus;
        notes: string | null;
    };
    canCheckIn: boolean;
    message: string;
}

export class TodayAttendanceDto {
    hasShift: boolean;
    shifts: ShiftWithAttendanceDto[];
    message: string;
}
