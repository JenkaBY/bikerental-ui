# Task 013: Update overview.md for the operator hand-in flow

> **Applied Skill:** CLAUDE.md "Keep docs in sync with code" - same `COMPONENT_NAME / TYPE / PURPOSE / RESPONSIBILITIES / SOURCE / CALLS / CALLED_BY` format as the existing blocks. `architecture.md` and `README.md` do not change (no new project or command).

## 1. Objective

Document the FR-07 additions and update the blocks they change. Documentation only. Requires tasks 001-011.

## 2. File to Modify / Create

* **File Path:** `overview.md` (repository root)
* **Action:** Modify Existing File

## 3. Code Implementation

* **Location:** `COMPONENT_NAME: OperatorLayoutComponent` block. Add under RESPONSIBILITIES, directly below the bullet `- Expose logout to the toolbar.`:
  `- Hide the bottom navigation when the deepest activated route has \`data.fullScreen === true\` (evaluated after every \`NavigationEnd\`); the toolbar and point switcher stay.`

* **Location:** `COMPONENT_NAME: OperatorCashComponent` block. Replace the bullet starting `- Collection availability uses` with:
  `- Collection availability uses \`CurrentPointStore.current().status\` and \`shift.expectedCash\`; "Hand in cash" navigates to \`cash/collect\`; "Close shift" currently shows an info notification until FR-08 adds \`cash/close-shift\`.`

* **Location:** `COMPONENT_NAME: RunningShiftStore`, `COMPONENT_NAME: FinanceConfirmDialogComponent`, `COMPONENT_NAME: IdempotentAttempt`, `COMPONENT_NAME: PointMoneyErrorClassifier` blocks: add `- OperatorCashCollectionComponent` (and, for `IdempotentAttempt`, `- OperatorCollectionStore`) under CALLED_BY of each.

* **Location:** Directly after the `COMPONENT_NAME: OperatorShiftCardComponent` block (immediately before `COMPONENT_NAME: HomeReturnTabComponent`), insert:

```markdown
COMPONENT_NAME: OperatorCashCollectionComponent
TYPE: Gateway
PURPOSE: Operator full-screen "Hand in cash" form (`/cash/collect`) - collects the running shift's cash into the bank.
RESPONSIBILITIES:

- Provide its own `RunningShiftStore` and `OperatorCollectionStore`; load the shift with a null slug and refresh the point status. Entry guard: scope lost, no running shift or `current().status !== 'ACTIVE'` sends the operator back to `/cash` (with the existing localized copy where applicable).
- Open `FinanceConfirmDialogComponent` (amount, from "{point} · Cash drawer", to "Bank account", remaining, cannot-be-cancelled note); on success put a `COLLECTION` receipt into `FinanceReceiptStore` and replace-navigate to `cash/collect/done`.
- Refusals via `PointMoneyErrorClassifier`: insufficient cash rebinds the available amount and shows the error under the amount; inactive / permanently closed / scope return to `/cash`; validation binds to the form; other errors notify and keep the form.
  SOURCE: `projects/operator/src/app/cash/operator-cash-collection.component.ts`, `operator-collection-confirm.ts`
  CALLS:
- OperatorCollectionFormComponent, OperatorCollectionStore, RunningShiftStore, CurrentPointStore, FinanceConfirmDialogComponent, FinanceReceiptStore, PointMoneyErrorClassifier, ErrorMessageResolver, NotificationService.
  CALLED_BY:
- OperatorRoutes

COMPONENT_NAME: OperatorCollectionFormComponent
TYPE: Gateway
PURPOSE: Dumb amount form of the operator hand-in screen.
RESPONSIBILITIES:

- Cash drawer available amount, destination "Bank account", large decimal amount input (`moneyAmountValidators(available)`, two decimals), "All", the remaining text (plain paragraph, not a `mat-hint`), primary button with the live caption. Re-binds the max validator when `available` changes and shows the store's server error under the amount. Outputs `amountChange`, `submitted`; method `showServerErrors()`.
  SOURCE: `projects/operator/src/app/cash/operator-collection-form.component.ts`
  CALLS:
- moneyAmountValidators, applyServerErrors, MaxDecimalsDirective
  CALLED_BY:
- OperatorCashCollectionComponent

COMPONENT_NAME: OperatorCollectionStore
TYPE: Store
PURPOSE: Page-scoped state and command of the operator cash collection.
RESPONSIBILITIES:

- State `available`, `ready`, `submitting`, `amountError`; computed `handIn` and `remaining`. `refuse()` rebinds `available` to the backend-reported cash position. `execute(amount)` uses `IdempotentAttempt` and `PointFinanceService.recordCollection(write, null)`.
  SOURCE: `projects/operator/src/app/cash/operator-collection.store.ts`
  CALLS:
- PointFinanceService, IdempotentAttempt
  CALLED_BY:
- OperatorCashCollectionComponent

COMPONENT_NAME: OperatorFinanceReceiptComponent
TYPE: Gateway
PURPOSE: Operator success/receipt screen (`/cash/collect/done`), discriminated by receipt kind (SHIFT_CLOSURE arrives with FR-08).
RESPONSIBILITIES:

- Take the receipt once from `FinanceReceiptStore.take()`; COLLECTION shows "Cash handed in", amount, Cash drawer, Bank account, recorded time and the remaining cash in the drawer. "Done" replace-navigates to `/cash`. The route is protected by `financeReceiptGuard` (no receipt -> `/cash`).
  SOURCE: `projects/operator/src/app/cash/operator-finance-receipt.component.ts`, `finance-receipt.view.ts`, `finance-receipt.guard.ts`
  CALLS:
- FinanceReceiptStore
  CALLED_BY:
- OperatorRoutes

COMPONENT_NAME: FinanceReceiptStore
TYPE: Store
PURPOSE: Transient, memory-only holder of the last finance receipt (root-provided); never persisted, never in the URL.
RESPONSIBILITIES:

- `set(receipt)`, `take()` (returns and clears), `has()`, `clear()`; `FinanceReceipt` is a discriminated union (`COLLECTION` now). Cleared on point switch by `PointSwitchRefreshService`.
  SOURCE: `projects/shared/src/core/state/finance-receipt.store.ts`, `projects/shared/src/core/models/finance-receipt.model.ts`
  CALLS:
- (none)
  CALLED_BY:
- OperatorCashCollectionComponent, OperatorFinanceReceiptComponent, PointSwitchRefreshService

COMPONENT_NAME: PointSwitchRefreshService
TYPE: Service
PURPOSE: Refreshes the operator outlet after a working-point switch.
RESPONSIBILITIES:

- On a single rental URL navigate to `/rentals`; on `cash/<sub-route>` (`collect`, `collect/done`, later `close-shift*`) clear `FinanceReceiptStore` and navigate to `/cash`; otherwise bump the outlet epoch.
  SOURCE: `projects/operator/src/app/core/point-switch-refresh.service.ts`
  CALLS:
- Router, FinanceReceiptStore
  CALLED_BY:
- OperatorLayoutComponent
```

If a `COMPONENT_NAME: PointSwitchRefreshService` block already exists in `overview.md` (search first), update that block's RESPONSIBILITIES instead of inserting the last block. Likewise, if a `FinanceReceiptStore` block exists, do not duplicate it.

## 4. Validation Steps

Execute the following commands to ensure this task was successful. Do NOT run the full application server.

```bash
npx prettier --check overview.md
```

If Prettier reports `overview.md`, run `npx prettier --write overview.md` and re-run the check.
