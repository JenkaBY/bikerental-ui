# Task 011: PointMoneyMoveStore (dialog-scoped signal store)

> **Applied Skill:** CLAUDE.md "Signal Store pattern" and project memory "UI state in stores" - private `signal`s, public `computed`s, derived values (`remaining`) in the store, provided in the dialog component's `providers: []` (task 012). `angular-signals`, `angular-di`, `angular-http` (the store owns the `IdempotentAttempt`, so key handling stays out of the component).

## 1. Objective

State and command logic of the money-move dialog:

* `available` (re-settable when the backend reports the current position), the typed `amount`, and `remaining` = `available - amount` while the amount is valid (`> 0` and `<= available`), else `available`;
* `execute(amount)` - the deferred command passed to `FinanceConfirmDialogComponent`: asks `IdempotentAttempt` for the key, calls `PointFinanceService.recordCollection(write, pointSlug)`, maps to `PointMoneyMoveOutcome`, and settles the attempt as definitive on success or by `IdempotentAttempt.outcomeOf(error)` on failure. The error is re-thrown unchanged.

Task 019 (blocked) extends `execute` with the settlement branch.

Requires tasks 003, 004, 010.

## 2. File to Modify / Create

* **File Path:** `projects/admin/src/app/points/point-money-move.store.ts` - **Action:** Create New File

## 3. Code Implementation

**Whole content:**

```typescript
import { computed, inject, Injectable, signal } from '@angular/core';
import { catchError, map, Observable, tap, throwError } from 'rxjs';
import {
  IdempotentAttempt,
  makeMoney,
  type Money,
  PointFinanceMapper,
  PointFinanceService,
} from '@bikerental/shared';
import type { PointMoneyMoveOutcome } from './point-money-move.model';

@Injectable()
export class PointMoneyMoveStore {
  private readonly finance = inject(PointFinanceService);
  private readonly attempt = new IdempotentAttempt();
  private readonly _available = signal<Money>(makeMoney(0));
  private readonly _amount = signal<number | null>(null);
  private pointSlug = '';

  readonly available = computed(() => this._available());
  readonly remaining = computed<Money>(() => {
    const available = this._available();
    const amount = this._amount();
    const valid = amount !== null && amount > 0 && amount <= available.amount;
    return valid
      ? PointFinanceMapper.sum(available, makeMoney(-amount, available.currency))
      : available;
  });

  init(pointSlug: string, available: Money): void {
    this.pointSlug = pointSlug;
    this._available.set(available);
  }

  setAmount(amount: number | null): void {
    this._amount.set(amount);
  }

  applyAvailable(available: Money): void {
    this._available.set(available);
  }

  execute(amount: number): Observable<PointMoneyMoveOutcome> {
    const idempotencyKey = this.attempt.keyFor({ amount });
    return this.finance.recordCollection({ idempotencyKey, amount }, this.pointSlug).pipe(
      tap(() => this.attempt.settle('definitive')),
      catchError((err: unknown) => {
        this.attempt.settle(IdempotentAttempt.outcomeOf(err));
        return throwError(() => err);
      }),
      map((collection) => ({
        amount: collection.amount,
        newPosition: collection.cashPosition,
      })),
    );
  }
}
```

## 4. Validation Steps

Execute the following commands to ensure this task was successful. Do NOT run the full application server.

```bash
npx prettier --write projects/admin/src/app/points/point-money-move.store.ts
npx ng build admin --configuration development
npx ng lint admin
```
