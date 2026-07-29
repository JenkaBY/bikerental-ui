import { computed, inject, Injectable, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { Observable, of, timer } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import type { CostCalculationV2Request } from '@api-models';
import type { RentalCostEstimate, RentalPricingDraft } from '@ui-models';
import { CostCalculationMapper } from '../mappers/cost-calculation.mapper';
import { RentalCostCalculationStore } from './rental-cost-calculation.store';
import { TariffStore } from './tariff.store';
import { RentalStore } from './rental.store';

const DISCOUNT_DEBOUNCE_MS = 300;

@Injectable()
export class RentalPricingStore {
  private readonly rentalStore = inject(RentalStore);
  private readonly tariffStore = inject(TariffStore);
  private readonly costStore = inject(RentalCostCalculationStore);
  private readonly costCalculationMapper = inject(CostCalculationMapper);

  private readonly _draft = signal<RentalPricingDraft>({
    mode: this.rentalStore.priceMode(),
    discountPercent: this.rentalStore.discountPercent(),
    specialPrice: this.rentalStore.specialPrice(),
  });

  readonly draft = this._draft.asReadonly();

  // Kept separate from `_draft.discountPercent` because RentalPriceControlComponent nulls the
  // percent when the operator leaves the Discount tab. Latching it here keeps the discount
  // request's identity stable across a Discount -> Full -> Discount round-trip, so switching
  // tabs never re-triggers a calculation.
  private readonly _quotedDiscountPercent = signal(this.rentalStore.discountPercent() ?? 0);

  readonly returnedItems = this.costStore.returnedItems;
  readonly returnedTotal = this.costStore.returnedTotal;

  readonly specialTariffId = computed(
    () => this.tariffStore.specialTariffId() ?? this.rentalStore.specialTariffId(),
  );

  // Frozen once submit() is called: the rental's own state patches (isUpdatingPricing toggles,
  // then the fresh rental data landing) would otherwise re-trigger these quotes while the sheet
  // is still alive during MatBottomSheet's close animation, wasting requests for a price the
  // operator has already committed.
  private readonly _isSubmitted = signal(false);
  private readonly _frozenEstimate = signal<RentalCostEstimate | null>(null);

  private readonly baselineRequest = computed<CostCalculationV2Request | null>(() => {
    if (this._isSubmitted()) return null;
    const active = this.costStore.activeItems();
    if (active.length === 0) return null;
    return this.costCalculationMapper.fromState(
      {
        equipmentItems: active,
        startedAt: this.rentalStore.startedAt(),
        durationMinutes: this.rentalStore.durationMinutes(),
        priceMode: 'FULL',
      },
      this.specialTariffId(),
    );
  });

  private readonly baselineQuote = rxResource<
    RentalCostEstimate | null,
    CostCalculationV2Request | null
  >({
    params: () => this.baselineRequest(),
    stream: ({ params }) => this.quote(params),
  });

  private readonly discountRequest = computed<CostCalculationV2Request | null>(() => {
    const percent = this._quotedDiscountPercent();
    const base = this.baselineRequest();
    if (percent <= 0 || !base) return null;
    return { ...base, discountPercent: percent };
  });

  private readonly discountQuote = rxResource<
    RentalCostEstimate | null,
    CostCalculationV2Request | null
  >({
    params: () => this.discountRequest(),
    stream: ({ params }) => {
      if (!params) return of(null);
      return timer(DISCOUNT_DEBOUNCE_MS).pipe(switchMap(() => this.quote(params)));
    },
  });

  private readonly hasDiscountApplied = computed(() => {
    const d = this._draft();
    return d.mode === 'DISCOUNT' && (d.discountPercent ?? 0) > 0;
  });

  readonly estimate = computed<RentalCostEstimate | null>(() => {
    if (this._isSubmitted()) return this._frozenEstimate();
    return this.hasDiscountApplied()
      ? (this.discountQuote.value() ?? null)
      : (this.baselineQuote.value() ?? null);
  });

  readonly isCalculating = computed(
    () => this.baselineQuote.isLoading() || this.discountQuote.isLoading(),
  );

  private readonly staleActiveSubtotal = computed(() =>
    this.costStore.activeItems().reduce((sum, item) => sum + (item.estimatedCost?.amount ?? 0), 0),
  );

  readonly fixedPrefill = computed(() => {
    const liveSubtotal = this.estimate()?.subtotal.amount;
    const activeSubtotal = liveSubtotal ?? this.staleActiveSubtotal();
    return this.returnedTotal().amount + activeSubtotal;
  });

  readonly canSubmit = computed(() => {
    const d = this._draft();
    switch (d.mode) {
      case 'FULL':
        return true;
      case 'DISCOUNT':
        return (
          d.discountPercent != null &&
          Number.isInteger(d.discountPercent) &&
          d.discountPercent >= 0 &&
          d.discountPercent <= 100
        );
      case 'FIXED':
        return d.specialPrice != null && d.specialPrice >= 0 && !!this.specialTariffId();
    }
  });

  readonly isSubmitting = this.rentalStore.isUpdatingPricing;

  setDraft(draft: RentalPricingDraft): void {
    this._draft.set(draft);
    if (draft.mode === 'DISCOUNT' && draft.discountPercent != null) {
      this._quotedDiscountPercent.set(draft.discountPercent);
    }
  }

  submit(): Observable<void> {
    this._frozenEstimate.set(this.estimate());
    this._isSubmitted.set(true);
    return this.rentalStore.updatePricing(this._draft(), this.specialTariffId());
  }

  private quote(request: CostCalculationV2Request | null): Observable<RentalCostEstimate | null> {
    if (!request) return of(null);
    return this.tariffStore.calculateCost(request).pipe(
      map((res) => this.costCalculationMapper.fromResponse(res)),
      catchError(() => of(null)),
    );
  }
}
