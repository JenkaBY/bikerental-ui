import {
  AbstractControl,
  FormControl,
  FormGroup,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import {
  applyServerErrors,
  createGeoLocationGroup,
  ErrorCode,
  resolveErrorMessage,
  SERVER_ERROR_KEY,
} from '@bikerental/shared';
import type { ApiError, Client, GeoLocationFormGroup } from '@bikerental/shared';

export const CLIENT_SLUG_PATTERN = /^[A-Z0-9_-]+$/;
export const CLIENT_SLUG_MAX = 50;
export const CLIENT_CURRENCY_PATTERN = /^[A-Za-z]{3}$/;
export const CLIENT_PHONE_PATTERN = /^\+?[0-9\-\s()]+$/;

export type ClientFormGroup = FormGroup<{
  currency: FormControl<string>;
  displayName: FormControl<string>;
  legalName: FormControl<string>;
  registrationNumber: FormControl<string>;
  contactEmail: FormControl<string>;
  contactPhone: FormControl<string>;
  location: GeoLocationFormGroup;
  timeZone: FormControl<string | null>;
}>;

export function toClientSlug(displayName: string): string {
  return displayName.trim().replace(/ /g, '_').toUpperCase();
}

export function noConsecutiveSpacesValidator(control: AbstractControl): ValidationErrors | null {
  return typeof control.value === 'string' && control.value.includes('  ')
    ? { consecutiveSpaces: true }
    : null;
}

export function slugSourceValidator(control: AbstractControl): ValidationErrors | null {
  if (typeof control.value !== 'string' || !control.value.trim()) return null;
  const slug = toClientSlug(control.value);
  if (!CLIENT_SLUG_PATTERN.test(slug)) return { slugChars: true };
  if (slug.length > CLIENT_SLUG_MAX) return { slugLength: true };
  return null;
}

function text(validators: ValidatorFn[] = []): FormControl<string> {
  return new FormControl('', { nonNullable: true, validators });
}

export function createClientForm(registering: boolean): ClientFormGroup {
  const nameValidators = [
    Validators.required,
    Validators.maxLength(200),
    noConsecutiveSpacesValidator,
  ];
  return new FormGroup({
    currency: text([Validators.required, Validators.pattern(CLIENT_CURRENCY_PATTERN)]),
    displayName: text(registering ? [...nameValidators, slugSourceValidator] : nameValidators),
    legalName: text([Validators.required, Validators.maxLength(300)]),
    registrationNumber: text([Validators.maxLength(50)]),
    contactEmail: text([Validators.email, Validators.maxLength(255)]),
    contactPhone: text([Validators.maxLength(20), Validators.pattern(CLIENT_PHONE_PATTERN)]),
    location: createGeoLocationGroup(),
    timeZone: new FormControl<string | null>(
      { value: null, disabled: !registering },
      { validators: [Validators.required] },
    ),
  });
}

const CODE_FIELDS: Record<string, string> = {
  [ErrorCode.CLIENT_SLUG_DUPLICATE]: 'displayName',
  [ErrorCode.CLIENT_SLUG_RESERVED]: 'displayName',
  [ErrorCode.CLIENT_CURRENCY_NOT_LEGAL_TENDER]: 'currency',
  [ErrorCode.CLIENT_LOCATION_UNKNOWN]: 'location.city',
  [ErrorCode.CLIENT_BUSINESS_LOCATION_OUTSIDE_COUNTRY]: 'location.country',
};

const FIELD_ALIASES: Record<string, string> = {
  slug: 'displayName',
  businessGeoLocationId: 'location.city',
};

export function isStaleClientVersion(apiError: ApiError): boolean {
  return apiError.code === ErrorCode.RESOURCE_OPTIMISTIC_LOCK;
}

export function applyClientErrors(form: ClientFormGroup, apiError: ApiError): string[] {
  const path = CODE_FIELDS[apiError.code];
  const control = path ? form.get(path) : null;
  if (control) {
    control.setErrors({
      ...(control.errors ?? {}),
      [SERVER_ERROR_KEY]: resolveErrorMessage(apiError),
    });
    control.markAsTouched();
    return [];
  }
  const fieldErrors = apiError.fieldErrors.map((f) => ({
    ...f,
    field: (f.field && FIELD_ALIASES[f.field]) || f.field,
  }));
  const unmatched = applyServerErrors(form, { ...apiError, fieldErrors });
  if (unmatched.length) return unmatched;
  return apiError.fieldErrors.length ? [] : [resolveErrorMessage(apiError)];
}

export function patchClientForm(form: ClientFormGroup, client: Client): void {
  form.patchValue({
    currency: client.currency,
    displayName: client.displayName,
    legalName: client.legalName,
    registrationNumber: client.registrationNumber ?? '',
    contactEmail: client.contactEmail ?? '',
    contactPhone: client.contactPhone ?? '',
  });
  form.controls.currency.disable();
}
