import {
  computed,
  DestroyRef,
  inject,
  Injectable,
  InjectionToken,
  Injector,
  runInInjectionContext,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { EMPTY, Observable } from 'rxjs';
import { catchError, finalize, map, switchMap, tap } from 'rxjs/operators';
import type { AddRentalEquipmentRequest } from '../api/generated';
import { CustomersService, RentalsService } from '../api/generated';
import {
  type BrokenEquipmentEntry,
  type Customer,
  type EquipmentSearchItem,
  type Money,
  type RentalEquipmentItem,
} from '@ui-models';
import type { RentalDetailState } from './rental.state';
import { CustomerMapper, makeMoney, RentalDashboardMapper, RentalMapper } from '../mappers';
import { suppressErrorNotification } from '../errors';
import { BatchRentalPropertyStore } from './batch-rental-property.store';
import { CustomerFinanceStore } from './customer-finance.store';
import { UserStore } from './user.store';
import { TariffStore } from './tariff.store';

export const RENTAL_VALIDATION_STORE_FOR_DELEGATION = new InjectionToken<{
  isBalanceSufficient: () => boolean;
}>('RentalValidationStoreForDelegation');

@Injectable()
export class RentalStore {
  private readonly rentalsService = inject(RentalsService);
  private readonly customersService = inject(CustomersService);
  private readonly batchRentalPropertyStore = inject(BatchRentalPropertyStore);
  private readonly userStore = inject(UserStore);
  private readonly customerFinanceStore = inject(CustomerFinanceStore);
  private readonly tariffStore = inject(TariffStore);
  private readonly destroyRef = inject(DestroyRef);
  private readonly injector = inject(Injector);

  private readonly _state = signal<RentalDetailState>({
    id: null,
    customer: null,
    equipmentItems: [],
    durationMinutes: 60,
    discountPercent: undefined,
    specialPrice: undefined,
    specialPriceEnabled: false,
    isSaving: false,
    isLoading: false,
    status: '',
    version: null,
    customerId: '',
    startedAt: null,
    isActive: false,
    isDebt: false,
    isOverdue: false,
    brokenEquipmentEntries: [] as BrokenEquipmentEntry[],
    isReturning: false,
    isAddingEquipment: false,
  });

  private patchState(partial: Partial<ReturnType<typeof this._state>>) {
    this._state.update((s) => ({ ...s, ...partial }));
  }

  // Primary public signals
  readonly state = this._state.asReadonly();
  readonly id = computed(() => this._state().id);
  readonly customer = computed(() => this._state().customer);
  readonly customerBalance = computed(() => this.customerFinanceStore.balance());
  readonly isBalanceSufficient = computed(() => {
    const validationStore = runInInjectionContext(this.injector, () =>
      inject(RENTAL_VALIDATION_STORE_FOR_DELEGATION, { optional: true }),
    );
    if (validationStore) {
      return validationStore.isBalanceSufficient();
    }
    return (this.customerFinanceStore.balance()?.available.amount ?? 0) >= 0;
  });
  readonly equipmentItems = computed(() => this._state().equipmentItems);
  readonly specialPriceEnabled = computed(() => this._state().specialPriceEnabled);
  readonly operatorId = computed(() => this.userStore.currentUser()?.id || 'FIX_ME');

  readonly isSaving = computed(() => this._state().isSaving);
  readonly isLoading = computed(() => this._state().isLoading);

  // Convenience computed signals derived from _state
  readonly durationMinutes = computed(() => this._state().durationMinutes);
  readonly discountPercent = computed(() => this._state().discountPercent ?? null);
  readonly specialPrice = computed(() => this._state().specialPrice ?? null);
  readonly isSelectedAnyEquipment = computed(() => this._state().equipmentItems.length > 0);

  readonly loadError = signal(false);
  private readonly _isSendingToSigning = signal(false);
  readonly selectedEquipmentItemIds = signal<Set<number>>(new Set<number>());
  readonly selectedEquipmentCount = computed(() => this.selectedEquipmentItemIds().size);
  readonly rentalEquipmentItems = computed(
    () => this._state().equipmentItems as RentalEquipmentItem[],
  );

  readonly status = computed(() => this._state().status);
  readonly isDraft = computed(() => this._state().status === 'DRAFT');
  readonly isAwaitingSignature = computed(() => this._state().status === 'AWAITING_SIGNATURE');
  readonly version = computed(() => this._state().version);
  readonly isSendingToSigning = computed(() => this._isSendingToSigning());
  readonly canSendToSigning = computed(
    () => this.isSelectedAnyEquipment() && this.isBalanceSufficient() && !this.isSendingToSigning(),
  );
  readonly isActive = computed(() => this._state().isActive);
  readonly isDebt = computed(() => this._state().isDebt);
  readonly isOverdue = computed(() => this._state().isOverdue);
  readonly overdueMinutes = computed(() => this._state().overdueMinutes);
  readonly debtAmount = computed(() => this._state().debtAmount);
  readonly expectedReturnAt = computed(() => this._state().expectedReturnAt);
  readonly startedAt = computed(() => this._state().startedAt);
  readonly customerId = computed(() => this._state().customerId);
  readonly paidDurationMinutes = computed(() => this._state().paidDurationMinutes);
  readonly estimatedCost = computed(() => this._state().estimatedCost);
  readonly brokenEquipmentEntries = computed(() => this._state().brokenEquipmentEntries);

  readonly subtotal = computed<Money | null>(() => {
    const items = this.rentalEquipmentItems();
    if (items.length === 0) return null;
    const amount = items.reduce((sum, item) => sum + (item.estimatedCost?.amount ?? 0), 0);
    const currency =
      items.find((item) => item.estimatedCost)?.estimatedCost?.currency ??
      this.estimatedCost()?.currency ??
      undefined;
    return makeMoney(amount, currency);
  });

  readonly hasDiscount = computed(() => {
    const percent = this.discountPercent();
    return !this.specialPriceEnabled() && percent != null && percent > 0;
  });

  readonly hasPricingBreakdown = computed(() => this.hasDiscount() || this.specialPriceEnabled());

  readonly discountAmount = computed<Money | null>(() => {
    if (!this.hasDiscount()) return null;
    const sub = this.subtotal();
    const total = this.estimatedCost();
    if (!sub || !total) return null;
    return makeMoney(sub.amount - total.amount, sub.currency);
  });

  setBrokenEquipmentEntries(entries: BrokenEquipmentEntry[]): void {
    this.patchState({ brokenEquipmentEntries: entries });
  }

  readonly isReturning = computed(() => this._state().isReturning);
  readonly isAddingEquipment = computed(() => this._state().isAddingEquipment);

  setCustomer(customer: Customer | null, options?: { hydrateNotes?: boolean }): void {
    this.patchState({ customer });
    if (customer?.id) {
      this.customerFinanceStore.loadById(customer.id);
    }
    if (options?.hydrateNotes && customer?.id) {
      this.customersService
        .getById(customer.id)
        .pipe(
          map((r) => CustomerMapper.fromResponse(r)),
          catchError(() => EMPTY),
          takeUntilDestroyed(this.destroyRef),
        )
        .subscribe((fullCustomer) => {
          if (this._state().customer?.id === fullCustomer.id) {
            this.patchState({ customer: fullCustomer });
          }
        });
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

    if (this._state().id !== null) {
      this.save().pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
    }
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

  selectEquipmentItem(id: number): void {
    const next = new Set(this.selectedEquipmentItemIds());
    next.add(id);
    this.selectedEquipmentItemIds.set(next);
  }

  deselectEquipmentItem(id: number): void {
    const next = new Set(this.selectedEquipmentItemIds());
    next.delete(id);
    this.selectedEquipmentItemIds.set(next);
  }

  selectAllActiveItems(ids: number[]): void {
    this.selectedEquipmentItemIds.set(new Set(ids));
  }

  clearSelection(): void {
    this.selectedEquipmentItemIds.set(new Set<number>());
  }

  save() {
    const { id, customer } = this._state();
    if (!customer?.id) {
      return EMPTY;
    }
    this.patchState({ isSaving: true });

    const request$ = id
      ? this.rentalsService.updateRental(id, this.mapToRequest())
      : this.rentalsService.createDraft().pipe(
          tap((res) => this.patchState({ id: res.id })),
          switchMap((res) => this.rentalsService.updateRental(res.id, this.mapToRequest())),
        );

    return request$.pipe(finalize(() => this.patchState({ isSaving: false })));
  }

  private applyDetail(state: Partial<RentalDetailState>): void {
    this.patchState(state);
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

  returnEquipment(): Observable<void> {
    const id = this._state().id;
    if (id === null) throw new Error('No rental id in store');
    const request = RentalDashboardMapper.toReturnRequest(
      { rentalId: id, equipmentItemIds: [...this.selectedEquipmentItemIds()] },
      this.operatorId(),
    );
    this.patchState({ isReturning: true });
    return this.rentalsService.returnEquipment(request).pipe(
      map(() => undefined as void),
      finalize(() => this.patchState({ isReturning: false })),
    );
  }

  addEquipmentToRental(equipmentIds: number[]): Observable<void> {
    const id = this._state().id;
    if (id === null) throw new Error('No rental id in store');
    const request: AddRentalEquipmentRequest = { equipmentIds, operatorId: this.operatorId() };
    this.patchState({ isAddingEquipment: true });
    return this.rentalsService
      .addEquipment(id, request, 'body', { context: suppressErrorNotification() })
      .pipe(
        switchMap((rental) => {
          const ids = (rental.equipmentItems ?? []).map((item) => item.equipmentId);
          return this.batchRentalPropertyStore
            .fetch$({ equipmentIds: ids, customerId: rental.customerId ?? null })
            .pipe(map(({ customer, equipmentItems }) => ({ rental, customer, equipmentItems })));
        }),
        map(({ rental, customer, equipmentItems }) =>
          RentalDashboardMapper.toDetailState(rental, customer, equipmentItems),
        ),
        tap((state) => this.applyDetail(state)),
        map(() => undefined as void),
        finalize(() => this.patchState({ isAddingEquipment: false })),
      );
  }

  cancelRental(): Observable<void> {
    const id = this._state().id;
    if (id === null) throw new Error('No rental id in store');
    return this.rentalsService
      .updateLifecycle(id, { status: 'CANCELLED', operatorId: this.operatorId() })
      .pipe(
        tap((r) => this.patchState({ status: r.status, version: r.version })),
        map(() => undefined as void),
      );
  }

  createAwaitingSignature(): Observable<number> {
    const { customer, equipmentItems } = this._state();
    if (!customer?.id || equipmentItems.length === 0) {
      return EMPTY;
    }
    this._isSendingToSigning.set(true);
    return this.rentalsService
      .initForSigning(this.mapToRequest(), undefined, { context: suppressErrorNotification() })
      .pipe(
        tap((r) => this.patchState({ id: r.id, status: r.status, version: r.version })),
        map((r) => r.version),
        finalize(() => this._isSendingToSigning.set(false)),
      );
  }

  sendToSigning(): Observable<number> {
    const id = this._state().id;
    if (id === null) throw new Error('No rental id in store');
    this._isSendingToSigning.set(true);
    return this.rentalsService
      .updateLifecycle(
        id,
        { status: 'AWAITING_SIGNATURE', operatorId: this.operatorId() },
        undefined,
        {
          context: suppressErrorNotification(),
        },
      )
      .pipe(
        tap((r) => this.patchState({ status: r.status, version: r.version })),
        map((r) => r.version),
        finalize(() => this._isSendingToSigning.set(false)),
      );
  }

  proceedToSigning(): Observable<number> {
    return this._state().id === null
      ? this.createAwaitingSignature()
      : this.save().pipe(switchMap(() => this.sendToSigning()));
  }

  cancelSigning(): Observable<void> {
    const id = this._state().id;
    if (id === null) throw new Error('No rental id in store');
    return this.rentalsService
      .updateLifecycle(id, { status: 'DRAFT', operatorId: this.operatorId() }, undefined, {
        context: suppressErrorNotification(),
      })
      .pipe(
        tap((r) => this.patchState({ status: r.status, version: r.version })),
        map(() => undefined as void),
      );
  }

  loadDetail(id: number): void {
    this.loadDetail$(id).subscribe();
  }

  loadDetail$(id: number, options?: { silent?: boolean }): Observable<Partial<RentalDetailState>> {
    const silent = options?.silent ?? false;
    if (!silent) this.patchState({ isLoading: true });
    this.loadError.set(false);

    return this.rentalsService.getRentalById(id).pipe(
      switchMap((rental) => {
        const equipmentIds = (rental.equipmentItems ?? []).map((item) => item.equipmentId);
        return this.batchRentalPropertyStore
          .fetch$({ equipmentIds, customerId: rental.customerId ?? null })
          .pipe(map(({ customer, equipmentItems }) => ({ rental, customer, equipmentItems })));
      }),
      map(({ rental, customer, equipmentItems }) =>
        RentalDashboardMapper.toDetailState(rental, customer, equipmentItems),
      ),
      tap((state) => {
        this.applyDetail(state);
        this.setCustomer(state.customer || null);
      }),
      finalize(() => {
        if (!silent) this.patchState({ isLoading: false });
      }),
      catchError(() => {
        this.loadError.set(true);
        return EMPTY;
      }),
      takeUntilDestroyed(this.destroyRef),
    );
  }

  reset(): void {
    this.selectedEquipmentItemIds.set(new Set<number>());
    this.patchState({
      id: null,
      customer: null,
      equipmentItems: [],
      specialPriceEnabled: false,
      isSaving: false,
      isLoading: false,
    });
  }
}
