# System Design: FR-05 - Remove Direct DRAFT→ACTIVE Activation from UI

## 1. Architectural Overview

The final, coordinated slice. The backend removes the direct `DRAFT → ACTIVE` lifecycle
transition (target `ACTIVE` in `PATCH /api/rentals/{id}/lifecycles` returns 400); the only path to
`ACTIVE` is the signing flow (FR-03).

**Superseded by `feature/new-signing-flow` (master PR #58):** that change reworked the rental
creation flow (skip the DRAFT screen, create directly into `AWAITING_SIGNATURE`) and, as part of
it, already deleted `rental-step3.component.ts` and `rental-activate-button.component.ts` — the UI
this slice originally set out to remove. This slice was rebased on top of that state: only the
leftover dead code in the shared store survived, since the UI callers were gone but the store
method/state/labels behind them were not cleaned up.

## 2. Impacted Components (removals)

* **`core/state/rental.store.ts`:** remove `activateRental()` (lifecycle target `ACTIVE`), the
  `isActivating` computed, its `_state` initializer, and its `reset()` entry.
* **`core/state/rental.state.ts`:** remove the `isActivating` field from `RentalState`.
* **`shared/constant/labels.ts`:** remove now-unused `StartRental`, `RentalStarted`,
  `RentalStartError` (grep-confirmed unused elsewhere).
* **Search-and-verify:** `grep -r "activateRental\|isActivating\|StartRental"` across `projects/`
  must come back empty (excluding generated client union types, which legitimately still list
  `ACTIVE` as a lifecycle enum member).

## 3. Non-Functional Decisions

* No behavior replacement is added here — FR-03 already ships the signing path; this is a pure
  removal slice, so the diff must stay minimal and mechanical.
* The generated client is not touched by this slice.
* No tests (MVP rule); lint + operator dev build must pass.
