import { HttpErrorResponse } from '@angular/common/http';
import type { ProblemDetail } from '../api/generated';
import {
  ApiError,
  ApiErrorKind,
  FieldError,
  NETWORK_ERROR_CODE,
  UNKNOWN_ERROR_CODE,
} from './api-error.model';
import { isDomainCode, isValidationCode } from './error-code';

type UnknownRecord = Record<string, unknown>;

export class ApiErrorParser {
  static parse(error: unknown): ApiError {
    if (error instanceof HttpErrorResponse) {
      return this.fromHttpError(error);
    }
    return this.synthetic(UNKNOWN_ERROR_CODE, 0, asMessage(error));
  }

  private static fromHttpError(error: HttpErrorResponse): ApiError {
    if (error.status === 0) {
      return this.synthetic(NETWORK_ERROR_CODE, 0, error.message);
    }

    const body = isRecord(error.error) ? error.error : null;
    if (!body || !hasProblemShape(body)) {
      return this.synthetic(
        UNKNOWN_ERROR_CODE,
        error.status,
        asMessage(error.error) ?? error.message,
      );
    }

    const code = readCode(body);
    const status = typeof body['status'] === 'number' ? body['status'] : error.status;

    return {
      code,
      kind: classify(code, status),
      status,
      detail: firstString(body, ['detail', 'title']) ?? error.message,
      fieldErrors: readFieldErrors(body),
      params: readParams(body),
      traceId: firstString(body, ['correlationId', 'traceId', 'trace_id']),
      raw: body as unknown as ProblemDetail,
    };
  }

  private static synthetic(code: string, status: number, detail?: string): ApiError {
    return {
      code,
      kind: classify(code, status),
      status,
      detail: detail ?? '',
      fieldErrors: [],
      params: {},
      traceId: undefined,
      raw: null,
    };
  }
}

function hasProblemShape(body: UnknownRecord): boolean {
  return 'errorCode' in body || 'detail' in body || 'title' in body || 'type' in body;
}

function classify(code: string, status: number): ApiErrorKind {
  if (code === NETWORK_ERROR_CODE || status === 0) return 'network';
  if (isValidationCode(code)) return 'validation';
  if (isDomainCode(code)) return 'domain';
  if (status >= 500) return 'system';
  return 'domain';
}

function readCode(body: UnknownRecord): string {
  const code = body['errorCode'];
  if (typeof code === 'string' && code.length > 0) return code;
  const type = body['type'];
  if (typeof type === 'string' && type.length > 0 && type !== 'about:blank') return type;
  return UNKNOWN_ERROR_CODE;
}

function readFieldErrors(body: UnknownRecord): FieldError[] {
  const errors = body['errors'];
  if (Array.isArray(errors)) {
    return errors.map(toFieldError).filter((e): e is FieldError => e !== null);
  }
  return [];
}

function toFieldError(raw: unknown): FieldError | null {
  if (!isRecord(raw)) return null;
  const field = firstString(raw, ['field', 'property', 'propertyPath', 'name', 'parameter']);
  if (!field) return null;
  return {
    field,
    code: firstString(raw, ['code', 'errorCode']) ?? UNKNOWN_ERROR_CODE,
    message: firstString(raw, ['message', 'defaultMessage', 'detail']),
    params: isRecord(raw['params']) ? raw['params'] : undefined,
  };
}

function readParams(body: UnknownRecord): UnknownRecord {
  const params = body['params'];
  return isRecord(params) ? params : {};
}

function firstString(record: UnknownRecord, keys: string[]): string | undefined {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'string' && value.length > 0) return value;
  }
  return undefined;
}

function asMessage(value: unknown): string | undefined {
  if (typeof value === 'string') return value;
  if (value instanceof Error) return value.message;
  return undefined;
}

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
