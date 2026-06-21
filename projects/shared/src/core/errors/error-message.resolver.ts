import { Injectable } from '@angular/core';
import { ApiError, FieldError, NETWORK_ERROR_CODE } from './api-error.model';
import { ErrorMessageCatalog, MessageTemplate, ErrorMessages } from './error-messages';

export function resolveErrorMessage(error: ApiError): string {
  if (error.code === NETWORK_ERROR_CODE) return ErrorMessages.network;

  const template = ErrorMessageCatalog[error.code];
  if (template) return render(template, error.params);

  return ErrorMessages.statusFallbacks[error.status] ?? ErrorMessages.generic;
}

export function resolveFieldErrorMessage(field: FieldError): string {
  if (field.message) return field.message;

  const template = ErrorMessageCatalog[field.code];
  if (template) return render(template, field.params ?? {});

  return ErrorMessages.generic;
}

@Injectable({ providedIn: 'root' })
export class ErrorMessageResolver {
  resolve(error: ApiError): string {
    return resolveErrorMessage(error);
  }

  resolveField(field: FieldError): string {
    return resolveFieldErrorMessage(field);
  }
}

function render(template: MessageTemplate, params: Record<string, unknown>): string {
  return typeof template === 'function' ? template(params) : template;
}
