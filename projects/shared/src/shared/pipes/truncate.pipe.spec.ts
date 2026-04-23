import { describe, expect, it } from 'vitest';
import { TruncatePipe } from './truncate.pipe';

describe('TruncatePipe', () => {
  const pipe = new TruncatePipe();

  it('returns empty string for null, undefined or empty input', () => {
    expect(pipe.transform(null)).toBe('');
    expect(pipe.transform(undefined)).toBe('');
    expect(pipe.transform('')).toBe('');
  });

  it('returns empty string when max <= 0', () => {
    expect(pipe.transform('abc', 0)).toBe('');
    expect(pipe.transform('abc', -1)).toBe('');
  });

  it('returns original value when length <= max', () => {
    expect(pipe.transform('hello', 10)).toBe('hello');
    expect(pipe.transform('12345', 5)).toBe('12345');
  });

  it('truncates and appends ellipsis when max > 3 and value is longer', () => {
    // max = 5 => reserve 3 for ellipsis -> take first 2 chars + '...'
    expect(pipe.transform('abcdef', 5)).toBe('ab...');

    // max = 4 => take 1 char + '...'
    expect(pipe.transform('abcdef', 4)).toBe('a...');
  });

  it('for max <= 3 returns a raw slice without ellipsis', () => {
    expect(pipe.transform('abcdef', 3)).toBe('abc');
    expect(pipe.transform('abcdef', 2)).toBe('ab');
    expect(pipe.transform('abcdef', 1)).toBe('a');
  });

  it('does not add ellipsis when value length equals max boundary', () => {
    // for max>3 exact equality should return original
    const s = '12345678';
    expect(pipe.transform(s, s.length)).toBe(s);
  });
});
