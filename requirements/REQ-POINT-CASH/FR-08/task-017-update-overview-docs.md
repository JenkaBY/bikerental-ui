# Task 017: Update overview.md for shift closure

> **Applied Skill:** CLAUDE.md "Keep docs in sync with code" - same `COMPONENT_NAME / TYPE / PURPOSE / RESPONSIBILITIES / SOURCE / CALLS / CALLED_BY` format as the existing blocks. `architecture.md` and `README.md` do not change (no new project, command or topology).

## 1. Objective

Document the FR-08 additions and refresh the blocks they change. Documentation only. Requires tasks 001-015.

## 2. File to Modify / Create

* **File Path:** `overview.md` (repository root) - **Action:** Modify Existing File

## 3. Code Implementation

Locate every block by searching for its `COMPONENT_NAME:` line (line numbers drift).

**Edits to existing blocks**

* `COMPONENT_NAME: PointCashTabComponent`: in the RESPONSIBILITIES bullet starting `- \`onCollect()\` opens the money-move dialog` replace the final sentence `Settlement and shift closure openers arrive with the settlement endpoint / FR-08.` with `\`onCloseShift()\` opens \`ShiftClosureDialogComponent\` through \`ShiftClosureLauncher\` (data \`{ pointSlug, pointName, shift }\`; \`done\` / \`shiftChanged\` go through \`applyOutcome()\`, so the revision effect reloads the shift and the movements). The settlement opener arrives with the settlement endpoint.` In CALLS add `ShiftClosureLauncher.`
* `COMPONENT_NAME: OperatorCashComponent`: replace `"Close shift" currently shows an info notification until FR-08 adds \`cash/close-shift\`.` with `"Close shift" navigates to \`cash/close-shift\`.` and remove `NotificationService` from its CALLS list.
* `COMPONENT_NAME: PointMoneyErrorClassifier`: replace `\`SHIFT_NOT_RUNNING\` arrives with FR-08.` with `\`SHIFT_NOT_RUNNING\` (\`finance.shift.not_running\`); \`classifyClosure(error)\` additionally maps an otherwise-unclassified 409 / 422 to \`SHIFT_NOT_RUNNING\` (closure flows only, assumption A5).` Add `- ShiftClosureDialogComponent` and `- OperatorShiftClosureComponent` to CALLED_BY.
* `COMPONENT_NAME: OperatorFinanceReceiptComponent`: replace `(SHIFT_CLOSURE arrives with FR-08)` in PURPOSE with `(\`/cash/collect/done\` and \`/cash/close-shift/done\`)`; append to RESPONSIBILITIES: `- SHIFT_CLOSURE shows "Shift N closed", point, expected cash, counted amount, difference ("Surplus +X" / "Shortage −X" / "Matches") and the closing time; \`FinanceReceiptView.amount\` is null for closures (no large amount line).`
* `COMPONENT_NAME: FinanceReceiptStore`: change `(\`COLLECTION\` now)` to `(\`COLLECTION\`, \`SHIFT_CLOSURE\`)` and add `- OperatorShiftClosureComponent` to CALLED_BY.
* `COMPONENT_NAME: PointSwitchRefreshService`: change `(\`collect\`, \`collect/done\`, later \`close-shift*\`)` to `(\`collect\`, \`collect/done\`, \`close-shift\`, \`close-shift/done\`)`.
* `COMPONENT_NAME: PointFinanceService`: add to RESPONSIBILITIES `- \`closeShift(write, pointSlug | null)\` -> \`POST /api/finance/shifts/current/closures\` (explicit \`X-Point-Slug\` when the slug is non-null, \`suppressErrorNotification()\`).`
* `COMPONENT_NAME: PointFinanceMapper`: add to RESPONSIBILITIES `- \`closureToRequest\` / \`closureFromResponse\` (\`ShiftClosureWrite\` / \`ShiftClosure\`; the closing user id is not mapped).`
* `COMPONENT_NAME: RunningShiftStore`, `FinanceConfirmDialogComponent`, `IdempotentAttempt`: add `- ShiftClosureDialogComponent`, `- OperatorShiftClosureComponent` (and for `IdempotentAttempt` `- ShiftClosureStore`) to CALLED_BY.

**New blocks.** Insert directly after the `COMPONENT_NAME: PointCashCardComponent` block (admin) the first block below, and directly after the `COMPONENT_NAME: OperatorShiftCardComponent` block (operator) the remaining ones:

