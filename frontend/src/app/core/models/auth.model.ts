// Core Models - User & Authentication
export interface User {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  role: Role;
  employmentType: 'FULL_TIME' | 'PART_TIME';
  isActive?: boolean;
  permissions?: string[];
  manager?: UserBasic;
  subordinates?: UserBasic[];
}

export interface UserBasic {
  id: string;
  fullName: string;
  email: string;
}

export interface Role {
  id: string;
  name: string;
  displayName: string;
  level: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  user: User;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}
