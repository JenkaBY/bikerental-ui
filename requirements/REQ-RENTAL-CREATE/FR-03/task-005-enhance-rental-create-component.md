# Task 005: Add `isLoading` to `RentalStore` and Wire It to `RentalCreateComponent`

> **Applied Skill:** `angular-signals`, `angular-component`, `angular-routing` — `RentalStore` owns all async loading state; `isLoading` lives there so any consumer can observe the load operation without duplicating state. `RentalCreateComponent` exposes it via a `protected` alias — the template reference is unchanged. `takeUntilDestroyed` prevents memory leaks.

## 1. Objective

This task has two tightly coupled changes:

**Part A — `RentalStore` (`shared` library):** Add a private `_isLoading` signal (default `false`) with a public `isLoading` computed, wire it through `loadRental()` (set `true` on entry; cleared via `finalize` on both success and error), and clear it in `reset()` for clean-slate resets.

**Part B — `RentalCreateComponent` (`operator` app):** Drop the local `isLoading = signal(false)` field and replace it with `protected readonly isLoading = this.store.isLoading` — a direct alias to the store's computed. Remove all `isLoading.set()` calls and the explicit `store.reset()` call (the store now handles its own reset in its `catchError`). Keep `tap(() => this.activeStep.set(1))` for step advancement on success, and keep `catchError` for the snackbar notification.

> **Important:** `RentalStore` is already declared in the component's `providers` array. Do NOT remove it — this ensures each route visit creates a fresh store instance.

## 2. Files to Modify

### File A

* **File Path:** `projects/shared/src/core/state/rental.store.ts`
* **Action:** Modify Existing File

### File B

* **File Path:** `projects/operator/src/app/rental-create/rental-create.component.ts`
* **Action:** Modify Existing File

## 3. Code Implementation

### 3A — `rental.store.ts`

**Imports Required:** None — `finalize` is already imported from `'rxjs/operators'`; `signal` and `computed` are already imported from `'@angular/core'`.

**Change 1 — Add private `_isLoading` signal**

* **Location:** After `private readonly _isActivating = signal<boolean>(false);` in the "Async / loading state" block.
* **Snippet:**

Replace:

```typescript
  // Async / loading state
  private readonly _costEstimate = signal<RentalCostEstimate | null>(null);
  private readonly _isSaving = signal<boolean>(false);
  private readonly _isActivating = signal<boolean>(false);
```

With:

```typescript
  // Async / loading state
  private readonly _costEstimate = signal<RentalCostEstimate | null>(null);
  private readonly _isSaving = signal<boolean>(false);
  private readonly _isActivating = signal<boolean>(false);
  private readonly _isLoading = signal<boolean>(false);
```

**Change 2 — Expose public `isLoading` computed**

* **Location:** After `readonly isActivating = computed(() => this._isActivating());` in the "Primary public signals" block.
* **Snippet:**

Replace:

```typescript
  readonly isActivating = computed(() => this._isActivating());

  // Convenience computed signals derived from _draft (preserve public API for step components)
```

With:

```typescript
  readonly isActivating = computed(() => this._isActivating());
  readonly isLoading = computed(() => this._isLoading());

  // Convenience computed signals derived from _draft (preserve public API for step components)
```

**Change 3 — Update `loadRental()` to manage `_isLoading`**

* **Location:** The full `loadRental(id: number)` method. Set `_isLoading` to `true` before the `return` statement; append `finalize(() => this._isLoading.set(false))` after the existing `catchError` operator inside the pipe.
* **Snippet:**

Replace:

```typescript
  loadRental(id: number): Observable<void> {
    return this.rentalsService.getRentalById(id).pipe(
      tap((response) => {
        const items: EquipmentSearchItem[] = response.equipmentItems.map((item) => ({
          id: item.equipmentId,
          uid: item.equipmentUid ?? '',
          model: '',
          typeSlug: '',
          statusSlug: item.status,
        }));
        this._id.set(response.id);
        this._equipmentItems.set(items);
        this._draft.update((d) => ({
          ...d,
          customerId: response.customerId,
          equipmentIds: items.map((e) => e.id),
          durationMinutes: response.plannedDurationMinutes,
        }));
      }),
      map(() => undefined),
      catchError((err) => {
        this.reset();
        throw err;
      }),
    );
  }
```

