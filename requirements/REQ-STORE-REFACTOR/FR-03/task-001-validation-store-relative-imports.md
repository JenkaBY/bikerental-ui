# Task 001: Switch `RentalValidationStore` to Relative Sibling Imports

> **Applied Skill:** `angular-di`, `typescript-es2022` - A library's internal modules must import
> siblings by relative module path, never through the library's own public barrel
> (`@bikerental/shared`). The self-referential barrel edge risks cyclic module initialisation where
> symbols evaluate as `undefined` at construction time depending on load order.

## 1. Objective

Remove the self-import inside the shared library: `RentalValidationStore` currently pulls
`CustomerFinanceStore`, `RentalCostCalculationStore`, and `RentalStore` from `@bikerental/shared`
(the library's own public barrel). Re-point those three imports at their relative sibling modules in
the same `state/` directory. (`makeMoney` already imports relatively from `../mappers` and stays as
is.) This satisfies FR-03 Acceptance Scenario 4 (no barrel self-import).

## 2. File to Modify / Create

* **File Path:** `projects/shared/src/core/state/rental-validation.store.ts`
* **Action:** Modify Existing File

## 3. Code Implementation

**Imports Required:**

No new imports are added; one barrel import line is replaced by three relative import lines.

**Code to Add/Replace:**

* **Location:** The top-of-file import block, lines 1-3. The first two lines (`@angular/core`
  and `../mappers`) are unchanged. Replace **only** the third line — the `@bikerental/shared`
  barrel import.

* **Old snippet (delete this exact line — line 3):**

```typescript
import { CustomerFinanceStore, RentalCostCalculationStore, RentalStore } from '@bikerental/shared';
```

* **New snippet (paste these three lines in its place):**

```typescript
import { CustomerFinanceStore } from './customer-finance.store';
import { RentalCostCalculationStore } from './rental-cost-calculation.store';
import { RentalStore } from './rental.store';
```

* **Resulting import block (lines 1-5) for verification:**

```typescript
import { computed, inject, Injectable } from '@angular/core';
import { makeMoney } from '../mappers';
import { CustomerFinanceStore } from './customer-finance.store';
import { RentalCostCalculationStore } from './rental-cost-calculation.store';
import { RentalStore } from './rental.store';
```

Do **not** touch any other line in the file. The `@Injectable()` decorator, the three `inject(...)`
fields, and all `computed(...)` signals stay exactly as they are.

## 4. Validation Steps

Execute the following commands to ensure this task was successful. Do NOT run the full application
server. Do NOT create or modify any `*.spec.ts` file (MVP rule — no tests).

```bash
npm run build
npm run fix
```

`npm run build` must compile with no module-resolution or type errors.
`npm run fix` (ESLint + Prettier) must report no errors on `rental-validation.store.ts`.
