# Task 005: PointMoneyActionAvailability (pure rules)

> **Applied Skill:** `typescript-es2022` - pure static class, no Angular imports (same shape as `BusinessPeriod` / `PointPeriodRule`). Design FR-03 section 2 - collection: active point only; settlement: refused only at a permanently closed point; close shift: whenever a shift runs. The backend stays the authority.

## 1. Objective

Create the single place for "may this money button be used" rules, reused by FR-04, FR-06 and
FR-08. `HIDDEN` = do not render the button; any other `reason` with `enabled: false` = render
disabled (the card shows a hint only for `POINT_NOT_ACTIVE` and `POINT_PERMANENTLY_CLOSED`).

Requires task-001.

## 2. File to Modify / Create

* **File Path:** `projects/shared/src/shared/utils/point-money-action-availability.ts` - **Action:** Create New File
* **File Path:** `projects/shared/src/public-api.ts` - **Action:** Modify Existing File

## 3. Code Implementation

* **Location:** New file `projects/shared/src/shared/utils/point-money-action-availability.ts` - full content.
* **Snippet:**

```typescript
import type {
  ActionAvailability,
  ActionUnavailableReason,
  Money,
  PointStatus,
  RunningShiftState,
} from '../../core/models';

const ENABLED: ActionAvailability = { enabled: true, reason: null };

function blocked(reason: ActionUnavailableReason): ActionAvailability {
  return { enabled: false, reason };
}

function amountRule(amount: Money | null): ActionAvailability {
  if (amount === null) return blocked('UNKNOWN');
  return amount.amount > 0 ? ENABLED : blocked('NOTHING_TO_MOVE');
}

export class PointMoneyActionAvailability {
  static collection(
    pointStatus: PointStatus | null,
    cashAmount: Money | null,
    shiftState: RunningShiftState,
  ): ActionAvailability {
    if (shiftState !== 'running') return blocked('HIDDEN');
    if (pointStatus === null) return blocked('UNKNOWN');
    if (pointStatus !== 'ACTIVE') return blocked('POINT_NOT_ACTIVE');
    return amountRule(cashAmount);
  }

  static settlement(
    pointStatus: PointStatus | null,
    terminalAmount: Money | null,
  ): ActionAvailability {
    if (pointStatus === null) return blocked('UNKNOWN');
    if (pointStatus === 'PERMANENTLY_CLOSED') return blocked('POINT_PERMANENTLY_CLOSED');
    return amountRule(terminalAmount);
  }

  static closeShift(shiftState: RunningShiftState): ActionAvailability {
    return shiftState === 'running' ? ENABLED : blocked('HIDDEN');
  }
}
```

* **Location:** `projects/shared/src/public-api.ts` - add one line directly below `export * from './shared/utils/point-period.rule';`
* **Snippet:**

```typescript
export * from './shared/utils/point-money-action-availability';
```

## 4. Validation Steps

Execute the following commands to ensure this task was successful. Do NOT run the full application server.

```bash
npx prettier --write projects/shared/src/shared/utils/point-money-action-availability.ts projects/shared/src/public-api.ts
npx ng build admin --configuration development
npx ng lint shared
```
