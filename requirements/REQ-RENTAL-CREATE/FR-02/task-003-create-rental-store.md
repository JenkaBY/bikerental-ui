# Task 003: Create `RentalStore`

> **Applied Skill:** `angular-data-flow-orchestrator` — Phase 3 (Store Implementation): feature-scoped (`@Injectable()` with no `providedIn`) signal store with reactive cost calculation pipeline (`toObservable` + `debounceTime` + `switchMap`), imperative mutation methods, and integration with `TariffStore` and `UserStore`.
> **Applied Skill:** `angular-signals` — `signal()` for writable state, `computed()` for derived state, `toObservable()` from `@angular/core/rxjs-interop` to drive the debounced RxJS pipeline.

## 1. Objective

Create `RentalStore`, the feature-scoped single source of truth for the Create Rental multi-step flow. It holds all draft state as writable signals, exposes computed signals for derived UI state (`costEstimate`, `projectedBalance`, `canProceedFromStep2`, `isBalanceSufficient`), drives cost recalculation via a debounced reactive pipeline, and provides `save()`, `activateRental()`, `loadRental()`, and `reset()` mutation methods.

**Prerequisite:** FR-01 tasks must be complete — `RentalWrite`, `RentalCostEstimate`, `EquipmentSearchItem` must be exported from `@ui-models`, and `RentalMapper.toCreateRequest()`, `RentalMapper.toCostCalculationRequest()`, `RentalMapper.fromCostResponse()` must exist in `projects/shared/src/core/mappers/rental.mapper.ts`.

## 2. File to Modify / Create

* **File Path:** `projects/shared/src/core/state/rental.store.ts`
* **Action:** Create New File

## 3. Code Implementation

**Imports Required:**

```typescript
import { computed, DestroyRef, inject, Injectable, signal } from '@angular/core';
import { toObservable, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Observable, of } from 'rxjs';
import { catchError, debounceTime, finalize, map, switchMap, tap } from 'rxjs/operators';
import { RentalsService, TariffsService } from '../api/generated';
import type { RentalUpdateJsonPatchRequest } from '@api-models';
import type {
  Customer,
  CustomerBalance,
  EquipmentSearchItem,
  RentalCostEstimate,
  RentalWrite,
} from '@ui-models';
import { RentalMapper } from '../mappers';
import { TariffStore } from './tariff.store';
import { UserStore } from './user.store';
```

**Module-level constant (above `@Injectable()`):**

```typescript
const DEFAULT_DRAFT: RentalWrite = {
  customerId: '',
  equipmentIds: [],
  durationMinutes: 30,
  operatorId: '',
};
```

**Code to Add/Replace:**

* **Location:** New file — full content as shown below.

