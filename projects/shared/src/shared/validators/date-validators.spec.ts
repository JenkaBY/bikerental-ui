import { FormControl } from '@angular/forms';
import { describe, expect, it } from 'vitest';
import { pastDateValidator } from './date-validators';

describe('pastDateValidator', () => {
  const validator = pastDateValidator();

  it('returns null for empty values', () => {
    expect(validator(new FormControl(null))).toBeNull();
    expect(validator(new FormControl(''))).toBeNull();
  });

  it('accepts a date strictly in the past', () => {
    const past = new Date();
    past.setDate(past.getDate() - 2);
    expect(validator(new FormControl(past))).toBeNull();
  });

  it('rejects today as invalid', () => {
    const today = new Date();
    expect(validator(new FormControl(today))).toEqual({ notInPast: true });
  });

  it('rejects a future date', () => {
    const future = new Date();
    future.setDate(future.getDate() + 3);
    expect(validator(new FormControl(future))).toEqual({ notInPast: true });
  });

  it('handles ISO date strings', () => {
    const past = new Date();
    past.setDate(past.getDate() - 5);
    expect(validator(new FormControl(past.toISOString()))).toBeNull();
  });
});
