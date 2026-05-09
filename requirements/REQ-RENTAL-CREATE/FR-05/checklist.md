# Implementation Checklist: FR-05 — Step 2: Rental Parameters

## Data Layer

- [x] `task-001-add-labels.md`
- [x] `task-002-create-equipment-search-item-model.md`
- [x] `task-003-create-equipment-search-item-mapper.md` _(depends on task-002)_
- [x] `task-003b-create-equipment-search-store.md` _(depends on task-002, task-003)_
- [x] `task-004-extend-rental-store-step2.md` _(depends on task-002; requires RentalStore from FR-02/FR-03)_

## Dumb Components

- [x] `task-005-create-equipment-item-row-component.md` _(depends on task-002)_
- [x] `task-006-create-duration-slider-component.md`
- [x] `task-007-create-duration-input-component.md` _(depends on task-001)_
- [x] `task-008-create-discount-input-component.md` _(depends on task-001)_
- [x] `task-009-create-special-price-input-component.md` _(depends on task-001)_

## Smart Components

- [x] `task-010-create-rental-customer-panel-component.md` _(depends on task-001, task-004)_
- [x] `task-011-create-rental-duration-control-component.md` _(depends on task-001, task-004, task-006, task-007)_
- [x] `task-012-create-rental-equipment-section-component.md` _(depends on task-003b, task-004, task-005)_
- [x] `task-013-create-rental-pricing-section-component.md` _(depends on task-001, task-004, task-008, task-009)_
- [x] `task-014-create-rental-cost-footer-component.md` _(depends on task-001, task-004)_
- [x] `task-015-create-rental-step2-component.md` _(depends on task-010 through task-014)_

## Specs — Dumb Components

- [x] `task-016-spec-equipment-item-row.md`
- [x] `task-017-spec-duration-slider.md`
- [x] `task-018-spec-duration-input.md`
- [x] `task-019-spec-discount-input.md`
- [x] `task-020-spec-special-price-input.md`

## Specs — Smart Components

- [x] `task-021-spec-rental-customer-panel.md`
- [x] `task-022-spec-rental-duration-control.md`
- [x] `task-023-spec-rental-equipment-section.md`
- [x] `task-024-spec-rental-pricing-section.md`
- [x] `task-025-spec-rental-cost-footer.md`
- [x] `task-026-spec-rental-step2.md` _(includes `.error.spec.ts`)_

**Next Task:** DONE
