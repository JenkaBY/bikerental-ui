import { inject, Injectable } from '@angular/core';
import type {
  CostCalculationV2Request,
  CostCalculationResponse,
  CostQuoteResponse,
} from '@api-models';
import type { RentalCostEstimate, RentalCostQuote, RentalEquipmentItem } from '@ui-models';
import type { RentalDetailState, RentalState } from '../state/rental.state';
import { makeMoney } from './money.mapper';
import { TIME_TRAVEL_STORE_TOKEN } from '../state/time-travel-store.token';

@Injectable({ providedIn: 'root' })
export class CostCalculationMapper {
  private readonly timeTravelStore = inject(TIME_TRAVEL_STORE_TOKEN, { optional: true });

  fromState(
    draft: RentalState | RentalDetailState,
    specialTariffId: number | null,
  ): CostCalculationV2Request {
    const startedAt = 'startedAt' in draft ? draft.startedAt : null;
    const now = this.timeTravelStore?.getCurrentTime() ?? new Date();
    const defaultReturnAt = startedAt ? now.toISOString() : undefined;
    return {
      // Equipment already returned earlier (e.g. a prior partial return) must keep its own
      // recorded return time — the backend rejects a quote that re-quotes it at a new time
      // (rental.quote.mismatch). Only equipment being returned now gets the uniform returnAt.
      equipments: draft.equipmentItems.map((e) => {
        const alreadyReturnedAt = (e as Partial<RentalEquipmentItem>).returnedAt;
        return {
          equipmentId: e.id,
          equipmentType: e.type.slug,
          returnAt: alreadyReturnedAt ? alreadyReturnedAt.toISOString() : defaultReturnAt,
        };
      }),
      startAt: (startedAt ?? now).toISOString(),
      plannedDurationMinutes: draft.durationMinutes,
      discountPercent: draft.specialPriceEnabled ? undefined : draft.discountPercent,
      specialPrice: draft.specialPriceEnabled ? draft.specialPrice : undefined,
      specialTariffId: draft.specialPriceEnabled ? (specialTariffId ?? undefined) : undefined,
    };
  }

  fromResponse(response: CostCalculationResponse): RentalCostEstimate {
    return {
      subtotal: makeMoney(response.subtotal),
      totalCost: makeMoney(response.totalCost),
      specialPricingApplied: response.specialPricingApplied ?? false,
      isEstimate: response.estimate ?? true,
      discountPercent: response.discount?.percent,
      discountAmount: makeMoney(response.discount?.amount ?? 0),
      equipmentBreakdowns: response.equipmentBreakdowns.map((b) => ({
        equipmentId: b.equipmentId,
        equipmentType: b.equipmentType,
        tariffId: b.tariffId,
        itemCost: makeMoney(b.itemCost),
        breakdownPatternCode: b.calculationBreakdown?.breakdownPatternCode,
        params: b.calculationBreakdown?.params ?? null,
        calculationMessage: b.calculationBreakdown?.message ?? '',
      })),
    };
  }

  fromQuoteResponse(response: CostQuoteResponse): RentalCostQuote {
    return {
      quoteId: response.quoteId,
      quotedAt: new Date(response.quotedAt),
      expiresAt: new Date(response.expiresAt),
      estimate: this.fromResponse(response.calculation),
    };
  }
}
