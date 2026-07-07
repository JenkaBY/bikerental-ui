# Implementation Checklist: FR-03 - Agreement Signing Flow in Rental Processing

- [x] `task-001-rental-state-version.md`
- [x] `task-002-rental-dashboard-mapper-version.md`
- [x] `task-003-rental-store-signing.md`
- [x] `task-004-agreement-signature-model.md`
- [x] `task-005-agreement-signature-mapper.md`
- [x] `task-006-models-barrel.md`
- [x] `task-007-mappers-barrel.md`
- [x] `task-008-error-codes.md`
- [x] `task-009-error-messages.md`
- [x] `task-010-rental-status-meta.md`
- [x] `task-011-labels.md`
- [x] `task-012-agreement-signing-store.md`
- [x] `task-013-public-api-export.md`
- [x] `task-014-signing-dialog-component.md`
- [x] `task-015-signing-flow-service.md`
- [x] `task-016-rental-step3-send-to-signing.md`
- [x] `task-017-rental-action-buttons-signing.md`
- [x] `task-018-rental-detail-signing-providers-banner.md`

**Status:** All tasks implemented inline (dev subagents hit the session limit; applied by the main
session per the spec-delegate fallback). Shared + operator lint pass; operator dev build passes.

## Ad-hoc fixes / deviations from task files

- Applied inline (not via dev subagents) — quota exhaustion mid-wave.
- `task-014`: fixed a wrong import — `MAT_DIALOG_DATA` must come from `@angular/material/dialog`,
  not `@angular/core` as the task snippet wrote.
- `task-014`: the summary equipment list originally read a `rentalEquipmentItems()`-or-
  `equipmentItems()` fallback and rendered `item.estimatedCost`, but the two store getters return
  the SAME `_state().equipmentItems` array (one is just a cast) and `EquipmentSearchItem` has no
  `estimatedCost` (only `RentalEquipmentItem` does), so it failed to compile. Simplified to the
  typed `rentalEquipmentItems` signal and guarded the per-item cost with `@if (item.estimatedCost)`
  (blank in the pure-create flow where costs aren't yet on the items; populated after loadDetail).
- `task-017`: dropped the "inject `AgreementSigningStore` but never use it" line — it would trip
  `no-unused-vars`; `SigningFlowService` resolves that store through DI itself, so the injection was
  unnecessary.

## Known interaction to review (see report)

- `RentalCreateComponent` has an effect that navigates to `/rentals/{id}` when the loaded rental's
  status is not `DRAFT`. It is guarded by `numericId() === null`, so the primary happy path from
  `/rentals/new` is unaffected (the signing dialog stays open). But when sending to signing from the
  **edit-existing-draft** route (`/rentals/:id/edit`), the transition to `AWAITING_SIGNATURE` can
  fire that redirect and tear down the just-opened dialog. Flagged for a follow-up decision rather
  than silently changing the design-specified redirect.
