/**
 * Employee Assignment Model
 * Dùng để hiển thị thông tin nhân viên khi gán ca
 */
export interface EmployeeAssignment {
  id: string;
  fullName: string;
  email: string;
  employmentType: 'FULL_TIME' | 'PART_TIME';

  // Thông tin ngày nghỉ cố định (Full-time)
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

/**
 * Employee Filter Type
 */
export type EmployeeFilterType = 'ALL' | 'FULL_TIME' | 'PART_TIME';

/**
 * Shift Opening with Capacity Info
 */
export interface ShiftOpeningWithCapacity {
  id: string;
  date: string;
  shiftType: string;
  startTime: string;
  endTime: string;

  // Full-time capacity
  isFTEnabled: boolean;
  ftAssignedCount?: number;

  // Part-time capacity
  isPTEnabled: boolean;
  ptCapacity: number;
  ptRegistered: number;
  ptAvailableSlots?: number;

  // Assigned employees
  shifts?: any[];
}
