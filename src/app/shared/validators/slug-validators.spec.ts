import { FormControl } from '@angular/forms';
import { SLUG_PATTERN, SlugValidators } from './slug-validators';

describe('SlugValidators', () => {
  it('pattern constant matches expected slugs', () => {
    expect(SLUG_PATTERN.test('BIKE')).toBe(true);
    expect(SLUG_PATTERN.test('BIKE-123')).toBe(true);
    expect(SLUG_PATTERN.test('BIKE_123')).toBe(true);
    expect(SLUG_PATTERN.test('bike')).toBe(false);
    expect(SLUG_PATTERN.test('Bike')).toBe(false);
    expect(SLUG_PATTERN.test('with space')).toBe(false);
    expect(SLUG_PATTERN.test('with$symbol')).toBe(false);
  });

  it('SlugValidators enforce required, pattern and maxLength', () => {
    const control = new FormControl('', SlugValidators);
    expect(control.errors).toBeTruthy();
    expect(control.hasError('required')).toBe(true);

    control.setValue('a'.repeat(51));
    expect(control.hasError('maxlength')).toBe(true);

    control.setValue('VALID-SLUG_123');
    expect(control.valid).toBe(true);
  });
});
