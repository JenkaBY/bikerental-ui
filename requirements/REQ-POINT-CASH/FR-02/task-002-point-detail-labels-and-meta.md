# Task 002: Point detail labels, period validation messages and movement meta maps

> **Applied Skill:** AGENTS.md i18n Rules - UI labels in `shared/constant/labels.ts`, validation copy in `shared/validators/form-error-messages.ts`, all `$localize`. Existing meta-map pattern (`shared/transaction.meta.ts`, `shared/revenue.meta.ts`) - `Record<Union, string>` maps that reuse existing labels. A `:meaning:` prefix separates "Cash" (tab / position, Russian "Касса") from the existing "Cash" (Russian "Наличные").

## 1. Objective

Add every FR-02 label (header, tabs, positions, movement kinds, table columns, sort, empty /
failure states, unknown user, not-found) and the three period messages, plus a meta file mapping
movement kinds, positions and period violations to their labels. Kinds that already have a label
with the same English text (Deposit, Withdrawal, Penalty, Adjustment, fallback "Transaction")
reuse it so their existing Russian targets apply.

## 2. File to Modify / Create

* **File Path:** `projects/shared/src/shared/constant/labels.ts` - **Action:** Modify Existing File
* **File Path:** `projects/shared/src/shared/validators/form-error-messages.ts` - **Action:** Modify Existing File
* **File Path:** `projects/shared/src/shared/point-money.meta.ts` - **Action:** Create New File
* **File Path:** `projects/shared/src/public-api.ts` - **Action:** Modify Existing File

## 3. Code Implementation

**Code to Add/Replace:**

* **Location:** `projects/shared/src/shared/constant/labels.ts` - inside `class Labels`, directly below the line `static readonly PointsLoadFailed = $localize\`Rental points could not be loaded\`;` (added in FR-01 task-007).
* **Snippet:**

```typescript
  static readonly PointBackButton = $localize`Back to rental points`;
  static readonly PointNotFound = $localize`Rental point not found`;
  static readonly PointTabProfile = $localize`Profile`;
  static readonly PointTabCash = $localize`:Point detail tab:Cash`;
  static readonly PointTabTransfers = $localize`Collections`;
  static readonly PointTabOperations = $localize`Operations`;
  static readonly PointPositionCash = $localize`:Point money position:Cash`;
  static readonly PointPositionTerminal = $localize`:Point money position:Terminal`;
  static readonly PointPositionBank = $localize`:Point money position:Bank`;
  static readonly PointMovementKindRentalPayment = $localize`Rental payment`;
  static readonly PointMovementKindCollection = $localize`Cash collection`;
  static readonly PointMovementKindTerminalSettlement = $localize`Terminal settlement`;
  static readonly PointMovementKindShiftDiscrepancy = $localize`Shift discrepancy`;
  static readonly PointMovementColumnDate = $localize`Date and time`;
  static readonly PointMovementColumnType = $localize`Type`;
  static readonly PointMovementColumnCustomer = $localize`Customer`;
  static readonly PointMovementColumnRecordedBy = $localize`Recorded by`;
  static readonly PointMovementColumnAmount = $localize`Amount`;
  static readonly PointMovementColumnBalance = $localize`Balance after`;
  static readonly PointMovementPositionLabel = $localize`Position`;
  static readonly PointMovementOrderLabel = $localize`Order`;
  static readonly PointMovementOrderNewest = $localize`Newest first`;
  static readonly PointMovementOrderOldest = $localize`Oldest first`;
  static readonly PointMovementsEmpty = $localize`No movements in this period`;
  static readonly PointMovementsLoadFailed = $localize`Movements could not be loaded`;
  static readonly PointPeriodFrom = $localize`From`;
  static readonly PointPeriodTo = $localize`To`;
  static readonly UnknownUser = $localize`Unknown user`;
```

* **Location:** `projects/shared/src/shared/validators/form-error-messages.ts` - inside `class FormErrorMessages`, directly below the line `static readonly maxDecimalPlaces = $localize\`Maximum 2 decimal places allowed\`;`
* **Snippet:**

```typescript
  static readonly periodRequired = $localize`Select both the start and the end of the period`;
  static readonly periodOrder = $localize`The end of the period cannot be before its start`;
  static readonly periodTooLong = $localize`The period may not exceed 366 days`;
```

* **Location:** New file `projects/shared/src/shared/point-money.meta.ts` - full content.
* **Snippet:**

```typescript
import type {
  PointMovementKind,
  PointMovementPosition,
  PointPeriodViolation,
} from '../core/models/point-finance.model';
import { Labels } from './constant/labels';
import { FormErrorMessages } from './validators/form-error-messages';

export const POINT_MOVEMENT_KIND_LABELS: Record<PointMovementKind, string> = {
  DEPOSIT: Labels.TransactionKindDeposit,
  WITHDRAWAL: Labels.TransactionKindWithdrawal,
  CAPTURE: Labels.PointMovementKindRentalPayment,
  PENALTY: Labels.TransactionKindPenalty,
  ADJUSTMENT: Labels.TransactionKindAdjustment,
  COLLECTION: Labels.PointMovementKindCollection,
  TERMINAL_SETTLEMENT: Labels.PointMovementKindTerminalSettlement,
  SHIFT_DISCREPANCY: Labels.PointMovementKindShiftDiscrepancy,
  OTHER: Labels.TransactionKindOther,
};

export const POINT_MOVEMENT_POSITION_LABELS: Record<PointMovementPosition, string> = {
  CASH: Labels.PointPositionCash,
  CARD_TERMINAL: Labels.PointPositionTerminal,
  BANK: Labels.PointPositionBank,
};

export const POINT_PERIOD_VIOLATION_MESSAGES: Record<PointPeriodViolation, string> = {
  REQUIRED: FormErrorMessages.periodRequired,
  ORDER: FormErrorMessages.periodOrder,
  TOO_LONG: FormErrorMessages.periodTooLong,
};
```

* **Location:** `projects/shared/src/public-api.ts` - add one line directly below the existing line `export * from './shared/transaction.meta';`
* **Snippet:**

```typescript
export * from './shared/point-money.meta';
```

## 4. Validation Steps

Execute the following commands to ensure this task was successful. Do NOT run the full application server.

```bash
npx prettier --write projects/shared/src/shared/constant/labels.ts projects/shared/src/shared/validators/form-error-messages.ts projects/shared/src/shared/point-money.meta.ts projects/shared/src/public-api.ts
npx ng build admin --configuration development
npx ng build operator --configuration development
npx ng lint shared
```
