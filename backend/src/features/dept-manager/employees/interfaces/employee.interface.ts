export interface ICurrentUser {
  id: string;
  email: string;
  roleId: string;
  departmentId?: string;
}

export interface IEmployeeQueryOptions {
  page: number;
  limit: number;
  search: string;
}

export interface IPaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface IPaginatedResult<T> {
  data: T[];
  meta: IPaginationMeta;
}
