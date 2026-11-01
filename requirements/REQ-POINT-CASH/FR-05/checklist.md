# Implementation Checklist: FR-05 — Admin Cash Collection and Terminal Settlement Dialogs

Implement after FR-03 (builds on `PointCashTabComponent`, `PointPositionsStore`, `applyOutcome`). Tasks 017-020 wait for the backend terminal-settlement endpoint.

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
- [ ] `task-017-blocked-backend-generate-api-terminal-settlements.md` (BLOCKED: backend FIN-002 FR-06 `POST /api/finance/terminal-settlements` not published)
- [ ] `task-018-blocked-backend-settlement-mapper-and-service.md` (BLOCKED: needs task-017)
- [ ] `task-019-blocked-backend-settlement-dialog-mode.md` (BLOCKED: needs task-018)
- [ ] `task-020-blocked-backend-record-settlement-wiring.md` (BLOCKED: needs task-019)

**Next Task:** task-017-blocked-backend-generate-api-terminal-settlements.md (BLOCKED)

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
