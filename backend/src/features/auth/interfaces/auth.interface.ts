export interface JwtPayload {
  sub: string; // userId
  email: string;
  roleId: string;
  roleName: string;
  roleLevel: number;
}

export interface LoginResponse {
  accessToken: string;
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
    employmentType: string;
  };
}
