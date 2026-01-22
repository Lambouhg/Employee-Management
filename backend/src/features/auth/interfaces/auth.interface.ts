export interface JwtPayload {
  sub: string; // userId
  email: string;
  roleId: string;
  roleName: string;
  roleLevel: number;
  type?: 'access' | 'refresh'; // Token type
}

export interface LoginResponse {
  accessToken: string;
  refreshToken?: string;
  user: {
    id: string;
    email: string;
    fullName: string;
    role: {
      id: string;
      name: string;
      displayName: string;
      level: number;
    };
    department?: {
      id: string;
      name: string;
      code: string;
    } | null;
    employmentType: string;
  };
}

export interface RefreshTokenResponse {
  accessToken: string;
}

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  phone?: string | null;
  role: {
    id: string;
    name: string;
    displayName: string;
    level: number;
  };
  department?: {
    id: string;
    name: string;
    code: string;
  } | null;
  employmentType: string;
  fixedDayOff?: string | null;
  isActive: boolean;
  createdAt: Date;
  manager?: {
    id: string;
    fullName: string;
    email: string;
  } | null;
  subordinates?: {
    id: string;
    fullName: string;
    email: string;
  }[];
  permissions: string[];
}
