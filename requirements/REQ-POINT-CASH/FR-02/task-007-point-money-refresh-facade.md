# Task 007: PointMoneyRefreshFacade ("point money changed" notifier)

> **Applied Skill:** `angular-signals` - a `revision` counter signal that tab-scoped stores react to. Existing facade pattern `core/state/rental-detail-refresh.facade.ts` (feature-scoped `@Injectable()`). Design FR-02 §2 - collections, settlements (FR-05) and shift closures (FR-08) call `notifyChanged()`; there is no cancellation trigger.

## 1. Objective

Create the host-scoped facade: `notifyChanged()` refreshes `PointPositionsStore` (header pills)
and bumps `revision`; mounted tabs (Operations here, FR-03/FR-04 later) reload when `revision`
changes. FR-02 itself has no caller of `notifyChanged()` yet.

## 2. File to Modify / Create

* **File Path:** `projects/shared/src/core/state/point-money-refresh.facade.ts` - **Action:** Create New File
* **File Path:** `projects/shared/src/public-api.ts` - **Action:** Modify Existing File

## 3. Code Implementation

* **Location:** New file `projects/shared/src/core/state/point-money-refresh.facade.ts` - full content.
* **Snippet:**

```typescript
import { computed, inject, Injectable, signal } from '@angular/core';
import { PointPositionsStore } from './point-positions.store';

@Injectable()
export class PointMoneyRefreshFacade {
  private readonly positions = inject(PointPositionsStore);

  private readonly _revision = signal(0);

  readonly revision = computed(() => this._revision());

  notifyChanged(): void {
    this.positions.refresh();
    this._revision.update((revision) => revision + 1);
  }
}
```

* **Location:** `projects/shared/src/public-api.ts` - add one line directly below `export * from './core/state/point-positions.store';`
* **Snippet:**

```typescript
export * from './core/state/point-money-refresh.facade';
```

## 4. Validation Steps

Execute the following commands to ensure this task was successful. Do NOT run the full application server.

```bash
npx prettier --write projects/shared/src/core/state/point-money-refresh.facade.ts projects/shared/src/public-api.ts
npx ng build admin --configuration development
npx ng build operator --configuration development
npx ng lint shared
```
