# Task 001: Add i18n Labels for FR-06

> **Applied Skill:** `angular-component` — All visible strings must go through `Labels` constants using `$localize`. Run `npm run i18n:extract` after this task.

## 1. Objective

Add 9 new label constants to the shared `Labels` class for the Step 3 confirmation screen.

## 2. File to Modify / Create

* **File Path:** `projects/shared/src/shared/constant/labels.ts`
* **Action:** Modify Existing File

## 3. Code Implementation

**Location:** Replace the closing `}` of the class with the new labels block. The last existing line before `}` is `static readonly NoEquipmentSelected`.

**Code to Add/Replace:**

```typescript
  static readonly
NoEquipmentSelected = $localize`Add at least one item to proceed`;

static readonly
StartRental = $localize`Start Rental`;
static readonly
RentalStarted = $localize`Rental started`;
static readonly
RentalStartError = $localize`Failed to start rental. Please try again.`;
static readonly
Confirmation = $localize`Confirmation`;
static readonly
Back = $localize`Back`;
static readonly
TopUpBalance = $localize`Top Up Balance`;
static readonly
RentalSummary = $localize`Rental Summary`;
static readonly
BalanceShortfall = $localize`Shortfall`;
static readonly
CustomerName = $localize`Customer`;
}
```

## 4. Validation Steps

```bash
npx ng build shared --configuration=development
npm run i18n:extract
```
