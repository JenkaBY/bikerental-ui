import { FormControl } from '@angular/forms';
import { describe, expect, it } from 'vitest';
import { phonePatternValidator } from './phone-validators';

describe('phonePatternValidator', () => {
  const validator = phonePatternValidator();

  it('accepts common valid phone formats', () => {
    const valid = [
      '+1 555-123-4567',
      '375291234567',
      '(555) 123 4567',
      '+44 (0)20 1234 5678',
      '5551234567',
    ];
    valid.forEach((v) => expect(validator(new FormControl(v))).toBeNull());
  });

  it('rejects invalid phone strings', () => {
    const invalid = ['abc', '123-abc-456', '+12#345', '++123'];
    invalid.forEach((v) =>
      expect(validator(new FormControl(v))).toEqual({ phonePattern: { value: v } }),
    );
  });

  it('treats empty/null/undefined as valid (use Validators.required separately)', () => {
    expect(validator(new FormControl(''))).toBeNull();
    expect(validator(new FormControl(null))).toBeNull();
    expect(validator(new FormControl(undefined))).toBeNull();
  });
});
