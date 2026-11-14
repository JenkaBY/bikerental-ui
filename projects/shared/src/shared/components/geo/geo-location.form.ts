import {
  AbstractControl,
  FormControl,
  FormGroup,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { ApiErrorParser } from '../../../core/errors/api-error.parser';
import type { ApiError } from '../../../core/errors/api-error.model';
import { ErrorCode } from '../../../core/errors/error-code';
import { applyServerErrors, SERVER_ERROR_KEY } from '../../../core/errors/server-errors.util';
import { resolveErrorMessage } from '../../../core/errors/error-message.resolver';
import type {
  GeoCityChoice,
  GeoCountry,
  GeoLocation,
  GeoLocationWrite,
} from '../../../core/models/geo.model';

export type GeoLocationFormGroup = FormGroup<{
  country: FormControl<GeoCountry | null>;
  city: FormControl<GeoCityChoice | null>;
  street: FormControl<string>;
}>;

export interface GeoLocationFormValue {
  country: GeoCountry | null;
  city: GeoCityChoice | null;
  street: string;
}

const CITY_NAME_MAX = 100;
const STREET_MAX = 255;
const LETTER = /\p{L}/u;

export function geoCityNameValidator(control: AbstractControl): ValidationErrors | null {
  const value: unknown = control.value;
  if (typeof value !== 'string') return null;
  const name = value.trim();
  return name.length >= 1 && name.length <= CITY_NAME_MAX && LETTER.test(name)
    ? null
    : { cityName: true };
}

export function createGeoLocationGroup(): GeoLocationFormGroup {
  return new FormGroup({
    country: new FormControl<GeoCountry | null>(null, { validators: [Validators.required] }),
    city: new FormControl<GeoCityChoice | null>(null, {
      validators: [Validators.required, geoCityNameValidator],
    }),
    street: new FormControl('', {
      nonNullable: true,
      validators: [Validators.maxLength(STREET_MAX)],
    }),
  });
}

export function geoLocationFormValue(location: GeoLocation | null): GeoLocationFormValue {
  if (!location) return { country: null, city: null, street: '' };
  return {
    country: { code: location.country.code, name: location.country.name, defaultTimeZone: null },
    city: {
      id: location.city.id,
      name: location.city.name,
      region: location.city.region,
      timeZone: null,
      suggestedTimeZone: null,
      userEntered: location.city.userEntered,
    },
    street: location.street ?? '',
  };
}

export function syncGeoLocationEnabled(
  group: GeoLocationFormGroup,
  dependents: readonly AbstractControl[] = [],
): void {
  const hasCountry = !!group.controls.country.value;
  for (const control of [group.controls.city, group.controls.street, ...dependents]) {
    if (hasCountry) control.enable({ emitEvent: false });
    else control.disable({ emitEvent: false });
  }
}

export function toGeoLocationWrite(group: GeoLocationFormGroup): GeoLocationWrite | null {
  const { country, city, street } = group.getRawValue();
  if (!country || city === null) return null;
  return { countryCode: country.code, city, street };
}

export function isSameGeoLocation(write: GeoLocationWrite, location: GeoLocation | null): boolean {
  return (
    !!location &&
    typeof write.city !== 'string' &&
    write.countryCode === location.country.code &&
    write.city.id === location.city.id &&
    write.street.trim() === (location.street ?? '')
  );
}

export function applyGeoLocationErrors(group: GeoLocationFormGroup, err: unknown): string[] {
  const apiError: ApiError = ApiErrorParser.parse(err);
  if (
    apiError.code === ErrorCode.GEO_CITY_NOT_FOUND ||
    apiError.code === ErrorCode.GEO_CITY_NOT_IN_COUNTRY
  ) {
    const city = group.controls.city;
    city.setErrors({ ...(city.errors ?? {}), [SERVER_ERROR_KEY]: resolveErrorMessage(apiError) });
    city.markAsTouched();
    return [];
  }
  const fieldErrors = apiError.fieldErrors.map((f) => ({
    ...f,
    field: f.field === 'cityId' || f.field === 'name' ? 'city' : f.field,
  }));
  const unmatched = applyServerErrors(group, { ...apiError, fieldErrors });
  if (unmatched.length) return unmatched;
  return apiError.fieldErrors.length ? [] : [resolveErrorMessage(apiError)];
}
