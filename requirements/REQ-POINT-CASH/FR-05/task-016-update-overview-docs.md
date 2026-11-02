# Task 016: Update overview.md for the money-move dialogs and shared write toolkit

> **Applied Skill:** CLAUDE.md "Keep docs in sync with code" - same `COMPONENT_NAME / TYPE / PURPOSE / RESPONSIBILITIES / SOURCE / CALLS / CALLED_BY` format as the blocks FR-01 / FR-02 / FR-03 added. `architecture.md` and `README.md` do not change in this FR (no new project, route or setup step).

## 1. Objective

Document the FR-05 additions and update the blocks they change. Documentation only. Settlement parts are documented as "added with the blocked tasks 017-020" until those land.

## 2. File to Modify / Create

* **File Path:** `overview.md` (repository root) - **Action:** Modify Existing File

## 3. Code Implementation

**Code to Add/Replace:**

* **Location:** In the `COMPONENT_NAME: PointFinanceService` block:
  * change the PURPOSE sentence's tail "later FRs add movements, the running shift and the money commands." to "...; money commands: cash collection (settlement follows with the backend endpoint)."
  * add the RESPONSIBILITIES bullet
    `- Expose \`recordCollection(write, pointSlug | null)\` over \`POST /api/finance/collections\` (admin names the point via \`X-Point-Slug\` with \`SKIP_POINT_SCOPE\`, \`null\` = operator via the point interceptor); always \`suppressErrorNotification\`, the caller owns error copy.`
  * add `- PointMoneyMoveStore` under its CALLED_BY and `recordCollection()` to the generated `FinanceService` CALLS bullet.
* **Location:** In the `COMPONENT_NAME: PointFinanceMapper` block add the bullet
  `- \`collectionToRequest\` / \`collectionFromResponse\`: \`{ idempotencyKey, amount }\` out; \`{ transactionId, pointSlug, amount, cashPosition, recordedAt }\` in (\`shiftId\` not mapped).`
* **Location:** In the `COMPONENT_NAME: PointCashTabComponent` block replace the bullet "`applyOutcome()` after a money dialog: ... Dialog openers arrive with FR-05 / FR-08." with
  `- \`onCollect()\` opens the money-move dialog (available = CASH position, fallback shift expected cash) through \`PointMoneyMoveLauncher\`; \`done\` patches the CASH position into \`PointPositionsStore\`; every result goes through \`applyOutcome()\` (\`notifyChanged()\`, plus \`PointAdminStore.loadOne\` on \`statusChanged\`). Settlement and shift closure openers arrive with the settlement endpoint / FR-08.`
  and add `PointMoneyMoveLauncher` to its CALLS list.
* **Location:** In the `COMPONENT_NAME: PointPositionsStore` block add `- PointMoneyMoveDialogComponent` under CALLED_BY (optional injection, patches the position reported by an insufficient-funds refusal).
* **Location:** Directly after the `COMPONENT_NAME: PointTerminalCardComponent` block, insert:

