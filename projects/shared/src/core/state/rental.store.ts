import { computed, DestroyRef, inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { EMPTY, Observable } from 'rxjs';
import { catchError, finalize, map, switchMap, tap } from 'rxjs/operators';
import { RentalsService } from '../api/generated';
import {
  type BrokenEquipmentEntry,
  type Customer,
  type EquipmentSearchItem,
  type RentalDetailState,
} from '@ui-models';
import { RentalDashboardMapper, RentalMapper } from '../mappers';
import { BatchRentalPropertyStore } from './batch-rental-property.store';
import { CustomerFinanceStore } from './customer-finance.store';
import { UserStore } from './user.store';
import { TariffStore } from './tariff.store';

@Injectable()
export class RentalStore {
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

  patchState(partial: Partial<ReturnType<typeof this._state>>) {
    this._state.update((s) => ({ ...s, ...partial }));
  }

  // Primary public signals
  readonly state = this._state.asReadonly();
  readonly id = computed(() => this._state().id);
  readonly customer = computed(() => this._state().customer);
  readonly customerBalance = computed(() => this.customerFinanceStore.balance());
  readonly equipmentItems = computed(() => this._state().equipmentItems);
  readonly specialPriceEnabled = computed(() => this._state().specialPriceEnabled);
  readonly operatorId = computed(() => this.userStore.currentUser()?.id || 'FIX_ME');

  readonly isSaving = computed(() => this._state().isSaving);
  readonly isActivating = computed(() => this._state().isActivating);
  readonly isLoading = computed(() => this._state().isLoading);

  // Convenience computed signals derived from _state
  readonly durationMinutes = computed(() => this._state().durationMinutes);
  readonly discountPercent = computed(() => this._state().discountPercent ?? null);
  readonly specialPrice = computed(() => this._state().specialPrice ?? null);
  readonly isSelectedAnyEquipment = computed(() => this._state().equipmentItems.length > 0);

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

  setCustomer(customer: Customer | null): void {
    this.patchState({ customer });
    if (customer?.id) {
      this.customerFinanceStore.loadById(customer.id);
    }
  }

  refreshCustomerBalance(): void {
    const cust = this.customer();
    if (cust?.id) {
      this.customerFinanceStore.loadById(cust.id);
    }
  }

  setDurationMinutes(minutes: number): void {
    this.patchState({ durationMinutes: minutes });
  }

  setEquipmentItems(items: EquipmentSearchItem[]): void {
    this.patchState({ equipmentItems: items });
  }

  addEquipmentItem(item: EquipmentSearchItem): void {
    const currentItems = this._state().equipmentItems;
    if (currentItems.some((e) => e.id === item.id)) return;
    const newItems = [...currentItems, item];
    this.patchState({ equipmentItems: newItems });
  }

  removeEquipmentItem(id: number): void {
    const newItems = this._state().equipmentItems.filter((e) => e.id !== id);
    this.patchState({ equipmentItems: newItems });
  }

  setDiscountPercent(percent: number | null): void {
    if (this._state().specialPriceEnabled) {
      return;
    }
    if (percent !== null) {
      this.patchState({ specialPriceEnabled: false, discountPercent: percent });
    }
  }

  setSpecialPriceEnabled(enabled: boolean): void {
    this.patchState({ specialPriceEnabled: enabled });
  }

  setSpecialPrice(price: number | null): void {
    if (!this._state().specialPriceEnabled) {
      return;
    }

    this.patchState({
      specialPriceEnabled: true,
      specialPrice: price ?? undefined,
      discountPercent: undefined,
    });
  }

  save() {
    const { id } = this._state();
    this.patchState({ isSaving: true });

    const request$ = id
      ? this.rentalsService.updateRental(id, this.mapToRequest())
      : this.rentalsService.createDraft().pipe(
          tap((res) => this.patchState({ id: res.id })),
          switchMap((res) => this.rentalsService.updateRental(res.id, this.mapToRequest())),
        );

    return request$.pipe(finalize(() => this.patchState({ isSaving: false })));
  }

  private mapToRequest() {
    const s = this._state();
    return {
      ...RentalMapper.toRentalRequest({
        customerId: s.customer?.id ?? '',
        equipmentIds: s.equipmentItems.map((e) => e.id),
        durationMinutes: s.durationMinutes,
        discountPercent: s.specialPriceEnabled ? undefined : s.discountPercent,
        specialPrice: s.specialPriceEnabled ? s.specialPrice : undefined,
        specialTariffId: s.specialPriceEnabled
          ? this.tariffStore.specialTariffId() || undefined
          : undefined,
        operatorId: this.operatorId(),
      }),
    };
  }

  activateRental(): Observable<void> {
    const id = this._state().id;
    if (id === null) throw new Error('No rental id in store');
    this.patchState({ isActivating: true });
    return this.rentalsService
      .updateLifecycle(id, { status: 'ACTIVE', operatorId: this.operatorId() })
      .pipe(
        map(() => undefined as void),
        finalize(() => this.patchState({ isActivating: false })),
      );
  }

  cancelRental(): Observable<void> {
    const id = this._state().id;
    if (id === null) throw new Error('No rental id in store');
    return this.rentalsService
      .updateLifecycle(id, { status: 'CANCELLED', operatorId: this.operatorId() })
      .pipe(map(() => undefined as void));
  }

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

  reset(): void {
    this.patchState({
      id: null,
      customer: null,
      equipmentItems: [],
      specialPriceEnabled: false,
      isSaving: false,
      isActivating: false,
      isLoading: false,
    });
  }
}
