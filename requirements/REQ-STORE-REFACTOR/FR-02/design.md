# System Design: FR-02 — Encapsulate `RentalStore` State Mutations

## 1. Architectural Overview

`RentalStore` (in `projects/shared/src/core/state/`) is the single signal-based store shared by
every component in the operator rental flow. Its raw state-patch method is currently declared at
public visibility, which means any injecting component could bypass the named mutation methods and
write arbitrary keys directly into the state signal. This FR closes that gap purely through access
modifier changes and a single private extraction — no logic, no field shapes, and no observable
behavior changes.

The refactor is self-contained inside one file (`rental.store.ts`). No external component, service,
mapper, or generated API type changes. Because every call to `patchState` already originates from
within the store (confirmed by codebase-wide grep — zero external callers exist today), making the
method `private` is a zero-risk, fully behavior-preserving change. The one structural addition is a
private `applyDetail` method that wraps the detail-load `patchState` call at line 270, giving the
detail-hydration path its own named entry point and making the two-step sequence
(`applyDetail` + `setCustomer`) easy to locate and reason about.

---

## 2. Impacted Components

* **`RentalStore` (shared/core/state/rental.store.ts):** Only component impacted. Two access
  modifier / structural changes:
  1. `patchState(partial)` is re-declared `private`. Its signature and body are unchanged.
  2. A new `private applyDetail(state: Partial<RentalDetailState>): void` method is introduced.
     Its body calls `patchState(state)`. The `loadDetail` subscribe callback is updated to call
     `applyDetail(state)` instead of `patchState(state)` directly.
  All other public methods (`setCustomer`, `setEquipmentItems`, `addEquipmentItem`,
  `removeEquipmentItem`, `setDurationMinutes`, `setDiscountPercent`, `setSpecialPrice`,
  `setSpecialPriceEnabled`, `setBrokenEquipmentEntries`, `reset`, `save`, `activateRental`,
  `returnEquipment`, `cancelRental`, `loadDetail`) remain public and their signatures are unchanged.

No new components, services, or data stores are required.

---

## 3. Abstract Data Schema Changes

No changes to any persisted or in-memory data schema. The `RentalDetailState` shape, all signal
fields, and all computed signals remain identical before and after this refactor.

---

## 4. Component Contracts & Payloads

No inter-component contracts change. `RentalStore`'s public API surface (the set of public methods
and readonly signals consumed by operator components) is unchanged. Making `patchState` private does
not alter any exported symbol because `patchState` was never part of any documented public API; it
was a leaking implementation detail.

* **Interaction: `RentalStore` (internal, `loadDetail` path)**
  * **Protocol:** In-process method call (signal mutation)
  * **Payload Changes:** None. The `Partial<RentalDetailState>` that was previously passed directly
    to `patchState(state)` at the subscribe site is now passed to `private applyDetail(state)`,
    which delegates to `patchState(state)`. The data flowing through is identical.

---

## 5. Updated Interaction Sequence

The only sequence that changes structurally is the `loadDetail` happy path. All other call sequences
are unchanged in observable behavior.

**Happy path — loadDetail (after refactor):**

1. A component calls `RentalStore.loadDetail(id)`.
2. `loadDetail` calls `private patchState({ isLoading: true })`.
3. `RentalsService.getRentalById(id)` emits the `RentalResponse`.
4. `BatchRentalPropertyStore.fetch$({ equipmentIds, customerId })` emits `{ customer, equipmentItems }`.
5. `RentalDashboardMapper.toDetailState(rental, customer, equipmentItems)` produces a
   `Partial<RentalDetailState>` value (unchanged).
6. The subscribe callback calls `RentalStore.private applyDetail(state)`.
7. `applyDetail` calls `private patchState(state)` — identical signal mutation to current code.
8. `applyDetail` returns; the subscribe callback calls `setCustomer(state.customer ?? null)`.
9. `setCustomer` calls `private patchState({ customer })` and optionally triggers
   `CustomerFinanceStore.loadById(customer.id)`.
10. `finalize` fires `private patchState({ isLoading: false })`.

**Unhappy path — loadDetail with error (unchanged behavior):**

1. Steps 1–4 as above.
2. `catchError` fires: `loadError` signal is set to `true`; `EMPTY` is returned to terminate the
   stream.
3. `finalize` fires `private patchState({ isLoading: false })`.
4. Components react to `loadError()` signal being `true`.

**Ordering constraint documentation — `setDiscountPercent` / `setSpecialPrice`:**

The implicit ordering rule that already exists (lines 136–159) must be captured in a co-located
test or inline documentation block:

- `setDiscountPercent(percent)` is a no-op when `specialPriceEnabled` is `true`. Callers that
  invoke it while `specialPriceEnabled` is `true` silently lose the write.
- `setSpecialPrice(price)` is a no-op when `specialPriceEnabled` is `false`. The required
  call order is: `setSpecialPriceEnabled(true)` first, then `setSpecialPrice(price)`.
- A test (or, optionally, a runtime guard that throws) must document this contract so future
  developers cannot misuse the methods silently.

---

## 6. Non-Functional Architecture Decisions

* **Security & Auth:** No change. This FR touches no HTTP boundary, no authentication token, and no
  PII-handling path. The same cross-boundary trust model (operator component → store → generated
  service → backend REST) is unchanged.

* **Scale & Performance:** No change. Signal mutation via `_state.update()` is synchronous and
  O(1). Wrapping the call in a private method adds zero overhead. No caching, queuing, or
  concurrency posture changes.

* **Compiler enforcement:** Making `patchState` private produces a compile-time error if any code
  outside `rental.store.ts` references it. The existing `tsc` step in the CI quality gate
  (`build-and-deploy.yml`) enforces this automatically — no additional tooling is required.

* **Test coverage:** The ordering coupling in `setDiscountPercent` / `setSpecialPrice` must be
  expressed as at least one behavior-verification test (`*.spec.ts` co-located with the store).
  All other existing tests must continue to pass without modification, as no public observable
  behavior changes.
