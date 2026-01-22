// Core Models - User & Authentication
export interface User {
  id: string;
  email: string;
  fullName: string;
  phone?: string | null;
  role: Role;
  department?: Department | null;
  employmentType: 'FULL_TIME' | 'PART_TIME';
  fixedDayOff?: string | null;
  isActive?: boolean;
  createdAt?: string | Date;
  permissions?: string[];
  manager?: UserBasic | null;
  subordinates?: UserBasic[];
}

export interface UserBasic {
  id: string;
  fullName: string;
  email: string;
}

export interface Role {
  id: string;
  name: string; // 'MANAGER', 'DEPT_MANAGER', 'STAFF'
  displayName: string;
  level: number; // 3, 2, 1
}

export interface Department {
  id: string;
  name: string;
  code: string;
  description?: string;
  parentId?: string;
  manager?: UserBasic;
  _count?: {
    employees: number;
    subDepartments: number;
  };
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken?: string;
  user: User;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
}

export interface ChangePasswordRequest {
  oldPassword: string;
  newPassword: string;
}

export interface ChangePasswordResponse {
  message: string;
}

export interface LogoutResponse {
  message: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}
