import { describe, expect, it } from 'vitest';
import { parseDate, toIsoDate } from './date.util';

describe('date.util', () => {
  describe('parseDate', () => {
    it('returns null for null, undefined or empty string', () => {
      expect(parseDate(null)).toBeNull();
      expect(parseDate(undefined)).toBeNull();
      expect(parseDate('')).toBeNull();
    });

    it('parses ISO-like date string to a Date at local midnight', () => {
      const d = parseDate('2023-03-05');
      expect(d).toBeInstanceOf(Date);
      // round-trip formatting should preserve the date part
      expect(toIsoDate(d as Date)).toBe('2023-03-05');
    });

    it('returns an invalid Date object for malformed input (does not throw)', () => {
      const d = parseDate('not-a-date');
      expect(d).toBeInstanceOf(Date);
      expect(isNaN((d as Date).getTime())).toBe(true);
    });
  });

  describe('toIsoDate', () => {
    it('formats date with zero-padded month and day', () => {
      const d = new Date(2021, 0, 5); // 2021-01-05
      expect(toIsoDate(d)).toBe('2021-01-05');
    });

    it('formats leap day correctly', () => {
      const d = new Date(2020, 1, 29); // 2020-02-29
      expect(toIsoDate(d)).toBe('2020-02-29');
    });

    it('round-trips parseDate -> toIsoDate', () => {
      const original = '1999-12-31';
      const parsed = parseDate(original) as Date;
      expect(parsed).toBeInstanceOf(Date);
      expect(toIsoDate(parsed)).toBe(original);
    });
  });
});
