# Implementation Checklist: FR-08 — Close the Running Shift with a Cash Count (Operator and Admin)

Implement after FR-03, FR-05, FR-06 and FR-07 (reuses `RunningShiftStore`, `FinanceConfirmDialogComponent`, `IdempotentAttempt`, `PointMoneyErrorClassifier`, `FinanceReceiptStore`, `OperatorFinanceReceiptComponent`, `PointFinanceService`).

- [x] `task-001-shift-closure-models.md`
- [x] `task-002-shift-difference-rule.md`
- [x] `task-003-shift-closure-mapper.md`
- [x] `task-004-point-finance-close-shift.md`
- [x] `task-005-shift-not-running-error.md`
- [x] `task-006-closure-labels-messages-validators.md`
- [x] `task-007-shift-closure-presentation.md`
- [x] `task-008-shift-closure-store.md`
- [x] `task-009-shift-count-form-component.md`
- [x] `task-010-admin-shift-closure-dialog.md`
- [x] `task-011-admin-cash-tab-close-shift.md`
- [x] `task-012-shift-closure-receipt.md`
- [x] `task-013-operator-shift-closure-component.md`
- [x] `task-014-close-shift-routes.md`
- [x] `task-015-operator-cash-close-shift-navigation.md`
- [x] `task-016-i18n-extract-and-russian-translations.md`
- [x] `task-017-update-overview-docs.md`

**Next Task:** DONE

## Ad-hoc fixes discovered during the verification stage

- projects/admin/src/app/points/shift-closure-dialog.component.ts, shift-closure.launcher.ts — prettier --write — line wrapping failed lint prettier rule

## Review fixes — round 1

- None needed (review clean; MINOR notes listed in the PR).
