# Task 004: `OperatorCollectionStore` (form state, idempotent command)

> **Applied Skill:** `angular-signals` - private writable signals, public `computed`. `angular-di` - plain `@Injectable()` provided by the page component (`providers: []`), never root. CLAUDE.md "UI state in stores" + memory rule - available/remaining, `submitting`, the server amount error and the idempotent command live here, not in component signals. Mirrors `projects/admin/src/app/points/point-money-move.store.ts` (do NOT import admin code); the difference is `recordCollection(write, null)` (operator scope header comes from the interceptor).

## 1. Objective

State: `available`, `ready`, `submitting`, `amountError`, derived `remaining` (available minus amount while the amount is valid, else available) and `handIn` (the valid amount as `Money`, else `null`).
Methods: `init(available)`, `setAmount(amount)` (also clears the server error), `refuse(message, position)` (insufficient cash: rebinds `available` when the backend reported a position, sets the server error), `execute(amount)` (key from `IdempotentAttempt`, settled `definitive` on success or by `IdempotentAttempt.outcomeOf(err)`; `submitting` true while in flight).

## 2. File to Modify / Create

* **File Path:** `projects/operator/src/app/cash/operator-collection.store.ts` - **Action:** Create New File

## 3. Code Implementation

* **Location:** new file, whole content:

```typescript
import { computed, inject, Injectable, signal } from '@angular/core';
import { catchError, defer, finalize, Observable, tap, throwError } from 'rxjs';
import {
  type CashCollection,
  IdempotentAttempt,
  makeMoney,
  type Money,
  PointFinanceMapper,
  PointFinanceService,
} from '@bikerental/shared';

@Injectable()
export class OperatorCollectionStore {
  private readonly finance = inject(PointFinanceService);
  private readonly attempt = new IdempotentAttempt();
  private readonly _available = signal<Money>(makeMoney(0));
  private readonly _amount = signal<number | null>(null);
  private readonly _ready = signal(false);
  private readonly _submitting = signal(false);
  private readonly _amountError = signal<string | null>(null);

  readonly available = computed(() => this._available());
  readonly ready = computed(() => this._ready());
  readonly submitting = computed(() => this._submitting());
  readonly amountError = computed(() => this._amountError());
  readonly handIn = computed<Money | null>(() => {
    const available = this._available();
    const amount = this._amount();
    const valid = amount !== null && amount > 0 && amount <= available.amount;
    return valid ? makeMoney(amount, available.currency) : null;
  });
  readonly remaining = computed<Money>(() => {
    const available = this._available();
    const handIn = this.handIn();
    return handIn
      ? PointFinanceMapper.sum(available, makeMoney(-handIn.amount, available.currency))
      : available;
  });

  init(available: Money): void {
    this._available.set(available);
    this._ready.set(true);
  }

  setAmount(amount: number | null): void {
    this._amount.set(amount);
    this._amountError.set(null);
  }

  refuse(message: string, position: Money | null): void {
    if (position) this._available.set(position);
    this._amountError.set(message);
  }

  execute(amount: number): Observable<CashCollection> {
    return defer(() => {
      this._submitting.set(true);
      const idempotencyKey = this.attempt.keyFor({ amount });
      return this.finance.recordCollection({ idempotencyKey, amount }, null).pipe(
        tap(() => this.attempt.settle('definitive')),
        catchError((err: unknown) => {
          this.attempt.settle(IdempotentAttempt.outcomeOf(err));
          return throwError(() => err);
        }),
        finalize(() => this._submitting.set(false)),
      );
    });
  }
}
```

## 4. Validation Steps

Execute the following commands to ensure this task was successful. Do NOT run the full application server.

```bash
npx prettier --write projects/operator/src/app/cash/operator-collection.store.ts
npx ng build operator --configuration development
npx ng lint operator
```
