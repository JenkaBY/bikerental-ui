# Task 003: Remove Dead `customerBalance` Field from `RentalDetailState`

> **Applied Skill:** `typescript-es2022`, `angular-signals` - Single ownership of state. The
> in-memory `customerBalance` copy on `RentalDetailState` is never written by the mapper and never
> read; the authoritative balance lives in `CustomerFinanceStore.balance`, which
> `RentalStore.customerBalance` reads through directly. Removing the dead field eliminates a
> stale-state hazard.

## 1. Objective

Delete the optional `customerBalance?: Money` attribute from the `RentalDetailState` interface so the
customer balance has a single owner (`CustomerFinanceStore.balance`). This satisfies the FR-03
clean-up rule: `RentalDetailState.customerBalance` should be removed.

## 2. Pre-flight Verification (MANDATORY — run before editing)

Confirm the field is truly dead. Run this grep and read each hit:

```bash
npx rg -n "\.customerBalance" projects
npx rg -n "customerBalance:" projects/shared/src/core/mappers
```

Expected facts (already verified during decomposition — re-confirm they still hold):

* `projects/shared/src/core/state/rental.store.ts:57` —
  `readonly customerBalance = computed(() => this.customerFinanceStore.balance());`
  This is the **signal**, reading the finance store directly. It does NOT read
  `this._state().customerBalance`. Leave it untouched.
* `projects/shared/src/core/mappers/rental-dashboard.mapper.ts` — produces the `RentalDetailState`
  in `toDetailState(...)` and **never** assigns a `customerBalance:` key. (The grep for
  `customerBalance:` in the mappers directory must return zero hits.)
* `projects/operator/src/app/rental-create/step2/rental-customer-panel.component.ts:27,42` — calls
  `store.customerBalance()` (the signal via `RENTAL_STORE_TOKEN`), not the state field. Leave it
  untouched.
* `rental-store.token.ts:6` — `readonly customerBalance: Signal<CustomerBalance | null>;` is the
  **contract signal**, unrelated to the `RentalDetailState` shape. Leave it untouched.

**Decision rule:** If the grep reveals ANY production code (non-`*.spec.ts`, non-`requirements/`)
that reads or writes `state.customerBalance` / `_state().customerBalance` /
assigns `customerBalance` inside `RentalDashboardMapper.toDetailState`, do **not** blindly delete —
instead first migrate that reader to `customerFinanceStore.balance()` (the signal) in the same task,
then remove the field. If the grep confirms only the four signal/contract/mapper-non-writer hits
above, proceed straight to Change 1.

## 3. Code Implementation

### Change 1 — Remove the dead attribute from the interface

* **File Path:** `projects/shared/src/core/models/rental-dashboard.model.ts`
* **Action:** Modify Existing File
* **Location:** Inside the `RentalDetailState` interface (currently lines 36-52). Delete the
  `customerBalance?: Money;` line (currently line 39), which sits between `customerId: string;` and
  `startedAt: Date | null;`.

* **Old snippet (delete the middle line — line 39):**

```typescript
export interface RentalDetailState extends RentalState {
  status: string;
  customerId: string;
  customerBalance?: Money;
  startedAt: Date | null;
```

* **New snippet (replace with):**

```typescript
export interface RentalDetailState extends RentalState {
  status: string;
  customerId: string;
  startedAt: Date | null;
```

### Change 2 — Verify the `Money` import is still used

The file still imports `Money` on line 1 (`import type { Money } from './transaction.model';`).
After removing line 39, `Money` is **still** referenced by `estimatedCost?: Money;`,
`finalCost?: Money;`, and `debtAmount?: Money;`, so the import stays. Do **not** remove it. (If a
build "unused import" error ever appears, re-confirm those three fields still exist before touching
the import.)

## 4. Validation Steps

Execute the following commands to ensure this task was successful. Do NOT run the full application
server. Do NOT create or modify any `*.spec.ts` file (MVP rule — no tests).

```bash
npm run build
npm run fix
```

* `npm run build` must compile with no errors. A successful build proves no production code depended
  on the removed `RentalDetailState.customerBalance` field.
* `npm run fix` must report no lint/format errors on `rental-dashboard.model.ts`.
* Re-run `npx rg -n "\.customerBalance" projects` — the only remaining production hits must be the
  `RentalStore` signal (line 57), the token contract, and the customer-panel template; none may
  reference the now-deleted state field.
