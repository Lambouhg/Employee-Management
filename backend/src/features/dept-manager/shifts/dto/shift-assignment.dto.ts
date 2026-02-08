import { IsNotEmpty, IsUUID, IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';
import { ShiftType, EmploymentType } from '@prisma/client';

/**
 * Response DTO khi lấy thông tin nhân viên để gán ca
 * Bao gồm thống kê về ca làm việc trong tuần
 */
export class EmployeeAssignmentInfoDto {
    id: string;
    fullName: string;
    email: string;
    employmentType: EmploymentType;

    // Thông tin ngày nghỉ cố định cho FULL_TIME
    fixedDayOff?: string; // "MONDAY", "TUESDAY", etc.
    fixedDayOffNumber?: number; // 0-6 (0 = Sunday)

    // Thống kê ca làm việc trong tuần hiện tại
    weeklyStats?: {
        totalShiftsAssigned: number; // Tổng số ca đã gán trong tuần
        shiftsByDay: Record<string, number>; // Số ca theo từng ngày
        canAssignMore: boolean; // Còn có thể gán thêm không?
        maxShiftsPerWeek: number; // Giới hạn ca/tuần (FT: 6, PT: 5)
    };
}

/**
 * Response DTO khi gán ca thành công
 */
export class AssignShiftResponseDto {
    success: boolean;
    message: string;
    shift: {
        id: string;
        date: string;
        shiftType: ShiftType;
        employee: {
            id: string;
            fullName: string;
            employmentType: EmploymentType;
        };
    };
}

/**
 * Response DTO chứa thông tin capacity của shift opening
 */
export class ShiftOpeningCapacityDto {
    id: string;
    date: string;
    shiftType: ShiftType;

    // Full-time capacity
    isFTEnabled: boolean;
    ftAssignedCount: number;

    // Part-time capacity
    isPTEnabled: boolean;
    ptCapacity: number;
    ptRegistered: number;
    ptAvailableSlots: number; // = ptCapacity - ptRegistered

    // Danh sách nhân viên đã gán
    assignedEmployees: EmployeeAssignmentInfoDto[];
}
