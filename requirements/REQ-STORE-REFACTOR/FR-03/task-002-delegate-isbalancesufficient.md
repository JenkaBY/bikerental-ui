# Task 002: Delegate `RentalStore.isBalanceSufficient` to `RentalValidationStore` (Lazy + Optional)

> **Applied Skill:** `angular-di`, `angular-signals` - Resolve a circular dependency by injecting the
> `Injector` eagerly and resolving the dependent store **lazily inside the `computed`** via
> `runInInjectionContext` + `inject(..., { optional: true })`. Eager field injection of
> `RentalValidationStore` here would close a runtime DI cycle (`RentalValidationStore` already
> injects `RentalStore` directly, and transitively via `RentalCostCalculationStore` which also
> injects `RentalStore`) and would throw `NullInjectorError` on the rental-detail screen, which
> provides `RentalStore` but not `RentalValidationStore`.

## 1. Objective

Make `RentalStore.isBalanceSufficient` the single read surface for projected-balance sufficiency by
delegating to `RentalValidationStore.isBalanceSufficient()` when that store exists in the current
injection scope, and falling back to the legacy `available >= 0` answer when it does not (the
detail screen). This satisfies FR-03 Acceptance Scenarios 1, 2, and 3 (panel and footer agree;
only one place computes projected sufficiency).

## 2. File to Modify / Create

* **File Path:** `projects/shared/src/core/state/rental.store.ts`
* **Action:** Modify Existing File

## 3. Code Implementation

### Change 1 — Extend the Angular core import

* **Location:** Line 1 (the `@angular/core` import).
* **Old snippet (line 1):**

```typescript
import { computed, DestroyRef, inject, Injectable, signal } from '@angular/core';
```

* **New snippet (replace line 1):**

```typescript
import {
  computed,
  DestroyRef,
  inject,
  Injectable,
  Injector,
  runInInjectionContext,
  signal,
} from '@angular/core';
```

### Change 2 — Add a relative import for the validation store

> Per Task 001's rule, a sibling store inside the library is imported by relative path, **not** via
> `@bikerental/shared`. Importing only the **type** keeps this an erased-at-runtime import so it
> introduces no eager module-graph edge.

* **Location:** Immediately after the existing import block (after the
  `import { TariffStore } from './tariff.store';` line, currently line 17). Add this new line.
* **New snippet (add):**

```typescript
import type { RentalValidationStore } from './rental-validation.store';
```

### Change 3 — Inject the `Injector` eagerly (the only new constructor-time dependency)

* **Location:** Inside the `RentalStore` class, in the `inject(...)` field block. Add this field
  directly **below** the existing `private readonly destroyRef = inject(DestroyRef);` line
  (currently line 26).
* **New snippet (add):**

```typescript
  private readonly injector = inject(Injector);
```

### Change 4 — Re-express `isBalanceSufficient` as a delegation with fallback

* **Location:** Replace the existing `isBalanceSufficient` computed (currently lines 58-60).
* **Old snippet (delete these exact lines — 58-60):**

```typescript
  readonly isBalanceSufficient = computed(
    () => (this.customerFinanceStore.balance()?.available.amount ?? 0) >= 0,
  );
```

* **New snippet (paste in its place):**

```typescript
  readonly isBalanceSufficient = computed(() => {
    const validationStore = runInInjectionContext(this.injector, () =>
      inject<RentalValidationStore | null>(
        RENTAL_VALIDATION_STORE_FOR_DELEGATION,
        { optional: true },
      ),
    );
    if (validationStore) {
      return validationStore.isBalanceSufficient();
    }
    return (this.customerFinanceStore.balance()?.available.amount ?? 0) >= 0;
  });
```

> **WHY THIS SHAPE — read before editing.** `inject()` cannot take a class symbol that is imported
> as a `type` only (the value would be erased). And it must run inside an injection context, which a
> `computed` callback is not — hence `runInInjectionContext(this.injector, ...)`. To resolve the
> concrete `RentalValidationStore` class as a runtime value **without** a static module-graph edge
> back into `rental-validation.store.ts`, we resolve it through the existing DI token instead. See
> Change 5: `RentalValidationStore` is already provided by class in the create flow, so we add a
> tiny alias token and have the create flow alias it to the same instance. This keeps Change 2's
> `import type` purely for the TypeScript signature and avoids any runtime cycle.

### Change 5 — Add the delegation alias token (avoids a runtime import cycle)

Resolving `RentalValidationStore` directly by class symbol would require a **value** import of
`rental-validation.store.ts` inside `rental.store.ts`, re-introducing the cyclic edge this FR
removes. Instead introduce a dedicated optional token.

* **Location:** Add this token declaration **above** the `@Injectable()` decorator of `RentalStore`
  (just below the import block).
* **New snippet (add):**

