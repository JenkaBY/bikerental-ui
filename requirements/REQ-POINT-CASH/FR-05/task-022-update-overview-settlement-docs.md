# Task 022: Update overview.md for terminal settlement

> **Applied Skill:** CLAUDE.md "Keep docs in sync with code".

## 1. Objective

Bring the component descriptions in `overview.md` in line with the code from tasks 018-020 and FR-04 task-006. Text edits only.

## 2. File to Modify / Create

* **File Path:** `overview.md` - **Action:** Modify Existing File

## 3. Code Implementation

Edit exactly these places (find by the quoted text):

1. `PointFinanceService` block: in `PURPOSE:` replace "money commands: cash collection (settlement follows with the backend endpoint)." with "money commands: cash collection and terminal settlement."; after the `recordCollection(write, pointSlug | null)` bullet add the bullet "- `recordSettlement(write, pointSlug | null)` over `POST /api/finance/terminal-settlements` (admin only; `X-Point-Slug` with `SKIP_POINT_SCOPE`, `suppressErrorNotification`, date sent as `yyyy-MM-dd` `statementDate`); maps via `PointFinanceMapper.settlementToRequest` / `settlementFromResponse`."; in its `CALLS:` line change "`getRunningShift()`, `recordCollection()`." to "`getRunningShift()`, `recordCollection()`, `recordTerminalSettlement()`.".
2. `PointCashTabComponent` block: replace the sentence "The settlement opener arrives with the settlement endpoint." with "`onSettle()` opens the same dialog in SETTLEMENT mode (available = CARD_TERMINAL position); `done` patches the CARD_TERMINAL position and goes through `applyOutcome()`."
3. `PointMoneyMoveLauncher` block: replace "on `done` shows "Collected: X"." with "on `done` shows "Collected: X" (collection) or "Settlement recorded: X" (settlement)."
4. `PointMoneyMoveDialogComponent` block: in `PURPOSE:` replace "Admin form dialog for a cash collection (terminal settlement mode follows with the backend endpoint)." with "Admin form dialog for a cash collection or a terminal settlement (`data.operation`)."; add the responsibility bullet "- SETTLEMENT mode adds `PointSettlementDateFieldComponent` (required statement date, `max` = today from `TimeStore`, `notFutureDateValidator`; form control `statementDate` so backend field errors bind) and passes the date to `PointMoneyMoveStore.execute(amount, statementDate)`; the confirmation shows it as `dd.MM.yyyy`."; add `PointSettlementDateFieldComponent, notFutureDateValidator, TimeStore` to its `CALLS:` list and `point-settlement-date-field.component.ts` to its `SOURCE:` list.
5. `PointMoneyMoveStore` block: replace the `execute(amount)` bullet with "- `init(operation, pointSlug, available)`; `execute(amount, statementDate | null)`: key from `IdempotentAttempt` over `{ amount, statementDate }`, `PointFinanceService.recordCollection` or (SETTLEMENT) `recordSettlement`, attempt settled definitive on success or by `IdempotentAttempt.outcomeOf(error)`."
6. Add a new block directly after `PointMoneyMoveStore`:

```
COMPONENT_NAME: PointSettlementDateFieldComponent
TYPE: Gateway
PURPOSE: Dumb statement-date picker of the settlement dialog.
RESPONSIBILITIES:

- Inputs `control` (`FormControl<Date | null>`) and `max`; Material datepicker (`provideNativeDateAdapter`); renders required / future-date / server errors.
  SOURCE: `projects/admin/src/app/points/point-settlement-date-field.component.ts`
  CALLS:
- NONE
  CALLED_BY:
- PointMoneyMoveDialogComponent
```

## 4. Validation Steps

Execute the following commands to ensure this task was successful. Do NOT run the full application server.

```bash
git grep -n -E "interim|follows with the|arrives with the settlement" -- overview.md
```

Expected: no line mentioning the settlement endpoint as pending.
