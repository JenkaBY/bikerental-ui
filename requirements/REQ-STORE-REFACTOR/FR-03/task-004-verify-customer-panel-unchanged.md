# Task 004: Verify `RentalCustomerPanelComponent` Needs No Edits

> **Applied Skill:** `angular-component`, `angular-di` - A dumb/binding component that reads state
> exclusively through an injection token (`RENTAL_STORE_TOKEN`) transparently inherits any change to
> the signal's underlying computation. No component edit is required when the contract shape is
> preserved.

## 1. Objective

Confirm (do NOT change) that `RentalCustomerPanelComponent` already reflects the new
projected-sufficiency answer purely by virtue of binding to `RENTAL_STORE_TOKEN.isBalanceSufficient()`
and `RENTAL_STORE_TOKEN.customerBalance()`. This is the FR-03 verification that the preferred
Option (a) keeps the panel and the footer/step-3 control in agreement with zero component changes.

## 2. File to Modify / Create

* **File Path:** `projects/operator/src/app/rental-create/step2/rental-customer-panel.component.ts`
* **Action:** Verify Only — **NO EDITS.** This task produces no code change.

## 3. Verification Checklist

Read the file and confirm every point below. Do **not** modify it.

1. The component injects the contract token, not a concrete store:
   `protected readonly store = inject(RENTAL_STORE_TOKEN);` (line 49). Confirm it does **not** also
   inject `RentalValidationStore`.
2. The colour binding reads the contract signal:
   `[class.text-red-600]="!store.isBalanceSufficient()"` and
   `[class.text-green-700]="store.isBalanceSufficient()"` (lines 30-31). Because Task 002 made
   `RentalStore.isBalanceSufficient` delegate to `RentalValidationStore` (and `RENTAL_STORE_TOKEN`
   is aliased to `RentalStore` via `useExisting`), this binding now resolves to the projected answer
   on the create flow and to the legacy `available >= 0` answer on the detail flow — no edit needed.
3. The balance block reads `store.customerBalance()` (lines 27, 42), which is the `RentalStore`
   signal that reads `CustomerFinanceStore.balance()` directly. Task 003 removed only the dead
   `RentalDetailState.customerBalance` field, which this component never referenced — so this binding
   is unaffected.
4. Confirm the `RENTAL_STORE_TOKEN` contract shape in
   `projects/shared/src/core/state/rental-store.token.ts` is unchanged (still exposes `customer`,
   `customerBalance`, `isBalanceSufficient`, and the pricing members). No contract member was added
   or removed by FR-03.

Cross-screen consistency check (read-only, no app server):

* Footer (`rental-cost-footer.component.ts:34`) binds to `validationStore.isBalanceSufficient()`.
* Step 3 (`rental-step3.component.ts:44,61`) and balance warning
  (`rental-balance-warning.component.ts:11`) bind to `validationStore.isBalanceSufficient()`.
* Customer panel binds to `store.isBalanceSufficient()` which (post Task 002) delegates to that same
  validation-store signal. Therefore panel colour and footer/step-3 enabled state derive from one
  boolean — FR-03 Scenarios 1 and 2 hold by construction.

## 4. Validation Steps

Execute the following commands. Do NOT run the full application server. Do NOT create or modify any
`*.spec.ts` file (MVP rule — no tests).

```bash
npm run build
```

* `npm run build` must compile cleanly with the customer-panel file unmodified, proving the
  `RENTAL_STORE_TOKEN` contract still satisfies the component's template bindings after Tasks 001-003.
* No `npm run fix` is required for this task because no file is edited. If you find yourself editing
  this component, STOP — that contradicts Option (a); re-read the design Section 6 tradeoff note
  before proceeding.
