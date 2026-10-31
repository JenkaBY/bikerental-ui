# Task 006: PointPositionsStore (viewed point's positions, refresh, patch from commands)

> **Applied Skill:** `angular-signals` - private signals, `computed()` views. CLAUDE.md "Signal Store pattern" - feature store provided on the detail host so every tab shares one instance. `angular-rxjs-streams` - latest request wins, `takeUntilDestroyed`. Design FR-02 §2 - backed by the business-wide positions overview filtered to one slug ([GAP]: no single-point read); `applyPosition(kind, amount)` lets FR-05 patch the CASH position from a collection response even while positions are unavailable.

## 1. Objective

Create the host-scoped store behind the header pills (and later FR-03 cards / FR-05 dialogs):
`load(slug)`, `refresh()`, `applyPosition(kind, amount)`, derived `cash`, `cardTerminal`, `bank`
(`null` = unknown -> em-dash). A successful fetch clears patches; a failed fetch clears the fetched
positions but keeps patches.

## 2. File to Modify / Create

* **File Path:** `projects/shared/src/core/state/point-positions.store.ts` - **Action:** Create New File
* **File Path:** `projects/shared/src/public-api.ts` - **Action:** Modify Existing File

## 3. Code Implementation

* **Location:** New file `projects/shared/src/core/state/point-positions.store.ts` - full content.
* **Snippet:**

```typescript
import { computed, DestroyRef, inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize, map, Subscription } from 'rxjs';
import { PointFinanceService } from '../api/point-finance';
import type { Money, PointPositionKind, PointPositions } from '../models';

@Injectable()
export class PointPositionsStore {
  private readonly finance = inject(PointFinanceService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly _slug = signal<string | null>(null);
  private readonly _positions = signal<PointPositions | null>(null);
  private readonly _patches = signal<Partial<Record<PointPositionKind, Money>>>({});
  private readonly _loading = signal(false);
  private readonly _failed = signal(false);

  private subscription: Subscription | null = null;

  readonly slug = computed(() => this._slug());
  readonly positions = computed(() => this._positions());
  readonly loading = computed(() => this._loading());
  readonly failed = computed(() => this._failed());
  readonly cash = computed(() => this.amountOf('CASH'));
  readonly cardTerminal = computed(() => this.amountOf('CARD_TERMINAL'));
  readonly bank = computed(() => this.amountOf('BANK'));

  load(slug: string): void {
    this._slug.set(slug);
    this._positions.set(null);
    this._patches.set({});
    this.fetch(slug);
  }

  refresh(): void {
    const slug = this._slug();
    if (slug) this.fetch(slug);
  }

  applyPosition(kind: PointPositionKind, amount: Money): void {
    this._patches.update((patches) => ({ ...patches, [kind]: amount }));
  }

  private fetch(slug: string): void {
    this.subscription?.unsubscribe();
    this._loading.set(true);
    this._failed.set(false);
    this.subscription = this.finance
      .getPositions()
      .pipe(
        map((overview) => overview.points.find((p) => p.pointSlug === slug) ?? null),
        finalize(() => this._loading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (positions) => {
          this._positions.set(positions);
          this._patches.set({});
        },
        error: () => {
          this._positions.set(null);
          this._failed.set(true);
        },
      });
  }

  private amountOf(kind: PointPositionKind): Money | null {
    return this._patches()[kind] ?? this._positions()?.amounts[kind] ?? null;
  }
}
```

* **Location:** `projects/shared/src/public-api.ts` - add one line directly below `export * from './core/state/point-list-view.store';` (FR-01 task-006).
* **Snippet:**

```typescript
export * from './core/state/point-positions.store';
```

## 4. Validation Steps

Execute the following commands to ensure this task was successful. Do NOT run the full application server.

```bash
npx prettier --write projects/shared/src/core/state/point-positions.store.ts projects/shared/src/public-api.ts
npx ng build admin --configuration development
npx ng build operator --configuration development
npx ng lint shared
```
