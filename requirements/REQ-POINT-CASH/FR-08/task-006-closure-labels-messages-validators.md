# Task 006: Closure labels, message functions, form messages and the counted-amount validators

> **Applied Skill:** AGENTS.md i18n Rules - every visible string is a `$localize` entry in `Labels` / `FormErrorMessages` / message functions; reuse existing entries, never duplicate. `angular-forms` - reusable `ValidatorFn[]` factory.

## 1. Objective

Add only what is missing. These already exist and MUST be reused, not re-added: `Labels.PointCloseShift` ("Close shift"), `Labels.PointShiftExpectedCash` ("Expected cash"), `Labels.Done`, `Labels.Back`, `Labels.MoneyPointLabel` ("Rental point"), `Labels.PointShiftNone`, `FormErrorMessages.amountMaxTwoDecimals`, `pointShiftCaption()`.

New: 8 labels, 3 message functions, 2 form messages and `countedAmountValidators()` (required, >= 0, at most two decimals; unlike `moneyAmountValidators` zero is accepted and there is no maximum).

## 2. File to Modify / Create

* **File Path:** `projects/shared/src/shared/constant/labels.ts` - **Action:** Modify Existing File
* **File Path:** `projects/shared/src/shared/constant/point-money-messages.ts` - **Action:** Modify Existing File
* **File Path:** `projects/shared/src/shared/validators/form-error-messages.ts` - **Action:** Modify Existing File
* **File Path:** `projects/shared/src/shared/validators/amount-validators.ts` - **Action:** Modify Existing File

## 3. Code Implementation

**File 1:** `projects/shared/src/shared/constant/labels.ts`. Insert directly below the line `static readonly Done = $localize\`Done\`;`:

```typescript
  static readonly ShiftClosureShiftRow = $localize`Shift`;
  static readonly ShiftClosureConfirmTitle = $localize`Close shift?`;
  static readonly ShiftClosureCounted = $localize`Counted amount`;
  static readonly ShiftClosureDifference = $localize`Difference`;
  static readonly ShiftClosureMatches = $localize`Matches`;
  static readonly ShiftClosureNote = $localize`A closed shift cannot be reopened`;
  static readonly ShiftClosureClosedAt = $localize`Closed at`;
  static readonly ShiftClosureAlreadyClosed = $localize`This shift is already closed`;
```

**File 2:** `projects/shared/src/shared/constant/point-money-messages.ts`. Append at the end of the file (the minus sign in `Shortage −` is the Unicode MINUS SIGN U+2212, copy it exactly):

```typescript

export function shiftSurplusMessage(amount: string): string {
  return $localize`Surplus +${amount}:amount:`;
}

export function shiftShortageMessage(amount: string): string {
  return $localize`Shortage −${amount}:amount:`;
}

export function shiftClosedTitle(sequence: number): string {
  return $localize`Shift ${sequence}:sequence: closed`;
}
```

**File 3:** `projects/shared/src/shared/validators/form-error-messages.ts`. Insert directly below the line `static readonly amountMaxTwoDecimals = $localize\`Maximum 2 decimal places allowed\`;`:

```typescript
  static readonly countedRequired = $localize`Counted amount is required`;
  static readonly countedNotNegative = $localize`Counted amount cannot be negative`;
```

**File 4:** `projects/shared/src/shared/validators/amount-validators.ts`. Insert directly below the `moneyAmountValidators` function (before `notFutureDateValidator`):

```typescript
export function countedAmountValidators(): ValidatorFn[] {
  return [Validators.required, Validators.min(0), maxDecimalPlacesValidator(MONEY_DECIMALS)];
}
```

No `public-api.ts` change: `labels`, `point-money-messages`, `form-error-messages` and `amount-validators` are already exported.

## 4. Validation Steps

Execute the following commands to ensure this task was successful. Do NOT run the full application server.

```bash
npx prettier --write projects/shared/src/shared/constant/labels.ts projects/shared/src/shared/constant/point-money-messages.ts projects/shared/src/shared/validators/form-error-messages.ts projects/shared/src/shared/validators/amount-validators.ts
npx tsc --noEmit -p projects/shared/tsconfig.lib.json
npx ng lint shared
```