```typescript
export const RENTAL_VALIDATION_STORE_FOR_DELEGATION = new InjectionToken<{
  isBalanceSufficient: () => boolean;
}>('RentalValidationStoreForDelegation');
```

* **Location:** Extend the `@angular/core` import (Change 1) to also import `InjectionToken`. The
  final `@angular/core` import becomes:

```typescript
import {
  computed,
  DestroyRef,
  inject,
  Injectable,
  InjectionToken,
  Injector,
  runInInjectionContext,
  signal,
} from '@angular/core';
```

> With the token in place, Change 2's `import type { RentalValidationStore }` is no longer needed for
> the runtime path. Keep it **only** if you also annotate the resolved value with that type;
> otherwise delete Change 2 entirely and let the token's structural type
> (`{ isBalanceSufficient: () => boolean }`) drive the signature. **Preferred: delete Change 2** and
> simplify Change 4's `inject` call to:

```typescript
  readonly isBalanceSufficient = computed(() => {
    const validationStore = runInInjectionContext(this.injector, () =>
      inject(RENTAL_VALIDATION_STORE_FOR_DELEGATION, { optional: true }),
    );
    if (validationStore) {
      return validationStore.isBalanceSufficient();
    }
    return (this.customerFinanceStore.balance()?.available.amount ?? 0) >= 0;
  });
```

### Change 6 — Wire the token in the create flow only (NOT the detail flow)

The create flow provides `RentalValidationStore`; alias the new token to that same instance there so
the delegation resolves. The detail flow does **not** provide it, so the token resolves to `null`
and the fallback runs — exactly the required behaviour.

* **File Path:** `projects/operator/src/app/rental-create/rental-create.component.ts`
* **Action:** Modify Existing File
* **Location:** Extend the `@bikerental/shared` import to include the new token, then add one
  provider line to the existing `providers` array.

* **Old import (lines 2-10):**

```typescript
import {
  BatchRentalPropertyStore,
  CustomerFinanceStore,
  Labels,
  RENTAL_STORE_TOKEN,
  RentalCostCalculationStore,
  RentalStore,
  RentalValidationStore,
} from '@bikerental/shared';
```

* **New import (replace):**

```typescript
import {
  BatchRentalPropertyStore,
  CustomerFinanceStore,
  Labels,
  RENTAL_STORE_TOKEN,
  RENTAL_VALIDATION_STORE_FOR_DELEGATION,
  RentalCostCalculationStore,
  RentalStore,
  RentalValidationStore,
} from '@bikerental/shared';
```

* **Old providers array (lines 18-25):**

```typescript
  providers: [
    BatchRentalPropertyStore,
    CustomerFinanceStore,
    RentalCostCalculationStore,
    RentalStore,
    RentalValidationStore,
    { provide: RENTAL_STORE_TOKEN, useExisting: RentalStore },
  ],
```

* **New providers array (replace):**

```typescript
  providers: [
    BatchRentalPropertyStore,
    CustomerFinanceStore,
    RentalCostCalculationStore,
    RentalStore,
    RentalValidationStore,
    { provide: RENTAL_STORE_TOKEN, useExisting: RentalStore },
    { provide: RENTAL_VALIDATION_STORE_FOR_DELEGATION, useExisting: RentalValidationStore },
  ],
```

### Change 7 — Export the new token from the public barrel

* **File Path:** `projects/shared/src/public-api.ts`
* **Action:** Modify Existing File
* **Location:** Find the existing export that re-exports `rental.store` (or the `core/state` barrel
  that re-exports it). The new `RENTAL_VALIDATION_STORE_FOR_DELEGATION` token is declared in
  `rental.store.ts`, so any `export * from '.../rental.store'` line already covers it. **Verify
  with grep** that `RENTAL_VALIDATION_STORE_FOR_DELEGATION` is reachable from `@bikerental/shared`:

```bash
npx tsc --noEmit
```

If `rental-create.component.ts` reports the token as unresolved after build, add an explicit
re-export of the token in `projects/shared/src/public-api.ts` next to the existing rental-store
export.

## 4. Validation Steps

Execute the following commands to ensure this task was successful. Do NOT run the full application
server. Do NOT create or modify any `*.spec.ts` file (MVP rule — no tests).

```bash
npm run build
npm run fix
```

* `npm run build` must compile with no `NullInjectorError`-class type errors and no circular-import
  diagnostics.
* `npm run fix` must report no lint/format errors on `rental.store.ts` and
  `rental-create.component.ts`.
* Manual code-read check (Scenario 3): grep for the projected-balance arithmetic
  `available - cost`/`balance - cost` and confirm it exists in **exactly one** place
  (`rental-validation.store.ts`); `rental.store.ts` no longer computes projected sufficiency, it
  only delegates or falls back to `available >= 0`.
