# Task 003: PointPeriodRule (required, from <= to, at most 366 days inclusive)

> **Applied Skill:** `typescript-es2022` - pure static rule, no Angular dependencies. Backend contract item 3 - "The period is required and at most 366 days". Reuses the existing `daysInclusive` helper in `shared/utils/date.util.ts` (date-granular, ignores the time of day).

## 1. Objective

Create the shared pure rule used by `PointMovementsStore` (never sends an invalid period) and by
`PointPeriodFilterComponent` (shows the localized message). FR-04 reuses it unchanged.

Rule:
* `from` or `to` missing -> `'REQUIRED'`
* `daysInclusive(from, to) < 1` (end before start) -> `'ORDER'`
* `daysInclusive(from, to) > 366` -> `'TOO_LONG'` (FR-02 Scenario 11: 01.01.2025-31.10.2026)
* otherwise `null`

## 2. File to Modify / Create

* **File Path:** `projects/shared/src/shared/utils/point-period.rule.ts` - **Action:** Create New File
* **File Path:** `projects/shared/src/public-api.ts` - **Action:** Modify Existing File

## 3. Code Implementation

* **Location:** New file `projects/shared/src/shared/utils/point-period.rule.ts` - full content.
* **Snippet:**

```typescript
import {
  POINT_PERIOD_MAX_DAYS,
  type PointPeriodViolation,
} from '../../core/models/point-finance.model';
import { daysInclusive } from './date.util';

export class PointPeriodRule {
  static validate(from: Date | null, to: Date | null): PointPeriodViolation | null {
    if (!from || !to) return 'REQUIRED';
    const days = daysInclusive(from, to);
    if (days < 1) return 'ORDER';
    if (days > POINT_PERIOD_MAX_DAYS) return 'TOO_LONG';
    return null;
  }
}
```

* **Location:** `projects/shared/src/public-api.ts` - add one line directly below `export * from './shared/utils/business-period.util';` (added in FR-01 task-002).
* **Snippet:**

```typescript
export * from './shared/utils/point-period.rule';
```

## 4. Validation Steps

Execute the following commands to ensure this task was successful. Do NOT run the full application server.

```bash
npx prettier --write projects/shared/src/shared/utils/point-period.rule.ts projects/shared/src/public-api.ts
npx ng build admin --configuration development
npx ng build operator --configuration development
npx ng lint shared
```