```markdown
COMPONENT_NAME: ShiftClosureDialogComponent
TYPE: Gateway
PURPOSE: Admin dialog that closes a point's running shift with a cash count (Cash tab "Close shift").
RESPONSIBILITIES:

- Data `{ pointSlug, pointName, shift }`; provides its own `ShiftClosureStore`. State 1: `ShiftCountFormComponent` + Cancel + "Close shift" -> `FinanceConfirmDialogComponent` (Shift / Expected cash / Counted amount / Difference, note "A closed shift cannot be reopened", Back / "Close shift", `execute = ShiftClosureStore.execute()`). State 2 (result): "Shift N closed", expected, counted, difference, closing time, "Done" -> close `{ outcome: 'done' }`; backdrop / Escape disabled in this state.
- `PointMoneyErrorClassifier.classifyClosure`: `SHIFT_NOT_RUNNING` -> warn "This shift is already closed" and close `{ outcome: 'shiftChanged' }`; `VALIDATION` -> `applyServerErrors` on the counted control; other -> error notification, form kept.
  SOURCE: `projects/admin/src/app/points/shift-closure-dialog.component.ts`, `shift-closure-dialog.model.ts`, `shift-closure.launcher.ts`
  CALLS:
- ShiftClosureStore, ShiftCountFormComponent, FinanceConfirmDialogComponent, buildShiftClosureConfirm, buildShiftClosureRows, PointMoneyErrorClassifier, ErrorMessageResolver, NotificationService
  CALLED_BY:
- PointCashTabComponent (via ShiftClosureLauncher)

COMPONENT_NAME: OperatorShiftClosureComponent
TYPE: Gateway
PURPOSE: Operator full-screen close-shift page (`/cash/close-shift`).
RESPONSIBILITIES:

- Provide its own `RunningShiftStore` and `ShiftClosureStore`; load the shift with a null slug. No working point / scope lost -> `/cash`; no running shift -> info "No shift is running" and `/cash`. Back arrow -> `/cash`, nothing sent.
- Mobile `ShiftCountFormComponent` + primary "Close shift" -> `FinanceConfirmDialogComponent`; success puts a `SHIFT_CLOSURE` receipt into `FinanceReceiptStore` and replace-navigates to `cash/close-shift/done`. `SHIFT_NOT_RUNNING` -> warn "This shift is already closed" and `/cash`; `SCOPE` -> `/cash` without an extra toast; `VALIDATION` binds to the form; other errors notify and keep the form.
  SOURCE: `projects/operator/src/app/cash/operator-shift-closure.component.ts`
  CALLS:
- ShiftClosureStore, RunningShiftStore, ShiftCountFormComponent, FinanceConfirmDialogComponent, FinanceReceiptStore, CurrentPointStore, OperatingScopeStore, PointMoneyErrorClassifier, ErrorMessageResolver, NotificationService
  CALLED_BY:
- OperatorRoutes

COMPONENT_NAME: ShiftCountFormComponent
TYPE: Gateway
PURPOSE: Shared dumb form of the shift closure (admin dialog and operator page).
RESPONSIBILITIES:

- Inputs `shift`, `pointName`, `layout` (`dialog` | `mobile`), `differenceText`; shows point name, expected cash, "Shift N · opened HH:mm" and ONE "Counted amount" control (`countedAmountValidators()`: required, >= 0, <= 2 decimals; decimal keypad; no "All" shortcut) with the live difference in a plain paragraph. Outputs `countedChange`, `submitted`; method `showServerErrors()`. No submit button (hosts render their own).
  SOURCE: `projects/shared/src/shared/components/shift-count-form/shift-count-form.component.ts`
  CALLS:
- countedAmountValidators, applyServerErrors, MaxDecimalsDirective, pointShiftCaption
  CALLED_BY:
- ShiftClosureDialogComponent, OperatorShiftClosureComponent

COMPONENT_NAME: ShiftClosureStore
TYPE: Store
PURPOSE: Host-scoped state and command of a shift closure (provided by the dialog / page, never root).
RESPONSIBILITIES:

- State `shift`, entered value, `submitting`, `closure`; computed `counted` (valid only when >= 0 with at most two decimals), `difference` (`ShiftDifference.of`), `differenceText`. `execute()` keys the attempt on `{ shiftId, counted }` via `IdempotentAttempt` and calls `PointFinanceService.closeShift(write, pointSlug)`.
  SOURCE: `projects/shared/src/core/state/shift-closure.store.ts`
  CALLS:
- PointFinanceService, IdempotentAttempt, ShiftDifference, describeShiftDifference
  CALLED_BY:
- ShiftClosureDialogComponent, OperatorShiftClosureComponent

COMPONENT_NAME: ShiftDifference
TYPE: Utility
PURPOSE: Pure rule: counted minus expected in integer cents, classified as `SURPLUS`, `SHORTAGE` or `MATCHES`.
RESPONSIBILITIES:

- `ShiftDifference.of(counted, expected)` -> `{ kind, amount }` (signed amount). Presentation helpers (`describeShiftDifference`, `buildShiftClosureRows`, `buildShiftClosureConfirm`) live in `shift-closure-presentation.ts`.
  SOURCE: `projects/shared/src/shared/utils/shift-difference.ts`, `shift-closure-presentation.ts`
  CALLS:
- makeMoney, formatFixedMoney
  CALLED_BY:
- ShiftClosureStore, OperatorFinanceReceiptComponent (via buildShiftClosureRows)
```

## 4. Validation Steps

Execute the following commands to ensure this task was successful. Do NOT run the full application server.

```bash
npx prettier --check overview.md
```

If Prettier reports `overview.md`, run `npx prettier --write overview.md` and re-run the check.
