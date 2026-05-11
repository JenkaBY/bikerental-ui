# Task 001b: Create `DurationPipe`

> **Applied Skill:** `angular-component` — Standalone Angular pipe placed in `projects/shared/src/shared/pipes/`. Formats a duration in minutes as a human-readable string (e.g. "1 day 30 min"). Exported from `public-api.ts` so all projects can import it via `@bikerental/shared`.

## 1. Objective

Extract the `formatDuration` logic into a reusable `DurationPipe` in the shared library. After this task, `RentalSummaryComponent` (task-002) imports `DurationPipe` instead of defining a file-local function.

## 2. Files to Modify / Create

### 2a. Create New File: `projects/shared/src/shared/pipes/duration.pipe.ts`

```typescript
import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'duration', standalone: true })
export class DurationPipe implements PipeTransform {
  transform(minutes: number | null | undefined): string {
    if (minutes == null || minutes < 0) return '';
    const days = Math.floor(minutes / 1440);
    const hours = Math.floor((minutes % 1440) / 60);
    const mins = minutes % 60;
    const parts: string[] = [];
    if (days > 0) parts.push(`${days} ${days === 1 ? 'day' : 'days'}`);
    if (hours > 0) parts.push(`${hours} ${hours === 1 ? 'hour' : 'hours'}`);
    if (mins > 0) parts.push(`${mins} min`);
    return parts.join(' ') || '0 min';
  }
}
```

### 2b. Create New File: `projects/shared/src/shared/pipes/duration.pipe.spec.ts`

```typescript
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

  it('should return "2 days 1 hour 30 min" for 3090 minutes', () => {
    expect(pipe.transform(3090)).toBe('2 days 1 hour 30 min');
  });

  it('should return empty string for null', () => {
    expect(pipe.transform(null)).toBe('');
  });

  it('should return empty string for undefined', () => {
    expect(pipe.transform(undefined)).toBe('');
  });
});
```

### 2c. Modify `projects/shared/src/public-api.ts`

**Location:** Add after the `export * from './shared/pipes/money.pipe';` line.

```typescript
export * from './shared/pipes/duration.pipe';
```

## 4. Validation Steps

```bash
npx ng build shared --configuration=development
npx ng test shared --include="**/pipes/duration.pipe.spec**"
```
