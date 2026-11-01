# Implementation Checklist: FR-03 — Admin Касса Tab: Running Shift, Point Positions and Shift Cash Movements

Implement after FR-02 (builds on its Point detail host, `PointPositionsStore`, `PointMovementsStore`, `PointMovementTableComponent`); ships together with FR-01 and FR-02.

- [x] `task-001-running-shift-domain-models.md`
- [x] `task-002-running-shift-mapper.md`
- [x] `task-003-point-finance-current-shift-api.md`
- [x] `task-004-running-shift-store.md`
- [x] `task-005-point-money-action-availability.md`
- [x] `task-006-cash-tab-labels-and-messages.md`
- [x] `task-007-business-period-since-day.md`
- [x] `task-008-point-movements-store-show-more.md`
- [x] `task-009-shift-breakdown-component.md`
- [x] `task-010-point-cash-card.md`
- [x] `task-011-point-terminal-card.md`
- [x] `task-012-point-cash-tab.md`
- [x] `task-013-i18n-extract-and-russian-translations.md`
- [x] `task-014-update-overview-docs.md`

**Next Task:** DONE

## Ad-hoc fixes discovered during the verification stage

- projects/shared/src/core/api/point-finance/point-finance.service.ts — wrapped request headers in `new HttpHeaders(...)` and imported `HttpHeaders` — generated `RequestOptions.headers` is `HttpHeaders`, plain object failed TS2353
- projects/shared/src/locale/messages.ru.xlf — added 16 Russian targets for the new FR-03 units — `i18n:check` reported them missing (task-013)

## Review fixes — round 1

- projects/shared/src/locale/messages.ru.xlf — replaced Russian targets of the Cash tab units with the task-013 table copy — reviewer finding 1

## Review fixes — round 2

- None applied (review rounds exhausted). Open: `messages.ru.xlf` unit `5152232822989636705` (`Cash collection`, movement kind) was changed from `Инкассация` to `Сдать в банк` by the round-1 fix — should be reverted to `Инкассация`.