```markdown
COMPONENT_NAME: PointMoneyMoveLauncher
TYPE: Gateway
PURPOSE: Opens the money-move dialog with the caller's injector and shows the success toast.
RESPONSIBILITIES:

- `open(injector, data)` returns the dialog result (`done` | `statusChanged` | undefined); on `done` shows "Collected: X".
  SOURCE: `projects/admin/src/app/points/point-money-move.launcher.ts`
  CALLS:
- MatDialog, NotificationService, PointMoneyMoveDialogComponent, formatFixedMoney
  CALLED_BY:
- PointCashTabComponent

COMPONENT_NAME: PointMoneyMoveDialogComponent
TYPE: Gateway
PURPOSE: Admin form dialog for a cash collection (terminal settlement mode follows with the backend endpoint).
RESPONSIBILITIES:

- Show point, read-only source, destination "Bank account" and available amount; amount field with "All" and live "Remaining: X"; submit opens `FinanceConfirmDialogComponent`.
- Map failures with `PointMoneyErrorClassifier`: insufficient funds -> available / validators / position updated and a server error under the amount; point not active / permanently closed -> toast and close with `statusChanged`; validation -> `applyServerErrors`; other -> toast.
  SOURCE: `projects/admin/src/app/points/point-money-move-dialog.component.ts`, `point-money-move.meta.ts`, `point-money-move-confirm.ts`, `point-money-move.model.ts`
  CALLS:
- PointMoneyMoveStore, FinanceConfirmDialogComponent, PointMoneyErrorClassifier, ErrorMessageResolver, NotificationService, PointPositionsStore (optional), moneyAmountValidators
  CALLED_BY:
- PointMoneyMoveLauncher

COMPONENT_NAME: PointMoneyMoveStore
TYPE: Store
PURPOSE: Dialog-scoped state and command of a point-money write.
RESPONSIBILITIES:

- State `available`, `amount`; computed `remaining` (`available - amount` while valid, else `available`).
- `execute(amount)`: key from `IdempotentAttempt`, `PointFinanceService.recordCollection`, attempt settled definitive on success or by `IdempotentAttempt.outcomeOf(error)`.
  SOURCE: `projects/admin/src/app/points/point-money-move.store.ts`
  CALLS:
- PointFinanceService, IdempotentAttempt
  CALLED_BY:
- PointMoneyMoveDialogComponent

COMPONENT_NAME: FinanceConfirmDialogComponent
TYPE: Gateway
PURPOSE: Generic stacked confirmation for point-money commands (collection, settlement, later operator collection and shift closure).
RESPONSIBILITIES:

- Render label/value rows and a note; Back closes with `undefined`; Confirm runs the deferred `execute` once with progress and `disableClose`, then closes `{ ok: true, result }` or `{ ok: false, error: ApiError }`.
  SOURCE: `projects/shared/src/shared/components/finance-confirm-dialog/finance-confirm-dialog.component.ts`
  CALLS:
- ApiErrorParser
  CALLED_BY:
- PointMoneyMoveDialogComponent

COMPONENT_NAME: IdempotentAttempt
TYPE: Utility
PURPOSE: Body `idempotencyKey` lifecycle for point-money writes (one plain instance per dialog).
RESPONSIBILITIES:

- `keyFor(payload)` reuses the key only when the payload is unchanged and the last outcome was indeterminate (status 0 / 408 / 5xx / non-HTTP error); otherwise a new UUID. `settle(outcome)`; `outcomeOf(error)`.
  SOURCE: `projects/shared/src/shared/utils/idempotent-attempt.ts`
  CALLS:
- (none)
  CALLED_BY:
- PointMoneyMoveStore

COMPONENT_NAME: PointMoneyErrorClassifier
TYPE: Utility
PURPOSE: Maps a parsed `ApiError` of a point-money write to a UI outcome.
RESPONSIBILITIES:

- `INSUFFICIENT_CASH` (`finance.point.insufficient_cash`, position = `params.cashPosition`), `INSUFFICIENT_TERMINAL` (`finance.point.insufficient_terminal`, `params.cardTerminalPosition`), `POINT_NOT_ACTIVE`, `POINT_PERMANENTLY_CLOSED`, `SCOPE`, `VALIDATION`, `OTHER`. `SHIFT_NOT_RUNNING` arrives with FR-08.
  SOURCE: `projects/shared/src/shared/utils/point-money-error.classifier.ts`
  CALLS:
- ErrorCode, makeMoney
  CALLED_BY:
- PointMoneyMoveDialogComponent
```

* **Location:** In the validators/utilities area of `overview.md` (next to the `PointPeriodRule` / number-validator documentation; if no validators block exists, add this block directly after `PointMoneyActionAvailability`):

```markdown
COMPONENT_NAME: AmountValidators
TYPE: Utility
PURPOSE: Reusable money-amount and date validators.
RESPONSIBILITIES:

- `maxAmountValidator(max)` (`maxAmount` error, re-bindable), `moneyAmountValidators(max)` (required, >= 0.01, two decimals, ceiling), `notFutureDateValidator(today)` (`futureDate` error). `maxWithdrawAmountValidator` delegates to `maxAmountValidator`.
  SOURCE: `projects/shared/src/shared/validators/amount-validators.ts`
  CALLS:
- maxDecimalPlacesValidator
  CALLED_BY:
- PointMoneyMoveDialogComponent, WithdrawDialogComponent
```

* **Location:** If the document lists registered error codes, add `finance.point.insufficient_cash` and `finance.point.insufficient_terminal` next to `finance.point.inactive`.

## 4. Validation Steps

Execute the following commands to ensure this task was successful. Do NOT run the full application server.

```bash
npx prettier --check overview.md
```

If Prettier reports `overview.md`, run `npx prettier --write overview.md` and re-run the check.
