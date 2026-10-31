# Task 006: `PointMoneyRefreshFacade` ("point money changed" signal, host-scoped)

> **Applied Skill:** `angular-signals` - a private writable `signal()` exposed read-only via `asReadonly()`; consumers react to `revision` changes. `angular-di` - feature-scoped `@Injectable()` (no `providedIn`), provided next to `PointCashStore` on the detail host so every tab shares one instance. `angular-data-flow-orchestrator` - facade coordinates stores without owning data.

## 1. Objective

Create the in-process notification used after any money change on a point:

* `notifyChanged()` — calls `PointCashStore.refresh()` (header pills + Cash tab cards) and increments `revision`.
* `revision` — monotonically increasing counter (starts at 0). Tab-scoped consumers (`PointMovementsStore` on the Operations tab in Task 011, the Cash tab in FR-03 and `BankTransferHistoryStore` in FR-04) reload when it changes.

FR-04 (cancellation) and FR-05 (transfer dialog callers) are the producers; FR-02 only provides and consumes it.

## 2. File to Modify / Create

* **File Path:** `projects/shared/src/core/state/point-money-refresh.facade.ts`
* **Action:** Create New File

* **File Path:** `projects/shared/src/public-api.ts`
* **Action:** Modify Existing File

## 3. Code Implementation

**Imports Required:** (contained in the snippet below)

**Code to Add/Replace:**

* **Location:** Whole content of NEW file `projects/shared/src/core/state/point-money-refresh.facade.ts`
* **Snippet:**

```typescript
import { inject, Injectable, signal } from '@angular/core';
import { PointCashStore } from './point-cash.store';

@Injectable()
export class PointMoneyRefreshFacade {
  private readonly cash = inject(PointCashStore);

  private readonly _revision = signal(0);

  readonly revision = this._revision.asReadonly();

  notifyChanged(): void {
    this.cash.refresh();
    this._revision.update((revision) => revision + 1);
  }
}
```

* **Location:** `projects/shared/src/public-api.ts` — directly below the line `export * from './core/state/point-movements.store';` (added in Task 005)
* **Snippet:**

```typescript
export * from './core/state/point-money-refresh.facade';
```

## 4. Validation Steps

Execute the following commands to ensure this task was successful. Do NOT run the full application server.

```bash
npx prettier --write projects/shared/src/core/state/point-money-refresh.facade.ts projects/shared/src/public-api.ts
npx ng build admin --configuration development
npx ng lint shared
```