With:

```typescript
  loadRental(id: number): Observable<void> {
    this._isLoading.set(true);
    return this.rentalsService.getRentalById(id).pipe(
      tap((response) => {
        const items: EquipmentSearchItem[] = response.equipmentItems.map((item) => ({
          id: item.equipmentId,
          uid: item.equipmentUid ?? '',
          model: '',
          typeSlug: '',
          statusSlug: item.status,
        }));
        this._id.set(response.id);
        this._equipmentItems.set(items);
        this._draft.update((d) => ({
          ...d,
          customerId: response.customerId,
          equipmentIds: items.map((e) => e.id),
          durationMinutes: response.plannedDurationMinutes,
        }));
      }),
      map(() => undefined),
      catchError((err) => {
        this.reset();
        throw err;
      }),
      finalize(() => this._isLoading.set(false)),
    );
  }
```

**Change 4 — Clear `_isLoading` inside `reset()`**

* **Location:** The `reset()` method. Append `this._isLoading.set(false);` as the last line before the closing `}`.
* **Snippet:**

Replace:

```typescript
  reset(): void {
    this._id.set(null);
    this._customer.set(null);
    this._customerBalance.set(null);
    this._equipmentItems.set([]);
    this._specialPriceEnabled.set(false);
    this._draft.set({ ...DEFAULT_DRAFT });
    this._costEstimate.set(null);
  }
```

With:

```typescript
  reset(): void {
    this._id.set(null);
    this._customer.set(null);
    this._customerBalance.set(null);
    this._equipmentItems.set([]);
    this._specialPriceEnabled.set(false);
    this._draft.set({ ...DEFAULT_DRAFT });
    this._costEstimate.set(null);
    this._isLoading.set(false);
  }
```

---

### 3B — `rental-create.component.ts`

**Imports Required:**

```typescript
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  input,
  signal,
} from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { MatSnackBar } from '@angular/material/snack-bar';
import { catchError, filter, of, switchMap, tap } from 'rxjs';
import { Labels, RentalStore } from '@bikerental/shared';
```

**Code to Add/Replace:**

* **Location:** Replace the entire contents of `rental-create.component.ts`.
* **Snippet:**

```typescript
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  input,
  signal,
} from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { MatSnackBar } from '@angular/material/snack-bar';
import { catchError, filter, of, switchMap, tap } from 'rxjs';
import { Labels, RentalStore } from '@bikerental/shared';

@Component({
  selector: 'app-rental-create',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [RentalStore],
  template: `
    @if (isLoading()) {
      <p i18n>Loading...</p>
    } @else {
      <h1 class="text-2xl font-semibold text-slate-800 mb-1" i18n>New Rental</h1>
      <p class="text-sm text-slate-500" i18n>Will be implemented in TASK011</p>
    }
  `,
})
export class RentalCreateComponent {
  private readonly store = inject(RentalStore);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);

  readonly id = input<number>();
  readonly activeStep = signal<number>(0);
  protected readonly isLoading = this.store.isLoading;

  constructor() {
    toObservable(this.id)
      .pipe(
        filter((id): id is number => id !== undefined),
        switchMap((id) =>
          this.store.loadRental(id).pipe(
            tap(() => this.activeStep.set(1)),
            catchError(() => {
              this.snackBar.open(Labels.RentalDraftLoadError, Labels.Close, { duration: 4000 });
              return of(undefined);
            }),
          ),
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }
}
```

> **Key changes:** `isLoading` is now a `protected` alias to `store.isLoading` — the store owns the state. `store.reset()` is gone from the component (the store calls it internally in its own `catchError`). All `isLoading.set()` calls are gone (the store manages them via `finalize`).

## 4. Validation Steps

Execute the following commands to ensure this task was successful. Do NOT run the full application server.

```bash
npx ng build shared
npx ng build operator --configuration=development
```
