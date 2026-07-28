import { AbstractControl, FormGroup } from '@angular/forms';
import { ApiError } from './api-error.model';
import { resolveFieldErrorMessage } from './error-message.resolver';

export const SERVER_ERROR_KEY = 'server';

export function applyServerErrors(form: FormGroup, error: ApiError): string[] {
  const unmatched: string[] = [];

  for (const fieldError of error.fieldErrors) {
    const message = resolveFieldErrorMessage(fieldError);
    const control = fieldError.field ? findControl(form, fieldError.field) : null;
    if (control) {
      control.setErrors({ ...(control.errors ?? {}), [SERVER_ERROR_KEY]: message });
      control.markAsTouched();
    } else {
      unmatched.push(message);
    }
  }

  return unmatched;
}

export function resolveGeneralErrors(error: ApiError): string[] {
  return error.fieldErrors.filter((e) => !e.field).map((e) => resolveFieldErrorMessage(e));
}

export function clearServerErrors(form: FormGroup): void {
  forEachControl(form, (control) => {
    if (control.hasError(SERVER_ERROR_KEY)) {
      const remaining = { ...(control.errors ?? {}) };
      delete remaining[SERVER_ERROR_KEY];
      control.setErrors(Object.keys(remaining).length ? remaining : null);
    }
  });
}

function findControl(form: FormGroup, field: string): AbstractControl | null {
  return form.get(field) ?? form.get(field.split('.')) ?? null;
}

function forEachControl(group: FormGroup, visit: (control: AbstractControl) => void): void {
  for (const control of Object.values(group.controls)) {
    if (control instanceof FormGroup) {
      forEachControl(control, visit);
    } else {
      visit(control);
    }
  }
}
