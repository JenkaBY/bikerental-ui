import { Validators } from '@angular/forms';

export const SLUG_PATTERN = /^[a-z0-9-_]+$/;

export const SlugValidators = [
  Validators.required,
  Validators.pattern(SLUG_PATTERN),
  Validators.maxLength(50),
];
