# Implementation Checklist: FR-05 - Remove Direct DRAFT→ACTIVE Activation from UI

Originally implemented on `feature/agreement-slice-5`, ahead of `rental-step3.component.ts` /
`rental-activate-button.component.ts` being deleted by the unrelated `feature/new-signing-flow`
rework merged to master (PR #58). Rebased as `feature/agreement-slice-5-cleanup` off current
master: the UI removal was already superseded, so only the leftover store/state/labels dead code
still needed removing.

- [x] `rental.store.ts`: removed `activateRental()` and the `isActivating` computed, its `_state`
  initializer, and its `reset()` entry.
- [x] `rental.state.ts`: removed the `isActivating` field.
- [x] `labels.ts`: removed `StartRental`, `RentalStarted`, `RentalStartError` (grep-confirmed
  unused elsewhere).

**Verification:** `grep -rn "activateRental|isActivating|RentalActivateButton|StartRental|
RentalStarted|RentalStartError" projects/ --include=*.ts` (excluding generated) returns nothing;
shared + operator lint pass; operator dev build passes. The generated lifecycle enum still lists
`ACTIVE` (correct — it remains a valid server-side status), but no UI path sends target `ACTIVE`.
