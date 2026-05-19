# Task 002: Add `isBalanceSufficient` Signal to `RentalStore`

> **Applied Skill:** `angular-signals` — extending existing `signal`-based store with a new
> `computed()` that satisfies `RentalStoreContract`.

## 1. Objective

Add `readonly isBalanceSufficient` as a `computed()` to `RentalStore` so that the class satisfies
the `RentalStoreContract` interface defined in Task 001. The check is a simple positive-balance
guard: `balance.available.amount >= 0`.

**Depends on:** Task 001 (token interface must exist before `RentalStore` can satisfy it).
**Note:** Apply after FR-06 Task 002 has been applied — the `_state` type will already be
`RentalDetailState` at that point. This task adds one additional computed, independent of that
change.

## 2. Files to Modify / Create

* **File Path:** `projects/shared/src/core/state/rental.store.ts`
* **Action:** Modify Existing File

---

## 3. Code Implementation

### Change 1 — Add `isBalanceSufficient` computed signal

**Location:** Add immediately after the existing `readonly customerBalance = computed(...)` line.

**Add:**

```typescript
  readonly isBalanceSufficient = computed(
    () => (this.customerFinanceStore.balance()?.available.amount ?? 0) >= 0,
  );
```

---

**Key implementation notes:**

- `customerFinanceStore` is already injected in `RentalStore` — no new injection needed.
- `balance()` returns `CustomerBalance | null` where `CustomerBalance.available` is of type
  `Money` (`{ amount: number; currency: string }`). The null-safe `?.available.amount ?? 0`
  defaults to `0` (not sufficient) when balance has not yet loaded.
- This is deliberately a **raw balance check** (not cost-adjusted). For the detail page,
  the FR defines the criterion as `available.amount > 0` (see FR-07 Scenarios 2 & 3). The
  cost-adjusted sufficiency check used for the create-flow "can proceed" gate lives in
  `RentalValidationStore.isBalanceSufficient` and is unchanged.
- `RentalStore` now satisfies `RentalStoreContract` — TypeScript will enforce this at the
  provider registration sites (Tasks 004 and 005) when `useExisting: RentalStore` is typed
  against the token.

---

## 4. Validation Steps

skip
