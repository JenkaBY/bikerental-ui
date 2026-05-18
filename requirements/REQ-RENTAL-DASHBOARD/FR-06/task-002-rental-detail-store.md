# Task 002: Extend RentalStore to Support Rental Detail Loading

> **Applied Skill:** `angular-signals` — extending an existing `signal<State>` store,
> imperative `loadDetail()` with `takeUntilDestroyed`, `DestroyRef` injection in a
> component-scoped service.

## 1. Objective

Extend the existing `projects/shared/src/core/state/rental.store.ts` so that it can drive
`RentalDetailComponent` (FR-06) and all subsequent detail sections (FR-07–FR-12):

1. Widen the internal state from `RentalState` to `RentalDetailState` (which already extends
   `RentalState` in `rental-dashboard.model.ts`).
2. Replace the unused `loadRental()` with a fully-featured `loadDetail(id)` that fetches
   rental + customer + equipment batch concurrently via `forkJoin` and maps via
   `RentalDashboardMapper.toDetailState()`.
3. Expose `loadError` and computed signals for all new detail fields.

No new file is created. `RentalStore` is already exported from `public-api.ts`.

**Depends on:** FR-01 (existing `RentalDetailState`, `RentalDashboardMapper.toDetailState()`).

## 2. Files to Modify / Create

* **File A Path:** `projects/shared/src/core/mappers/rental-dashboard.mapper.ts`
* **Action:** Modify Existing File

* **File B Path:** `projects/shared/src/core/state/rental.store.ts`
* **Action:** Modify Existing File

---

## 3. Code Implementation

### Change 0 — Update `RentalDashboardMapper.toDetailState` signature

**File:** `projects/shared/src/core/mappers/rental-dashboard.mapper.ts`

**Replace the existing import block** at the top of the file with:

```typescript
import type {
  CustomerResponse,
  EquipmentItemResponse,
  RentalResponse,
  RentalSummaryResponse,
  ReturnEquipmentRequest,
} from '@api-models';
import type {
  BrokenEquipmentEntry,
  Customer,
  EquipmentSearchItem,
  RentalDetailState,
  RentalEquipmentItem,
  RentalListItem,
  ReturnEquipmentWrite,
} from '@ui-models';
```

**Replace the `toDetailState` method signature and its first two locals:**

**Replace:**

```typescript
  static toDetailState(
    r: RentalResponse,
    customer: CustomerResponse | null,
    equipmentBatch: EquipmentResponse[],
  ): Partial<RentalDetailState> {
```

**With:**

```typescript
  static toDetailState(
    r: RentalResponse,
    customer: Customer | null,
    equipmentBatch: EquipmentSearchItem[],
  ): Partial<RentalDetailState> {
```

**Replace the equipment Map construction and type field:**

**Replace:**

```typescript
    const equipmentMap = new Map<number, EquipmentResponse>(equipmentBatch.map((e) => [e.id, e]));
    const equipmentItems: RentalEquipmentItem[] = (r.equipmentItems ?? []).map(
      (item: EquipmentItemResponse) => {
        const eq = equipmentMap.get(item.equipmentId);
        return {
          id: item.equipmentId,
          uid: eq?.uid ?? item.equipmentUid ?? '',
          model: eq?.model ?? '',
          type: { slug: eq?.type ?? '', name: eq?.type ?? '', isForSpecialTariff: false },
```

**With:**

```typescript
    const equipmentMap = new Map<number, EquipmentSearchItem>(equipmentBatch.map((e) => [e.id, e]));
    const equipmentItems: RentalEquipmentItem[] = (r.equipmentItems ?? []).map(
      (item: EquipmentItemResponse) => {
        const eq = equipmentMap.get(item.equipmentId);
        return {
          id: item.equipmentId,
          uid: eq?.uid ?? item.equipmentUid ?? '',
          model: eq?.model ?? '',
          type: eq?.type ?? { slug: eq?.type || '', name: eq?.type || '', isForSpecialTariff: false },
```

**Replace the `customer` field in the returned object:**

**Replace:**

```typescript
      customer: customer ? CustomerMapper.fromResponse(customer) : null,
```

**With:**

```typescript
      customer,
```

> `CustomerMapper` import is also removed — it is only used in `toDetailState` and is no longer needed.

---

### Change 1 — Update imports

**Replace the existing import block** (all imports at the top of the file) with:

```typescript
import { computed, DestroyRef, inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { EMPTY, Observable } from 'rxjs';
import { catchError, finalize, map, switchMap, tap } from 'rxjs/operators';
import { RentalsService } from '../api/generated';
import { RentalDashboardMapper, RentalMapper } from '../mappers';
import type {
  BrokenEquipmentEntry,
  Customer,
  EquipmentSearchItem,
  RentalDetailState,
  RentalEquipmentItem,
} from '@ui-models';
import { BatchRentalPropertyStore } from './batch-rental-property.store';
import { CustomerFinanceStore } from './customer-finance.store';
import { UserStore } from './user.store';
import { TariffStore } from './tariff.store';
```

---

### Change 2 — Widen `_state` to `RentalDetailState` and add new injections

**Location:** Inside the `RentalStore` class body — replace the block that starts with
`private readonly rentalsService` through the end of the `_state` signal declaration.

**Replace:**

```typescript
  private readonly rentalsService = inject(RentalsService);
  private readonly userStore = inject(UserStore);
  private readonly customerFinanceStore = inject(CustomerFinanceStore);
  private readonly tariffStore = inject(TariffStore);

  // Single source of truth for all mutable state
  private readonly _state = signal<RentalState>({
    id: null,
    customer: null,
    equipmentItems: [],
    durationMinutes: 60,
    discountPercent: undefined,
    specialPrice: undefined,
    specialPriceEnabled: false,
    isSaving: false,
    isActivating: false,
    isLoading: false,
  });
```

