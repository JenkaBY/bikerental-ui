# Implementation Checklist: FR-05 — Admin Cash Collection and Terminal Settlement Dialogs

Implement after FR-03 (builds on `PointCashTabComponent`, `PointPositionsStore`, `applyOutcome`). Tasks 017-022 cover terminal settlement; the backend endpoint is published and the client is generated. Task 021 must run after FR-04 `task-006-blocked-backend-record-settlement-wiring.md` (it removes the label that task still uses).

- [x] `task-001-point-money-move-domain-models.md`
- [x] `task-002-collection-mapper.md`
- [x] `task-003-point-finance-record-collection-api.md`
- [x] `task-004-idempotent-attempt.md`
- [x] `task-005-insufficient-funds-error-codes.md`
- [x] `task-006-point-money-error-classifier.md`
- [x] `task-007-amount-and-date-validators.md`
- [x] `task-008-point-money-move-labels-and-messages.md`
- [x] `task-009-finance-confirm-dialog.md`
- [x] `task-010-point-money-move-types-and-confirm-builder.md`
- [x] `task-011-point-money-move-store.md`
- [x] `task-012-point-money-move-dialog.md`
- [x] `task-013-point-money-move-launcher.md`
- [x] `task-014-cash-tab-collect-wiring.md`
- [x] `task-015-i18n-extract-and-russian-translations.md`
- [x] `task-016-update-overview-docs.md`
- [x] `task-017-blocked-backend-generate-api-terminal-settlements.md` (done: `npm run generate:api` ran, additive diff in generated models/index.ts and services/finance.service.ts)
- [x] `task-018-blocked-backend-settlement-mapper-and-service.md` (settlement model rename to `statementDate`, mapper, `recordSettlement`)
- [x] `task-019-blocked-backend-settlement-dialog-mode.md` (date field component, store, dialog SETTLEMENT mode)
- [x] `task-020-blocked-backend-record-settlement-wiring.md` (success toast, launcher, Cash tab `onSettle`)
- [x] `task-021-i18n-settlement-extract-and-russian-translations.md` (after FR-04 task-006; extract, Russian target, remove `PointActionNotAvailableYet`)
- [x] `task-022-update-overview-settlement-docs.md`

**Next Task:** DONE

## Ad-hoc fixes discovered during the verification stage

- projects/admin/src/app/points/point-money-move-dialog.component.ts — prettier --write (import line wrapping) — lint prettier/prettier error
- projects/shared/src/core/api/point-finance/point-finance.service.ts — prettier --write formatting — prettier check
- projects/shared/src/locale/messages.xlf — regenerated via npm run i18n:extract — task-015
- projects/shared/src/locale/messages.ru.xlf — added 21 new Russian trans-unit targets (84 added lines, no existing unit touched) — task-015, i18n:check

## Review fixes — round 1

- projects/admin/src/app/points/point-money-move-dialog.component.ts — moved "Remaining" text from mat-hint to a paragraph under the amount row — mat-hint is hidden while the control is invalid and touched
- requirements/REQ-POINT-CASH/FR-05/task-012-point-money-move-dialog.md — template snippet updated to match the code — keep task in sync

## Review fixes — round 2

- None needed (review clean).

## Ad-hoc fixes discovered during the verification stage

- projects/admin/src/app/points/point-money-move-dialog.component.ts — wrapped the settlementDate summary line — prettier/prettier lint error

## Review fixes — settlement round 1

- requirements/REQ-POINT-CASH/FR-05/design.md — `settlementDate` renamed to `statementDate`, `cardTerminalPosition` made non-null, dropped "assumed" wording, added 409 and field constraints, removed "enable only once the endpoint exists" — sync with published contract
- requirements/REQ-POINT-CASH/FR-05/fr.md — backend-dependency line states settlement endpoint is published — sync with published contract
- requirements/REQ-POINT-CASH/FR-04/fr.md — backend-dependency line states movements and results are published — remove stale wording
- requirements/REQ-POINT-CASH/FR-04/design.md — delivery split no longer says settlement waits for backend — remove stale wording
- requirements/REQ-POINT-CASH/FR-04/checklist.md, FR-05/checklist.md — ticked remaining tasks, Next Task set to DONE — bookkeeping
