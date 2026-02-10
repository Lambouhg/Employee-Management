// Staff Feature Models
export interface MySchedule {
  id: string;
  date: string;
  shiftName: string;
  startTime: string;
  endTime: string;
  location?: string;
  status: 'scheduled' | 'completed' | 'cancelled';
}

export interface AvailableShift {
  id: string;
  date: string;
  shiftName: string;
  startTime: string;
  endTime: string;
  department: string;
  maxRegistrations: number;
  currentRegistrations: number;
  canRegister: boolean;
}

export interface ShiftRegistration {
  id: string;
  shiftId: string;
  shiftName: string;
  date: string;
  startTime: string;
  endTime: string;
  status: 'pending' | 'approved' | 'rejected';
  requestedAt: string;
  responseAt?: string;
  responseBy?: string;
  note?: string;
}

export interface AttendanceRecord {
  id: string;
  date: string;
  shiftName: string;
  checkInTime?: string;
  checkOutTime?: string;
  status: 'present' | 'absent' | 'late' | 'pending';
  workingHours?: number;
  note?: string;
}

export interface LeaveBalance {
  totalDays: number;
  usedDays: number;
  remainingDays: number;
  pendingDays: number;
}
