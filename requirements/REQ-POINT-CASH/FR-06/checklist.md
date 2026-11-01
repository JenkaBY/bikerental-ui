# Implementation Checklist: FR-06 — Operator Касса Screen: Running Shift and Bottom-Nav Entry

Implement after FR-03 and FR-05 (reuses `RunningShiftStore`, `ShiftBreakdownComponent`, `PointMoneyActionAvailability`, `pointShiftCaption`).

- [x] `task-001-operator-cash-labels.md`
- [x] `task-002-current-point-store-refresh-current.md`
- [x] `task-003-operator-shift-card.md`
- [x] `task-004-operator-cash-component.md`
- [x] `task-005-operator-route-and-nav-item.md`
- [x] `task-006-i18n-extract-and-russian-translations.md`
- [x] `task-007-update-overview-docs.md`

**Next Task:** DONE

## Ad-hoc fixes discovered during the verification stage

- projects/operator/src/app/cash/operator-cash.component.ts — reformatted with prettier — lint prettier/prettier error on the empty-state div attributes
- projects/shared/src/locale/messages.ru.xlf — added Russian targets for 2 new units (Cash/operator nav -> Касса, Hand in cash -> Сдать наличные) — task-006

## Review fixes — round 1

- projects/shared/src/core/state/running-shift.store.ts — skip notifications.error for scope.not_established (state still failed) — global interceptor already warns, avoids double toast
- overview.md — appended CurrentPointStore.refreshCurrent() note to the CurrentPointStore entry — docs-in-sync

## Review fixes — round 2

- None needed (review clean).
