import { ShiftType } from './schedule.model';

export interface ShiftTemplate {
    id: string;
    name: string;
    code: string;
    departmentId: string;
    shiftType: ShiftType;
    startTime: string; // ISO time string or "HH:mm" depends on API response (usually ISO from NestJS Date)
    endTime: string;
    totalHours: number;
    isActive: boolean;
    allowFullTime: boolean;
    allowPartTime: boolean;
    description?: string;
    notes?: string;
    createdAt: string;
    updatedAt: string;
}

export interface CreateShiftTemplateDto {
    name: string;
    code: string;
    shiftType: ShiftType;
    startTime: string; // HH:mm
    endTime: string; // HH:mm
    totalHours?: number;
    allowFullTime?: boolean;
    allowPartTime?: boolean;
    description?: string;
    notes?: string;
}

export interface UpdateShiftTemplateDto extends Partial<CreateShiftTemplateDto> {
    isActive?: boolean;
}
