import { describe, expect, it } from 'vitest';
import { DurationPipe } from './duration.pipe';

describe('DurationPipe', () => {
  const pipe = new DurationPipe();

  it('should return "0 min" for 0 minutes', () => {
    expect(pipe.transform(0)).toBe('0 min');
  });

  it('should return "30 min" for 30 minutes', () => {
    expect(pipe.transform(30)).toBe('30 min');
  });

  it('should return "1 hour" for 60 minutes', () => {
    expect(pipe.transform(60)).toBe('1 hour');
  });

  it('should return "1 hour 30 min" for 90 minutes', () => {
    expect(pipe.transform(90)).toBe('1 hour 30 min');
  });

  it('should return "2 hours" for 120 minutes', () => {
    expect(pipe.transform(120)).toBe('2 hours');
  });

  it('should return "1 day" for 1440 minutes', () => {
    expect(pipe.transform(1440)).toBe('1 day');
  });

  it('should return "1 day 30 min" for 1470 minutes', () => {
    expect(pipe.transform(1470)).toBe('1 day 30 min');
  });

  it('should return "2 days 3 hours 30 min" for 3090 minutes', () => {
    expect(pipe.transform(3090)).toBe('2 days 3 hours 30 min');
  });

  it('should return empty string for null', () => {
    expect(pipe.transform(null)).toBe('');
  });

  it('should return empty string for undefined', () => {
    expect(pipe.transform(undefined)).toBe('');
  });
});
