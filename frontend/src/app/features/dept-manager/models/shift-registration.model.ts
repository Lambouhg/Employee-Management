/**
 * Shift Registration Models
 * Dùng cho approval workflow của shift registrations
 * Pattern này sẽ được tái sử dụng cho leaves và attendance sau này
 */

export enum RegistrationStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED'
}

export enum ShiftType {
  MORNING = 'MORNING',
  AFTERNOON = 'AFTERNOON',
  EVENING = 'EVENING',
  NIGHT = 'NIGHT'
}

export enum EmploymentType {
  FULL_TIME = 'FULL_TIME',
  PART_TIME = 'PART_TIME'
}

// Base interface for all approval items (reusable for leaves, attendance)
export interface BaseApprovalItem {
  id: string;
  status: RegistrationStatus;
  createdAt: string;
  reviewedAt?: string;
  rejectionReason?: string;
}

// Employee info trong registration
export interface RegistrationEmployee {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  employmentType: EmploymentType;
  role?: {
    id: string;
    name: string;
    displayName: string;
  };
  department?: {
    id: string;
    name: string;
    code: string;
  };
}

// Opening info trong registration
export interface RegistrationOpening {
  id: string;
  date: string;
  shiftType: ShiftType;
  startTime: string;
  endTime: string;
  ptCapacity: number;
  notes?: string;
  plan: {
    weekStartDate: string;
    status: string;
    department: { name: string };
  };
  template?: {
    name: string;
    code: string;
  };
  _count?: {
    shiftRegistrations: number;
  };
}

// Main shift registration interface
export interface ShiftRegistration extends BaseApprovalItem {
  employee: RegistrationEmployee;
  opening: RegistrationOpening;
  notes?: string; // Employee notes when registering
  availableSlots?: number; // Calculated field
  reviewedBy?: {
    id: string;
    fullName: string;
    email: string;
  };
}

// Query params
export interface GetRegistrationsQuery {
  status?: RegistrationStatus;
  date?: string;
  page?: number;
  limit?: number;
}

// Review DTO
export interface ReviewRegistrationDto {
  status: RegistrationStatus.APPROVED | RegistrationStatus.REJECTED;
  rejectionReason?: string;
}

// Paginated response
export interface PaginatedRegistrationsResponse {
  data: ShiftRegistration[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// Statistics
export interface RegistrationStats {
  pending: number;
  approved: number;
  rejected: number;
  cancelled: number;
  total: number;
}
