# Task 002: BusinessPeriod helper (current month to date + localized month name)

> **Applied Skill:** `typescript-es2022` - pure static helper, no side effects. CLAUDE.md "Lifecycle" - "this month" comes from the business clock (`TimeStore.getCurrentDate()`), which the caller passes in; the helper never calls `new Date()` itself.

## 1. Objective

Provide the pure helper that turns the business clock's "now" into the inclusive period
"first day of this month ... today", and formats a localized stand-alone month name for the
"Deposited to bank in <month>" card. FR-02 reuses it for the Operations tab default period.

## 2. File to Modify / Create

* **File Path:** `projects/shared/src/shared/utils/business-period.util.ts`
* **Action:** Create New File

* **File Path:** `projects/shared/src/public-api.ts`
* **Action:** Modify Existing File

## 3. Code Implementation

**Imports Required:** (included in the snippet below)

**Code to Add/Replace:**

* **Location:** New file `projects/shared/src/shared/utils/business-period.util.ts` - full content.
* **Snippet:**

```typescript
import { formatDate } from '@angular/common';
import type { PointPeriod } from '../../core/models/point-finance.model';

export class BusinessPeriod {
  static currentMonthToDate(now: Date): PointPeriod {
    return {
      from: new Date(now.getFullYear(), now.getMonth(), 1),
      to: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
    };
  }

  static monthName(date: Date, locale: string): string {
    return formatDate(date, 'LLLL', locale);
  }
}
```

Notes:
* `'LLLL'` is the stand-alone month name: `October` in `en-US`, `октябрь` in `ru` (the form that
  reads correctly after "за").
* Both dates are local midnight; they are business dates, not instants.

* **Location:** `projects/shared/src/public-api.ts` - add one line directly below the existing line `export * from './shared/utils/date.util';`
* **Snippet:**

```typescript
export * from './shared/utils/business-period.util';
```

## 4. Validation Steps

Execute the following commands to ensure this task was successful. Do NOT run the full application server.

```bash
npx prettier --write projects/shared/src/shared/utils/business-period.util.ts projects/shared/src/public-api.ts
npx ng build admin --configuration development
npx ng build operator --configuration development
npx ng lint shared
```
