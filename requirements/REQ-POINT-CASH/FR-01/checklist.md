# Implementation Checklist: FR-01 — Points List with Money Overview

Ships together with FR-02: task-012 links rows to `/points/:slug`, which FR-02 adds. Implement FR-02 right after task-015 and release both together.

- [x] `task-001-point-finance-domain-models.md`
- [x] `task-002-business-period-util.md`
- [x] `task-003-point-finance-mapper-foundation.md`
- [x] `task-004-point-finance-api-abstraction.md`
- [x] `task-005-point-money-overview-store.md`
- [x] `task-006-point-list-view-store.md`
- [x] `task-007-points-list-labels-and-messages.md`
- [x] `task-008-fixed-money-pipe.md`
- [x] `task-009-point-profile-form-component.md`
- [x] `task-010-point-create-dialog.md`
- [x] `task-011-point-money-summary-cards.md`
- [x] `task-012-points-page-and-list-table-rewrite.md`
- [x] `task-013-point-admin-store-drop-master-detail.md`
- [x] `task-014-i18n-extract-and-russian-translations.md`
- [x] `task-015-update-overview-docs.md`
- [ ] `task-016-blocked-backend-generate-api-point-positions-results.md` — BLOCKED: backend FIN-002 FR-08 (`point-positions`, `point-results`) not published
- [ ] `task-017-blocked-backend-point-finance-mapper-positions-results.md` — BLOCKED: needs task-016
- [ ] `task-018-blocked-backend-http-point-ledger-reader-positions-results.md` — BLOCKED: needs task-016, task-017

**Next Task:** `task-016-blocked-backend-generate-api-point-positions-results.md` (BLOCKED: backend FIN-002 FR-08)

## Ad-hoc fixes discovered during the verification stage

- projects/admin/src/app/points/point-list.component.ts — replaced `statusClasses[row.status]`/`statusLabels[row.status]` template indexing with typed `statusClass()`/`statusLabel()` methods — TS7053 (row is any in matCellDef) broke the admin build
- projects/admin/src/app/points/point-money-summary-cards.component.ts, projects/admin/src/app/points/points-page.component.ts — prettier --write — lint prettier/prettier errors
- projects/shared/src/locale/messages.xlf — regenerated via i18n:extract (task-014 completed by the verifier)
- projects/shared/src/locale/messages.ru.xlf — added 9 Russian units, removed stale units "Rental points list" and "Select a rental point or create a new one" (task-014 completed by the verifier; "Point" and "Status" already had units)
- projects/shared/src/locale/gateway.xlf — deleted extract leftover

## Review fixes

Round 1:
- projects/shared/src/shared/constant/labels.ts — `PointColumnPoint` prefix changed to `:points-table|Points table column header:Point` — gives it its own message id so Russian shows "Точка" instead of sharing the "Пункт" unit with `DamageReportColumnPoint`
- projects/shared/src/locale/messages.ru.xlf — added unit 92811049220739013 with `<target>Точка</target>` — Russian translation for the new unit
