import type { ProblemDetail } from '../api/generated';

export type ApiErrorKind = 'validation' | 'domain' | 'system' | 'network';

export interface FieldError {
  field: string;
  code: string;
  message?: string;
  params?: Record<string, unknown>;
}

export interface ApiError {
  code: string;
  kind: ApiErrorKind;
  status: number;
  detail: string;
  fieldErrors: FieldError[];
  params: Record<string, unknown>;
  traceId?: string;
  raw: ProblemDetail | null;
}

export const UNKNOWN_ERROR_CODE = 'UNKNOWN';
export const NETWORK_ERROR_CODE = 'NETWORK';
