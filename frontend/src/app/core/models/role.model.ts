export interface Role {
  id: string;
  name: string;
  displayName: string;
  description?: string;
  level: number;
}

export interface Manager {
  id: string;
  fullName: string;
  email: string;
  role: {
    name: string;
    displayName: string;
    level: number;
  };
  department?: {
    id: string;
    name: string;
    code: string;
  };
}
