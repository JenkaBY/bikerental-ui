# Task 001: `FinanceReceipt` model and transient `FinanceReceiptStore` (shared)

> **Applied Skill:** `angular-di` - root-provided service. `typescript-es2022` - discriminated union, `import type`. AGENTS.md "Shared Import Convention" - inside `shared` use relative paths, export new symbols from `projects/shared/src/public-api.ts`. The store is memory-only and deliberately not signal-based: it is read by a route guard and consumed once, never rendered reactively. FR-08 later adds a `SHIFT_CLOSURE` member to the union.

## 1. Objective

* New domain type `FinanceReceipt` (discriminated by `kind`; only `COLLECTION` now).
* New root store `FinanceReceiptStore` with `set(receipt)`, `take()` (returns and clears), `has()`, `clear()`.
* Export both from the shared public API.

## 2. File to Modify / Create

* **File Path:** `projects/shared/src/core/models/finance-receipt.model.ts` - **Action:** Create New File
* **File Path:** `projects/shared/src/core/models/index.ts` - **Action:** Modify Existing File
* **File Path:** `projects/shared/src/core/state/finance-receipt.store.ts` - **Action:** Create New File
* **File Path:** `projects/shared/src/public-api.ts` - **Action:** Modify Existing File

## 3. Code Implementation

**Step 1 - `finance-receipt.model.ts`, whole content:**

```typescript
import type { CashCollection } from './point-money-move.model';

export interface CollectionReceipt {
  readonly kind: 'COLLECTION';
  readonly pointName: string;
  readonly collection: CashCollection;
}

export type FinanceReceipt = CollectionReceipt;
```

**Step 2 - `models/index.ts`.** Add directly below the line `export * from './point-money-move.model';`:

```typescript
export * from './finance-receipt.model';
```

**Step 3 - `finance-receipt.store.ts`, whole content:**

```typescript
import { Injectable } from '@angular/core';
import type { FinanceReceipt } from '../models';

@Injectable({ providedIn: 'root' })
export class FinanceReceiptStore {
  private receipt: FinanceReceipt | null = null;

  set(receipt: FinanceReceipt): void {
    this.receipt = receipt;
  }

  take(): FinanceReceipt | null {
    const current = this.receipt;
    this.receipt = null;
    return current;
  }

  has(): boolean {
    return this.receipt !== null;
  }

  clear(): void {
    this.receipt = null;
  }
}
```

**Step 4 - `public-api.ts`.** Add directly below the line `export * from './core/state/running-shift.store';`:

```typescript
export * from './core/state/finance-receipt.store';
```

## 4. Validation Steps

Execute the following commands to ensure this task was successful. Do NOT run the full application server.

```bash
npx prettier --write projects/shared/src/core/models/finance-receipt.model.ts projects/shared/src/core/state/finance-receipt.store.ts
npx ng build operator --configuration development
npx ng lint shared
```
