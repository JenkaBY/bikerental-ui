# Task 007: Amount and date validators and their form error messages

> **Applied Skill:** `angular-forms` - reactive-form `ValidatorFn`s, validators re-bindable with `setValidators` + `updateValueAndValidity`. AGENTS.md i18n Rules - validation copy lives in `FormErrorMessages`. `typescript-es2022`.

## 1. Objective

* Generalize the withdraw ceiling into `maxAmountValidator(max)` (same error shape `{ maxAmount: { max, actual } }`).
* Add `notFutureDateValidator(today)` (error key `futureDate`) - used by the settlement date (task 019).
* Add `moneyAmountValidators(max)` returning the full amount rule set (required, > 0, at most 2 decimals, ceiling), so a dialog can re-bind it when the available amount changes.
* Add the `FormErrorMessages` entries. `amountMaxTwoDecimals` has the same English text as the existing `maxDecimalPlaces`, so it reuses that translation unit.

## 2. File to Modify / Create

* **File Path:** `projects/shared/src/shared/validators/amount-validators.ts` - **Action:** Create New File
* **File Path:** `projects/shared/src/shared/components/withdraw-dialog/max-amount.validator.ts` - **Action:** Modify Existing File (replace whole content)
* **File Path:** `projects/shared/src/shared/validators/form-error-messages.ts` - **Action:** Modify Existing File
* **File Path:** `projects/shared/src/public-api.ts` - **Action:** Modify Existing File

## 3. Code Implementation

**File 1 - `projects/shared/src/shared/validators/amount-validators.ts` (whole content):**

```typescript
import { AbstractControl, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { maxDecimalPlacesValidator } from './number-validators';

const MONEY_DECIMALS = 2;
const MIN_MONEY_AMOUNT = 0.01;

export function maxAmountValidator(max: number): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value as number | null;
    if (value == null) return null;
    return value > max ? { maxAmount: { max, actual: value } } : null;
  };
}

export function moneyAmountValidators(max: number): ValidatorFn[] {
  return [
    Validators.required,
    Validators.min(MIN_MONEY_AMOUNT),
    maxDecimalPlacesValidator(MONEY_DECIMALS),
    maxAmountValidator(max),
  ];
}

export function notFutureDateValidator(today: Date): ValidatorFn {
  const limit = startOfDay(today);
  return (control: AbstractControl): ValidationErrors | null => {
    const value: unknown = control.value;
    if (!(value instanceof Date) || Number.isNaN(value.getTime())) return null;
    return startOfDay(value) > limit ? { futureDate: true } : null;
  };
}

function startOfDay(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}
```

**File 2 - `projects/shared/src/shared/components/withdraw-dialog/max-amount.validator.ts` (replace whole content):**

```typescript
import { ValidatorFn } from '@angular/forms';
import { maxAmountValidator } from '../../validators/amount-validators';

export function maxWithdrawAmountValidator(max: number): ValidatorFn {
  return maxAmountValidator(max);
}
```

**File 3 - `projects/shared/src/shared/validators/form-error-messages.ts`:** directly below the line `static readonly maxDecimalPlaces = $localize\`Maximum 2 decimal places allowed\`;` add:

```typescript
  static readonly amountRequired = $localize`Amount is required`;
  static readonly amountPositive = $localize`Amount must be greater than zero`;
  static readonly amountExceedsAvailable = $localize`Amount exceeds the available amount`;
  static readonly amountMaxTwoDecimals = $localize`Maximum 2 decimal places allowed`;
  static readonly settlementDateRequired = $localize`Settlement date is required`;
  static readonly settlementDateFuture = $localize`Settlement date cannot be in the future`;
```

**File 4 - `projects/shared/src/public-api.ts`:** in the `// Shared UI — validators` block add this line directly below `export * from './shared/validators/number-validators';`:

```typescript
export * from './shared/validators/amount-validators';
```

## 4. Validation Steps

Execute the following commands to ensure this task was successful. Do NOT run the full application server.

```bash
npx prettier --write projects/shared/src/shared/validators/amount-validators.ts projects/shared/src/shared/components/withdraw-dialog/max-amount.validator.ts projects/shared/src/shared/validators/form-error-messages.ts projects/shared/src/public-api.ts
npx eslint projects/shared/src/shared/validators/amount-validators.ts projects/shared/src/shared/components/withdraw-dialog/max-amount.validator.ts
npx ng build admin --configuration development
```
