# Task 004: RunningShiftStore (feature-scoped)

> **Applied Skill:** `angular-signals` - private state signal, `computed` read API. `angular-di` - `@Injectable()` WITHOUT `providedIn` (provided by the consuming tab's `providers: []`, so admin tab and later operator screens each get their own instance). CLAUDE.md - UI/load state lives in the store. AGENTS.md API Error Handling - `ApiErrorParser.parse` + `ErrorMessageResolver.resolve` + `NotificationService.error`, never a raw `HttpErrorResponse`.

## 1. Objective

Create the store holding the point's running shift: `{ pointSlug, shift, state }`, API `load(pointSlug | null)`
(`null` = operator, the interceptor adds the header) and `refresh()` (re-fetch without flashing
the `loading` state). The service returns `null` for "no running shift" (state `none`); any error is
notified once and becomes state `failed`.

Requires task-001 and task-003.

## 2. File to Modify / Create

* **File Path:** `projects/shared/src/core/state/running-shift.store.ts` - **Action:** Create New File
* **File Path:** `projects/shared/src/public-api.ts` - **Action:** Modify Existing File

## 3. Code Implementation

* **Location:** New file `projects/shared/src/core/state/running-shift.store.ts` - full content.
* **Snippet:**

```typescript
import { computed, DestroyRef, inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subscription } from 'rxjs';
import { PointFinanceService } from '../api/point-finance';
import { ApiErrorParser } from '../errors/api-error.parser';
import { ErrorMessageResolver } from '../errors/error-message.resolver';
import { NotificationService } from '../errors/notification.service';
import type { RunningShift, RunningShiftState } from '../models';

interface RunningShiftSnapshot {
  readonly pointSlug: string | null;
  readonly shift: RunningShift | null;
  readonly state: RunningShiftState;
}

@Injectable()
export class RunningShiftStore {
  private readonly finance = inject(PointFinanceService);
  private readonly notifications = inject(NotificationService);
  private readonly resolver = inject(ErrorMessageResolver);
  private readonly destroyRef = inject(DestroyRef);

  private readonly _snapshot = signal<RunningShiftSnapshot>({
    pointSlug: null,
    shift: null,
    state: 'loading',
  });

  private target: { readonly pointSlug: string | null } | null = null;
  private subscription: Subscription | null = null;

  readonly pointSlug = computed(() => this._snapshot().pointSlug);
  readonly shift = computed(() => this._snapshot().shift);
  readonly state = computed(() => this._snapshot().state);
  readonly shiftId = computed(() => this._snapshot().shift?.shiftId ?? null);

  load(pointSlug: string | null): void {
    this.target = { pointSlug };
    this._snapshot.set({ pointSlug, shift: null, state: 'loading' });
    this.fetch(pointSlug);
  }

  refresh(): void {
    if (this.target) this.fetch(this.target.pointSlug);
  }

  private fetch(pointSlug: string | null): void {
    this.subscription?.unsubscribe();
    this.subscription = this.finance
      .getCurrentShift(pointSlug)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (shift) =>
          this._snapshot.set({ pointSlug, shift, state: shift ? 'running' : 'none' }),
        error: (err: unknown) => {
          this.notifications.error(this.resolver.resolve(ApiErrorParser.parse(err)));
          this._snapshot.set({ pointSlug, shift: null, state: 'failed' });
        },
      });
  }
}
```

* **Location:** `projects/shared/src/public-api.ts` - add one line directly below `export * from './core/state/point-results.store';`
* **Snippet:**

```typescript
export * from './core/state/running-shift.store';
```

## 4. Validation Steps

Execute the following commands to ensure this task was successful. Do NOT run the full application server.

```bash
npx prettier --write projects/shared/src/core/state/running-shift.store.ts projects/shared/src/public-api.ts
npx ng build admin --configuration development
npx ng build operator --configuration development
npx ng lint shared
```
