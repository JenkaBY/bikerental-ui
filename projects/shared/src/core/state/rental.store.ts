import { computed, DestroyRef, inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { EMPTY, Observable, of } from 'rxjs';
import { catchError, debounceTime, finalize, map, switchMap, tap } from 'rxjs/operators';
import { FinanceService, RentalsService, TariffsService } from '../api/generated';
import type { RentalUpdateJsonPatchRequest } from '@api-models';
import type {
  Customer,
  CustomerBalance,
  EquipmentSearchItem,
  RentalCostEstimate,
  RentalWrite,
} from '@ui-models';
import { BalanceMapper, makeMoney, RentalMapper } from '../mappers';
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
  private readonly financeService = inject(FinanceService);
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
  private readonly _isCalculatingCost = signal<boolean>(false);
  private readonly _isSaving = signal<boolean>(false);
  private readonly _isActivating = signal<boolean>(false);
  private readonly _isLoading = signal<boolean>(false);

  // Primary public signals
  readonly id = computed(() => this._id());
  readonly customer = computed(() => this._customer());
  readonly customerBalance = computed(() => this._customerBalance());
  readonly equipmentItems = computed(() => this._equipmentItems());
  readonly specialPriceEnabled = computed(() => this._specialPriceEnabled());
  readonly draft = computed(() => this._draft());
  readonly costEstimate = computed(() => this._costEstimate());
  readonly isCalculatingCost = computed(() => this._isCalculatingCost());
  readonly isSaving = computed(() => this._isSaving());
  readonly isActivating = computed(() => this._isActivating());
  readonly isLoading = computed(() => this._isLoading());

  // Convenience computed signals derived from _draft (preserve public API for step components)
  readonly durationMinutes = computed(() => this._draft().durationMinutes);
  readonly discountPercent = computed(() => this._draft().discountPercent ?? null);
  readonly specialPrice = computed(() => this._draft().specialPrice ?? null);

  readonly projectedBalance = computed(() => {
    const balance = this._customerBalance();
    if (balance === null) return null;
    const amount = balance.available.amount - (this._costEstimate()?.totalCost.amount ?? 0);
    return makeMoney(amount);
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
    return balance !== null && balance.amount >= 0;
  });

  readonly isProjectedBalanceNegative = computed(() => {
    const balance = this.projectedBalance();
    return balance !== null && balance.amount < 0;
  });

  readonly balanceShortfall = computed(() => {
    const balance = this.projectedBalance();
    if (!balance) return null;
    return { amount: Math.abs(balance.amount), currency: balance.currency };
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
            this._isCalculatingCost.set(false);
            return of(null);
          }
          return of(inputs).pipe(
            debounceTime(300),
            switchMap((debounced) => {
              this._isCalculatingCost.set(true);
              return this.tariffsService
                .calculateCost(
                  RentalMapper.toCostCalculationRequest(
                    {
                      durationMinutes: debounced.durationMinutes,
                      discountPercent: debounced.discountPercent ?? undefined,
                      specialTariffId: debounced.specialTariffId ?? undefined,
                      specialPrice: debounced.specialPrice ?? undefined,
                    },
                    debounced.items.map((e) => e.type.slug),
                  ),
                )
                .pipe(
                  map((response) => RentalMapper.fromCostResponse(response)),
                  catchError(() => of(null)),
                  finalize(() => this._isCalculatingCost.set(false)),
                );
            }),
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

  addEquipmentItem(item: EquipmentSearchItem): void {
    if (this._equipmentItems().some((e) => e.id === item.id)) return;
    const newItems = [...this._equipmentItems(), item];
    this._equipmentItems.set(newItems);
    this._draft.update((d) => ({ ...d, equipmentIds: newItems.map((e) => e.id) }));
  }

  removeEquipmentItem(id: number): void {
    const newItems = this._equipmentItems().filter((e) => e.id !== id);
    this._equipmentItems.set(newItems);
    this._draft.update((d) => ({ ...d, equipmentIds: newItems.map((e) => e.id) }));
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

  refreshCustomerBalance(): void {
    const id = this.customer()?.id;
    if (!id) return;
    this.financeService
      .getBalances(id)
      .pipe(
        tap((r) => {
          this._customerBalance.set(BalanceMapper.fromBalanceResponse(r));
        }),
        catchError(() => EMPTY),
      )
      .subscribe();
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
      specialTariffId: this.tariffStore.specialTariffId() ?? undefined,
      specialPrice: draft.specialPrice,
    };
    return this.rentalsService.createRental(RentalMapper.toCreateRequest(request)).pipe(
      tap((response) => this._id.set(response.id)),
      map((response) => response.id),
      finalize(() => this._isActivating.set(false)),
    );
  }

  loadRental(id: number): Observable<void> {
    this._isLoading.set(true);
    return this.rentalsService.getRentalById(id).pipe(
      tap((response) => {
        const items: EquipmentSearchItem[] = response.equipmentItems.map((item) => ({
          id: item.equipmentId,
          uid: item.equipmentUid ?? '',
          model: '',
          type: { slug: '', name: '', isForSpecialTariff: false },
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

  private patchDraft(id: number): Observable<void> {
    const draft = this._draft();
    const patchRequest: RentalUpdateJsonPatchRequest = {
      operations: [
        { op: 'replace', path: '/customerId', value: draft.customerId },
        { op: 'replace', path: '/equipmentIds', value: draft.equipmentIds },
        { op: 'replace', path: '/duration', value: draft.durationMinutes.toString() },
      ],
    };
    return this.rentalsService.updateRental(id, patchRequest).pipe(map(() => undefined as void));
  }
}
