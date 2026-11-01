# Task 007: BusinessPeriod.sinceDayOf

> **Applied Skill:** `typescript-es2022` - pure static helper next to `currentMonthToDate`. Backend contract item 3 - the movements period is date-granular (`from`/`to` as `yyyy-MM-dd`), so the shift list asks from the calendar day of `openedAt` (assumption A7).

## 1. Objective

Add the helper that turns the shift's opening instant into the period `[day of openedAt ... today]`.

## 2. File to Modify / Create

* **File Path:** `projects/shared/src/shared/utils/business-period.util.ts` - **Action:** Modify Existing File

## 3. Code Implementation

* **Location:** inside `class BusinessPeriod`, directly below the `currentMonthToDate` method.
* **Snippet:**

```typescript
  static sinceDayOf(start: Date, now: Date): PointPeriod {
    return {
      from: new Date(start.getFullYear(), start.getMonth(), start.getDate()),
      to: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
    };
  }

```

## 4. Validation Steps

Execute the following commands to ensure this task was successful. Do NOT run the full application server.

```bash
npx prettier --write projects/shared/src/shared/utils/business-period.util.ts
npx ng build admin --configuration development
npx ng lint shared
```
