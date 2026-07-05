# Implementation Checklist: FR-01 - Admin Agreement Template Version Management

- [x] `task-001-agreement-template-model.md`
- [x] `task-002-agreement-template-mapper.md`
- [x] `task-003-models-barrel.md`
- [x] `task-004-mappers-barrel.md`
- [x] `task-005-error-codes.md`
- [x] `task-006-error-messages.md`
- [x] `task-007-labels.md`
- [x] `task-008-agreement-template-store.md`
- [x] `task-009-public-api-export.md`
- [x] `task-010-pdf-preview-dialog.md`
- [x] `task-011-agreement-dialog.md`
- [x] `task-012-agreement-list-component.md`
- [x] `task-013-admin-routes.md`
- [x] `task-014-admin-layout-nav.md`

**Status:** All tasks implemented; lint and dev builds (admin/operator/gateway) pass.

## Code-review refactors (user FIXME feedback)

- Moved all transient UI state into `AgreementTemplateStore`: dialog `loading`/`saving`/
  `previewing` flags (`isFetchingDetail`/`isSaving`/`isPreviewing`), the per-row `busy` record
  (`busyIds: ReadonlySet<number>`), and sorting (`sortColumn`/`sortDirection`/`toggleSort()`/
  `sortedTemplates` computed). Components only render store computeds now.
- Replaced the `statusLabel` switch with a `STATUS_LABELS` record map.
- Collapsed `openCreateDialog`/`openEditDialog`/`openViewDialog` into one private
  `openTemplateDialog(data)` (plus a shared `confirmThen` helper for the two confirm flows).

## Ad-hoc fixes discovered during the test stage

- `agreement-template.store.ts`: removed unused `tap` import (lint error left by task-008 snippet).
- `ng lint admin --fix`: auto-fixed 9 import-ordering/formatting violations in the three new
  admin agreement components produced by tasks 010–012.
- Generated API client regenerated a second time against the backend running with the `dev`
  Spring profile: the first regeneration (container with empty profile) silently dropped the
  profile-gated time-travel endpoints (`TimeResponse`, `SetTimeRequest`, `SseEmitter`), breaking
  `time-travel.store.ts` compilation. `docker/.env` in the backend repo now sets
  `SPRING_PROFILES_ACTIVE=dev` so future regenerations expose the full contract.
