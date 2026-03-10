import { FormControl } from '@angular/forms';
import { SLUG_PATTERN, SlugValidators } from './slug-validators';

describe('SlugValidators', () => {
  it('pattern constant matches expected slugs', () => {
    expect(SLUG_PATTERN.test('bike')).toBe(true);
    expect(SLUG_PATTERN.test('bike-123')).toBe(true);
    expect(SLUG_PATTERN.test('bike_123')).toBe(true);
    expect(SLUG_PATTERN.test('Bike')).toBe(true); // uppercase not allowed
    expect(SLUG_PATTERN.test('with space')).toBe(false);
    expect(SLUG_PATTERN.test('with$symbol')).toBe(false);
  });

  it('SlugValidators enforce required, pattern and maxLength', () => {
    const control = new FormControl('', SlugValidators);
    expect(control.errors).toBeTruthy();
    expect(control.hasError('required')).toBe(true);

    control.setValue('a'.repeat(51));
    expect(control.hasError('maxlength')).toBe(true);

    control.setValue('valid-slug_123');
    expect(control.valid).toBe(true);
  });
});