**With:**

```typescript
  private readonly rentalsService = inject(RentalsService);
  private readonly batchRentalPropertyStore = inject(BatchRentalPropertyStore);
  private readonly userStore = inject(UserStore);
  private readonly customerFinanceStore = inject(CustomerFinanceStore);
  private readonly tariffStore = inject(TariffStore);
  private readonly destroyRef = inject(DestroyRef);

  private readonly _state = signal<RentalDetailState>({
    id: null,
    customer: null,
    equipmentItems: [],
    durationMinutes: 60,
    discountPercent: undefined,
    specialPrice: undefined,
    specialPriceEnabled: false,
    isSaving: false,
    isActivating: false,
    isLoading: false,
    status: '',
    customerId: '',
    startedAt: null,
    isActive: false,
    isDebt: false,
    isOverdue: false,
    brokenEquipmentEntries: [] as BrokenEquipmentEntry[],
    isReturning: false,
  });
```

---

### Change 3 — Add `loadError` signal and detail computed signals

**Location:** Add immediately after the existing `readonly isSelectedAnyEquipment` computed
signal (after the line `readonly isSelectedAnyEquipment = computed(...)`).

```typescript
  readonly loadError = signal(false);

  readonly status = computed(() => this._state().status);
  readonly isActive = computed(() => this._state().isActive);
  readonly isDebt = computed(() => this._state().isDebt);
  readonly isOverdue = computed(() => this._state().isOverdue);
  readonly overdueMinutes = computed(() => this._state().overdueMinutes);
  readonly debtAmount = computed(() => this._state().debtAmount);
  readonly expectedReturnAt = computed(() => this._state().expectedReturnAt);
  readonly startedAt = computed(() => this._state().startedAt);
  readonly customerId = computed(() => this._state().customerId);
  readonly paidDurationMinutes = computed(() => this._state().paidDurationMinutes);
  readonly brokenEquipmentEntries = computed(() => this._state().brokenEquipmentEntries);
  readonly isReturning = computed(() => this._state().isReturning);
```

---

### Change 4 — Replace `loadRental` with `loadDetail`

**Location:** Replace the entire `loadRental` method body (from `loadRental(id: number): Observable<void> {` through its closing `}`).

**Replace:**

```typescript
  loadRental(id: number): Observable<void> {
    this.patchState({ isLoading: true });
    return this.rentalsService.getRentalById(id).pipe(
      tap((response) => {
        const items: EquipmentSearchItem[] = response.equipmentItems.map((item) => ({
          id: item.equipmentId,
          uid: item.equipmentUid ?? '',
          model: '',
          type: { slug: '', name: '', isForSpecialTariff: false },
        }));

        this.patchState({
          id: response.id,
          equipmentItems: items,
          customer: this._state().customer,
          durationMinutes: response.plannedDurationMinutes,
        });
      }),
      map(() => undefined as void),
      catchError((err) => {
        this.reset();
        throw err;
      }),
      finalize(() => this.patchState({ isLoading: false })),
    );
  }
```

**With:**

```typescript
  loadDetail(id: number): void {
    this.patchState({ isLoading: true });
    this.loadError.set(false);

    this.rentalsService
      .getRentalById(id)
      .pipe(
        switchMap((rental) => {
          const equipmentIds = (rental.equipmentItems ?? []).map((item) => item.equipmentId);
          return this.batchRentalPropertyStore
            .fetch$({ equipmentIds, customerId: rental.customerId ?? null })
            .pipe(map(({ customer, equipmentItems }) => ({ rental, customer, equipmentItems })));
        }),
        map(({ rental, customer, equipmentItems }) =>
          RentalDashboardMapper.toDetailState(rental, customer, equipmentItems),
        ),
        finalize(() => this.patchState({ isLoading: false })),
        catchError(() => {
          this.loadError.set(true);
          return EMPTY;
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((state) => this.patchState(state));
  }
```

---

**Key implementation notes:**

- `RentalDetailState extends RentalState` (defined in `rental-dashboard.model.ts`). Widening
  `_state` to `signal<RentalDetailState>` is backward-compatible — every method that calls
  `patchState({ ... })` with `RentalState` fields still works because
  `patchState(partial: Partial<ReturnType<typeof this._state>>)` accepts any `Partial<RentalDetailState>`.
- `loadRental` had zero callers outside this file (verified). Replacing it with `loadDetail`
  introduces no regression.
- `BatchRentalPropertyStore` must be added to `RentalDetailComponent.providers` alongside
  `RentalStore` and `CustomerFinanceStore` (see Task 003): `providers: [RentalStore,
  CustomerFinanceStore, BatchRentalPropertyStore]`. `RentalStore` injects it by class token,
  so the same instance is shared within the component subtree.
- `loadDetail` is imperative (void return). Subscription lifecycle is managed by
  `takeUntilDestroyed(this.destroyRef)` — when `RentalDetailComponent` is destroyed, Angular
  destroys the component-scoped `RentalStore` instance, which triggers `DestroyRef` and
  cancels any in-flight HTTP call automatically.
- `loadDetail` calls `patchState(state)` where `state` is `Partial<RentalDetailState>` returned
  by `toDetailState()`. The `update` in `patchState` merges the partial into the existing state,
  so all fields not returned by the mapper retain their default values.
- `loadError` is a `WritableSignal` (not a computed) so `loadDetail` can set it imperatively.
  The component resets it by calling `loadDetail` again (retry).
- `CustomerFinanceStore` is still required at the component level: `RentalStore` injects it to
  expose `customerBalance`. **`RentalDetailComponent.providers` must include `CustomerFinanceStore`
  alongside `RentalStore`** (see Task 003).

---

## 4. Validation Steps

skip
