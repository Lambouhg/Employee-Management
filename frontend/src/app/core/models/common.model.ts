/**
 * Common enums and types used across the application
 */

export enum LoadingState {
  IDLE = 'idle',
  LOADING = 'loading',
  SUCCESS = 'success',
  ERROR = 'error'
}

export interface ApiError {
  statusCode: number;
  message: string;
  error?: string;
  details?: any;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export type SortDirection = 'asc' | 'desc';

export interface SortConfig {
  field: string;
  direction: SortDirection;
}

export interface FilterConfig {
  [key: string]: any;
}

export interface TableState {
  page: number;
  limit: number;
  sort?: SortConfig;
  filters?: FilterConfig;
}