```typescript
import { computed, DestroyRef, inject, Injectable, signal } from '@angular/core';
import { toObservable, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Observable, of } from 'rxjs';
import { catchError, debounceTime, finalize, map, switchMap, tap } from 'rxjs/operators';
import { RentalsService, TariffsService } from '../api/generated';
import type { RentalUpdateJsonPatchRequest } from '@api-models';
import type {
  Customer,
  CustomerBalance,
  EquipmentSearchItem,
  RentalCostEstimate,
  RentalWrite,
} from '@ui-models';
import { RentalMapper } from '../mappers';
import { TariffStore } from './tariff.store';
import { UserStore } from './user.store';

const DEFAULT_DRAFT: RentalWrite = {
  customerId: '',
  equipmentIds: [],
  durationMinutes: 30,
  operatorId: '',
};

@Injectable()
export class RentalStore {
  private readonly tariffsService = inject(TariffsService);
  private readonly rentalsService = inject(RentalsService);
  private readonly tariffStore = inject(TariffStore);
  private readonly userStore = inject(UserStore);
  private readonly destroyRef = inject(DestroyRef);

  // UI-enriched state — not representable by RentalWrite
  private readonly _id = signal<number | null>(null);
  private readonly _customer = signal<Customer | null>(null);
  private readonly _customerBalance = signal<CustomerBalance | null>(null);
  private readonly _equipmentItems = signal<EquipmentSearchItem[]>([]);
  private readonly _specialPriceEnabled = signal<boolean>(false);

  // Single source of truth for all RentalWrite fields
  private readonly _draft = signal<RentalWrite>({ ...DEFAULT_DRAFT });

  // Async / loading state
  private readonly _costEstimate = signal<RentalCostEstimate | null>(null);
  private readonly _isSaving = signal<boolean>(false);
  private readonly _isActivating = signal<boolean>(false);

  // Primary public signals
  readonly id = computed(() => this._id());
  readonly customer = computed(() => this._customer());
  readonly customerBalance = computed(() => this._customerBalance());
  readonly equipmentItems = computed(() => this._equipmentItems());
  readonly specialPriceEnabled = computed(() => this._specialPriceEnabled());
  readonly draft = computed(() => this._draft());
  readonly costEstimate = computed(() => this._costEstimate());
  readonly isSaving = computed(() => this._isSaving());
  readonly isActivating = computed(() => this._isActivating());

  // Convenience computed signals derived from _draft (preserve public API for step components)
  readonly durationMinutes = computed(() => this._draft().durationMinutes);
  readonly discountPercent = computed(() => this._draft().discountPercent ?? null);
  readonly specialPrice = computed(() => this._draft().specialPrice ?? null);

  readonly projectedBalance = computed(() => {
    const balance = this._customerBalance();
    if (balance === null) return null;
    return balance.available.amount - (this._costEstimate()?.totalCost ?? 0);
  });

  readonly canProceedFromStep2 = computed(() => {
    const items = this._equipmentItems();
    const specialEnabled = this._specialPriceEnabled();
    const specialPrice = this._draft().specialPrice;
    const estimate = this._costEstimate();
    return items.length > 0 && (!specialEnabled || specialPrice !== undefined) && estimate !== null;
  });

  readonly isBalanceSufficient = computed(() => {
    const balance = this.projectedBalance();
    return balance !== null && balance >= 0;
  });

  private readonly _costInputs = computed(() => {
    const draft = this._draft();
    return {
      items: this._equipmentItems(),
      durationMinutes: draft.durationMinutes,
      discountPercent: draft.discountPercent ?? null,
      specialEnabled: this._specialPriceEnabled(),
      specialPrice: draft.specialPrice ?? null,
      specialTariffId: this.tariffStore.specialTariffId(),
    };
  });

  constructor() {
    toObservable(this._costInputs)
      .pipe(
        switchMap((inputs) => {
          if (inputs.items.length === 0) {
            return of(null);
          }
          return of(inputs).pipe(
            debounceTime(300),
            switchMap((debounced) =>
              this.tariffsService
                .calculateCost(
                  RentalMapper.toCostCalculationRequest(
                    {
                      durationMinutes: debounced.durationMinutes,
                      discountPercent: debounced.discountPercent,
                      specialTariffId: debounced.specialTariffId,
                      specialPrice: debounced.specialPrice,
                    },
                    debounced.items.map((e) => e.typeSlug),
                  ),
                )
                .pipe(
                  map((response) => RentalMapper.fromCostResponse(response)),
                  catchError(() => of(null)),
                ),
            ),
          );
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((estimate) => this._costEstimate.set(estimate));
  }

  setCustomer(customer: Customer | null): void {
    this._customer.set(customer);
    this._draft.update((d) => ({ ...d, customerId: customer?.id ?? '' }));
  }

  setCustomerBalance(balance: CustomerBalance | null): void {
    this._customerBalance.set(balance);
  }

  setDurationMinutes(minutes: number): void {
    this._draft.update((d) => ({ ...d, durationMinutes: minutes }));
  }

  setEquipmentItems(items: EquipmentSearchItem[]): void {
    this._equipmentItems.set(items);
    this._draft.update((d) => ({ ...d, equipmentIds: items.map((e) => e.id) }));
  }

  setDiscountPercent(percent: number | null): void {
    if (percent !== null) {
      this._specialPriceEnabled.set(false);
      this._draft.update((d) => ({ ...d, discountPercent: percent, specialPrice: undefined }));
    } else {
      this._draft.update((d) => ({ ...d, discountPercent: undefined }));
    }
  }

  setSpecialPriceEnabled(enabled: boolean): void {
    this._specialPriceEnabled.set(enabled);
    if (enabled) {
      this._draft.update((d) => ({ ...d, discountPercent: undefined }));
    } else {
      this._draft.update((d) => ({ ...d, specialPrice: undefined }));
    }
  }

  setSpecialPrice(price: number | null): void {
    if (price !== null) {
      this._draft.update((d) => ({ ...d, specialPrice: price, discountPercent: undefined }));
    } else {
      this._draft.update((d) => ({ ...d, specialPrice: undefined }));
    }
  }

  save(): Observable<void> {
    this._isSaving.set(true);
    const currentId = this._id();
    if (currentId === null) {
      return this.rentalsService.createDraft().pipe(
        tap((response) => this._id.set(response.id)),
        switchMap((response) => this.patchDraft(response.id)),
        finalize(() => this._isSaving.set(false)),
      );
    }
    return this.patchDraft(currentId).pipe(finalize(() => this._isSaving.set(false)));
  }

  activateRental(): Observable<number> {
    this._isActivating.set(true);
    const draft = this._draft();
    const request: RentalWrite = {
      ...draft,
      operatorId: this.userStore.currentUser()?.id ?? '',
      discountPercent: draft.discountPercent,
      specialTariffId: this.tariffStore.specialTariffId(),
      specialPrice: draft.specialPrice,
    };
    return this.rentalsService.createRental(RentalMapper.toCreateRequest(request)).pipe(
      tap((response) => this._id.set(response.id)),
      map((response) => response.id),
      finalize(() => this._isActivating.set(false)),
    );
  }

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

  reset(): void {
    this._id.set(null);
    this._customer.set(null);
    this._customerBalance.set(null);
    this._equipmentItems.set([]);
    this._specialPriceEnabled.set(false);
    this._draft.set({ ...DEFAULT_DRAFT });
    this._costEstimate.set(null);
  }

  private patchDraft(id: number): Observable<void> {
    const draft = this._draft();
    const patchRequest: RentalUpdateJsonPatchRequest = {
      operations: [
        { op: 'replace', path: '/customerId', value: draft.customerId },
        { op: 'replace', path: '/equipmentIds', value: draft.equipmentIds },
        { op: 'replace', path: '/duration', value: draft.durationMinutes },
      ],
    };
    return this.rentalsService
      .updateRental(id, patchRequest)
      .pipe(map(() => undefined as void));
  }
}
```

