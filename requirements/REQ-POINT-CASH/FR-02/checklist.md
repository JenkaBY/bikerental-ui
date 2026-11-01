# Implementation Checklist: FR-02 — Point Detail Shell, Профиль Tab and Операции Tab

Implement after FR-01 task-015 (builds on FR-01's code state); ships together with FR-01.

- [x] `task-001-point-movement-domain-models.md`
- [x] `task-002-point-detail-labels-and-meta.md`
- [x] `task-003-point-period-rule.md`
- [x] `task-004-point-finance-movements-abstraction.md`
- [x] `task-005-point-admin-store-load-one.md`
- [x] `task-006-point-positions-store.md`
- [x] `task-007-point-money-refresh-facade.md`
- [x] `task-008-staff-name-resolver.md`
- [x] `task-009-point-movements-store.md`
- [x] `task-010-point-balance-pill.md`
- [x] `task-011-point-period-filter.md`
- [x] `task-012-point-movement-table.md`
- [x] `task-013-point-profile-tab.md`
- [x] `task-014-point-cash-and-transfers-tab-shells.md`
- [x] `task-015-point-operations-tab.md`
- [x] `task-016-point-detail-page.md`
- [x] `task-017-point-detail-routes.md`
- [x] `task-018-i18n-extract-and-russian-translations.md`
- [x] `task-019-update-overview-docs.md`
- [x] `task-020-blocked-backend-generate-api-point-movements.md` — client regenerated on FR-01 (bike-rental PR 325/327), merged in
- [x] `task-021-blocked-backend-point-finance-mapper-movements.md` — `movementPageFromResponse`; `runningBalance` nullable
- [x] `task-022-blocked-backend-http-point-ledger-reader-movements.md` — `HttpPointLedgerReader.movements()` with kind filter and `recordedAt` sort

**Next Task:** DONE

## Ad-hoc fixes discovered during the verification stage

- task-018 (i18n extract and Russian targets) was completed by the verification stage: 23 new units added to `projects/shared/src/locale/messages.ru.xlf`, `messages.xlf` regenerated, `i18n:check` OK (802 units)
- `projects/admin/src/app/points/point-movement-table.component.ts` — prettier formatting; replaced `kindLabels[row.kind]` template index (TS7053, untyped `row`) with typed `kindLabel(kind)` method — admin build failed
- `projects/admin/src/app/points/point-operations-tab.component.ts` — prettier formatting — lint failed
- `projects/shared/src/shared/constant/labels.ts` — gave `PointTabCash` and `PointPositionCash` a meaning (`Point detail tab|...`, `Point money position|...`) — plain "Cash" collided with the existing unit translated "Наличные"; the task requires "Касса"
- `projects/admin/src/app/app.config.ts` — no change needed, `withComponentInputBinding()` already enabled

## Handoff JenkaBY/bikerental-ui#155 additions

- Movement-kind filter: `POINT_MOVEMENT_FILTER_KINDS` (adds `HOLD`, `RELEASE`), `PointMovementsStore.setKinds()`, multi-select in the Operations tab
- Results tab `/points/:slug/results`: `PointResultsStore` + `PointResultsTabComponent`, period filter, five figures
- 12 new i18n units with Russian targets (815 total)

## Review fixes

Round 1: clean (no BLOCKER/MAJOR findings) — no changes.
