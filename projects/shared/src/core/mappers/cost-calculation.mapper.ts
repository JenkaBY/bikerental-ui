import { inject, Injectable } from '@angular/core';
import type {
  CostCalculationResponse,
  CostCalculationV2Request,
  CostQuoteResponse,
} from '@api-models';
import type {
  EquipmentSearchItem,
  RentalCostEstimate,
  RentalCostQuote,
  RentalEquipmentItem,
  RentalPriceMode,
} from '@ui-models';
import { makeMoney } from './money.mapper';
import { TIME_TRAVEL_STORE_TOKEN } from '../state/time-travel-store.token';

export interface CostQuoteInput {
  equipmentItems: readonly EquipmentSearchItem[];
  startedAt?: Date | null;
  durationMinutes: number;
  priceMode: RentalPriceMode;
  discountPercent?: number | null;
  specialPrice?: number | null;
}

@Injectable({ providedIn: 'root' })
export class CostCalculationMapper {
  private readonly timeTravelStore = inject(TIME_TRAVEL_STORE_TOKEN, { optional: true });

  fromState(draft: CostQuoteInput, specialTariffId: number | null): CostCalculationV2Request {
    const startedAt = draft.startedAt ?? null;
    const now = this.timeTravelStore?.getCurrentTime() ?? new Date();
    const defaultReturnAt = startedAt ? now.toISOString() : undefined;
    return {
      // Equipment already returned earlier (e.g. a prior partial return) must keep its own
      // recorded return time — the backend rejects a quote that re-quotes it at a new time
      // (rental.quote.mismatch). Only equipment being returned now gets the uniform returnAt.
      equipments: draft.equipmentItems.map((e) => {
        const item = e as Partial<RentalEquipmentItem>;
        return {
          equipmentId: e.id,
          equipmentType: e.type.slug,
          startAt: item.startedAt ? item.startedAt.toISOString() : undefined,
          returnAt: item.returnedAt ? item.returnedAt.toISOString() : defaultReturnAt,
        };
      }),
      startAt: (startedAt ?? now).toISOString(),
      plannedDurationMinutes: draft.durationMinutes,
      discountPercent:
        draft.priceMode === 'DISCOUNT' ? (draft.discountPercent ?? undefined) : undefined,
      specialPrice: draft.priceMode === 'FIXED' ? (draft.specialPrice ?? undefined) : undefined,
      specialTariffId: draft.priceMode === 'FIXED' ? (specialTariffId ?? undefined) : undefined,
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