### Design Notes

* **Single `_draft` signal**: all fields that map to `RentalWrite` (`customerId`, `equipmentIds`, `durationMinutes`, `discountPercent`, `specialPrice`) are stored in one signal. A module-level `DEFAULT_DRAFT` constant holds the reset values. `operatorId` is stored as `''` and overridden with the real user ID at activation time; `specialTariffId` is always resolved from `TariffStore` at request-build time.
* **Separate signals** are kept for state that is richer than `RentalWrite`: `_id` (persisted rental ID), `_customer` (full `Customer` object for display), `_customerBalance`, `_equipmentItems` (`EquipmentSearchItem[]` — needed for display; `equipmentIds` in `_draft` is kept in sync via `setEquipmentItems`), and `_specialPriceEnabled` (UI-only toggle with no `RentalWrite` equivalent).
* **Convenience computed signals** (`durationMinutes`, `discountPercent`, `specialPrice`) project individual fields out of `_draft` so step components keep the same call-site API. `discountPercent` and `specialPrice` convert `undefined → null` because `RentalWrite` uses `undefined` for optional fields while the UI prefers `null`.
* `_customerBalance` is held separately because `Customer` (from `@ui-models`) does not carry a `balance` field. Step components call `store.setCustomerBalance(balance)` after loading finance data via `CustomerFinanceStore`.
* The reactive cost pipeline uses `toObservable(computed)` → outer `switchMap` (immediate `null` for empty items) → inner `of(inputs).pipe(debounceTime(300), switchMap(api))`. Removing all equipment clears `costEstimate` immediately; non-empty changes are debounced 300 ms. The inner `switchMap` cancels in-flight requests.

## 4. Validation Steps

Execute the following commands to ensure this task was successful. Do NOT run the full application server.

```bash
npx tsc --project tsconfig.app.json --noEmit
```
