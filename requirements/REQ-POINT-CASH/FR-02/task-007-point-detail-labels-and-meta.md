# Task 007: Point detail labels (`$localize`) and point-money presentation meta

> **Applied Skill:** AGENTS.md *i18n Rules* - every visible string is a `$localize` entry in `Labels`; explicit custom ids (`:@@id:`) are used where the same English source text already exists in the catalogue with a different Russian meaning. Pattern of `shared/transaction.meta.ts` - `Record<Union, string>` label maps live in `shared/` next to `Labels`, so admin (FR-02/FR-03) and operator (FR-06) share one mapping. `typescript-es2022` - exhaustive `Record<...>` typing.

## 1. Objective

Add all English source strings for the point detail page (back label, not-found message, tab names, header pill captions, placeholder text, account names, movement type names, table headers, empty state) and create `point-money.meta.ts` with `POINT_ACCOUNT_LABELS` and `POINT_MOVEMENT_TYPE_LABELS`.

Notes on custom ids (Russian targets are added in Task 014):

* `PointTabCash` / `PointBalanceCash` — the source `Cash` already exists with the Russian target "Наличные"; FR-02 needs "Касса", so they use `@@pointDetailTabCash` / `@@pointBalancePillCash`.
* `PointMovementBankTransfer` — the source `Bank transfer` already exists as "Банковский перевод"; the movement type must read "Инкассация", so it uses `@@pointMovementTypeBankTransfer`.
* `PointMovementOther` — uses `@@pointMovementTypeOther` so a future generic "Other" is not forced to share its translation.
* Sources that already exist and are reused on purpose (same meaning, same Russian target): `Profile`, `Terminal` (FR-01), `Account`, `Adjustment`, `Balance after`. Existing labels reused directly in templates: `Labels.Type`, `Labels.Amount`.

## 2. File to Modify / Create

* **File Path:** `projects/shared/src/shared/constant/labels.ts`
* **Action:** Modify Existing File

* **File Path:** `projects/shared/src/shared/point-money.meta.ts`
* **Action:** Create New File

* **File Path:** `projects/shared/src/public-api.ts`
* **Action:** Modify Existing File

## 3. Code Implementation

**Imports Required:** none for `labels.ts` (`$localize` is global). The meta file imports are contained in its snippet.

**Code to Add/Replace:**

* **Location:** `projects/shared/src/shared/constant/labels.ts` — inside `class Labels`, directly below the line `static readonly PointsShowClosed = $localize\`Show closed points\`;` (added by FR-01 Task 005)
* **Snippet:**

```typescript
  static readonly PointBackToList = $localize`Back to rental points`;
  static readonly PointNotFound = $localize`Rental point not found`;
  static readonly PointTabProfile = $localize`Profile`;
  static readonly PointTabCash = $localize`:@@pointDetailTabCash:Cash`;
  static readonly PointTabTransfers = $localize`Bank transfers`;
  static readonly PointTabOperations = $localize`Operations`;
  static readonly PointTabUnavailable = $localize`This section is not available yet`;
  static readonly PointBalanceCash = $localize`:@@pointBalancePillCash:Cash`;
  static readonly PointBalanceTerminal = $localize`Terminal`;
  static readonly PointAccountCash = $localize`Cash drawer`;
  static readonly PointAccountTerminal = $localize`Terminal account`;
  static readonly PointMovementRentalPayment = $localize`Rental payment`;
  static readonly PointMovementCustomerDeposit = $localize`Customer deposit`;
  static readonly PointMovementCustomerPayout = $localize`Customer payout`;
  static readonly PointMovementBankTransfer = $localize`:@@pointMovementTypeBankTransfer:Bank transfer`;
  static readonly PointMovementBankTransferCancelled = $localize`Bank transfer cancelled`;
  static readonly PointMovementAdjustment = $localize`Adjustment`;
  static readonly PointMovementOther = $localize`:@@pointMovementTypeOther:Other`;
  static readonly PointMovementColumnTime = $localize`Time`;
  static readonly PointMovementColumnParties = $localize`Customer · operator`;
  static readonly PointMovementColumnAccount = $localize`Account`;
  static readonly PointMovementColumnBalanceAfter = $localize`Balance after`;
  static readonly PointMovementsTableLabel = $localize`Rental point operations`;
  static readonly PointOperationsEmpty = $localize`No operations for the selected period`;
```

* **Location:** Whole content of NEW file `projects/shared/src/shared/point-money.meta.ts`
* **Snippet:**

```typescript
import type { PointAccountType, PointMovementType } from '../core/models/point-money.model';
import { Labels } from './constant/labels';

export const POINT_ACCOUNT_LABELS: Record<PointAccountType, string> = {
  CASH: Labels.PointAccountCash,
  CARD_TERMINAL: Labels.PointAccountTerminal,
};

export const POINT_MOVEMENT_TYPE_LABELS: Record<PointMovementType, string> = {
  RENTAL_PAYMENT: Labels.PointMovementRentalPayment,
  CUSTOMER_DEPOSIT: Labels.PointMovementCustomerDeposit,
  CUSTOMER_PAYOUT: Labels.PointMovementCustomerPayout,
  BANK_TRANSFER: Labels.PointMovementBankTransfer,
  BANK_TRANSFER_CANCELLED: Labels.PointMovementBankTransferCancelled,
  ADJUSTMENT: Labels.PointMovementAdjustment,
  OTHER: Labels.PointMovementOther,
};
```

* **Location:** `projects/shared/src/public-api.ts` — directly below the existing line `export * from './shared/transaction.meta';`
* **Snippet:**

```typescript
export * from './shared/point-money.meta';
```

## 4. Validation Steps

Execute the following commands to ensure this task was successful. Do NOT run the full application server.

```bash
npx prettier --write projects/shared/src/shared/constant/labels.ts projects/shared/src/shared/point-money.meta.ts projects/shared/src/public-api.ts
npx ng build admin --configuration development
npx ng lint shared
```
